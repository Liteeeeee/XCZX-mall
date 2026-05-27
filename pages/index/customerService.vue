<template>
  <s-layout title="专属客服" :bgStyle="{ color: '#fff' }">
    <view class="page">
      <image class="qr-img" :src="qrUrl" mode="aspectFill" show-menu-by-longpress />
    </view>
  </s-layout>
</template>

<script setup>
  import { computed } from 'vue';
  import sheep from '@/sheep';

  const qrUrl = computed(() => sheep.$url.cdn('/mp/static/企业微信@2x.png'));
</script>

<style lang="scss" scoped>
  .page {
    height: calc(100vh - var(--window-top) - var(--window-bottom));
    padding-top: 83rpx;
    box-sizing: border-box;
  }

  .qr-img {
    width: 100%;
    height: 100%;
  }
</style>
