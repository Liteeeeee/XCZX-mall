<!-- 智能戒指 · 健康首页：数据概览、全天同步与实时单次检测 -->
<template>
  <s-layout title="智能戒指" :bgStyle="{ color: '#f6f6f6' }">
    <view class="ring-page">
      <!-- 平台不支持时的兜底说明（H5 已隐藏入口，此处仅防御异常路径） -->
      <view v-if="!ring.supported" class="ss-m-30 card">
        <view class="card-title">当前平台不支持</view>
        <view class="card-text">
          智能戒指依赖系统蓝牙能力，请在「App（Android / iOS）」或「微信小程序」中打开本功能。
        </view>
      </view>

      <template v-else>
        <!-- 设备状态 -->
        <view class="ss-m-30 card device-card" @tap="goDevice">
          <view class="device-left">
            <view class="device-name">{{ ring.deviceName || '尚未绑定设备' }}</view>
            <view class="device-sub">{{ ring.ready ? '设备已就绪' : '点击前往设备管理' }}</view>
          </view>
          <text class="device-action">{{ ring.ready ? '管理' : '去绑定' }}</text>
        </view>

        <!-- 健康数据概览 -->
        <view class="ss-m-30 card">
          <view class="ss-flex ss-row-between ss-col-center">
            <view class="card-title">健康概览</view>
            <text class="card-hint">{{
              ring.lastSyncAt ? '同步于 ' + lastSyncText : '尚未同步'
            }}</text>
          </view>

          <view class="overview-grid">
            <view v-for="item in ring.overview" :key="item.type" class="overview-item">
              <view class="overview-value">
                <text class="value">{{ item.value === null ? '--' : item.value }}</text>
                <text class="unit">{{ item.value === null ? '' : item.unit }}</text>
              </view>
              <view class="overview-label">{{ item.label }}</view>
            </view>
          </view>

          <button
            class="btn btn-primary ss-reset-button"
            :disabled="ring.syncing || !ring.ready"
            @tap="onSync"
          >
            {{ ring.syncing ? '正在同步…' : '同步全天数据' }}
          </button>

          <view v-if="ring.syncing" class="progress-track">
            <view class="progress-bar" :style="{ width: ring.syncProgress + '%' }"></view>
          </view>
          <view v-if="!ring.ready" class="card-text">请先连接戒指后再同步数据。</view>
        </view>

        <!-- 实时单次检测 -->
        <view class="ss-m-30 card">
          <view class="card-title">实时单次检测</view>
          <view class="metric-row">
            <view
              v-for="item in metrics"
              :key="item.metric"
              class="metric-chip"
              :class="{ 'metric-chip-active': activeMetric === item.metric }"
              @tap="onPickMetric(item.metric)"
            >
              {{ item.label }}
            </view>
          </view>

          <view class="realtime-value">
            <text class="value">{{ realtimeValue === null ? '--' : realtimeValue }}</text>
            <text class="unit">{{ currentMetric ? currentMetric.unit : '' }}</text>
          </view>

          <button
            class="btn ss-reset-button"
            :class="measuring ? 'btn-plain' : 'btn-primary'"
            :disabled="!ring.ready"
            @tap="onToggleMeasure"
          >
            {{ measuring ? '停止检测' : '开始检测' }}
          </button>
          <view v-if="!ring.ready" class="card-text">请先连接戒指后再进行检测。</view>
        </view>

        <!-- 分类明细 -->
        <view class="ss-m-30 card">
          <view class="card-title">数据明细</view>
          <view class="card-hint hint-inline">按设备支持类型展示，记录数来自最近一次同步</view>
          <view
            v-for="item in ring.supportedHealthTypes"
            :key="item.type"
            class="type-item"
          >
            <text class="type-label">{{ item.label }}</text>
            <text class="type-count">{{ recordCount(item.type) }} 条</text>
          </view>
        </view>
      </template>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onUnload } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { RING_REALTIME_METRICS } from '@/sheep/store/ring';

  const ring = sheep.$store('ring');
  const metrics = RING_REALTIME_METRICS;
  const activeMetric = ref(RING_REALTIME_METRICS[0].metric);

  const currentMetric = computed(() =>
    metrics.find((item) => item.metric === activeMetric.value),
  );

  const measuring = computed(() => ring.measuringMetric === activeMetric.value);

  const realtimeValue = computed(() => {
    const data = ring.realtime[activeMetric.value];
    return data && Number.isFinite(Number(data.dataValue)) ? Number(data.dataValue) : null;
  });

  const lastSyncText = computed(() =>
    ring.lastSyncAt ? sheep.$helper.timeFrom(ring.lastSyncAt) : '',
  );

  onUnload(() => {
    if (ring.measuringMetric) {
      ring.stopMeasure(ring.measuringMetric).catch(() => undefined);
    }
  });

  function goDevice() {
    sheep.$router.go('/pages/ring/device');
  }

  function recordCount(type) {
    const records = ring.health[type];
    return Array.isArray(records) ? records.length : 0;
  }

  async function onSync() {
    try {
      await ring.syncHealth();
      sheep.$helper.toast('全天数据同步完成');
    } catch (error) {
      sheep.$helper.toast(error.errMsg || error.message || '同步失败');
    } finally {
      // 同步结束释放原生同步 callback，避免长时间占用
      ring.releaseSyncCallbacks().catch(() => undefined);
    }
  }

  function onPickMetric(metric) {
    if (measuring.value) {
      sheep.$helper.toast('请先停止当前检测');
      return;
    }
    activeMetric.value = metric;
  }

  async function onToggleMeasure() {
    const metric = activeMetric.value;
    try {
      if (measuring.value) {
        await ring.stopMeasure(metric);
        return;
      }
      await ring.startMeasure(metric);
    } catch (error) {
      sheep.$helper.toast(error.errMsg || error.message || '检测失败');
    }
  }
</script>

<style lang="scss" scoped>
  .ring-page {
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
    color: var(--ui-TC-3);
  }

  .hint-inline {
    margin-top: 10rpx;
  }

  .card-text {
    margin-top: 16rpx;
    font-size: 26rpx;
    line-height: 40rpx;
    color: var(--ui-TC-2);
  }

  .device-card {
    display: flex;
    margin-top: 180rpx;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #1e3f1c, #356b32);

    .device-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #ffffff;
    }

    .device-sub {
      margin-top: 10rpx;
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.75);
    }

    .device-action {
      font-size: 26rpx;
      color: #ffffff;
    }
  }

  .overview-grid {
    display: flex;
    flex-wrap: wrap;
    margin: 20rpx -10rpx 10rpx;

    .overview-item {
      width: 25%;
      padding: 20rpx 10rpx;
      text-align: center;

      .overview-value {
        display: flex;
        align-items: baseline;
        justify-content: center;

        .value {
          font-size: 40rpx;
          font-weight: bold;
          color: #1e3f1c;
        }

        .unit {
          margin-left: 4rpx;
          font-size: 20rpx;
          color: var(--ui-TC-3);
        }
      }

      .overview-label {
        margin-top: 8rpx;
        font-size: 22rpx;
        color: var(--ui-TC-2);
      }
    }
  }

  .metric-row {
    display: flex;
    flex-wrap: wrap;
    margin: 20rpx 0;

    .metric-chip {
      margin: 0 20rpx 16rpx 0;
      padding: 12rpx 30rpx;
      font-size: 26rpx;
      color: var(--ui-TC-1);
      background: var(--ui-BG-1);
      border-radius: 32rpx;
    }

    .metric-chip-active {
      background: rgba(30, 63, 28, 0.1);
      color: #1e3f1c;
      font-weight: bold;
    }
  }

  .realtime-value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    padding: 20rpx 0 30rpx;

    .value {
      font-size: 76rpx;
      font-weight: bold;
      color: #1e3f1c;
    }

    .unit {
      margin-left: 8rpx;
      font-size: 26rpx;
      color: var(--ui-TC-3);
    }
  }

  .progress-track {
    height: 12rpx;
    margin-top: 20rpx;
    background: var(--ui-BG-2);
    border-radius: 6rpx;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      background: #1e3f1c;
      border-radius: 6rpx;
      transition: width 0.3s;
    }
  }

  .type-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22rpx 0;
    border-bottom: 2rpx solid var(--ui-BG-2);

    .type-label {
      font-size: 28rpx;
      color: #3c3c3c;
    }

    .type-count {
      font-size: 24rpx;
      color: var(--ui-TC-3);
    }
  }

  .btn {
    width: 100%;
    height: 84rpx;
    line-height: 84rpx;
    margin-top: 20rpx;
    font-size: 28rpx;
    text-align: center;
    border-radius: 42rpx;
  }

  .btn-primary {
    background: #1e3f1c;
    color: #ffffff;
  }

  .btn-plain {
    background: var(--ui-BG-2);
    color: var(--ui-TC-1);
  }

  .btn[disabled] {
    opacity: 0.5;
  }
</style>
