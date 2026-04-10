<!-- 微信公众号的登录回调页 -->
<template>
  <!-- #ifdef H5 -->
  <view />
  <!-- #endif -->

  <!-- #ifndef H5 -->
  <s-layout navbar="clear" :bgStyle="{ backgroundColor: 'rgba(248, 249, 243, 1.0)' }">
    <view
      class="login-page"
      :style="{ backgroundImage: `url(${bgUrl})` }"
    >
      <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
        <su-status-bar />
        <view
          class="nav-bar-container"
          :style="{
            height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px',
          }"
        >
          <view
            class="nav-bar-inner ss-flex ss-col-center"
            :style="{ height: '100%', paddingLeft: '20rpx' }"
          >
            <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="onBack">
              <text
                class="sicon-back"
                style="font-size: 40rpx; color: rgba(30, 63, 28, 1); font-weight: 600"
              ></text>
            </view>
          </view>
        </view>
      </view>
      <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }" />
      <view class="brand-box ss-flex ss-flex-col ss-col-center">
        <image class="brand-logo" :src="logoUrl" mode="aspectFit" />
        <view class="brand-title">仙草甄选</view>
        <view class="brand-subtitle">以甄选之心，传故土本草之韵</view>
      </view>

      <view class="form-box">
        <view class="input-box ss-flex ss-row-between ss-col-center">
          <view class="input-label">手机号</view>
          <input
            class="input-control"
            v-model="state.mobile"
            type="number"
            placeholder="请输入手机号"
            placeholder-class="placeholder"
            maxlength="11"
          />
        </view>

        <view class="input-box ss-flex ss-row-between ss-col-center ss-m-t-24">
          <view class="input-label">验证码</view>
          <input
            class="input-control"
            v-model="state.code"
            type="number"
            placeholder="请输4位验证码"
            placeholder-class="placeholder"
            maxlength="6"
          />
          <view class="get-code-btn" @tap="onGetCode">{{ getSmsTimer('smsLogin') }}</view>
        </view>

        <view
          class="agreement-row ss-flex ss-col-center ss-m-t-24"
          :class="{ shake: currentProtocol }"
        >
          <view class="agreement-circle ss-flex ss-row-center ss-col-center" @tap="onAgree">
            <radio
              :checked="state.protocol === true"
              color="rgba(30, 63, 28, 1)"
              style="transform: scale(0.8)"
              @tap.stop="onAgree"
            />
          </view>
          <view class="agreement-text">
            <text>我已阅读并同意遵守</text>
            <text class="tcp-text" @tap.stop="onProtocol('用户协议')">《用户协议》</text>
            <text>与</text>
            <text class="tcp-text" @tap.stop="onProtocol('隐私协议')">《隐私协议》</text>
          </view>
        </view>
      </view>

      <view class="bottom-box ss-flex ss-flex-col ss-col-center">
        <button class="ss-reset-button login-btn" :disabled="state.loading" @tap="onLogin"
          >登录仙草</button
        >
        <view class="quick-row ss-flex ss-col-center">
          <text class="quick-left">还没有账号？</text>
          <!-- #ifdef MP-WEIXIN -->
          <button
            class="ss-reset-button quick-right"
            open-type="getPhoneNumber"
            @getphonenumber="getPhoneNumber"
          >
            快捷登录
          </button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <text class="quick-right" @tap="onLogin">快捷登录</text>
          <!-- #endif -->
        </view>
        <view class="safe-box" />
      </view>
    </view>
  </s-layout>
  <!-- #endif -->
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import test from '@/sheep/helper/test.js';
  import AuthUtil from '@/sheep/api/member/auth';
  import { getSmsCode, getSmsTimer } from '@/sheep/hooks/useModal';

  const state = reactive({
    mobile: '',
    code: '',
    protocol: null,
    loading: false,
  });

  const currentProtocol = ref(false);

  const bgUrl = sheep.$url.static('/static/loginBg.webp');
  const logoUrl = sheep.$url.static('/static/loginLogo.webp');

  function onBack() {
    sheep.$router.back();
  }

  function onAgree() {
    state.protocol = !state.protocol;
  }

  function onProtocol(title) {
    if (title === '隐私协议') {
      sheep.$router.go('/pages/index/privacyPolicy');
    } else if (title === '用户协议') {
      sheep.$router.go('/pages/index/userAgreement');
    } else {
      sheep.$router.go('/pages/public/richtext', { title });
    }
  }

  function shakeProtocol() {
    currentProtocol.value = true;
    setTimeout(() => {
      currentProtocol.value = false;
    }, 1000);
  }

  function onGetCode() {
    if (state.protocol !== true) {
      shakeProtocol();
      sheep.$helper.toast('请阅读并同意遵守协议');
      return;
    }
    getSmsCode('smsLogin', state.mobile);
  }

  async function onLogin() {
    if (!test.mobile(state.mobile)) {
      sheep.$helper.toast('手机号码格式不正确');
      return;
    }
    if (!state.code) {
      sheep.$helper.toast('请输入验证码');
      return;
    }
    if (state.protocol !== true) {
      shakeProtocol();
      sheep.$helper.toast('请阅读并同意遵守协议');
      return;
    }

    state.loading = true;
    const inviterIdRaw = uni.getStorageSync('inviterId');
    const inviterId = inviterIdRaw ? Number(inviterIdRaw) : 0;
    const res =
      Number.isFinite(inviterId) && inviterId > 0
        ? await AuthUtil.smsInviteLogin({ mobile: state.mobile, code: state.code, inviterId })
        : await AuthUtil.smsLogin({ mobile: state.mobile, code: state.code });
    state.loading = false;
    if (res?.code !== 0) {
      return;
    }
    if (Number.isFinite(inviterId) && inviterId > 0) {
      uni.removeStorageSync('inviterId');
      uni.removeStorageSync('shareId');
    }

    const returnUrl = uni.getStorageSync('returnUrl');
    if (returnUrl) {
      uni.removeStorage({ key: 'returnUrl' });
      sheep.$router.go(returnUrl, {}, { redirect: true });
      return;
    }

    sheep.$router.go('/pages/index/index', {}, { redirect: true });
  }

  const getPhoneNumber = async (e) => {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      sheep.$helper.toast('快捷登录失败');
      return;
    }
    if (state.protocol !== true) {
      shakeProtocol();
      sheep.$helper.toast('请阅读并同意遵守协议');
      return;
    }
    state.loading = true;
    const result = await sheep.$platform.useProvider().mobileLogin(e.detail);
    state.loading = false;
    if (!result) {
      return;
    }
    const returnUrl = uni.getStorageSync('returnUrl');
    if (returnUrl) {
      uni.removeStorage({ key: 'returnUrl' });
      sheep.$router.go(returnUrl, {}, { redirect: true });
      return;
    }
    sheep.$router.go('/pages/index/index', {}, { redirect: true });
  };

  onLoad(async (options) => {
    // #ifdef H5
    new URLSearchParams(location.search).forEach((value, key) => {
      options[key] = value;
    });
    const event = options.event;
    const code = options.code;
    const state = options.state;
    if (event === 'login') {
      await sheep.$platform.useProvider().login(code, state);
    } else if (event === 'bind') {
      await sheep.$platform.useProvider().bind(code, state);
    }

    let returnUrl = uni.getStorageSync('returnUrl');
    if (returnUrl) {
      uni.removeStorage({ key: 'returnUrl' });
      location.replace(returnUrl);
    } else {
      sheep.$router.go('/pages/index/index', {}, { redirect: true });
    }
    // #endif
  });
</script>

<style lang="scss" scoped>
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    background-color: transparent;
  }

  .nav-bar-container {
    position: relative;
    width: 100%;
  }

  .back-btn {
    width: 60rpx;
    height: 100%;
  }

  .shake {
    animation: shake 0.05s linear 4 alternate;
  }

  @keyframes shake {
    from {
      transform: translateX(-10rpx);
    }
    to {
      transform: translateX(10rpx);
    }
  }

  .login-page {
    position: relative;
    min-height: 100vh;
    background-color: rgba(248, 249, 243, 1);
    background-repeat: no-repeat;
    background-position: center -260rpx;
    background-size: cover;
    box-sizing: border-box;
    overflow: hidden;
  }

  .brand-box {
    position: relative;
    padding-top: 102rpx;
    z-index: 2;
  }

  .brand-logo {
    width: 200rpx;
    height: 265rpx;
  }

  .brand-title {
    margin-top: 33rpx;
    font-size: 46rpx;
    font-weight: 600;
    color: rgba(30, 63, 28, 1);
    letter-spacing: 1.4375rpx;
    line-height: 65rpx;
  }

  .brand-subtitle {
    margin-top: 5rpx;
    font-size: 28rpx;
    font-weight: 400;
    color: #3D3D3C;
    letter-spacing: 0.875rpx;
    line-height: 40rpx;
  }

  .form-box {
    // position: relative;
    padding-top: 60rpx;
    z-index: 2;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .input-box {
    width: 630rpx;
    height: 92rpx;
    background-color: rgba(255, 255, 250, 1);
    border: 1rpx solid rgba(238, 238, 238, 1);
    border-radius: 20rpx;
    padding: 0 28rpx;
  }

  .input-label {
    font-size: 28rpx;
    font-weight: 400;
    color: rgba(61, 61, 60, 1);
    line-height: 40rpx;
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  .input-control {
    flex: 1;
    font-size: 28rpx;
    font-weight: 400;
    color: rgba(61, 61, 60, 1);
    line-height: 40rpx;
  }

  .placeholder {
    color: rgba(157, 156, 150, 1);
    font-size: 28rpx;
    line-height: 40rpx;
  }

  .get-code-btn {
    font-size: 28rpx;
    font-weight: 500;
    color: rgba(61, 61, 60, 1);
    line-height: 40rpx;
    margin-left: 24rpx;
    flex-shrink: 0;
  }

  .agreement-row {
    width: 630rpx;
  }

  .agreement-text {
    margin-left: 18rpx;
    font-size: 24rpx;
    font-weight: 400;
    color: rgba(157, 156, 150, 1);
    line-height: 33rpx;
    white-space: nowrap;
  }

  .tcp-text {
    color: rgba(181, 131, 25, 1);
  }

  .bottom-box {
    position: relative;
    padding: 0 60rpx;
    z-index: 2;
  }

  .quick-row {
    height: 40rpx;
    margin-top: 77rpx;
  }

  .quick-left {
    font-size: 28rpx;
    font-weight: 400;
    color: rgba(30, 63, 28, 1);
    line-height: 40rpx;
  }

  .quick-right {
    font-size: 28rpx;
    font-weight: 400;
    color: rgba(181, 158, 109, 1);
    line-height: 40rpx;
    margin-left: 16rpx;
  }

  .login-btn {
    width: 630rpx;
    height: 92rpx;
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    margin-top: 44rpx;
    font-size: 36rpx;
    font-weight: 500;
    color: rgba(255, 254, 250, 1);
    line-height: 50rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-btn[disabled] {
    opacity: 0.6;
  }

  .safe-box {
    height: calc(constant(safe-area-inset-bottom) / 5 * 3);
    height: calc(env(safe-area-inset-bottom) / 5 * 3);
  }
</style>
