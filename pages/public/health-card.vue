<template>
  <view class="health-card-page">
    <!-- 自定义导航栏（设计稿 NavBar：返回按钮 + 居中标题） -->
    <view class="custom-navbar" :style="navbarBoxStyle">
      <view class="navbar-content">
        <view class="back-btn" @tap="onTapBack" aria-label="返回">
          <text class="iconfont sicon-back back-icon"></text>
        </view>
        <view class="navbar-title">{{ card.serviceName }}</view>
      </view>
    </view>

    <view class="wrap" :style="{ paddingTop: contentPadTop }">
      <!-- 电子会员卡 -->
      <view class="member-card" @tap="onCopyRedeemCode">
        <view class="member-card__arc"></view>

        <view class="member-card__head">
          <view class="member-card__identity">
            <image class="member-card__identity-icon" :src="iconSrc.activity" mode="aspectFit" />
            <text class="member-card__name">{{ card.serviceName }}</text>
          </view>
          <view class="member-card__status">
            <image class="member-card__status-icon" :src="iconSrc.check" mode="aspectFit" />
            <text class="member-card__status-text">兑换码:</text>
            <text class="member-card__status-code">{{ card.redeemCode }}</text>
          </view>
        </view>

        <image class="member-card__art" :src="iconSrc.cardArt" mode="aspectFill" />
      </view>

      <!-- 激活与协助 -->
      <view class="section">
        <view class="section__title">激活与协助</view>
        <view class="section__desc">兑换码激活方式及客服协助入口</view>

       

        <!-- 方式二：小程序使用服务 -->
        <view class="method-card method-card--sms">
          <view class="method-head">
            <image class="method-head__icon" :src="localIcon('smartphone')" mode="aspectFit" />
            <view class="method-head__text">
              <view class="method-head__name">小程序使用服务</view>
              <view class="method-head__step">方式 01 · 使用小程序</view>
            </view>
          </view>

          <view class="method-btn method-btn--ghost" @tap="onSearchMiniProgram">
            <text class="method-btn__text">微信搜索：{{ card.miniProgramName }}小程序</text>
          </view>
        </view>

        <!-- 方式三：在线客服协助 -->
        <view class="method-card method-card--service">
          <view class="method-head">
            <image class="method-head__icon" :src="localIcon('headset')" mode="aspectFit" />
            <view class="method-head__text">
              <view class="method-head__name">在线客服协助</view>
              <view class="method-head__step">方式 02 · 工作日 9:00–21:00</view>
            </view>
          </view>

          <view class="method-note">
            拨打官方客服电话: {{ card.servicePhoneDisplay }}， 激活使用{{ card.serviceName }}
          </view>
          <view class="method-divider"></view>
          <view class="method-phone">
            <text class="method-phone__label">客服电话</text>
            <text class="method-phone__value">{{ card.servicePhoneDisplay }}</text>
          </view>

          <view class="method-btn method-btn--ghost" @tap="onCallService">
            <text class="method-btn__text">联系客服</text>
            <image class="method-btn__icon" :src="iconSrc.phone" mode="aspectFit" />
          </view>
        </view>
      </view>

      <!-- 说明分隔线 -->
      <view class="foot-divider"></view>

      <!-- 说明 -->
      <view class="foot-note">
        <image class="foot-note__icon" :src="iconSrc.clock" mode="aspectFit" />
        <view class="foot-note__body">
          <view class="foot-note__title">激活后24小时内开通全部问诊权益</view>
          <view class="foot-note__text">
            免责声明：本服务由第三方持牌互联网医院提供
            <br />
            卡片仅供绑定账号使用
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OemApi from '@/sheep/api/member/oem';

  // 线上切图目录（sheep.$url.static 会拼上 SHOPRO_STATIC_URL 的 OSS 前缀）
  const OSS_ICON_DIR = '/static/在线问诊';
  // 本地切图目录：线上缺失的图标（globe / smartphone / headset）走本地，需硬编码路径
  const LOCAL_ICON_DIR = '/static/img/health-card';
  const LOCAL_ICON_FILES = {
    globe: 'method-globe.png',
    smartphone: 'method-smartphone.png',
    headset: 'method-headset.png',
  };

  const iconSrc = {
    cardArt: sheep.$url.static(`${OSS_ICON_DIR}/image 4@3x.png`),
    activity: sheep.$url.static(`${OSS_ICON_DIR}/square-activity@3x.png`),
    check: sheep.$url.static(`${OSS_ICON_DIR}/circle-check@3x.png`),
    copy: sheep.$url.static(`${OSS_ICON_DIR}/copy@3x.png`),
    phone: sheep.$url.static(`${OSS_ICON_DIR}/phone@3x.png`),
    clock: sheep.$url.static(`${OSS_ICON_DIR}/Vector@3x.png`),
  };

  function localIcon(key) {
    return `${LOCAL_ICON_DIR}/${LOCAL_ICON_FILES[key]}`;
  }

  // 自定义导航栏：状态栏高度 + 44px 标题栏，下方留 23.53pt(47rpx) 间距（设计稿）
  const statusBarHeight = sheep?.$platform?.device?.statusBarHeight || 20; // px
  const navBarHeight = 44; // px，标题栏内容区高度
  const navbarBoxStyle = computed(() => ({
    paddingTop: `${statusBarHeight}px`,
    height: `${statusBarHeight + navBarHeight}px`,
  }));
  const contentPadTop = computed(() => `calc(${statusBarHeight + navBarHeight}px + 47rpx)`);

  function onTapBack() {
    const pages = getCurrentPages();
    if (pages && pages.length > 1) {
      uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) });
    } else {
      uni.switchTab({ url: '/pages/index/index' });
    }
  }

  // 会员卡信息：激活码来自接口，其余字段接口就绪前先用占位数据
  const card = reactive({
    serviceName: '仙草健康卡',
    redeemCode: '',
    activateUrl: 'https://oem.baitengjiankang.com',
    servicePhone: '010-8883-3110',
    servicePhoneDisplay: '(010)-8883-3110',
    miniProgramName: '仙草有方',
  });

  // 领取激活码（进入页面时请求一次，错误提示由请求拦截器统一处理）
  async function loadActivationCode() {
    const res = await OemApi.getActivationCode();
    if (!res || res.code !== 0) return;
    const payload = res.data;
    let code = '';
    if (typeof payload === 'string') {
      code = payload;
    } else if (payload && typeof payload === 'object') {
      code = payload.activationCode || payload.code || payload.redeemCode || '';
    }
    if (code) {
      card.redeemCode = String(code);
    }
  }

  onLoad(() => {
    loadActivationCode();
  });

  function onCopyRedeemCode() {
    if (!card.redeemCode) return;
    uni.setClipboardData({
      data: card.redeemCode,
      success: () => {
        uni.showToast({ title: '兑换码已复制', icon: 'none' });
      },
    });
  }

  function onCopyActivateUrl() {
    uni.setClipboardData({
      data: card.activateUrl,
      success: () => {
        uni.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'none' });
      },
    });
  }

  function onSearchMiniProgram() {
    uni.setClipboardData({
      data: card.miniProgramName,
      success: () => {
        uni.showToast({ title: '已复制，请在微信搜索该小程序', icon: 'none' });
      },
    });
  }

  function onCallService() {
    uni.makePhoneCall({ phoneNumber: card.servicePhone, fail: () => {} });
  }
</script>

<style lang="scss" scoped>
  .health-card-page {
    min-height: 100vh;
    background: #f5f7fa;
  }

  /* 自定义导航栏 */
  .custom-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    box-sizing: border-box;
    background: #f5f7fa;
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
    margin-left: 3rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .back-icon {
    font-size: 22px;
    line-height: 1;
    color: rgba(0, 0, 0, 0.9);
  }

  .navbar-title {
    position: absolute;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 36rpx;
    font-weight: 600;
    line-height: 52rpx;
    color: rgba(0, 0, 0, 0.9);
    pointer-events: none;
  }

  .wrap {
    padding: 0 33rpx calc(88rpx + env(safe-area-inset-bottom));
  }

  /* 电子会员卡 */
  .member-card {
    position: relative;
    width: 100%;
    height: 522rpx;
    overflow: hidden;
    box-sizing: border-box;
    border: 2rpx solid #ffffff;
    border-radius: 45rpx;
    background: linear-gradient(90deg, #f3f7fb 0%, #dfe9f2 52%, #c9dae9 100%);
    box-shadow: 0 19rpx 45rpx rgba(41, 77, 112, 0.09);
  }

  .member-card__arc {
    position: absolute;
    left: 377rpx;
    top: 75rpx;
    width: 392rpx;
    height: 392rpx;
    box-sizing: border-box;
    border: 2rpx solid rgba(255, 255, 255, 0.44);
    border-radius: 50%;
  }

  .member-card__head {
    position: absolute;
    left: 41rpx;
    right: 41rpx;
    top: 41rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .member-card__identity {
    display: flex;
    align-items: center;
  }

  .member-card__identity-icon {
    flex-shrink: 0;
    width: 35rpx;
    height: 35rpx;
    display: block;
  }

  .member-card__name {
    margin-left: 13rpx;
    font-size: 30rpx;
    font-weight: 700;
    line-height: 45rpx;
    color: #233c52;
  }

  .member-card__status {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 19rpx;
    height: 53rpx;
    box-sizing: border-box;
    border: 2rpx solid #bbd1d0;
    border-radius: 999rpx;
    background: #f4faf9;
  }

  .member-card__status-icon {
    flex-shrink: 0;
    width: 24rpx;
    height: 24rpx;
    display: block;
  }

  .member-card__status-text {
    margin-left: 9rpx;
    font-size: 22rpx;
    font-weight: 400;
    line-height: 34rpx;
    color: #356c67;
  }

  .member-card__status-code {
    font-weight: 700;
  }

  .member-card__art {
    position: absolute;
    left: 41rpx;
    top: 131rpx;
    width: 604rpx;
    height: 350rpx;
    display: block;
  }

  /* 激活与协助 */
  .section {
    margin-top: 56rpx;
  }

  .section__title {
    font-size: 37rpx;
    font-weight: 700;
    line-height: 52rpx;
    color: #233c52;
  }

  .section__desc {
    margin-top: 11rpx;
    font-size: 26rpx;
    font-weight: 400;
    line-height: 41rpx;
    color: #60768a;
  }

  /* 方式卡片 */
  .method-card {
    margin-top: 31rpx;
    padding: 33rpx;
    box-sizing: border-box;
    border: 2rpx solid #d8e7ec;
    border-radius: 34rpx;
    background: #ffffff;
  }

  .method-card--sms {
    padding-top: 34rpx;
    padding-bottom: 32rpx;
  }

  .method-card--service {
    padding-top: 34rpx;
    padding-bottom: 35rpx;
  }

  .method-head {
    display: flex;
    align-items: center;
  }

  .method-head__icon {
    flex-shrink: 0;
    width: 75rpx;
    height: 75rpx;
    display: block;
  }

  .method-head__text {
    flex: 1;
    min-width: 0;
    margin-left: 22rpx;
  }

  .method-head__name {
    font-size: 30rpx;
    font-weight: 700;
    line-height: 45rpx;
    color: #233c52;
  }

  .method-head__step {
    margin-top: 2rpx;
    font-size: 22rpx;
    font-weight: 400;
    line-height: 34rpx;
    color: #60768a;
  }

  .method-body {
    margin-top: 27rpx;
  }

  .method-body__url {
    font-size: 26rpx;
    font-weight: 500;
    line-height: 41rpx;
    color: #35688b;
  }

  .method-body__desc {
    margin-top: 11rpx;
    font-size: 26rpx;
    font-weight: 400;
    line-height: 41rpx;
    color: #60768a;
  }

  .method-note {
    margin-top: 26rpx;
    font-size: 26rpx;
    font-weight: 400;
    line-height: 41rpx;
    color: #60768a;
  }

  .method-divider {
    margin-top: 24rpx;
    height: 2rpx;
    background: #d8e7ec;
  }

  .method-phone {
    margin-top: 26rpx;
    height: 49rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .method-phone__label {
    font-size: 22rpx;
    font-weight: 400;
    line-height: 34rpx;
    color: #60768a;
  }

  .method-phone__value {
    font-size: 34rpx;
    font-weight: 500;
    line-height: 49rpx;
    color: #233c52;
  }

  /* 操作入口 */
  .method-btn {
    margin-top: 26rpx;
    height: 82rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 22rpx;
  }

  .method-btn--solid {
    border: 2rpx solid #35688b;
    background: #35688b;
  }

  .method-btn--ghost {
    border: 2rpx solid #d8e7ec;
    background: #ffffff;
  }

  .method-btn__text {
    font-size: 30rpx;
    font-weight: 700;
    line-height: 45rpx;
    color: #35688b;
  }

  .method-btn__text--light {
    color: #ffffff;
  }

  .method-btn__icon {
    flex-shrink: 0;
    width: 30rpx;
    height: 30rpx;
    margin-left: 14rpx;
    display: block;
  }

  /* 说明 */
  .foot-divider {
    margin: 68rpx 4rpx 0;
    height: 2rpx;
    background: #d8e7ec;
  }

  .foot-note {
    margin: 45rpx 4rpx 0;
    display: flex;
    align-items: flex-start;
  }

  .foot-note__icon {
    flex-shrink: 0;
    width: 26rpx;
    height: 26rpx;
    margin-top: 8rpx;
    display: block;
  }

  .foot-note__body {
    flex: 1;
    min-width: 0;
    margin-left: 18rpx;
  }

  .foot-note__title {
    font-size: 26rpx;
    font-weight: 400;
    line-height: 41rpx;
    color: #60768a;
  }

  .foot-note__text {
    margin-top: 4rpx;
    font-size: 22rpx;
    font-weight: 400;
    line-height: 34rpx;
    color: #60768a;
  }
</style>
