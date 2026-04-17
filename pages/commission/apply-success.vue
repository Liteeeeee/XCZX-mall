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
              @tap="onBack"
              class="nav-back"
            />
            <text class="nav-title">审核中</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="content flex-col align-center">
        <image
          class="success-img"
          :src="sheep.$url.cdn('/mp/static/success.webp')"
          mode="aspectFit"
        />
        <text class="title">审核中</text>
        <text class="desc">您的分销申请正在审核中，请耐心等待</text>

        <button class="back-btn" @tap="onBack">返回</button>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';

  function onBack() {
    // 返回上一页或首页
    const pages = getCurrentPages();
    if (pages.length > 1) {
      sheep.$router.back();
    } else {
      sheep.$router.go('/pages/index/index');
    }
  }
</script>

<style lang="scss" scoped>
  .page {
    background-color: rgba(248, 249, 243, 1);
    width: 750rpx;
    min-height: 100vh;
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
    color: #000000;
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 50rpx;
    margin-left: 14rpx;
  }

  .content {
    margin-top: 120rpx;
  }

  .success-img {
    width: 240rpx;
    height: 240rpx;
    margin-bottom: 40rpx;
  }

  .title {
    font-size: 40rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.9);
    line-height: 56rpx;
    margin-bottom: 16rpx;
  }

  .desc {
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    color: rgba(0, 0, 0, 0.5);
    line-height: 40rpx;
    margin-bottom: 80rpx;
  }

  .back-btn {
    width: 320rpx;
    height: 80rpx;
    background-color: rgba(30, 63, 28, 1);
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    color: #ffffff;
  }

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
</style>
