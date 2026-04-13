<!-- 售后日志列表  -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view class="nav-bar-inner">
          <view class="nav-left ss-flex ss-col-center">
            <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="onBack">
              <text class="sicon-back"></text>
            </view>
            <text class="nav-title ss-m-l-10">售后进度</text>
          </view>
          <view v-if="isMiniProgram" class="nav-right">
            <view class="capsule-placeholder" :style="capsuleStyle"></view>
          </view>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>
    <s-empty
      v-if="state.loaded && state.list.length === 0"
      :icon="sheep.$url.static('/static/order-empty.webp')"
      text="暂无售后进度"
    />
    <view v-else class="log-box">
      <view v-for="(item, index) in state.list" :key="item.id">
        <log-item :item="item" :index="index" :data="state.list" />
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import logItem from './log-item.vue';
  import AfterSaleApi from '@/sheep/api/trade/afterSale';

  const isMiniProgram = sheep.$platform.platform === 'miniProgram';
  const capsuleStyle = computed(() => {
    if (!isMiniProgram) {
      return {};
    }
    const rightMargin = sheep.$platform.device.windowWidth - sheep.$platform.capsule.right;
    return {
      width: sheep.$platform.capsule.width + rightMargin + 'px',
      height: sheep.$platform.capsule.height + 'px',
    };
  });

  const state = reactive({
    list: [],
    loaded: false,
  });

  function onBack() {
    if (sheep.$router.hasHistory()) {
      sheep.$router.back();
      return;
    }
    sheep.$router.go('/pages/index/index', {}, { redirect: true });
  }

  async function getDetail(id) {
    const { data } = await AfterSaleApi.getAfterSaleLogList(id);
    state.list = Array.isArray(data) ? data : [];
    state.loaded = true;
  }

  onLoad((options) => {
    state.aftersaleId = options.id;
    if (!options.id) {
      state.loaded = true;
      return;
    }
    getDetail(options.id);
  });
</script>

<style lang="scss" scoped>
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    background: #f8f9f3;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* #ifdef H5 */
    max-width: 750rpx;
    left: 50%;
    transform: translateX(-50%);
    /* #endif */
  }
  .nav-bar-container {
    background: #f8f9f3;
    display: flex;
    align-items: center;
  }
  .back-btn {
    width: 60rpx;
    color: rgba(30, 63, 28, 0.9);
    height: 60rpx;
  }
  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
  }
  .nav-bar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 20rpx;
    width: 100%;
    box-sizing: border-box;
  }
  .nav-left,
  .nav-right {
    display: flex;
    align-items: center;
  }

  .log-box {
    margin: 24rpx 32rpx 0 32rpx;
    padding: 24rpx 24rpx 24rpx 40rpx;
    background-color: #fff;
    border-radius: 10rpx;
    box-sizing: border-box;
  }
</style>
