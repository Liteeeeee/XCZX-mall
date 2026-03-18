<!-- 我的设置 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <!-- 头部导航 -->
    <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
      <su-status-bar />
      <view class="nav-bar-container" :style="{ height: (sheep.$platform.navbar - sheep.$platform.device.statusBarHeight) + 'px' }">
        <view class="nav-bar-inner ss-flex ss-col-center" :style="{ height: '100%', paddingLeft: '20rpx' }">
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="sheep.$router.back()">
            <text class="sicon-back" style="font-size: 40rpx; color: #1E3F1C; font-weight: 600;"></text>
          </view>
          <text class="nav-title ss-m-l-10">设置</text>
        </view>
      </view>
    </view>
    <!-- 占位 -->
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <!-- 表单内容 -->
    <view class="content-box">
      <view class="form-group">
        <!-- 头像 -->
        <view class="form-item ss-flex ss-row-between ss-col-center">
          <text class="item-label">头像</text>
          <view class="avatar-box">
            <image class="avatar-img" :src="sheep.$url.avatar(state.model?.avatar)" mode="aspectFill" />
            <!-- #ifdef MP -->
            <button class="ss-reset-button avatar-action-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar"></button>
            <!-- #endif -->
            <!-- #ifndef MP -->
            <button class="ss-reset-button avatar-action-btn" @tap="onChangeAvatar"></button>
            <!-- #endif -->
          </view>
        </view>

        <!-- 昵称 -->
        <view class="form-item ss-flex ss-row-between ss-col-center ss-m-t-56">
          <text class="item-label">昵称</text>
          <view class="item-value-box ss-flex ss-col-center">
            <input
              class="nickname-input"
              :class="{'has-value': state.model.nickname}"
              v-model="state.model.nickname"
              type="nickname"
              placeholder="未填写"
              placeholder-class="placeholder-text"
              @blur="onSubmit"
            />
            <text class="_icon-forward ss-m-l-10 arrow-icon"></text>
          </view>
        </view>

        <!-- 手机号 -->
        <view class="form-item ss-flex ss-row-between ss-col-center ss-m-t-70" @tap="onChangeMobile">
          <text class="item-label">手机号</text>
          <view class="item-value-box ss-flex ss-col-center">
            <text class="item-value" :class="{'is-empty': !userInfo.mobile}">{{ maskMobile(userInfo.mobile) || '未绑定' }}</text>
            <text class="_icon-forward ss-m-l-10 arrow-icon"></text>
          </view>
        </view>

        <!-- 生日 -->
        <view class="form-item ss-flex ss-row-between ss-col-center ss-m-t-70">
          <text class="item-label">生日</text>
          <view class="item-value-box ss-flex ss-col-center">
            <picker mode="date" :value="state.model.birthday" @change="onChangeBirthday">
              <view class="ss-flex ss-col-center">
                <text class="item-value" :class="{'is-empty': !state.model.birthday}">{{ formatBirthday(state.model.birthday) || '未设置' }}</text>
                <text class="_icon-forward ss-m-l-10 arrow-icon"></text>
              </view>
            </picker>
          </view>
        </view>

        <!-- 性别 -->
        <view class="form-item ss-flex ss-row-between ss-col-center ss-m-t-70">
          <text class="item-label">性别</text>
          <view class="item-value-box ss-flex ss-col-center">
            <radio-group @change="onChangeGender" class="ss-flex ss-col-center">
              <label class="radio ss-flex ss-col-center">
                <radio value="1" color="#6DD400" style="transform: scale(0.8)" :checked="state.model.sex === 1" />
                <text class="gender-text ss-m-l-10" :class="{'is-checked': state.model.sex === 1}">先生</text>
              </label>
              <label class="radio ss-flex ss-col-center ss-m-l-40">
                <radio value="2" color="#6DD400" style="transform: scale(0.8)" :checked="state.model.sex === 2" />
                <text class="gender-text ss-m-l-10" :class="{'is-checked': state.model.sex === 2}">女士</text>
              </label>
            </radio-group>
          </view>
        </view>
      </view>

      <view class="hint-text ss-flex ss-row-center">
        完善您的个人信息有助于我们为您提供更好的会员服务
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="footer-box">
      <button class="ss-reset-button logout-btn" @tap="onLogout">退出登录</button>
      <button class="ss-reset-button save-btn ss-m-t-20" @tap="onSubmit">保存</button>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, reactive, onBeforeMount } from 'vue';
  import sheep from '@/sheep';
  import { clone } from 'lodash-es';
  import { showAuthModal } from '@/sheep/hooks/useModal';
  import UserApi from '@/sheep/api/member/user';
  import {
    chooseAndUploadFile,
    uploadFilesFromPath,
  } from '@/sheep/components/s-uploader/choose-and-upload-file';

  const state = reactive({
    model: {
      avatar: '',
      nickname: '',
      sex: 0,
      birthday: '',
    },
  });

  const userInfo = computed(() => sheep.$store('user').userInfo);

  // 格式化手机号
  const maskMobile = (mobile) => {
    if (!mobile) return '';
    return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  };

  // 格式化生日
  const formatBirthday = (dateStr) => {
    if (!dateStr) return '';
    // 如果设计图要求年份打码，可以这样写：return dateStr.replace(/^\d{4}/, '****').replace(/-/g, '.');
    // 这里先保留年份，替换横线为点，参考设计图效果
    return dateStr.replace(/^\d{4}/, '****').replace(/-/g, '.');
  };

  // 选择性别
  async function onChangeGender(e) {
    state.model.sex = parseInt(e.detail.value);
    await onSubmit();
  }

  // 选择生日
  async function onChangeBirthday(e) {
    state.model.birthday = e.detail.value;
    await onSubmit();
  }

  // 修改手机号
  const onChangeMobile = () => {
    showAuthModal('changeMobile');
  };

  // 选择微信头像
  async function onChooseAvatar(e) {
    const tempUrl = e.detail.avatarUrl || '';
    if (!tempUrl) return;
    const files = await uploadFilesFromPath(tempUrl);
    if (files.length > 0) {
      state.model.avatar = files[0].url;
      await onSubmit();
    }
  }

  // 手动选择头像
  async function onChangeAvatar() {
    const files = await chooseAndUploadFile({ type: 'image' });
    if (files.length > 0) {
      state.model.avatar = files[0].url;
      await onSubmit();
    }
  }

  // 保存信息
  async function onSubmit() {
    const { code } = await UserApi.updateUser({
      avatar: state.model.avatar,
      nickname: state.model.nickname,
      sex: state.model.sex,
      birthday: state.model.birthday, // 假设后端支持 birthday 字段
    });
    if (code === 0) {
      await getUserInfo();
    }
  }

  // 退出登录
  function onLogout() {
    uni.showModal({
      title: '提示',
      content: '确认退出登录？',
      success: async function (res) {
        if (res.confirm) {
          const result = await sheep.$store('user').logout();
          if (result) {
            sheep.$router.go('/pages/index/user');
          }
        }
      },
    });
  }

  // 获取用户信息
  const getUserInfo = async () => {
    const userInfo = await sheep.$store('user').getInfo();
    state.model = clone(userInfo);
  };

  onBeforeMount(() => {
    getUserInfo();
  });
</script>

<style lang="scss" scoped>
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    background-color: rgba(248, 249, 243, 1);
  }

  .nav-bar-container {
    position: relative;
    width: 100%;
  }

  .back-btn {
    width: 60rpx;
    height: 100%;
  }

  .nav-title {
    color: rgba(30, 63, 28, 0.9);
    font-size: 36rpx;
    font-weight: 600;
    font-family: PingFangSC-Semibold;
  }

  .content-box {
    padding: 0;
  }

  .form-group {
    background-color: rgba(255, 254, 250, 1);
    border-radius: 20rpx;
    width: 686rpx;
    margin: 26rpx auto 0;
    padding: 34rpx 24rpx 24rpx 23rpx;
    box-sizing: border-box;
  }

  .form-item {
    position: relative;
  }

  .ss-m-t-56 {
    margin-top: 56rpx;
  }

  .ss-m-t-70 {
    margin-top: 70rpx;
  }

  .item-label {
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-weight: 400;
    font-family: PingFangSC-Regular;
  }

  .avatar-box {
    position: relative;
    width: 68rpx;
    height: 68rpx;
    border-radius: 50%;
    overflow: hidden;

    .avatar-img {
      width: 100%;
      height: 100%;
    }

    .avatar-action-btn {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 1;
    }
  }

  .item-value-box {
    position: relative;
  }

  .nickname-input {
    width: 300rpx;
    text-align: right;
    font-size: 28rpx;
    font-weight: 500;
    color: rgba(61, 61, 60, 1);
    font-family: PingFangSC-Medium;

    &.has-value {
      color: rgba(61, 61, 60, 1);
    }
  }

  .placeholder-text {
    color: rgba(212, 212, 213, 1);
    font-weight: 500;
  }

  .item-value {
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-weight: 500;
    font-family: PingFangSC-Medium;

    &.is-empty {
      color: rgba(212, 212, 213, 1);
    }
  }

  .arrow-icon {
    color: rgba(212, 212, 213, 1);
    font-size: 24rpx;
  }

  .gender-text {
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-weight: 500;
    font-family: PingFangSC-Medium;
  }

  .hint-text {
    color: rgba(181, 158, 109, 1);
    font-size: 24rpx;
    font-weight: 400;
    font-family: PingFangSC-Regular;
    margin-top: 41rpx;
  }

  .footer-box {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 24rpx 32rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
    background-color: rgba(255, 255, 250, 1);
    box-shadow: 0px -6rpx 10rpx 0px rgba(0, 0, 0, 0.02);
    box-sizing: border-box;
    z-index: 100;
  }

  .logout-btn {
    width: 100%;
    height: 86rpx;
    line-height: 86rpx;
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    border: 1px solid rgba(157, 156, 150, 1);
    color: rgba(0, 0, 0, 1);
    font-size: 32rpx;
    font-weight: 400;
    font-family: PingFangSC-Regular;
    text-align: center;
  }

  .save-btn {
    width: 100%;
    height: 86rpx;
    line-height: 86rpx;
    background-color: #6DD400;
    border-radius: 20rpx;
    color: rgba(255, 255, 255, 1);
    font-size: 32rpx;
    font-weight: 400;
    font-family: PingFangSC-Regular;
    text-align: center;
    margin-top: 20rpx;
  }
</style>
