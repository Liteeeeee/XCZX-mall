<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#fff' }">
    <view class="fixed-header">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{
          position: 'relative',
          height: navbarHeight - statusBarHeight + 'px',
        }"
      >
        <view
          class="nav-bar-inner ss-flex ss-col-center"
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
            color="#000"
            @tap="sheep.$router.back()"
            class="ss-m-l-20"
          ></uni-icons>
          <text class="nav-title ss-m-l-10">专属客服</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ paddingTop: navbarHeight + 'px' }"></view>

    <view class="page" :style="{ height: contentHeight }">
      <image class="qr-img" :src="qrUrl" mode="aspectFill" show-menu-by-longpress />
    </view>
  </s-layout>
</template>

<script setup>
  import { computed } from 'vue';
  import sheep from '@/sheep';

  const navbarHeight = computed(() => sheep?.$platform?.navbar || 0);
  const statusBarHeight = computed(() => sheep?.$platform?.device?.statusBarHeight || 0);
  const contentHeight = computed(
    () => `calc(100vh - var(--window-top) - var(--window-bottom) - ${navbarHeight.value}px)`,
  );
  const qrUrl = computed(() => sheep.$url.cdn('/mp/static/企业微信@2x.png'));
</script>

<style lang="scss" scoped>
  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 10;
    background-color: #fff;
  }

  .nav-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #000;
  }

  .page {
    box-sizing: border-box;
    overflow: hidden;
  }

  .qr-img {
    width: 100%;
    height: 100%;
    min-height: 100%;
  }
</style>
