<template>
  <view class="browser-launch-page">
    <view class="custom-navbar" :style="navbarBoxStyle">
      <view class="navbar-content">
        <view class="back-btn" @tap="onTapBack" aria-label="返回">
          <text class="iconfont sicon-back back-icon"></text>
        </view>
        <view class="navbar-title">视频问诊</view>
      </view>
    </view>

    <view class="wrap" :style="{ paddingTop: contentPadTop }">
      <!-- 访问方式介绍 -->
      <view class="hero">
        <image
          class="hero-icon"
          :src="iconSrc.hero"
          mode="aspectFit"
          @error="onIconError('hero')"
        />
        <view class="hero-title">请选择访问方式</view>
        <view class="hero-desc">
          <text class="hero-desc-strong">按照互联网诊疗相关管理要求，线上问诊需进行实名认证</text>
          <text>，认证只能到系统浏览器中完成，请选择第一种方式。</text>
        </view>
      </view>

      <!-- 三要素实名认证说明 -->
      <view class="notice-card" @tap="onTapNotice">
        <view class="notice-title">关于实名认证</view>
        <image
          class="notice-info"
          :src="iconSrc.info"
          mode="aspectFit"
          @error="onIconError('info')"
        />
      </view>

      <!-- 方式一：首次使用 -->
      <view class="path-card-wrap" :class="{ 'path-card-wrap--lit': guideVisible }">
        <!-- 首次进入引导浮层：模态图 + 指向按钮的连接线 -->
        <view v-if="guideVisible" class="guide-popup" @tap.stop="closeGuide">
          <image class="guide-img" :src="modalImgSrc" mode="widthFix" />
          <view class="guide-arrow"></view>
        </view>

        <view class="path-card">
          <view class="path-head">
            <image
              class="path-icon"
              :src="iconSrc.globe"
              mode="aspectFit"
              @error="onIconError('globe')"
            />
            <view class="path-info">
              <view class="path-name">首次使用</view>
              <view class="path-sub">先在系统浏览器完成实名认证</view>
            </view>
            <view class="path-index">01</view>
          </view>

          <view class="btn btn-primary" @tap="onTapOpenBrowser">
            <image
              class="btn-icon"
              :src="iconSrc.copy"
              mode="aspectFit"
              @error="onIconError('copy')"
            />
            <text class="btn-text">{{ primaryBtnText }}</text>
          </view>

          <view class="path-tip">
            <image
              class="tip-icon"
              :src="iconSrc.info16"
              mode="aspectFit"
              @error="onIconError('info16')"
            />
            <view class="tip-body">
              <view class="tip-label">温馨提示</view>
              <view class="tip-text">{{ tipText }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 方式二：已完成实名认证 -->
      <view class="path-card">
        <view class="path-head">
          <image
            class="path-icon"
            :src="iconSrc.phone"
            mode="aspectFit"
            @error="onIconError('phone')"
          />
          <view class="path-info">
            <view class="path-name">已完成实名认证</view>
            <view class="path-sub">可在小程序内直接打开服务页面</view>
          </view>
          <view class="path-index">02</view>
        </view>

        <view class="btn btn-ghost" @tap="onTapOpenWebview">
          <image
            class="btn-icon"
            :src="iconSrc.arrow"
            mode="aspectFit"
            @error="onIconError('arrow')"
          />
          <text class="btn-text">在小程序内直接打开</text>
        </view>
      </view>
    </view>

    <!-- 首次进入引导遮罩：点击任意空白处关闭 -->
    <view v-if="guideVisible" class="guide-mask" @tap="closeGuide"></view>
  </view>
</template>

<script setup>
  import { computed, reactive, ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OemApi from '@/sheep/api/member/oem';

  // 线上切图目录（sheep.$url.static 会拼上 SHOPRO_STATIC_URL 的 OSS 前缀）
  const REMOTE_ICON_DIR = '/static/bower';
  // 本地切图目录（线上资源缺失时的兜底）
  const LOCAL_ICON_DIR = '/static/img/视频问诊 · 请选择访问方式_slices';
  const ICON_FILES = {
    hero: '身份访问图标@3x.webp',
    info: 'info@3x.webp',
    globe: '路径图标@3x.webp',
    phone: '路径图标@3x(1).webp',
    copy: 'copy-18.png',
    info16: 'info-16@4x.png',
    arrow: 'arrow-up-right@3x.webp',
  };
  const iconSrc = reactive(
    Object.fromEntries(
      Object.entries(ICON_FILES).map(([key, file]) => [
        key,
        sheep.$url.static(`${REMOTE_ICON_DIR}/${file}`),
      ]),
    ),
  );
  function onIconError(key) {
    const local = `${LOCAL_ICON_DIR}/${ICON_FILES[key]}`;
    if (iconSrc[key] !== local) {
      iconSrc[key] = local;
    }
  }

  // 首次进入引导浮层的模态图（线上资源）
  const modalImgSrc = sheep.$url.static('/static/vipNeo/modal.png');
  // 本地存储标记：仅首次进入本页展示一次引导
  const GUIDE_STORAGE_KEY = 'browser_launch_guide_shown';
  const guideVisible = ref(false);

  function showGuideOnce() {
    try {
      if (uni.getStorageSync(GUIDE_STORAGE_KEY)) return;
      uni.setStorageSync(GUIDE_STORAGE_KEY, 1);
    } catch (e) {
      // 本地存储不可用时按首次处理
    }
    guideVisible.value = true;
  }

  function closeGuide() {
    guideVisible.value = false;
  }

  const launchUrl = ref('');
  const loading = ref(false);
  const opening = ref(false);
  const openingWebview = ref(false);
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
    if (platform === 'APP') return '复制链接，用系统浏览器打开';
    if (platform === 'H5') return '复制链接，在新标签页打开';
    return '复制链接，去浏览器打开';
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

  const tipText = computed(() =>
    envTips.value.length
      ? `${envTips.value.join('；')}。`
      : '微信内不能直接调起外部浏览器；复制链接后可粘贴到系统浏览器或长按识别访问。',
  );

  onLoad((options) => {
    // 首次进入本页时展示一次访问引导浮层
    showGuideOnce();
    const raw = options?.launchUrl ? decodeURIComponent(options.launchUrl) : '';
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

  function onTapNotice() {
    uni.showModal({
      title: '关于三要素实名认证',
      content:
        '按国家监管规定，首次使用视频问诊服务需完成三要素（姓名 / 身份证号 / 手机号）实名认证，该认证流程无法在小程序内完成。请复制链接后到系统浏览器中完成认证；已完成认证的用户可在小程序内直接打开。',
      showCancel: false,
      confirmText: '我知道了',
    });
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

  // 在小程序内直接唤起 web-view 加载该地址（已完成实名认证的用户可直接使用）
  async function onTapOpenWebview() {
    if (openingWebview.value) return;
    if (!launchUrl.value) {
      showSysErr();
      return;
    }
    openingWebview.value = true;
    try {
      await new Promise((resolve, reject) => {
        uni.navigateTo({
          url: `/pages/public/webview?url=${encodeURIComponent(launchUrl.value)}`,
          success: resolve,
          fail: reject,
        });
      });
    } catch (e) {
      showSysErr();
    } finally {
      openingWebview.value = false;
    }
  }

  async function onTapOpenBrowser() {
    if (opening.value) return;
    if (!launchUrl.value) {
      showSysErr();
      return;
    }
    // 用户已按引导点击按钮，关闭引导浮层
    closeGuide();
    opening.value = true;
    try {
      const url = launchUrl.value;
      // APP：直接打开系统浏览器，失败则复制并展示引导图
      // #ifdef APP-PLUS
      try {
        plus.runtime.openURL(url, () => {
          void copyFallback();
        });
        return;
      } catch (e) {
        void copyFallback();
        return;
      }
      // #endif

      // H5：新标签打开，被拦截则复制并展示引导图
      // #ifdef H5
      try {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) {
          void copyFallback();
          return;
        }
        uni.showToast({ title: '已在新标签页打开', icon: 'none', mask: true });
        return;
      } catch (e) {
        void copyFallback();
        return;
      }
      // #endif

      // 小程序：复制链接并展示引导图
      // #ifdef MP
      void copyFallback();
      return;
      // #endif
    } finally {
      // 兜底 200ms 后释放，复制 fallback 里也会解
      setTimeout(() => {
        opening.value = false;
      }, 220);
    }
  }

  // 复制链接，提示用户到浏览器中打开
  async function copyFallback() {
    try {
      const ok = await copyToClipboard(launchUrl.value);
      if (!ok) {
        showSysErr();
        return;
      }
      uni.showToast({
        title: '链接已复制，请到浏览器中打开',
        icon: 'none',
        mask: true,
        duration: 2500,
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
    background: #f8f9f3;
  }

  .custom-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: #f8f9f3;
    box-sizing: border-box;
  }

  .navbar-content {
    position: relative;
    height: 44px;
    display: flex;
    align-items: center;
  }

  .back-btn {
    width: 88rpx;
    height: 88rpx;
    margin-left: 4rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    padding: 0;
  }

  .back-icon {
    color: #222a35;
    font-size: 22px;
    line-height: 1;
  }

  .navbar-title {
    position: absolute;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 28rpx;
    font-weight: 400;
    line-height: 1;
    color: #222a35;
    pointer-events: none;
  }

  .wrap {
    padding: 40rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
  }

  /* 访问方式介绍 */
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-icon {
    width: 128rpx;
    height: 128rpx;
    display: block;
  }

  .notice-info {
    flex-shrink: 0;
    width: 38rpx;
    height: 38rpx;
    display: block;
  }

  .path-icon {
    flex-shrink: 0;
    width: 80rpx;
    height: 80rpx;
    display: block;
  }

  .btn-icon {
    flex-shrink: 0;
    width: 36rpx;
    height: 36rpx;
    display: block;
  }

  .tip-icon {
    flex-shrink: 0;
    width: 32rpx;
    height: 32rpx;
    display: block;
  }

  .hero-title {
    margin-top: 24rpx;
    font-size: 48rpx;
    font-weight: 700;
    line-height: 64rpx;
    color: #222a35;
    text-align: center;
  }

  .hero-desc {
    margin-top: 24rpx;
    padding: 0 16rpx;
    font-size: 28rpx;
    font-weight: 400;
    line-height: 44rpx;
    color: #606b7a;
    text-align: center;
  }

  .hero-desc-strong {
    color: #237a48;
  }

  /* 三要素实名认证说明 */
  .notice-card {
    margin-top: 48rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    background: #e6ffe6;
    border-radius: 32rpx;
  }

  .notice-title {
    font-size: 32rpx;
    font-weight: 700;
    line-height: 48rpx;
    color: #237a48;
  }

  /* 访问路径卡片 */
  .path-card {
    margin-top: 20rpx;
    padding: 32rpx;
    background: #ffffff;
    border: 2rpx solid #dee8db;
    border-radius: 32rpx;
    box-sizing: border-box;
  }

  .path-head {
    display: flex;
    align-items: center;
  }

  .path-info {
    flex: 1;
    min-width: 0;
    margin-left: 24rpx;
  }

  .path-name {
    font-size: 32rpx;
    font-weight: 700;
    line-height: 48rpx;
    color: #222a35;
  }

  .path-sub {
    font-size: 24rpx;
    font-weight: 400;
    line-height: 36rpx;
    color: #606b7a;
  }

  .path-index {
    flex-shrink: 0;
    font-size: 36rpx;
    font-weight: 500;
    line-height: 1;
    color: #606b7a;
  }

  /* 按钮 */
  .btn {
    margin-top: 32rpx;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 24rpx;
    box-sizing: border-box;
  }

  .btn-text {
    margin-left: 12rpx;
    font-size: 32rpx;
    font-weight: 700;
    line-height: 48rpx;
  }

  .btn-primary {
    background: #237a48;
    border: 2rpx solid #237a48;
  }

  .btn-primary .btn-text {
    color: #ffffff;
  }

  .btn-ghost {
    background: #ffffff;
    border: 2rpx solid #dee8db;
  }

  .btn-ghost .btn-text {
    color: #237a48;
  }

  /* 浏览器打开提示 */
  .path-tip {
    margin-top: 32rpx;
    display: flex;
    align-items: flex-start;
  }

  .tip-body {
    flex: 1;
    min-width: 0;
    margin-left: 16rpx;
  }

  .tip-label {
    font-size: 24rpx;
    font-weight: 400;
    line-height: 36rpx;
    color: #237a48;
  }

  .tip-text {
    margin-top: 8rpx;
    font-size: 24rpx;
    font-weight: 400;
    line-height: 36rpx;
    color: #606b7a;
  }

  /* 首次进入引导浮层 */
  .guide-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.6);
  }

  /* 首张卡片外层：引导时抬到遮罩之上，形成聚光效果 */
  .path-card-wrap {
    position: relative;
    margin-top: 20rpx;
  }

  .path-card-wrap--lit {
    z-index: 1001;
  }

  .path-card-wrap .path-card {
    margin-top: 0;
  }

  /* 模态图：位于首张卡片正上方，水平居中 */
  .guide-popup {
    position: absolute;
    left: 50%;
    bottom: 100%;
    margin-bottom: 62rpx;
    transform: translateX(-50%);
    width: 670rpx;
    z-index: 1002;
  }

  .guide-img {
    width: 100%;
    display: block;
  }

  /* 模态图与卡片之间的连接线 */
  .guide-arrow {
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -2rpx;
    width: 4rpx;
    height: 62rpx;
    background: #fce5af;
  }
</style>
