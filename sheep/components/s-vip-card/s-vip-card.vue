<template>
  <view
    class="vip-card ss-flex ss-row-between ss-col-center"
    @tap="sheep.$router.go('/pages/index/member')"
  >
    <image class="vip-card-bg" :src="sheep.$url.static('/static/cart/header.webp')" />
    <view class="ss-flex ss-col-center vip-card-content">
      <image class="vip-icon ss-m-r-18" :src="sheep.$url.static('/static/cart/vipIcon.webp')" />
      <view class="ss-flex-col">
        <view class="vip-title">开通黄金会员</view>
        <view class="vip-subtitle">购物可享受9折优惠哦～</view>
      </view>
    </view>
    <button class="ss-reset-button open-vip-btn">立即开通</button>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
</script>

<style lang="scss" scoped>
  .vip-card {
    position: relative;
    width: 100%;
    height: 120rpx;
    margin-top: 10rpx;
    border-radius: 10rpx;
    overflow: hidden;

    .vip-card-bg {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .vip-card-content {
      position: relative;
      z-index: 2;
      padding-left: 26rpx;

      .vip-icon {
        width: 60rpx;
        height: 52rpx;
      }

      .vip-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #FFECC9;
        line-height: 42rpx;
      }

      .vip-subtitle {
        font-size: 22rpx;
        color: #FFECC9;
        line-height: 32rpx;
      }
    }

    .open-vip-btn {
      position: relative;
      z-index: 2;
      width: 152rpx;
      height: 52rpx;
      background: linear-gradient( 270deg, #F7EDD6 0%, #F9D6B4 100%);
      border-radius: 26rpx;
      font-size: 22rpx;
      font-family: PingFangSC, PingFang SC;
      font-weight: 500;
      color: #774910;
      margin-right: 26rpx;
    }
  }
</style>
