<template>
  <s-layout :bgStyle="{ color: '#fff' }" navbar="clear">
    <!-- 顶部自定义导航栏 -->
    <view class="fixed-header">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{
          height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px',
        }"
      >
        <view class="nav-bar-inner ss-flex ss-col-center">
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="onBack">
            <text class="sicon-back" style="font-size: 40rpx; color: #000; font-weight: 600"></text>
          </view>
          <text class="nav-title">品牌故事</text>
        </view>
      </view>
    </view>

    <!-- 导航栏占位，将内容区往下推 -->
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <!-- 页面内容：长图100%宽按比例展示 -->
    <view class="story-content">
      <image
        class="story-img"
        src="https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/品牌故事.jpg"
        mode="widthFix"
      />
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';

  function onBack() {
    sheep.$router.back();
  }
</script>

<style lang="scss" scoped>
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    background-color: #fff;
  }

  .nav-bar-container {
    position: relative;
    width: 100%;
  }

  .nav-bar-inner {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 100%;
    width: 100%;
    padding-left: 20rpx;
  }

  .back-btn {
    width: 60rpx;
    height: 100%;
  }

  .nav-title {
    font-size: 34rpx;
    font-weight: 500;
    color: #000;
    margin-left: 10rpx;
  }

  .story-content {
    width: 100%;
    min-height: 100vh;
  }

  .story-img {
    width: 100%;
    display: block; /* 消除图片底部空隙 */
  }
</style>
