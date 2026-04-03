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
            <uni-icons type="left" size="22" color="rgba(0, 0, 0, 0.9)" @tap="sheep.$router.back()" class="nav-back" />
            <text class="nav-title">分销</text>
           
          </view>
        </view>
      </view>
      <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

      <view class="card flex-col">
        <view class="row flex-row">
          <text class="row-label">昵称</text>
          <text class="row-value">{{ userInfo?.nickname || '' }}</text>
        </view>
        <view class="divider"></view>

        <view class="row flex-row">
          <text class="row-label">手机号</text>
          <text class="row-prefix">+86</text>
          <uni-icons type="bottom" size="14" color="rgba(212, 212, 213, 1)" class="prefix-arrow" />
          <input
            class="row-input"
            type="number"
            maxlength="11"
            v-model="state.mobile"
            placeholder="请输入您的手机号"
            placeholder-class="placeholder"
          />
        </view>
        <view class="divider"></view>

        <view class="row flex-row">
          <text class="row-label">身份证号</text>
          <input
            class="row-input"
            type="idcard"
            maxlength="18"
            v-model="state.idCardNo"
            placeholder="请输入您的身份证号"
            placeholder-class="placeholder"
          />
        </view>
        <view class="divider"></view>

        <view class="row flex-col">
          <text class="row-label" style="margin-bottom: 24rpx;">身份证照片</text>
          <view class="idcard-upload-group flex-row justify-between">
            <view class="idcard-upload-item flex-col align-center">
              <s-uploader
                v-model:url="state.idCardFrontUrl"
                fileMediatype="image"
                limit="1"
                mode="grid"
                :imageStyles="{ width: '310rpx', height: '200rpx', border: { radius: '20rpx', color: 'rgba(157,156,150,1)', style: 'solid', width: '1rpx' } }"
              >
                <view class="upload-box-inner flex-col align-center justify-center">
                  <uni-icons type="camera-filled" size="32" color="rgba(157, 156, 150, 1)" class="upload-icon" />
                  <text class="upload-text">上传人像面</text>
                </view>
              </s-uploader>
            </view>
            <view class="idcard-upload-item flex-col align-center">
              <s-uploader
                v-model:url="state.idCardBackUrl"
                fileMediatype="image"
                limit="1"
                mode="grid"
                :imageStyles="{ width: '310rpx', height: '200rpx', border: { radius: '20rpx', color: 'rgba(157,156,150,1)', style: 'solid', width: '1rpx' } }"
              >
                <view class="upload-box-inner flex-col align-center justify-center">
                  <uni-icons type="camera-filled" size="32" color="rgba(157, 156, 150, 1)" class="upload-icon" />
                  <text class="upload-text">上传国徽面</text>
                </view>
              </s-uploader>
            </view>
          </view>
        </view>
        <view class="divider"></view>

        <view class="row flex-row" @tap="onChooseCareer">
          <text class="row-label">职业</text>
          <text class="row-select" :class="state.careerName ? '' : 'row-select-placeholder'">{{
            state.careerName || '请选择'
          }}</text>
          <uni-icons type="right" size="18" color="rgba(212, 212, 213, 1)" class="row-right" />
        </view>
        <view class="divider"></view>

        <view class="row flex-row">
          <text class="row-label">性别</text>
          <view class="gender-group flex-row align-center">
            <view class="gender-option flex-row align-center" @tap="state.gender = 1">
              <view class="gender-check flex-col" :class="state.gender === 1 ? 'gender-check-on' : ''">
                <view v-if="state.gender === 1" class="gender-check-tick"></view>
              </view>
              <text class="gender-text">先生</text>
            </view>
            <view class="gender-option flex-row align-center gender-option-right" @tap="state.gender = 2">
              <view class="gender-check flex-col" :class="state.gender === 2 ? 'gender-check-on' : ''">
                <view v-if="state.gender === 2" class="gender-check-tick"></view>
              </view>
              <text class="gender-text">女士</text>
            </view>
          </view>
        </view>
        <view class="divider"></view>

        <view class="row flex-row">
          <text class="row-label">申请原因</text>
          <input
            class="row-input-reason"
            v-model="state.reason"
            maxlength="50"
            placeholder="请输入申请原因"
            placeholder-class="placeholder"
          />
        </view>
      </view>

      <view class="footer">
        <view class="submit-btn" @tap="onSubmit">
          <text class="submit-text">提交审核</text>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import BrokerageApplyApi from '@/sheep/api/trade/brokerageApply';
  import SUploader from '@/sheep/components/s-uploader/s-uploader.vue';

  const userInfo = computed(() => sheep.$store('user').userInfo || {});

  const state = reactive({
    mobile: '',
    idCardNo: '',
    idCardFrontUrl: '',
    idCardBackUrl: '',
    careerName: '',
    gender: 1,
    reason: '',
  });

  function onChooseCareer() {
    sheep.$router.go('/pages/commission/career', { current: state.careerName });
  }

  function normalizeMobile(v) {
    return String(v || '').replace(/\s/g, '');
  }

  function submitApply(payload) {
    uni.showLoading({ title: '提交中' });
    BrokerageApplyApi.createApply(payload)
      .then((res) => {
        uni.hideLoading();
        if (res.code === 0) {
          uni.showToast({ title: '已提交', icon: 'none' });
          sheep.$router.back();
        }
      })
      .catch(() => {
        uni.hideLoading();
      });
  }

  async function onSubmit() {
    const mobile = normalizeMobile(state.mobile);
    if (!mobile) {
      uni.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    const idCardNo = (state.idCardNo || '').trim();
    if (!idCardNo) {
      uni.showToast({ title: '请输入身份证号', icon: 'none' });
      return;
    }
    // 简单的身份证格式校验（18位，最后一位可以是数字或Xx）
    if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCardNo)) {
      uni.showToast({ title: '请输入正确的身份证号', icon: 'none' });
      return;
    }
    if (!state.idCardFrontUrl) {
      uni.showToast({ title: '请上传身份证人像面', icon: 'none' });
      return;
    }
    if (!state.idCardBackUrl) {
      uni.showToast({ title: '请上传身份证国徽面', icon: 'none' });
      return;
    }
    if (!state.careerName) {
      uni.showToast({ title: '请选择职业', icon: 'none' });
      return;
    }

    // 提取 key，去除可能存在的 CDN 前缀（兼容 http 和 https）
    const extractKey = (url) => {
      if (url) {
        return url.replace(/^https?:\/\/xiancao\.oss-cn-beijing\.aliyuncs\.com\//, '');
      }
      return url;
    };

    const payload = {
      mobile,
      idCardNo,
      idCardFrontUrl: extractKey(state.idCardFrontUrl),
      idCardBackUrl: extractKey(state.idCardBackUrl),
      occupation: state.careerName,
      gender: state.gender,
      reason: state.reason,
    };

    // 获取当前位置并拼装到 additionalInfo
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        payload.additionalInfo = JSON.stringify({
          longitude: res.longitude,
          latitude: res.latitude,
        });
        submitApply(payload);
      },
      fail: (err) => {
        console.error('获取定位失败：', err);
        // 如果获取定位失败，为了不阻塞用户申请，仍然允许提交
        submitApply(payload);
      },
    });
  }

  onLoad(() => {
    state.mobile = userInfo.value?.mobile || '';
  });

  onShow(() => {
    const careerName = uni.getStorageSync('brokerageApplyCareerName');
    if (careerName) {
      state.careerName = careerName;
      uni.removeStorageSync('brokerageApplyCareerName');
    }
  });
</script>

<style lang="scss" scoped>
  .page {
    background-color: rgba(248, 249, 243, 1);
    width: 750rpx;
    min-height: 100vh;
    padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
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
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 0.9);
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 50rpx;
    margin-left: 14rpx;
  }

  .capsule {
    background-color: rgba(255, 255, 255, 0.594);
    border-radius: 100rpx;
    width: 174rpx;
    border: 1rpx solid rgba(151, 151, 151, 0.198);
    padding: 12rpx 26rpx 13rpx 26rpx;
    margin-left: auto;
    margin-right: 16rpx;
    align-items: center;
  }

  .capsule-dots {
    background-color: rgba(0, 0, 0, 1);
    width: 37rpx;
    margin: 13rpx 0 11rpx 0;
  }

  .dot {
    width: 8rpx;
    height: 8rpx;
    margin: 3rpx 0 2rpx 0;
  }

  .dot-mid {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    width: 13rpx;
    height: 13rpx;
  }

  .capsule-divider {
    background-color: rgba(0, 0, 0, 0.2);
    width: 1rpx;
    height: 37rpx;
    margin-left: 23rpx;
  }

  .capsule-circle {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    margin: 2rpx 0 1rpx 25rpx;
    padding: 4rpx;
  }

  .capsule-circle-inner {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    padding: 7rpx;
  }

  .capsule-square {
    width: 12rpx;
    height: 12rpx;
  }

  .card {
    background-color: rgba(255, 254, 250, 1);
    border-radius: 20rpx;
    width: 686rpx;
    align-self: center;
    padding: 48rpx 23rpx 99rpx 23rpx;
    margin-top: 26rpx;
    box-sizing: border-box;
  }

  .row {
    min-height: 40rpx;
    align-items: center;
  }

  .row-label {
    width: 184rpx;
    flex-shrink: 0;
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .row-value {
    flex: 1;
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .divider {
    width: 639rpx;
    height: 1rpx;
    border-top: 1rpx solid rgba(157, 156, 150, 0.3);
    margin: 34rpx 0 35rpx 1rpx;
  }

  .row-prefix {
    flex-shrink: 0;
    overflow-wrap: break-word;
    color: rgba(212, 212, 213, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: right;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .prefix-arrow {
    flex-shrink: 0;
    margin: 0 27rpx 0 7rpx;
  }

  .row-input {
    flex: 1;
    font-size: 28rpx;
    line-height: 40rpx;
    color: rgba(61, 61, 60, 1);
  }

  .row-select {
    flex: 1;
    overflow-wrap: break-word;
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
    color: rgba(61, 61, 60, 1);
  }

  .row-select-placeholder {
    color: rgba(212, 212, 213, 1);
  }

  .row-right {
    margin-left: auto;
  }

  .gender-group {
    flex: 1;
    justify-content: flex-end;
  }

  .gender-option-right {
    margin-left: 107rpx;
  }

  .gender-check {
    width: 28rpx;
    height: 28rpx;
    border: 2rpx solid rgba(212, 212, 213, 1);
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .gender-check-on {
    border-color: rgba(30, 63, 28, 1);
    background-color: rgba(30, 63, 28, 1);
  }

  .gender-check-tick {
    width: 12rpx;
    height: 7rpx;
    border-left: 3rpx solid rgba(255, 254, 250, 1);
    border-bottom: 3rpx solid rgba(255, 254, 250, 1);
    transform: rotate(-45deg);
    margin-top: -2rpx;
  }

  .gender-text {
    flex-shrink: 0;
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: right;
    white-space: nowrap;
    line-height: 40rpx;
    margin-left: 6rpx;
  }

  .row-input-reason {
    flex: 1;
    font-size: 28rpx;
    line-height: 40rpx;
    color: rgba(61, 61, 60, 1);
    text-align: left;
  }

  .placeholder {
    color: rgba(212, 212, 213, 1);
    font-weight: 500;
  }

  .footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    background-color: rgba(255, 255, 250, 1);
    box-shadow: 0rpx -6rpx 10rpx 0rpx rgba(0, 0, 0, 0.02);
  }

  .submit-btn {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    border: 1rpx solid rgba(157, 156, 150, 1);
    width: 686rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .submit-text {
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 45rpx;
  }

  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .justify-between {
    display: flex;
    justify-content: space-between;
  }

  .justify-center {
    display: flex;
    justify-content: center;
  }

  .justify-between {
    display: flex;
    justify-content: space-between;
  }

  .align-center {
    display: flex;
    align-items: center;
  }

  .idcard-upload-group {
    width: 100%;
    margin-top: 10rpx;
  }

  .idcard-upload-item {
    width: 310rpx;
  }

  .upload-box-inner {
    width: 100%;
    height: 100%;
    background-color: rgba(255, 254, 250, 1);
  }

  .upload-icon {
    margin-bottom: 12rpx;
  }

  .upload-text {
    color: rgba(157, 156, 150, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    line-height: 34rpx;
  }
</style>
