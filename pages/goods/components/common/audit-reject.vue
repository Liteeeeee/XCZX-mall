<template>
  <view class="page flex-col">
    <view class="container flex-col">
      <image
        class="illustration"
        src="https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/reject.webp"
        mode="widthFix"
      />
      <text class="title">审核未通过</text>
      <view class="actions flex-row">
        <button class="btn btn-outline" @tap="$emit('contact')">联系客服</button>
        <button class="btn btn-solid" @tap="$emit('reapply')">重新申请</button>
      </view>
    </view>
    <view class="footer-shadow"></view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.flex-col { display: flex; flex-direction: column; }
.flex-row { display: flex; flex-direction: row; }
.page {
  background-color: rgba(248, 249, 243, 1.0);
  position: relative;
  width: 750rpx;
  min-height: 100vh;
  overflow: hidden;
}
.container {
  background-color: rgba(255, 255, 250, 1.0);
  border-radius: 30rpx;
  margin: 62rpx 38rpx 0 32rpx;
  padding: 140rpx 37rpx 160rpx 43rpx;
}
.illustration {
  width: 327rpx;
  height: 279rpx;
  align-self: center;
}
.title {
  color: rgba(0, 0, 0, 1);
  font-size: 40rpx;
  line-height: 56rpx;
  text-align: center;
  margin-top: 78rpx;
  font-weight: 500;
}
.actions {
  width: 600rpx;
  align-self: center;
  justify-content: space-between;
  margin-top: 276rpx;
}
.btn {
  width: 286rpx;
  height: 86rpx;
  border-radius: 100rpx;
  font-size: 36rpx;
  line-height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-outline {
  background-color: rgba(248, 249, 243, 1.0);
  color: rgba(30, 63, 28, 1);
  border: 1rpx solid rgba(30, 63, 28, 1);
}
.btn-solid {
  background-color: rgba(30, 63, 28, 1.0);
  color: rgba(255, 254, 250, 1);
  border: none;
}
.footer-shadow {
  background-color: rgba(0, 0, 0, 0.9);
  border-radius: 550rpx;
  width: 536rpx;
  height: 20rpx;
  align-self: center;
  margin-top: 60rpx;
  opacity: 0.1;
}
</style>
