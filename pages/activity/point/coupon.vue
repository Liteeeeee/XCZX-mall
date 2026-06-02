<template>
  <s-layout class="coupon-exchange-wrap" navbar="clear" :bgStyle="{ backgroundColor: '#f8f9f3' }">
    <view class="header-box">
      <su-status-bar />
      <view
        class="custom-nav"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view class="nav-inner ss-flex ss-col-center">
          <view class="left-box ss-flex ss-col-center ss-p-l-30 ss-p-r-20" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <view class="title">优惠券兑换</view>
        </view>
      </view>
    </view>

    <view v-if="state.loading" />
    <s-empty
      v-else-if="!state.detail"
      :icon="sheep.$url.static('/static/goods-empty.webp')"
      text="兑换配置不存在"
    />
    <view v-else class="content">
      <view class="card">
        <view class="amount">{{ formatCouponAmount(state.detail) }}</view>
        <view class="name">{{ state.detail.couponTemplateName || state.detail.name }}</view>
        <view class="desc ss-m-t-10">{{ state.detail.couponTemplateDescription || '' }}</view>
        <view class="point-row ss-m-t-30">
          <text class="point-num">{{ state.detail.point }}</text>
          <text class="point-unit">积分</text>
        </view>
      </view>
      <button class="ss-reset-button exchange-btn" @tap="onExchange">立即兑换</button>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import PointCouponExchangeApi from '@/sheep/api/promotion/pointCouponExchange';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const state = reactive({
    id: undefined,
    loading: true,
    detail: null,
  });

  function formatCouponAmount(item) {
    if (Number(item?.discountType) === 1) {
      return `${fen2yuan(item?.discountPrice || 0)}元`;
    }
    if (Number(item?.discountType) === 2) {
      const percent = Number(item?.discountPercent || 0);
      return percent ? `${percent / 10}折` : '折扣券';
    }
    return '优惠券';
  }

  async function getDetail() {
    state.loading = true;
    const res = await PointCouponExchangeApi.getPointCouponExchange(state.id);
    state.loading = false;
    if (typeof res?.code === 'number' && res.code !== 0) {
      return;
    }
    const data = res?.data ?? res;
    state.detail = data || null;
  }

  async function onExchange() {
    if (!state.id) return;
    const res = await PointCouponExchangeApi.exchangeCoupon(state.id);
    if (typeof res?.code === 'number' && res.code !== 0) return;
    uni.showToast({ title: '兑换成功', icon: 'none' });
  }

  onLoad((options) => {
    state.id = options?.id ? Number(options.id) : undefined;
    if (!state.id) {
      state.loading = false;
      state.detail = null;
      return;
    }
    getDetail();
  });
</script>

<style lang="scss" scoped>
  .custom-nav {
    position: relative;
    width: 100%;

    .nav-inner {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 100%;
      width: 100%;

      .left-box {
        .sicon-back {
          font-size: 32rpx;
          color: #1e3f1c;
        }
      }

      .title {
        font-size: 32rpx;
        font-weight: 600;
        color: #1e3f1c;
      }
    }
  }

  .content {
    padding: 30rpx 24rpx;
  }

  .card {
    background: #ffffff;
    border-radius: 18rpx;
    padding: 30rpx;
  }

  .amount {
    font-size: 72rpx;
    font-weight: 700;
    color: #1e3f1c;
    line-height: 84rpx;
  }

  .name {
    font-size: 34rpx;
    font-weight: 700;
    color: #000;
    margin-top: 10rpx;
  }

  .desc {
    font-size: 26rpx;
    color: #666;
    line-height: 36rpx;
  }

  .point-row {
    display: flex;
    align-items: baseline;
  }

  .point-num {
    font-size: 56rpx;
    font-weight: 700;
    color: #ff6a00;
    line-height: 56rpx;
  }

  .point-unit {
    font-size: 28rpx;
    color: #999;
    margin-left: 8rpx;
  }

  .exchange-btn {
    margin-top: 30rpx;
    width: 100%;
    height: 88rpx;
    border-radius: 44rpx;
    background: #1e3f1c;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

