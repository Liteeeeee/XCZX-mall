<template>
  <view
    class="cart-vip-card ss-flex ss-col-center"
    :style="{
      backgroundImage: 'url(' + sheep.$url.static('/static/vipBg.png') + ')',
    }"
    @tap="sheep.$router.go('/pages/index/member')"
  >
    <image class="vip-icon" :src="sheep.$url.static('/static/vipIcon.png')" mode="aspectFit" />
    <view class="vip-text"> 开通黄金会员购物享 <text class="vip-num">9</text> 折优惠哦～ </view>
    <view class="text-wrapper_8 flex-col">
      <text class="text_22">立即开通</text>
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
</script>

<style lang="scss" scoped>
  .cart-vip-card {
    width: 100%;
    height: 80rpx;
    padding: 0 20rpx;
    box-sizing: border-box;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    border-radius: 16rpx;
    overflow: hidden;
  }

  .vip-icon {
    width: 66rpx;
    height: 30rpx;
    margin-right: 16rpx;
    flex: none;
  }

  .vip-text {
    flex: 1;
    font-size: 24rpx;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .vip-num {
    color: #ff0000;
  }

  .text-wrapper_8 {
    background-image: linear-gradient(270deg, rgba(17, 107, 106, 1) 0, rgba(48, 155, 75, 1) 100%);
    border-radius: 68rpx;
    padding: 2rpx 16rpx 6rpx 16rpx;
    flex: none;
    margin-left: 12rpx;
  }

  .text_22 {
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 22rpx;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 30rpx;
  }
</style>
