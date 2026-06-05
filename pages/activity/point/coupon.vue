<template>
  <s-layout class="coupon-exchange-wrap" navbar="clear" :bgStyle="{ backgroundColor: '#f8f9f3' }">
    <view class="header-box">
      <su-status-bar />
      <view
        class="custom-nav"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view class="nav-inner ss-flex ss-col-center">
          <view
            class="left-box ss-flex ss-col-center ss-p-l-30 ss-p-r-20"
            @tap="sheep.$router.back()"
          >
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
      <view class="exchange-card">
        <view class="exchange-main ss-flex-col ss-col-center">
          <image class="coupon-icon" :src="couponIcon" mode="aspectFit" />
          <view class="exchange-name ss-line-1">
            {{ state.detail.couponTemplateName || state.detail.name }}
          </view>
          <view class="exchange-valid">领券当日起始{{ validDays }}天内有效</view>
        </view>
        <view class="exchange-meta ss-flex ss-row-between ss-col-center">
          <view class="exchange-point">
            <text class="point-num">{{ state.detail.point }}</text>
            <text class="point-unit">积分</text>
          </view>
          <view v-if="!isUnlimited" class="exchange-stock">剩余{{ remainText }}份</view>
        </view>
      </view>

      <view class="notice-card">
        <view class="notice-title">兑换须知</view>
        <view class="notice-list">
          <view v-for="(line, idx) in noticeLines" :key="idx" class="notice-item">
            <text class="notice-no">{{ idx + 1 }}、</text>
            <text class="notice-text">{{ line }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="state.detail" class="footer">
      <button class="ss-reset-button exchange-btn" @tap="onExchange">立即兑换</button>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import PointCouponExchangeApi from '@/sheep/api/promotion/pointCouponExchange';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const state = reactive({
    id: undefined,
    loading: true,
    detail: null,
  });

  const couponIcon = sheep.$url.cdn('/mp/static/优惠图标@2x.png');

  const validDays = computed(() => {
    const d = state.detail;
    return Number(d?.validDays ?? d?.validityDays ?? d?.expireDays ?? 90) || 90;
  });

  const remainCount = computed(() => {
    const d = state.detail;
    const direct =
      d?.remainCount ?? d?.remainingCount ?? d?.leftCount ?? d?.stock ?? d?.availableCount;
    if (typeof direct === 'number') return direct;
    if (typeof direct === 'string' && direct !== '') return Number(direct);
    const total = d?.totalCount ?? d?.total ?? d?.count;
    const used = d?.exchangedCount ?? d?.usedCount ?? d?.exchangeCount ?? d?.redeemCount;
    if (typeof total === 'number' && typeof used === 'number') return total - used;
    return undefined;
  });

  const remainText = computed(() => {
    const v = remainCount.value;
    return typeof v === 'number' && !Number.isNaN(v) ? v : '--';
  });

  const totalCount = computed(() => {
    const d = state.detail;
    const v = d?.totalCount ?? d?.total ?? d?.count ?? d?.stock;
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v !== '') return Number(v);
    return undefined;
  });

  const totalText = computed(() => {
    const v = totalCount.value;
    return typeof v === 'number' && !Number.isNaN(v) ? v : '--';
  });

  const isUnlimited = computed(() => {
    const v = totalCount.value;
    return v === -1;
  });

  function stripLeadingNo(str) {
    return String(str || '')
      .trim()
      .replace(/^\d+\s*[、.]\s*/, '');
  }

  const noticeLines = computed(() => {
    const d = state.detail;
    const raw = d?.notice;
    if (Array.isArray(raw)) {
      let list = raw.map((v) => stripLeadingNo(v)).filter(Boolean);
      if (isUnlimited.value) list = list.filter((v) => !/限量.*份/.test(v));
      if (list.length) return list;
    }
    if (typeof raw === 'string' && raw.trim()) {
      let str = raw.trim();
      try {
        if (str.startsWith('[') || str.startsWith('{')) {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            let list = parsed.map((v) => stripLeadingNo(v)).filter(Boolean);
            if (isUnlimited.value) list = list.filter((v) => !/限量.*份/.test(v));
            if (list.length) return list;
          }
        }
      } catch (e) {}

      str = str.replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n');
      if (!str.includes('\n') && /[0-9]+[、.]/.test(str) && str.includes('；')) {
        let parts = str
          .split('；')
          .map((v) => stripLeadingNo(v))
          .filter(Boolean)
          .map((v, i, arr) => (i < arr.length - 1 ? `${v}；` : v));
        if (isUnlimited.value) parts = parts.filter((v) => !/限量.*份/.test(v));
        if (parts.length) return parts;
      }
      let lines = str
        .split(/\r?\n/)
        .map((v) => stripLeadingNo(v))
        .filter(Boolean);
      if (isUnlimited.value) lines = lines.filter((v) => !/限量.*份/.test(v));
      if (lines.length) return lines;
    }
    const base = [`领券当日起始${validDays.value}天内有效；`];
    if (!isUnlimited.value) base.push(`本优惠券限量${totalText.value}份/期，兑完即止；`);
    base.push(
      '部分新品、特价商品、拼团特惠、限时特惠和会员特价商品不可使用；',
      '优惠券兑换后，不可取消兑换并返还积分；',
      '兑换成功后，可以从我的-优惠券中查看；',
      '每人限兑1次。',
    );
    return base;
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
    padding: 30rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
  }

  .exchange-card {
    background: #ffffff;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.04);
  }

  .exchange-main {
    padding: 52rpx 24rpx 40rpx 24rpx;
  }

  .coupon-icon {
    width: 56rpx;
    height: 56rpx;
  }

  .exchange-name {
    margin-top: 28rpx;
    font-size: 32rpx;
    font-weight: 700;
    color: #000;
    text-align: center;
  }

  .exchange-valid {
    margin-top: 16rpx;
    font-size: 24rpx;
    color: #999;
    text-align: center;
  }

  .exchange-meta {
    background: #eef0e6;
    padding: 22rpx 24rpx;
  }

  .exchange-point {
    display: flex;
    align-items: baseline;
  }

  .point-num {
    font-size: 44rpx;
    font-weight: 700;
    color: #ff6a00;
    line-height: 44rpx;
  }

  .point-unit {
    font-size: 28rpx;
    color: #999;
    margin-left: 8rpx;
  }

  .exchange-stock {
    font-size: 26rpx;
    color: #999;
  }

  .notice-card {
    margin-top: 24rpx;
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx 24rpx;
  }

  .notice-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #000;
  }

  .notice-list {
    margin-top: 18rpx;
  }

  .notice-item {
    font-size: 26rpx;
    color: #666;
    line-height: 44rpx;
  }

  .footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: calc(100% - 48rpx);
    padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
    background: #f8f9f3;
    z-index: 10;
  }

  .exchange-btn {
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
