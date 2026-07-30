<template>
  <s-layout navbar="clear" :bgStyle="{ color: 'rgba(248, 249, 243, 1.0)' }">
    <view class="page flex-col">
      <view class="fixed-header">
        <su-status-bar />
        <view
          class="nav-bar-container"
          :style="{
            position: 'relative',
            height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px',
          }"
        >
          <view
            class="nav-bar-inner flex-row align-center"
            :style="{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '100%',
              left: '0',
              width: '100%',
            }"
          >
            <uni-icons
              type="left"
              size="22"
              color="rgba(0, 0, 0, 0.9)"
              @tap="sheep.$router.back()"
              class="nav-back"
            />
            <text class="nav-title">提交资料</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="form-card flex-col">
        <view class="form-row flex-row align-center justify-between">
          <text class="form-label"><text class="required">*</text>真实姓名</text>
          <input
            class="form-input"
            v-model="state.form.realName"
            placeholder="请输入真实姓名"
            placeholder-class="form-placeholder"
          />
        </view>
        <view class="divider-line"></view>
        <view class="form-row flex-row align-center justify-between">
          <text class="form-label"><text class="required">*</text>身份证号</text>
          <input
            class="form-input"
            v-model="state.form.idCardNo"
            maxlength="18"
            placeholder="请输入身份证号"
            placeholder-class="form-placeholder"
          />
        </view>
        <view class="divider-line"></view>
        <view class="form-row flex-row align-center justify-between">
          <text class="form-label"><text class="required">*</text>手机号码</text>
          <input
            class="form-input"
            v-model="state.form.mobile"
            type="number"
            maxlength="11"
            placeholder="请输入手机号码"
            placeholder-class="form-placeholder"
          />
        </view>
        <view class="divider-line"></view>
        <view class="form-row flex-row align-center justify-between">
          <text class="form-label"><text class="required">*</text>银行卡号</text>
          <input
            class="form-input"
            v-model="state.form.bankCard"
            type="number"
            maxlength="24"
            placeholder="请输入银行卡号"
            placeholder-class="form-placeholder"
          />
        </view>
      </view>

      <view class="form-card upload-card flex-col">
        <view class="upload-header flex-row align-center justify-between">
          <text class="upload-title"><text class="required">*</text>身份证照片</text>
          <text class="upload-subtitle">请上传本人身份证正反面清晰照</text>
        </view>
        <view class="upload-group flex-row justify-between">
          <view class="upload-item flex-col align-center">
            <s-uploader
              v-model:url="state.form.idCardFront"
              fileMediatype="image"
              limit="1"
              mode="grid"
              :imageStyles="{
                width: '304rpx',
                height: '198rpx',
                border: {
                  radius: '20rpx',
                  color: 'rgba(157,156,150,1)',
                  style: 'dashed',
                  width: '1rpx',
                },
              }"
              @change="onFrontChange"
            >
              <view class="upload-box-inner flex-col align-center justify-center">
                <uni-icons
                  type="camera-filled"
                  size="30"
                  color="rgba(157, 156, 150, 1)"
                  class="upload-icon"
                />
                <text class="upload-text">上传人像面</text>
              </view>
            </s-uploader>
            <text class="upload-hint">身份证正面（人像面）</text>
          </view>
          <view class="upload-item flex-col align-center">
            <s-uploader
              v-model:url="state.form.idCardBack"
              fileMediatype="image"
              limit="1"
              mode="grid"
              :imageStyles="{
                width: '304rpx',
                height: '198rpx',
                border: {
                  radius: '20rpx',
                  color: 'rgba(157,156,150,1)',
                  style: 'dashed',
                  width: '1rpx',
                },
              }"
              @change="onBackChange"
            >
              <view class="upload-box-inner flex-col align-center justify-center">
                <uni-icons
                  type="camera-filled"
                  size="30"
                  color="rgba(157, 156, 150, 1)"
                  class="upload-icon"
                />
                <text class="upload-text">上传国徽面</text>
              </view>
            </s-uploader>
            <text class="upload-hint">身份证反面（国徽面）</text>
          </view>
        </view>
      </view>

      <view class="tip-card flex-col">
        <text class="tip-title">温馨提示</text>
        <text class="tip-text">1. 真实姓名、身份证号、银行卡号需与本人实名信息保持一致；</text>
        <text class="tip-text">2. 身份证照片需保证清晰可辨，无边框、无反光、无遮挡；</text>
        <text class="tip-text">3. 提交后将进入签约与认证环节，请按指引完成后续操作。</text>
      </view>

      <su-fixed bottom placeholder :bgStyles="{ backgroundColor: 'rgba(255, 255, 250, 1.0)' }">
        <view class="bottom-bar">
          <button class="ss-reset-button submit-btn" :disabled="state.submitting" @tap="onSubmit">
            <text class="submit-btn-text">{{ state.submitting ? '提交中...' : '提交资料' }}</text>
          </button>
        </view>
      </su-fixed>
    </view>
  </s-layout>
</template>

<script setup>
  import { onBeforeMount, reactive } from 'vue';
  import sheep from '@/sheep';
  import LinggongApi from '@/sheep/api/trade/linggong';
  import SUploader from '@/sheep/components/s-uploader/s-uploader.vue';
  import $store from '@/sheep/store';

  const state = reactive({
    submitting: false,
    form: {
      realName: '',
      idCardNo: '',
      mobile: '',
      bankCard: '',
      idCardFront: [],
      idCardBack: [],
      idCardFrontName: '',
      idCardBackName: '',
    },
  });

  function fileNameFromUrl(url) {
    const s = String(url || '').trim();
    if (!s) return '';
    const clean = s.split('?')[0].split('#')[0];
    const slash = clean.lastIndexOf('/');
    return slash >= 0 ? clean.slice(slash + 1) : clean;
  }

  function firstUrl(list) {
    if (typeof list === 'string') return list || '';
    if (Array.isArray(list)) {
      for (const it of list) {
        if (!it) continue;
        if (typeof it === 'string') return it;
        if (it && typeof it.url === 'string') return it.url;
      }
    }
    if (list && typeof list.url === 'string') return list.url;
    return '';
  }

  function onFrontChange() {
    const url = firstUrl(state.form.idCardFront);
    state.form.idCardFrontName = fileNameFromUrl(url);
  }

  function onBackChange() {
    const url = firstUrl(state.form.idCardBack);
    state.form.idCardBackName = fileNameFromUrl(url);
  }

  function validateIdCard(idCard) {
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(idCard);
  }

  function validateMobile(mobile) {
    const reg = /^1[3-9]\d{9}$/;
    return reg.test(mobile);
  }

  function validateBankCard(card) {
    const reg = /^\d{12,24}$/;
    return reg.test(String(card || ''));
  }

  onBeforeMount(() => {
    const user = $store('user');
    if (user && user.userInfo) {
      if (user.userInfo.realName && !state.form.realName) {
        state.form.realName = String(user.userInfo.realName).trim();
      }
      if (user.userInfo.nickname && !state.form.realName) {
        state.form.realName = String(user.userInfo.nickname).trim();
      }
      if (user.userInfo.mobile && !state.form.mobile) {
        const m = String(user.userInfo.mobile).replace(/\D/g, '').slice(0, 11);
        if (m && validateMobile(m)) {
          state.form.mobile = m;
        }
      }
    }
  });

  async function onSubmit() {
    const realName = String(state.form.realName || '').trim();
    const idCardNo = String(state.form.idCardNo || '').trim();
    const mobile = String(state.form.mobile || '').trim();
    const bankCard = String(state.form.bankCard || '').trim();
    const idCardFront = firstUrl(state.form.idCardFront);
    const idCardBack = firstUrl(state.form.idCardBack);

    if (!realName) {
      sheep.$helper.toast('请输入真实姓名');
      return;
    }
    if (!idCardNo) {
      sheep.$helper.toast('请输入身份证号');
      return;
    }
    if (!validateIdCard(idCardNo)) {
      sheep.$helper.toast('身份证号格式不正确');
      return;
    }
    if (!mobile) {
      sheep.$helper.toast('请输入手机号码');
      return;
    }
    if (!validateMobile(mobile)) {
      sheep.$helper.toast('手机号码格式不正确');
      return;
    }
    if (!bankCard) {
      sheep.$helper.toast('请输入银行卡号');
      return;
    }
    if (!validateBankCard(bankCard)) {
      sheep.$helper.toast('银行卡号格式不正确');
      return;
    }
    if (!idCardFront) {
      sheep.$helper.toast('请上传身份证正面照片');
      return;
    }
    if (!idCardBack) {
      sheep.$helper.toast('请上传身份证反面照片');
      return;
    }

    const payload = {
      realName,
      idCardNo,
      mobile,
      bankCard,
      idCardFront,
      idCardBack,
      idCardFrontName: state.form.idCardFrontName || fileNameFromUrl(idCardFront),
      idCardBackName: state.form.idCardBackName || fileNameFromUrl(idCardBack),
    };

    state.submitting = true;
    uni.showLoading({ title: '提交中...', mask: true });
    try {
      const res = await LinggongApi.submitSignInfo(payload);
      if (!res) {
        sheep.$helper.toast('提交失败：网络异常');
        return;
      }
      if (res.code !== 0) {
        sheep.$helper.toast(res.msg || '提交失败');
        return;
      }
      const errorMsg =
        res.data && typeof res.data === 'object'
          ? String(res.data.errorMsg || res.data.errorMessage || '').trim()
          : '';
      if (errorMsg.includes('提交签约异常')) {
        sheep.$helper.toast(errorMsg);
        return;
      }
      sheep.$helper.toast('提交成功');
      setTimeout(() => {
        sheep.$router.back();
      }, 800);
    } finally {
      uni.hideLoading();
      state.submitting = false;
    }
  }
</script>

<style lang="scss" scoped>
  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .align-center {
    display: flex;
    align-items: center;
  }

  .justify-between {
    display: flex;
    justify-content: space-between;
  }

  .page {
    background-color: rgba(248, 249, 243, 1);
    width: 750rpx;
    min-height: 100vh;
    padding-bottom: 24rpx;
  }

  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 10;
    background-color: rgba(248, 249, 243, 1);
  }

  .header-placeholder {
    width: 100%;
  }

  .nav-back {
    margin-left: 34rpx;
  }

  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    margin-left: 14rpx;
    line-height: 50rpx;
  }

  .form-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 30rpx;
    margin: 24rpx 38rpx 0 32rpx;
    padding: 8rpx 24rpx;
    box-sizing: border-box;
  }

  .required {
    color: rgba(224, 71, 71, 1);
    margin-right: 6rpx;
  }

  .form-row {
    padding: 32rpx 0;
  }

  .form-label {
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    line-height: 40rpx;
    width: 170rpx;
    flex-shrink: 0;
  }

  .form-input {
    flex: 1;
    text-align: right;
    font-size: 28rpx;
    color: rgba(61, 61, 60, 1);
    margin-left: 20rpx;
  }

  .form-placeholder {
    color: rgba(157, 156, 150, 1);
    font-size: 28rpx;
  }

  .divider-line {
    width: 100%;
    border: 1rpx solid rgba(151, 151, 151, 0.1);
  }

  .upload-card {
    padding: 28rpx 24rpx 32rpx 24rpx;
  }

  .upload-header {
    margin-bottom: 24rpx;
  }

  .upload-title {
    color: rgba(61, 61, 60, 1);
    font-size: 30rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 42rpx;
  }

  .upload-subtitle {
    color: rgba(157, 156, 150, 1);
    font-size: 22rpx;
    line-height: 32rpx;
    margin-left: auto;
  }

  .upload-group {
    gap: 16rpx;
  }

  .upload-item {
    width: 304rpx;
  }

  .upload-box-inner {
    width: 304rpx;
    height: 198rpx;
    border-radius: 20rpx;
    background-color: rgba(248, 249, 243, 0.6);
  }

  .upload-icon {
    margin-bottom: 10rpx;
  }

  .upload-text {
    color: rgba(157, 156, 150, 1);
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .upload-hint {
    margin-top: 14rpx;
    color: rgba(157, 156, 150, 1);
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .tip-card {
    background: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    margin: 24rpx 38rpx 0 32rpx;
    padding: 24rpx 26rpx;
    box-sizing: border-box;
    border: 2rpx solid rgba(151, 151, 151, 0.1);
  }

  .tip-title {
    color: rgba(30, 63, 28, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 36rpx;
    margin-bottom: 12rpx;
  }

  .tip-text {
    color: rgba(102, 102, 102, 1);
    font-size: 24rpx;
    line-height: 38rpx;
    margin-top: 6rpx;
  }

  .bottom-bar {
    background-color: rgba(255, 255, 250, 1);
    padding: 24rpx 32rpx 24rpx 32rpx;
    box-shadow: 0rpx -6rpx 10rpx 0rpx rgba(0, 0, 0, 0.02);
  }

  .submit-btn {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    border: 2rpx solid rgba(157, 156, 150, 1);
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .submit-btn[disabled] {
    opacity: 0.6;
  }

  .submit-btn-text {
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    line-height: 45rpx;
  }
</style>
