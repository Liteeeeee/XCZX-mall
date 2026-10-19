<!-- 视频问诊（第三方问诊 H5 容器页），由七暖 OEM H5 通过 wx.miniProgram.navigateTo 唤起 -->
<template>
  <view class="qcx">
    <web-view v-if="src" :src="src" @error="onWebviewError" />
    <view v-else class="qcx-error">
      <view class="qcx-error__title">暂时无法打开视频问诊</view>
      <view class="qcx-error__text">{{ error || '请检查网络后重试' }}</view>
      <button class="qcx-error__primary" @tap="retry">重新加载</button>
      <button class="qcx-error__ghost" @tap="goBack">返回</button>
    </view>
  </view>
</template>

<script setup>
  import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
  import { nextTick, ref } from 'vue';
  import { loadCapabilities } from './capabilities';

  // 仅允许加载白名单内的问诊域名，避免 src 被伪造后打开任意页面
  const ALLOWED_HOSTS = [
    'claim.yuanforce.com',
    'm.ehealthnowsolutions.com',
    'm1.ehealthnowsolutions.com',
    'hmhl.ehealthnowsolutions.com',
  ];
  const POLL_INTERVAL = 30000;
  const REFRESH_THRESHOLD = 500;

  const src = ref('');
  const error = ref('');

  let targetSrc = '';
  let pollTimer = null;
  let pollRunning = false;
  let networkToasted = false;
  let lastCheckedAt = 0;

  onLoad((query) => {
    const raw = String((query && query.src) || '').trim();
    let decoded = raw;
    if (/^https?%3a/i.test(raw)) {
      try {
        decoded = decodeURIComponent(raw);
      } catch (e) {}
    }
    const match = decoded.match(/^https:\/\/([^/?#]+)(?:[/?#]|$)/i);
    const host = String((match && match[1]) || '').toLowerCase();
    const allowed = ALLOWED_HOSTS.some((item) => host === item || host.endsWith('.' + item));
    if (!allowed) {
      error.value = '视频问诊地址无效，请返回后重新发起';
      return;
    }
    targetSrc = decoded;
    refreshCapability(true);
  });

  onShow(() => {
    if (!targetSrc) return;
    startPolling();
    if (Date.now() - lastCheckedAt < REFRESH_THRESHOLD) return;
    refreshCapability(false);
  });

  onHide(stopPolling);
  onUnload(stopPolling);

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => {
      if (pollRunning || !targetSrc) return;
      pollRunning = true;
      try {
        await refreshCapability(false);
      } finally {
        pollRunning = false;
      }
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  async function refreshCapability(reload) {
    const pageAlreadyLoaded = !!src.value;
    if (reload && !pageAlreadyLoaded) {
      src.value = '';
      error.value = '';
    }
    const caps = await loadCapabilities();
    lastCheckedAt = Date.now();
    if (!caps.healthy) {
      // 已经打开的问诊不因一次网络抖动被中断
      if (pageAlreadyLoaded) {
        if (!networkToasted) {
          networkToasted = true;
          uni.showToast({ title: '网络不稳定，已保留当前问诊', icon: 'none' });
        }
        return true;
      }
      src.value = '';
      error.value = '网络不稳定，暂时无法确认视频问诊状态，请重试';
      return false;
    }
    networkToasted = false;
    if (!caps.qcx) {
      src.value = '';
      error.value = '视频问诊服务已关闭，请返回';
      return false;
    }
    if (reload || !src.value) {
      src.value = targetSrc;
      error.value = '';
    }
    return true;
  }

  function onWebviewError(e) {
    console.error('qcx web-view load failed', e && e.detail);
    src.value = '';
    error.value = '视频问诊页面加载失败，请确认小程序业务域名后重试';
  }

  async function retry() {
    if (!targetSrc) return;
    if (!(await refreshCapability(false))) return;
    src.value = '';
    error.value = '';
    await nextTick();
    src.value = targetSrc;
  }

  function goBack() {
    uni.navigateBack({
      delta: 1,
      fail: () => uni.reLaunch({ url: '/pages/index/index' }),
    });
  }
</script>

<style lang="scss" scoped>
  .qcx {
    min-height: 100vh;
    background: #f5f6fa;
  }

  .qcx-error {
    min-height: 100vh;
    box-sizing: border-box;
    padding: 240rpx 64rpx 80rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .qcx-error__title {
    font-size: 36rpx;
    font-weight: 700;
    color: #151828;
  }

  .qcx-error__text {
    margin-top: 24rpx;
    font-size: 26rpx;
    line-height: 1.6;
    color: #7b8192;
  }

  .qcx-error__primary,
  .qcx-error__ghost {
    width: 100%;
    height: 88rpx;
    margin-top: 36rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    line-height: 88rpx;
  }

  .qcx-error__primary {
    color: #fff;
    background: linear-gradient(135deg, #6c5ce7, #8b70f2);
  }

  .qcx-error__ghost {
    margin-top: 20rpx;
    color: #6c5ce7;
    background: #ebe8ff;
  }

  .qcx-error__primary::after,
  .qcx-error__ghost::after {
    border: 0;
  }
</style>
