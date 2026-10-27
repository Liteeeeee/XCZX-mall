import { defineStore } from 'pinia';

// 智能戒指能力依赖原生蓝牙：仅 App（Android/iOS/HarmonyOS）与微信小程序可用，
// H5 等平台无插件实现，调用会直接抛错，故入口也会同步隐藏。
// #ifdef APP-PLUS || MP-WEIXIN
import {
  initialize,
  getSdkVersion,
  getPluginVersion,
  startScan,
  stopScan,
  connect,
  reconnect,
  disconnect,
  getPower,
  getFirmwareVersion,
  getFunctionList,
  unbind,
  iosSetBindedStatus,
  startRealtimeMeasure,
  stopRealtimeMeasure,
  syncAllHealthData,
  removeHealthDataCallback,
  onScanResult,
  onScanFinish,
  onConnectState,
  onFunctionMenu,
  onRealtimeData,
  onRealtimeMeasureComplete,
  onSyncProgress,
  onSyncResult,
  onSyncFinish,
  onSyncError,
} from '@/uni_modules/rwfit-ble';
// #endif

let RING_SUPPORTED = false;
// #ifdef APP-PLUS || MP-WEIXIN
RING_SUPPORTED = true;
// #endif

const BOUND_DEVICE_KEY = 'xczx-ring-device';
const HEALTH_DATA_KEY = 'xczx-ring-health';

/** 健康数据类型，顺序与 SDK 返回一致，页面按此顺序渲染，不做二次排序 */
export const RING_HEALTH_TYPES = [
  { type: 'step', label: '计步', unit: '步', support: 'isStep' },
  { type: 'hr', label: '心率', unit: 'bpm', support: 'isHr' },
  { type: 'sleep', label: '睡眠', unit: '分钟', support: 'isSleep' },
  { type: 'bo', label: '血氧', unit: '%', support: 'isBloodOxy' },
  { type: 'hrv', label: 'HRV', unit: 'ms', support: 'isHrv' },
  { type: 'pressure', label: '压力', unit: '', support: 'isPressure' },
  { type: 'bp', label: '血压', unit: 'mmHg', support: 'isBloodPress' },
  { type: 'bloodSugar', label: '血糖', unit: 'mmol/L', support: 'isBloodSugar' },
  { type: 'temp', label: '体温', unit: '°C', support: 'isBodyTemp' },
  { type: 'muslimCount', label: '赞念计数', unit: '次', support: 'isMuslimCountData' },
];

/** 实时单次检测可选指标，取值与 SDK RealtimeMetric 一致 */
export const RING_REALTIME_METRICS = [
  { metric: 'hr', label: '心率', unit: 'bpm', dataType: 1 },
  { metric: 'bloodOxy', label: '血氧', unit: '%', dataType: 3 },
  { metric: 'hrv', label: 'HRV', unit: 'ms', dataType: 13 },
  { metric: 'pressure', label: '压力', unit: '', dataType: 8 },
];

/**
 * dataType → 实时指标名。
 * 必须与 RING_REALTIME_METRICS 的 metric 同名（SDK 的 RealtimeMetric 命名），
 * 否则回调写入 realtime 的 key 与页面读取的 key 不一致，数值会一直是空。
 * 例：血氧 dataType=3，曾映射成健康数据的 'bo'，页面读的是 'bloodOxy'。
 */
const REALTIME_TYPE_MAP = Object.fromEntries(
  RING_REALTIME_METRICS.map((item) => [item.dataType, item.metric]),
);

/** 健康记录中的时间/元信息字段，提取数值时跳过 */
const META_KEYS = [
  'date',
  'time',
  'timestamp',
  'timestampSec',
  'utc',
  'timezone',
  'type',
  'id',
  'index',
  'dataType',
];

const VALUE_KEYS = {
  step: ['step', 'steps', 'totalStep', 'count'],
  hr: ['hr', 'heartRate', 'avgHr', 'averageHeartRate'],
  sleep: ['totalDuration', 'sleepTime', 'totalSleepTime', 'duration'],
  bo: ['bo', 'bloodOxy', 'bloodOxygen', 'spo2'],
  hrv: ['hrv', 'hrvValue'],
  pressure: ['pressure', 'stress'],
  bp: ['systolic', 'sbp', 'high', 'sys'],
  bloodSugar: ['bloodSugar', 'sugar', 'glucose'],
  temp: ['temp', 'temperature', 'bodyTemp'],
  muslimCount: ['muslimCount', 'totalCount', 'count'],
};

/** 取一条健康记录的主数值，先按类型约定的字段名匹配，再兜底取首个数值字段 */
function extractValue(record, type) {
  if (!record) return null;
  const keys = VALUE_KEYS[type] || [];
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  for (const key of Object.keys(record)) {
    if (META_KEYS.includes(key)) continue;
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

// 事件与同步回调是进程级的，只注册一次，避免页面反复进出造成重复监听
let eventsBound = false;
let initPromise = null;
let syncResolve = null;
let syncReject = null;
let pendingHealthBatches = {};
// 等待「设备业务指令就绪」的挂起请求，由 onFunctionMenu / onConnectState 统一裁决
let readyWaiters = [];

function settleReadyWaiters(error) {
  const waiters = readyWaiters;
  readyWaiters = [];
  waiters.forEach((waiter) => {
    clearTimeout(waiter.timer);
    if (error) waiter.reject(error);
    else waiter.resolve();
  });
}

/** 将 SDK 的 callback options 风格统一包装为 Promise */
function invoke(command, payload = {}) {
  return new Promise((resolve, reject) => {
    command({
      ...payload,
      success: (result) => resolve(result),
      fail: (error) => reject(error),
    });
  });
}

function errorText(error) {
  if (!error) return '操作失败';
  if (typeof error === 'string') return error;
  return error.errMsg || error.message || '操作失败';
}

function isIosApp() {
  // #ifdef APP-PLUS
  return typeof plus !== 'undefined' && plus.os && plus.os.name === 'iOS';
  // #endif
  // #ifndef APP-PLUS
  return false;
  // #endif
}

const ring = defineStore({
  id: 'ring',
  state: () => ({
    initialized: false,
    sdkVersion: '',
    pluginVersion: '',
    scanning: false,
    devices: [],
    boundDevice: uni.getStorageSync(BOUND_DEVICE_KEY) || null,
    connectionState: 'disconnected',
    connected: false,
    // ready 才是「设备业务指令可用」的信号，connected 仅代表 BLE 链路已建立
    ready: false,
    functionMenu: null,
    health: uni.getStorageSync(HEALTH_DATA_KEY) || {},
    syncing: false,
    syncProgress: 0,
    lastSyncAt: 0,
    realtime: {},
    measuringMetric: '',
    error: '',
  }),
  getters: {
    supported: () => RING_SUPPORTED,
    deviceName: (state) => state.boundDevice?.name || '',
    deviceMac: (state) => state.boundDevice?.mac || state.boundDevice?.uuid || '',
    power: (state) => state.boundDevice?.power ?? null,
    firmwareVersion: (state) => state.boundDevice?.firmware?.deviceNo || '',
    // 各类健康数据的最新一条记录，用于首页概览
    overview(state) {
      return RING_HEALTH_TYPES.map((item) => {
        const records = Array.isArray(state.health[item.type]) ? state.health[item.type] : [];
        const latest = records.length ? records[records.length - 1] : null;
        return {
          ...item,
          total: records.length,
          date: latest?.date || '',
          value: extractValue(latest, item.type),
        };
      });
    },
    // 设备功能表下发前不限制，下发后按 menu 过滤出设备真正支持的类型
    supportedHealthTypes(state) {
      const menu = state.functionMenu || state.boundDevice?.supportMenu;
      if (!menu) return RING_HEALTH_TYPES;
      const list = RING_HEALTH_TYPES.filter((item) => menu[item.support] === true);
      return list.length ? list : RING_HEALTH_TYPES;
    },
  },
  actions: {
    /** 注册一次全局事件监听，页面无需管理 on/off */
    bindEvents() {
      if (eventsBound || !RING_SUPPORTED) return;
      eventsBound = true;
      onScanResult((device) => {
        const key = device.uuid || device.deviceId || device.mac;
        const index = this.devices.findIndex(
          (item) => (item.uuid || item.deviceId || item.mac) === key,
        );
        if (index >= 0) this.devices.splice(index, 1, device);
        else this.devices.push(device);
      });
      onScanFinish(() => {
        this.scanning = false;
      });
      onConnectState((event) => {
        this.connectionState = event.state;
        this.connected = event.state === 'connected';
        // 链路断开后必须等待新的功能表回调，才能再次下发业务指令
        if (!this.connected) this.ready = false;
        if (event.state === 'failed') settleReadyWaiters(new Error('设备连接失败'));
      });
      onFunctionMenu((menu) => {
        this.connected = true;
        this.ready = true;
        this.connectionState = 'connected';
        this.functionMenu = menu.raw;
        this.boundDevice = {
          ...(this.boundDevice || {}),
          name: menu.name,
          mac: menu.mac,
          uuid: menu.uuid,
          supportMenu: menu.raw,
        };
        this.persistDevice();
        settleReadyWaiters(null);
        // iOS 原生 SDK 仅在 binded=true 时自动重连，其余平台由 reconnect 显式触发
        if (isIosApp()) {
          invoke(iosSetBindedStatus, { isBinded: true }).catch(() => undefined);
        }
      });
      onRealtimeData((data) => {
        const type = REALTIME_TYPE_MAP[data.dataType] || this.measuringMetric;
        if (type) this.realtime[type] = { ...data, receivedAt: Date.now() };
      });
      onRealtimeMeasureComplete(() => {
        this.measuringMetric = '';
      });
      onSyncProgress((progress) => {
        this.syncProgress = Math.round(Number(progress) * 100) || 0;
      });
      onSyncResult((result) => {
        // iOS 一次同步会分多条批次回调同一类型，按记录主键合并，避免后一批覆盖前一批
        const incoming = Array.isArray(result.data) ? result.data : [];
        const pending = pendingHealthBatches[result.type] || (pendingHealthBatches[result.type] = new Map());
        incoming.forEach((record) => {
          const key = record && (record.date || record.time || record.timestamp || record.timestampSec);
          pending.set(key == null ? Symbol() : key, record);
        });
        this.health[result.type] = Array.from(pending.values());
        uni.setStorageSync(HEALTH_DATA_KEY, this.health);
      });
      onSyncFinish(() => {
        this.syncing = false;
        this.syncProgress = 100;
        this.lastSyncAt = Date.now();
        const resolve = syncResolve;
        syncResolve = null;
        syncReject = null;
        if (resolve) resolve(this.health);
      });
      onSyncError((error) => {
        this.syncing = false;
        const reject = syncReject;
        syncResolve = null;
        syncReject = null;
        if (reject) reject(error);
      });
    },

    persistDevice() {
      if (this.boundDevice) uni.setStorageSync(BOUND_DEVICE_KEY, this.boundDevice);
      else uni.removeStorageSync(BOUND_DEVICE_KEY);
    },

    /** 初始化 SDK，授权与版本号只会在首次调用时申请与读取 */
    ensureInitialized() {
      if (!RING_SUPPORTED) return Promise.reject(new Error('当前平台不支持智能戒指功能'));
      if (this.initialized) return Promise.resolve();
      if (initPromise) return initPromise;
      this.bindEvents();
      initPromise = invoke(initialize)
        .then(() => {
          this.initialized = true;
          return Promise.all([
            invoke(getSdkVersion).then((value) => {
              this.sdkVersion = value || '';
            }),
            invoke(getPluginVersion).then((value) => {
              this.pluginVersion = value || '';
            }),
          ]);
        })
        .catch((error) => {
          initPromise = null;
          throw error;
        });
      return initPromise;
    },

    async scan() {
      await this.ensureInitialized();
      this.devices = [];
      this.scanning = true;
      this.error = '';
      try {
        return await invoke(startScan);
      } catch (error) {
        this.scanning = false;
        throw error;
      }
    },

    async stopScan() {
      if (!this.scanning) return;
      this.scanning = false;
      return invoke(stopScan);
    },

    /** 连接必须回传扫描得到的完整 device 对象，iOS 与微信小程序需要其中的平台标识 */
    async connectDevice(device) {
      await this.ensureInitialized();
      await this.stopScan().catch(() => undefined);
      this.boundDevice = device;
      this.persistDevice();
      return invoke(connect, { device });
    },

    /** 等待 onFunctionMenu 回调，超时或连接失败都视为未就绪 */
    waitReady(timeoutMs = 15000) {
      if (this.ready) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const waiter = { resolve, reject, timer: null };
        waiter.timer = setTimeout(() => {
          readyWaiters = readyWaiters.filter((item) => item !== waiter);
          reject(new Error('等待设备就绪超时，请重试'));
        }, timeoutMs);
        readyWaiters.push(waiter);
      });
    },

    async reconnectDevice() {
      if (!this.boundDevice) throw new Error('尚未绑定设备');
      await this.ensureInitialized();
      await invoke(reconnect, { device: this.boundDevice });
      if (isIosApp()) return;
      return this.waitReady();
    },

    async disconnectDevice() {
      const result = await invoke(disconnect);
      this.connected = false;
      this.ready = false;
      return result;
    },

    async unbindDevice() {
      // 先关闭 iOS 自动重连标记，避免 unregister 过程中原生 SDK 又发起重连
      if (isIosApp()) {
        await invoke(iosSetBindedStatus, { isBinded: false }).catch(() => undefined);
      }
      await this.ensureInitialized();
      try {
        await invoke(unbind);
      } catch (error) {
        // 部分固件不支持 unbind，退化为断开连接
        if (Number(error?.errCode) !== 9201007) throw error;
        await invoke(disconnect).catch(() => undefined);
      }
      this.boundDevice = null;
      this.functionMenu = null;
      this.health = {};
      this.connected = false;
      this.ready = false;
      this.lastSyncAt = 0;
      uni.removeStorageSync(HEALTH_DATA_KEY);
      this.persistDevice();
    },

    async refreshDeviceInfo() {
      await this.ensureInitialized();
      const [power, firmware, functions] = await Promise.all([
        invoke(getPower),
        invoke(getFirmwareVersion),
        invoke(getFunctionList),
      ]);
      this.functionMenu = functions.supportMenu;
      this.boundDevice = {
        ...(this.boundDevice || {}),
        power,
        firmware,
        supportMenu: functions.supportMenu,
      };
      this.persistDevice();
      return this.boundDevice;
    },

    syncHealth() {
      if (!RING_SUPPORTED) return Promise.reject(new Error('当前平台不支持智能戒指功能'));
      if (this.syncing) return Promise.reject(new Error('正在同步中，请稍候'));
      if (!this.ready) return Promise.reject(new Error('设备未就绪，请先连接戒指'));
      this.syncing = true;
      this.syncProgress = 0;
      pendingHealthBatches = {};
      return new Promise((resolve, reject) => {
        syncResolve = resolve;
        syncReject = reject;
        invoke(syncAllHealthData).catch((error) => {
          this.syncing = false;
          syncResolve = null;
          syncReject = null;
          reject(error);
        });
      });
    },

    /** 同步结束或页面销毁后释放原生同步 callback */
    releaseSyncCallbacks() {
      if (!RING_SUPPORTED) return Promise.resolve();
      return invoke(removeHealthDataCallback);
    },

    async startMeasure(metric) {
      if (!this.ready) throw new Error('设备未就绪，请先连接戒指');
      await invoke(startRealtimeMeasure, { metric });
      this.measuringMetric = metric;
    },

    async stopMeasure(metric) {
      await invoke(stopRealtimeMeasure, { metric });
      if (this.measuringMetric === metric) this.measuringMetric = '';
    },

    clearError() {
      this.error = '';
    },
  },
});

export default ring;
