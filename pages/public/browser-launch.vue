<template>
  <view class="browser-launch-page">
    <view class="custom-navbar" :style="navbarBoxStyle">
      <view class="navbar-content">
        <view class="back-btn" @tap="onTapBack" aria-label="返回">
          <text class="iconfont sicon-back back-icon"></text>
        </view>
        <view class="navbar-title-slot"><!-- 故意留空，不显示任何标题或占位 --></view>
      </view>
    </view>
    <view class="wrap" :style="{ paddingTop: contentPadTop }">
      <view class="hero-card">
        <view class="hero-icon">
          <su-image
            :src="sheep.$url.static('/static/public/browser-tip.webp')"
            mode="aspectFit"
            width="160rpx"
            height="160rpx"
          />
        </view>
        <view class="hero-title">请在浏览器中打开以享受完整服务</view>
        <view class="hero-desc">
          当前环境暂不支持直接内嵌打开该服务页面， 请点击下方按钮复制链接或跳转浏览器打开。
        </view>
      </view>

      <view class="panel">
        <view class="panel-title">访问地址</view>
        <view class="panel-row link-box" v-if="launchUrl">
          <text class="link-text">{{ launchUrl }}</text>
          <view class="copy-btn" @tap="onTapCopyOnly">复制链接</view>
        </view>
        <view class="panel-row link-box loading" v-else>
          <text class="loading-text">正在生成访问地址，请稍候…</text>
        </view>
      </view>

      <view class="tip-row" v-if="envTips.length">
        <view class="tip-badge">温馨提示</view>
        <view class="tip-text">{{ envTips.join('；') }}</view>
      </view>

      <view class="actions">
        <view class="btn primary" @tap="onTapOpenBrowser">
          {{ primaryBtnText }}
        </view>
        <view class="btn ghost" @tap="onTapCopyOnly"> 仅复制链接 </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OemApi from '@/sheep/api/member/oem';

  const launchUrl = ref('');
  const loading = ref(false);
  const opening = ref(false);
  const copying = ref(false);
  const inputLaunchUrl = ref('');
  const statusBarHeight = sheep?.$platform?.device?.statusBarHeight || 20; // px
  const navBarHeight = 44; // px, 标题栏内容区固定高度
  const navbarBoxStyle = computed(() => ({
    paddingTop: `${statusBarHeight}px`,
    height: `${statusBarHeight + navBarHeight}px`,
  }));
  const contentPadTop = computed(() => `${statusBarHeight + navBarHeight}px`);

  function detectPlatform() {
    // #ifdef APP-PLUS
    return 'APP';
    // #endif
    // #ifdef H5
    return 'H5';
    // #endif
    // #ifdef MP-WEIXIN
    return 'MP-WEIXIN';
    // #endif
    // #ifdef MP-ALIPAY
    return 'MP-ALIPAY';
    // #endif
    // #ifdef MP
    // #ifndef MP-WEIXIN
    // #ifndef MP-ALIPAY
    return 'MP-OTHER';
    // #endif
    // #endif
    // #endif
    return 'UNKNOWN';
  }

  const platform = detectPlatform();

  const primaryBtnText = computed(() => {
    if (platform === 'APP') return '用系统浏览器打开';
    if (platform === 'H5') return '打开新标签页访问';
    return '复制链接并提示打开方式';
  });

  const envTips = computed(() => {
    const tips = [];
    if (platform === 'MP-WEIXIN') {
      tips.push('微信内不能直接调起外部浏览器');
      tips.push('复制链接后可粘贴到系统浏览器或长按识别访问');
    }
    if (platform === 'MP-ALIPAY' || platform === 'MP-OTHER') {
      tips.push('当前小程序环境暂无法直接打开外部浏览器');
      tips.push('请复制链接后切换到浏览器 App 粘贴打开');
    }
    if (platform === 'H5') {
      tips.push('如浏览器拦截了弹窗，请在地址栏手动粘贴访问');
    }
    return tips;
  });

  onLoad((options) => {
    const raw = options?.launchUrl ? decodeURIComponent(options.launchUrl) : '';
    inputLaunchUrl.value = raw;
    if (raw && /^https?:\/\//i.test(raw)) {
      launchUrl.value = raw;
    } else {
      void fetchLaunchUrl();
    }
  });

  async function fetchLaunchUrl() {
    if (loading.value) return;
    loading.value = true;
    try {
      const res = await OemApi.getHealthConsultLaunchUrl();
      if (!res || res.code !== 0) {
        showSysErr();
        return;
      }
      let url = '';
      const payload = res.data;
      if (typeof payload === 'string') {
        url = payload;
      } else if (payload && typeof payload === 'object') {
        url =
          payload.launchUrl ||
          payload.launch_url ||
          payload.url ||
          payload.h5Url ||
          payload.redirectUrl ||
          '';
      }
      if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
        showSysErr();
        return;
      }
      launchUrl.value = url;
    } catch (e) {
      showSysErr();
    } finally {
      loading.value = false;
    }
  }

  function showSysErr() {
    uni.showToast({ title: '系统异常，请稍后再试', icon: 'none', mask: true });
  }

  async function copyToClipboard(text) {
    if (!text) {
      showSysErr();
      return false;
    }
    return new Promise((resolve) => {
      uni.setClipboardData({
        data: text,
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    });
  }

  async function onTapCopyOnly() {
    if (!launchUrl.value || copying.value) return;
    copying.value = true;
    try {
      const ok = await copyToClipboard(launchUrl.value);
      if (!ok) {
        showSysErr();
        return;
      }
      uni.showToast({ title: '链接已复制', icon: 'none', mask: true });
    } finally {
      copying.value = false;
    }
  }

  async function onTapOpenBrowser() {
    if (opening.value) return;
    if (!launchUrl.value) {
      showSysErr();
      return;
    }
    opening.value = true;
    try {
      const url = launchUrl.value;
      // APP：直接打开系统浏览器
      // #ifdef APP-PLUS
      try {
        plus.runtime.openURL(url, (err) => {
          void copyFallback(err);
        });
        return;
      } catch (e) {
        void copyFallback(e);
        return;
      }
      // #endif

      // H5：新标签打开，被拦截则复制
      // #ifdef H5
      try {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) {
          void copyFallback({ reason: 'popup-blocked' });
          return;
        }
        uni.showToast({ title: '已在新标签页打开', icon: 'none', mask: true });
        return;
      } catch (e) {
        void copyFallback(e);
        return;
      }
      // #endif

      // 微信小程序：复制 + Modal 引导
      // #ifdef MP-WEIXIN
      void copyFallback(null, {
        modalTitle: '请在浏览器打开',
        modalContent: '链接已复制到剪贴板。请切换到系统浏览器（Safari / Chrome 等）粘贴访问。',
      });
      return;
      // #endif

      // 支付宝/其他小程序：复制 + Modal 引导
      // #ifdef MP
      // #ifndef MP-WEIXIN
      void copyFallback(null, {
        modalTitle: '请在浏览器打开',
        modalContent: '链接已复制到剪贴板。请切换到系统浏览器粘贴访问以享受完整服务。',
      });
      return;
      // #endif
      // #endif
    } finally {
      // 兜底 200ms 后释放，复制 fallback 里也会解
      setTimeout(() => {
        opening.value = false;
      }, 220);
    }
  }

  async function copyFallback(err, modalOpts) {
    try {
      const ok = await copyToClipboard(launchUrl.value);
      if (!ok) {
        showSysErr();
        return;
      }
      uni.showModal({
        title: modalOpts?.modalTitle || '请在浏览器打开',
        content:
          modalOpts?.modalContent ||
          '链接已复制，请切换到系统浏览器（Safari / Chrome 等）粘贴访问。',
        showCancel: false,
        confirmText: '我知道了',
      });
    } catch (e) {
      showSysErr();
    } finally {
      opening.value = false;
    }
  }

  function onTapBack() {
    const pages = getCurrentPages();
    if (pages && pages.length > 1) {
      uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) });
    } else {
      uni.switchTab({ url: '/pages/index/index' });
    }
  }
</script>

<style lang="scss" scoped>
  .browser-launch-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #fff8f3 0%, #ffffff 60%);
  }

  .custom-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: transparent;
    box-sizing: border-box;
  }

  .navbar-content {
    position: relative;
    height: 44px;
    display: flex;
    align-items: center;
    padding-left: 20rpx;
  }

  .back-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    padding: 0;
  }

  .back-icon {
    color: #000;
    font-size: 22px;
    line-height: 1;
  }

  .navbar-title-slot {
    flex: 1;
  }

  .wrap {
    padding: 32rpx 28rpx 120rpx;
  }

  .hero-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 48rpx 36rpx 40rpx;
    box-shadow: 0 8rpx 24rpx rgba(255, 90, 50, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: #fff1e8;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
  }

  .hero-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1f2024;
    text-align: center;
    margin-bottom: 16rpx;
  }

  .hero-desc {
    font-size: 26rpx;
    line-height: 1.6;
    color: #6b7280;
    text-align: center;
  }

  .panel {
    margin-top: 28rpx;
    background: #ffffff;
    border-radius: 24rpx;
    padding: 28rpx 28rpx 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(17, 24, 39, 0.04);
  }

  .panel-title {
    font-size: 24rpx;
    color: #9ca3af;
    margin-bottom: 16rpx;
  }

  .panel-row.link-box {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20rpx;
  }

  .link-text {
    flex: 1;
    font-size: 26rpx;
    line-height: 1.7;
    color: #374151;
    word-break: break-all;
    background: #f5f6f7;
    border-radius: 16rpx;
    padding: 20rpx;
  }

  .copy-btn {
    flex-shrink: 0;
    height: 64rpx;
    padding: 0 24rpx;
    line-height: 64rpx;
    font-size: 24rpx;
    color: #ffffff;
    background: #ff5a32;
    border-radius: 999rpx;
    margin-top: 8rpx;
  }

  .loading-text {
    font-size: 26rpx;
    color: #9ca3af;
  }

  .tip-row {
    margin-top: 28rpx;
    background: #fff7e6;
    border: 1rpx solid #ffe0a3;
    border-radius: 20rpx;
    padding: 24rpx;
    display: flex;
    gap: 16rpx;
  }

  .tip-badge {
    flex-shrink: 0;
    height: 40rpx;
    line-height: 40rpx;
    padding: 0 16rpx;
    font-size: 22rpx;
    color: #b45309;
    background: #ffedd5;
    border-radius: 999rpx;
    align-self: flex-start;
  }

  .tip-text {
    flex: 1;
    font-size: 24rpx;
    color: #92400e;
    line-height: 1.7;
  }

  .actions {
    position: fixed;
    left: 28rpx;
    right: 28rpx;
    bottom: calc(40rpx + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  .btn {
    height: 96rpx;
    line-height: 96rpx;
    text-align: center;
    border-radius: 999rpx;
    font-size: 30rpx;
    font-weight: 600;
  }

  .btn.primary {
    color: #ffffff;
    background: linear-gradient(135deg, #ff7a3c 0%, #ff3e00 100%);
    box-shadow: 0 12rpx 24rpx rgba(255, 82, 30, 0.22);
  }

  .btn.ghost {
    color: #ff5a32;
    background: #ffffff;
    border: 2rpx solid #ffd3c4;
  }
</style>
