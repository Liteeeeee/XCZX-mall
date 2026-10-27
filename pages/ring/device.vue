<!-- 智能戒指 · 设备管理：扫描、连接、设备信息与解绑 -->
<template>
  <s-layout title="设备管理" :bgStyle="{ color: '#f6f6f6' }">
    <view class="device-page">
      <!-- 平台不支持时的兜底说明（H5 已隐藏入口，此处仅防御异常路径） -->
      <view v-if="!ring.supported" class="ss-m-30 card">
        <view class="card-title">当前平台不支持</view>
        <view class="card-text">
          智能戒指依赖系统蓝牙能力，请在「App（Android / iOS）」或「微信小程序」中打开本功能。
        </view>
      </view>

      <template v-else>
        <!-- 当前设备 -->
        <view class="ss-m-30 card">
          <view class="ss-flex ss-row-between ss-col-center">
            <view class="card-title">当前设备</view>
            <text class="status" :class="statusClass">{{ statusText }}</text>
          </view>

          <template v-if="ring.boundDevice">
            <view class="kv">
              <text class="kv-label">设备名称</text>
              <text class="kv-value">{{ ring.deviceName || '未知设备' }}</text>
            </view>
            <view class="kv">
              <text class="kv-label">设备标识</text>
              <text class="kv-value">{{ ring.deviceMac || '--' }}</text>
            </view>
            <view class="kv">
              <text class="kv-label">固件版本</text>
              <text class="kv-value">{{ ring.firmwareVersion || '--' }}</text>
            </view>
            <view class="kv">
              <text class="kv-label">剩余电量</text>
              <text class="kv-value">{{ ring.power === null ? '--' : ring.power + '%' }}</text>
            </view>

            <view class="btn-group">
              <button class="btn btn-primary ss-reset-button" :disabled="busy" @tap="onReconnect">
                重新连接
              </button>
              <button
                class="btn btn-plain ss-reset-button"
                :disabled="busy || !ring.ready"
                @tap="onRefreshInfo"
              >
                读取设备信息
              </button>
            </view>
            <view class="btn-group">
              <button class="btn btn-danger ss-reset-button" :disabled="busy" @tap="onUnbind">
                解除绑定
              </button>
            </view>
          </template>

          <view v-else class="card-text">尚未绑定设备，请在下方扫描附近的戒指。</view>
        </view>

        <!-- 扫描 -->
        <view class="ss-m-30 card">
          <view class="ss-flex ss-row-between ss-col-center">
            <view class="card-title">发现设备</view>
            <text class="card-hint">{{ ring.devices.length }} 个</text>
          </view>

          <button
            class="btn ss-reset-button"
            :class="ring.scanning ? 'btn-plain' : 'btn-primary'"
            @tap="onToggleScan"
          >
            {{ ring.scanning ? '停止扫描' : '开始扫描' }}
          </button>

          <view v-if="ring.devices.length === 0" class="card-text">
            {{ ring.scanning ? '正在搜索附近的蓝牙设备…' : '点击上方按钮开始搜索' }}
          </view>

          <view
            v-for="(device, index) in ring.devices"
            :key="device.uuid || device.deviceId || device.mac || index"
            class="device-item"
            @tap="onConnect(device)"
          >
            <view class="device-main">
              <view class="device-name">{{ device.name || '未命名设备' }}</view>
              <view class="device-mac">{{ device.mac || device.uuid || device.deviceId || '--' }}</view>
            </view>
            <text class="device-rssi">{{ device.rssi }} dBm</text>
          </view>
        </view>

        <!-- 使用提示 -->
        <view class="ss-m-30 card">
          <view class="card-title">连接说明</view>
          <view class="card-text">
            1. 请先在系统设置中打开手机蓝牙，并让戒指保持电量充足。
          </view>
          <view class="card-text">
            2. 连接成功后需要等待设备返回功能表，之后才能读取数据与同步健康记录。
          </view>
          <view class="card-text">
            3. 已绑定过的设备重新进入时会自动尝试重连；重连失败可使用上方「重新连接」。
          </view>
        </view>
      </template>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onUnload } from '@dcloudio/uni-app';
  import sheep from '@/sheep';

  const ring = sheep.$store('ring');
  const busy = ref(false);
  let scanTimer = null;

  const statusText = computed(() => {
    if (ring.ready) return '已就绪';
    if (ring.connectionState === 'connecting') return '连接中';
    if (ring.connected) return '已连接';
    if (ring.connectionState === 'failed') return '连接失败';
    return '未连接';
  });

  const statusClass = computed(() => (ring.ready ? 'status-ok' : 'status-off'));

  onLoad(() => {
    if (!ring.supported) return;
    ring.ensureInitialized().catch((error) => {
      sheep.$helper.toast(error.message || '蓝牙初始化失败');
    });
    // 已绑定设备直接静默重连，避免用户每次进页面都要重新扫描
    if (ring.boundDevice && !ring.ready) {
      onReconnect(true);
    }
  });

  onUnload(() => {
    clearTimeout(scanTimer);
    ring.stopScan().catch(() => undefined);
  });

  async function onToggleScan() {
    if (ring.scanning) {
      clearTimeout(scanTimer);
      await ring.stopScan().catch(() => undefined);
      return;
    }
    try {
      await ring.scan();
      // 蓝牙扫描耗电，10 秒后自动停止，用户也可以手动延长
      scanTimer = setTimeout(() => {
        ring.stopScan().catch(() => undefined);
      }, 10000);
    } catch (error) {
      sheep.$helper.toast(error.errMsg || '扫描失败，请检查蓝牙与定位权限');
    }
  }

  async function onConnect(device) {
    if (busy.value) return;
    busy.value = true;
    clearTimeout(scanTimer);
    try {
      await ring.connectDevice(device);
      await ring.waitReady();
      await ring.refreshDeviceInfo();
      sheep.$helper.toast('设备已连接');
    } catch (error) {
      sheep.$helper.toast(error.errMsg || error.message || '连接失败');
    } finally {
      busy.value = false;
    }
  }

  async function onReconnect(silent = false) {
    if (busy.value) return;
    busy.value = true;
    try {
      await ring.reconnectDevice();
      await ring.refreshDeviceInfo();
      if (!silent) sheep.$helper.toast('设备已连接');
    } catch (error) {
      if (!silent) sheep.$helper.toast(error.errMsg || error.message || '重连失败');
    } finally {
      busy.value = false;
    }
  }

  async function onRefreshInfo() {
    if (busy.value) return;
    busy.value = true;
    try {
      await ring.refreshDeviceInfo();
      sheep.$helper.toast('设备信息已更新');
    } catch (error) {
      sheep.$helper.toast(error.errMsg || error.message || '读取失败');
    } finally {
      busy.value = false;
    }
  }

  function onUnbind() {
    uni.showModal({
      title: '解除绑定',
      content: '解绑后将清除本机保存的设备与健康数据，需要重新扫描连接。',
      success: async ({ confirm }) => {
        if (!confirm) return;
        busy.value = true;
        try {
          await ring.unbindDevice();
          sheep.$helper.toast('已解除绑定');
        } catch (error) {
          sheep.$helper.toast(error.errMsg || error.message || '解绑失败');
        } finally {
          busy.value = false;
        }
      },
    });
  }
</script>

<style lang="scss" scoped>
  .device-page {
    padding-bottom: 40rpx;
  }

  .card {
    padding: 30rpx;
    background: #fffffa;
    border-radius: 22rpx;
  }

  .card-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #3c3c3c;
  }

  .card-hint {
    font-size: 24rpx;
    color: var(--ui-TC-2);
  }

  .card-text {
    margin-top: 16rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    color: var(--ui-TC-2);
  }

  .status {
    font-size: 24rpx;
  }

  .status-ok {
    color: #1e3f1c;
  }

  .status-off {
    color: var(--ui-TC-3);
  }

  .kv {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 2rpx solid var(--ui-BG-2);

    .kv-label {
      font-size: 26rpx;
      color: var(--ui-TC-2);
    }

    .kv-value {
      font-size: 26rpx;
      color: #3c3c3c;
      word-break: break-all;
    }
  }

  .btn-group {
    display: flex;
    margin-top: 24rpx;

    .btn + .btn {
      margin-left: 20rpx;
    }
  }

  .btn {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    font-size: 28rpx;
    text-align: center;
    border-radius: 40rpx;
  }

  .btn-primary {
    background: #1e3f1c;
    color: #ffffff;
  }

  .btn-plain {
    background: var(--ui-BG-2);
    color: var(--ui-TC-1);
  }

  .btn-danger {
    background: rgba(214, 57, 57, 0.1);
    color: #d63939;
  }

  .btn[disabled] {
    opacity: 0.5;
  }

  .device-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20rpx;
    padding: 24rpx;
    background: var(--ui-BG-1);
    border-radius: 16rpx;

    &:active {
      opacity: 0.8;
    }

    .device-main {
      flex: 1;
      overflow: hidden;
    }

    .device-name {
      font-size: 28rpx;
      color: #3c3c3c;
    }

    .device-mac {
      margin-top: 8rpx;
      font-size: 22rpx;
      color: var(--ui-TC-3);
    }

    .device-rssi {
      margin-left: 20rpx;
      font-size: 24rpx;
      color: var(--ui-TC-2);
    }
  }
</style>
