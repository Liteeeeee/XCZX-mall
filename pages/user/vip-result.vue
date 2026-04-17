<template>
  <s-layout :bgStyle="{ backgroundColor: '#F8F9F3' }" navbar="clear">
    <view class="custom-header">
      <su-status-bar />
      <view class="nav-bar">
        <view class="back-btn" @tap="onBack">
          <text class="sicon-back"></text>
        </view>
        <view class="nav-title">开通会员</view>
      </view>
    </view>

    <view class="page-container">
      <view class="result-card">
        <!-- 上半部分：状态展示（图片+文字） -->
        <view class="state-box flex-col flex-x-center">
          <!-- Success State -->
          <block v-if="state.payState === 'success'">
            <image
              class="state-img"
              :src="sheep.$url.static('/static/kaitongchenggong.webp')"
              mode="aspectFit"
            />
            <view class="state-title">会员开通成功</view>
          </block>

          <!-- Failure State -->
          <block v-else>
            <image
              class="state-img"
              :src="sheep.$url.static('/static/reject.webp')"
              mode="aspectFit"
            />
            <view class="state-title">会员开通失败</view>
          </block>
        </view>

        <!-- 下半部分：操作按钮（并排） -->
        <view class="btn-box flex-row">
          <button class="ss-reset-button action-btn back-btn" @tap="onMyMember"> 我的会员 </button>
          <button class="ss-reset-button action-btn home-btn" @tap="onHome"> 回到首页 </button>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';

  const state = reactive({
    payState: 'fail', // success | fail
  });

  function onBack() {
    if (sheep.$router.hasHistory()) {
      sheep.$router.back();
    } else {
      sheep.$router.go('/pages/index/index');
    }
  }

  function onMyMember() {
    sheep.$router.redirect('/pages/index/member');
  }

  function onHome() {
    sheep.$router.go('/pages/index/index');
  }

  onLoad((options) => {
    if (options.payState) {
      state.payState = options.payState;
    }
  });
</script>

<style lang="scss" scoped>
  .custom-header {
    width: 100%;
    background-color: transparent;
  }

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-right: 20rpx;
      height: 100%;

      .sicon-back {
        font-size: 32rpx;
        color: #000;
      }
    }

    .nav-title {
      font-size: 32rpx;
      font-weight: 500;
      color: #000;
    }
  }

  .page-container {
    width: 100%;
    min-height: 100vh;
    padding: 32rpx; /* 主体外边距 32rpx */
    box-sizing: border-box;
  }

  .result-card {
    width: 100%;
    background-color: #ffffff; /* 白色背景卡片 */
    border-radius: 20rpx; /* 圆角 */
    padding: 100rpx 0 80rpx 0; /* 上下内边距 */
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* 上半部分：状态展示 */
  .state-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 100rpx; /* 与按钮组的间距 */

    .state-img {
      width: 200rpx; /* 根据设计图调整大小 */
      height: 200rpx;
      margin-bottom: 40rpx; /* 图片与文字间距 */
    }

    .state-title {
      font-size: 36rpx;
      font-weight: 500;
      color: #333333;
      line-height: 50rpx;
      text-align: center;
    }

    .state-desc {
      font-size: 28rpx;
      font-weight: normal;
      color: #9d9c96;
      line-height: 40rpx;
      text-align: center;
      margin-top: 16rpx;
    }
  }

  /* 下半部分：按钮组 */
  .btn-box {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center; /* 居中排列 */
    align-items: center;

    .action-btn {
      width: 280rpx; /* 设计图要求280rpx */
      height: 88rpx; /* 设计图要求88rpx */
      border-radius: 44rpx; /* 胶囊形状 */
      font-size: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
    }

    .back-btn {
      background-color: #ffffff;
      border: 2rpx solid #1a4b2b; /* 绿色边框 */
      color: #1a4b2b;
      margin-right: 40rpx; /* 按钮间距 40rpx */
    }

    .home-btn {
      background-color: #1a4b2b; /* 绿色背景 */
      color: #ffffff;
      border: 2rpx solid #1a4b2b;
    }
  }
</style>
