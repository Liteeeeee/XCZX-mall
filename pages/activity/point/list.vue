<template>
  <s-layout class="point-mall-wrap" navbar="clear" :bgStyle="{ backgroundColor: '#f8f9f3' }">
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
          <view class="title">{{ pageTitle }}</view>
        </view>
      </view>
      <view class="score-hero">
        <view class="score-row">
          <text class="score-num">{{ userInfo.point || 0 }}</text>
          <text class="score-unit">积分</text>
        </view>
        <view class="record-btn" @tap="onRecordTap">兑换记录</view>
      </view>
    </view>

    <view class="page-content">
      <view v-if="mode === 'all' || mode === 'coupon'" class="section">
        <view class="section-hd ss-flex ss-row-between ss-col-center">
          <text class="section-title">优惠券兑换</text>
          <view
            v-if="mode === 'all'"
            class="more-btn ss-flex ss-col-center"
            @tap="onMore('coupon')"
          >
            <text class="more-text">查看更多</text>
            <text class="cicon-forward more-icon"></text>
          </view>
        </view>
        <view class="coupon-grid">
          <view
            v-for="item in couponState.list"
            :key="item.id"
            class="coupon-card"
            @tap="onCouponDetail(item)"
          >
            <view class="coupon-top">
              <image
                v-if="item.picUrl"
                class="coupon-pic"
                :src="sheep.$url.cdn(item.picUrl)"
                mode="aspectFill"
              />
              <view v-else class="coupon-top-content">
                <view class="coupon-amount">{{ formatCouponAmount(item) }}</view>
                <view class="coupon-tag">优惠券</view>
              </view>
            </view>
            <view class="coupon-name ss-line-1">{{ formatCouponName(item) }}</view>
            <view class="coupon-point">
              <text class="coupon-point-num">{{ item.point }}</text>
              <text class="coupon-point-unit">积分</text>
            </view>
          </view>
        </view>
        <s-empty
          v-if="
            mode === 'coupon' && couponState.total === 0 && couponState.loadStatus !== 'loading'
          "
          :icon="sheep.$url.static('/static/goods-empty.webp')"
          text="暂无可兑换优惠券"
        />
        <uni-load-more
          v-if="mode === 'coupon' && couponState.total > 0"
          :auto="true"
          :status="couponState.loadStatus"
          :content-text="{ contentdown: '上拉加载更多' }"
          @clickLoadMore="loadMore"
        />
      </view>

      <view v-if="mode === 'all' || mode === 'vip'" class="section">
        <view class="section-hd ss-flex ss-row-between ss-col-center">
          <text class="section-title">超级会员专属兑换</text>
          <view v-if="mode === 'all'" class="more-btn ss-flex ss-col-center" @tap="onMore('vip')">
            <text class="more-text">查看更多</text>
            <text class="cicon-forward more-icon"></text>
          </view>
        </view>
        <view class="vip-list">
          <view
            v-for="item in vipState.list"
            :key="item.id"
            class="vip-item ss-flex ss-col-center"
            @tap="onGoodsDetail(item)"
          >
            <image class="vip-img" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFill" />
            <view class="vip-info ss-flex-col ss-row-between">
              <view class="vip-title ss-line-2">{{ item.spuName }}</view>
              <view class="vip-bottom ss-flex ss-row-between ss-col-center">
                <view class="vip-price ss-flex-col">
                  <view class="vip-price-main ss-flex ss-col-center">
                    <text class="vip-point-num">{{ item.point }}</text>
                    <text class="vip-point-unit">积分</text>
                    <text v-if="item.price && item.price > 0" class="vip-plus"
                      >+￥{{ fen2yuan(item.price) }}</text
                    >
                    <text v-if="item.skuPrice" class="vip-origin"
                      >￥{{ fen2yuan(item.skuPrice) }}</text
                    >
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <s-empty
          v-if="mode === 'vip' && vipState.total === 0 && vipState.loadStatus !== 'loading'"
          :icon="sheep.$url.static('/static/goods-empty.webp')"
          text="暂无积分商品"
        />
        <uni-load-more
          v-if="mode === 'vip' && vipState.total > 0"
          :auto="true"
          :status="vipState.loadStatus"
          :content-text="{ contentdown: '上拉加载更多' }"
          @clickLoadMore="loadMore"
        />
      </view>

      <view v-if="mode === 'all' || mode === 'normal'" class="section">
        <view class="section-hd ss-flex ss-row-between ss-col-center">
          <text class="section-title">精选积分兑换</text>
          <view
            v-if="mode === 'all'"
            class="more-btn ss-flex ss-col-center"
            @tap="onMore('normal')"
          >
            <text class="more-text">查看更多</text>
            <text class="cicon-forward more-icon"></text>
          </view>
        </view>
        <view class="goods-grid">
          <view
            v-for="item in normalState.list"
            :key="item.id"
            class="goods-card"
            @tap="onGoodsDetail(item)"
          >
            <image class="goods-img" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFill" />
            <view class="goods-name ss-line-2">{{ item.spuName }}</view>
            <view class="goods-bottom ss-flex ss-col-center ss-row-between">
              <view class="goods-point">
                <text class="goods-point-num">{{ item.point }}</text>
                <text class="goods-point-unit">积分</text>
                <text v-if="item.price && item.price > 0" class="goods-plus"
                  >+¥{{ fen2yuan(item.price) }}</text
                >
              </view>
            </view>
            <view
              ><text v-if="item.skuPrice" class="goods-origin"
                >¥{{ fen2yuan(item.skuPrice) }}</text
              ></view
            >
          </view>
        </view>
        <s-empty
          v-if="
            mode === 'normal' && normalState.total === 0 && normalState.loadStatus !== 'loading'
          "
          :icon="sheep.$url.static('/static/goods-empty.webp')"
          text="暂无积分商品"
        />
        <uni-load-more
          v-if="mode === 'normal' && normalState.total > 0"
          :auto="true"
          :status="normalState.loadStatus"
          :content-text="{ contentdown: '上拉加载更多' }"
          @clickLoadMore="loadMore"
        />
      </view>
    </view>
  </s-layout>
</template>
<script setup>
  import sheep from '@/sheep';
  import { onLoad, onReachBottom, onReady } from '@dcloudio/uni-app';
  import { computed, reactive, ref } from 'vue';
  import PointApi from '@/sheep/api/promotion/point';
  import PointCouponExchangeApi from '@/sheep/api/promotion/pointCouponExchange';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const userInfo = computed(() => sheep.$store('user').userInfo);
  const mode = ref('all');

  const pageTitle = computed(() => {
    if (mode.value === 'coupon') return '优惠券兑换';
    if (mode.value === 'vip') return '会员专属积分商品';
    if (mode.value === 'normal') return '积分商品';
    return '积分商城';
  });

  const headerBg = computed(() => {
    return `url(${encodeURI(sheep.$url.cdn('/mp/static/花茶kt@2x.webp'))})`;
  });

  const couponState = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 4,
    loadStatus: '',
  });

  const vipState = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 4,
    loadStatus: '',
  });

  const normalState = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 4,
    loadStatus: '',
  });

  function resetListState(state, pageSize) {
    state.list = [];
    state.total = 0;
    state.pageNo = 1;
    state.pageSize = pageSize;
    state.loadStatus = '';
  }

  async function getCouponList() {
    couponState.loadStatus = 'loading';
    const res = await PointCouponExchangeApi.getPointCouponExchangePage({
      pageNo: couponState.pageNo,
      pageSize: couponState.pageSize,
    });
    if (typeof res?.code === 'number' && res.code !== 0) {
      couponState.loadStatus = '';
      return;
    }
    const data = res?.data ?? res;
    const list = data?.list || data?.records || [];
    const total = Number(data?.total ?? data?.totalCount ?? data?.count ?? list.length ?? 0);
    couponState.list = couponState.list.concat(list);
    couponState.total = total;
    couponState.loadStatus = couponState.list.length < couponState.total ? 'more' : 'noMore';
  }

  async function getGoodsList(targetState, memberOnly) {
    targetState.loadStatus = 'loading';
    const res = await PointApi.getPointActivityPage({
      pageNo: targetState.pageNo,
      pageSize: targetState.pageSize,
      memberOnly,
    });
    if (typeof res?.code === 'number' && res.code !== 0) {
      targetState.loadStatus = '';
      return;
    }
    const data = res?.data ?? res;
    const list = data?.list || data?.records || [];
    const total = Number(data?.total ?? data?.totalCount ?? data?.count ?? list.length ?? 0);
    targetState.list = targetState.list.concat(list);
    targetState.total = total;
    targetState.loadStatus = targetState.list.length < targetState.total ? 'more' : 'noMore';
  }

  function loadMore() {
    if (mode.value === 'all') return;
    if (mode.value === 'coupon') {
      if (couponState.loadStatus === 'noMore') return;
      couponState.pageNo += 1;
      getCouponList();
      return;
    }
    if (mode.value === 'vip') {
      if (vipState.loadStatus === 'noMore') return;
      vipState.pageNo += 1;
      getGoodsList(vipState, true);
      return;
    }
    if (mode.value === 'normal') {
      if (normalState.loadStatus === 'noMore') return;
      normalState.pageNo += 1;
      getGoodsList(normalState, false);
      return;
    }
  }

  function onMore(type) {
    sheep.$router.go('/pages/activity/point/list', { type });
  }

  function onCouponDetail(item) {
    sheep.$router.go('/pages/activity/point/coupon', { id: item.id });
  }

  function onGoodsDetail(item) {
    sheep.$router.go('/pages/goods/point', { id: item.id });
  }

  function onRecordTap() {
    sheep.$router.go('/pages/activity/point/coupon-record');
  }

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

  function formatCouponName(item) {
    const raw = item?.couponTemplateName || item?.name || '';
    const s = String(raw);
    if (s.length <= 10) return s;
    return s.slice(0, 10) + '...';
  }

  onLoad((options) => {
    mode.value = options?.type || 'all';
    if (mode.value === 'coupon') {
      resetListState(couponState, 10);
    } else if (mode.value === 'vip') {
      resetListState(vipState, 10);
    } else if (mode.value === 'normal') {
      resetListState(normalState, 10);
    }
  });

  onReady(() => {
    if (mode.value === 'coupon') {
      getCouponList();
      return;
    }
    if (mode.value === 'vip') {
      getGoodsList(vipState, true);
      return;
    }
    if (mode.value === 'normal') {
      getGoodsList(normalState, false);
      return;
    }
    Promise.all([getCouponList(), getGoodsList(vipState, true), getGoodsList(normalState, false)]);
  });

  onReachBottom(() => {
    loadMore();
  });
</script>

<style lang="scss" scoped>
  .header-box {
    width: 100%;
    background-size: 100% 109%;
    background-repeat: no-repeat;
    background-image: v-bind(headerBg);
    padding: 0 0 32rpx 0;
  }

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
          font-size: 48rpx;
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

  .score-hero {
    padding: 24rpx 40rpx 0;

    .score-row {
      display: flex;
      align-items: baseline;
    }

    .score-num {
      font-size: 72rpx;
      font-weight: 700;
      color: #1e3f1c;
      line-height: 84rpx;
    }

    .score-unit {
      font-size: 28rpx;
      color: #1e3f1c;
      margin-left: 10rpx;
    }

    .record-btn {
      margin-top: 22rpx;
      width: 180rpx;
      height: 64rpx;
      border-radius: 32rpx;
      background: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      color: #1e3f1c;
    }
  }

  .page-content {
    padding: 0 0 40rpx;
    background-color: #fffffa;
  }

  .section {
    padding: 0 24rpx 32rpx;
    border-top-left-radius: 40rpx;
    border-top-right-radius: 40rpx;
    background: #fffffa;
    overflow: hidden;
  }

  .section-hd {
    padding: 16rpx 6rpx;
  }

  .section-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #000;
  }

  .more-btn {
    color: #666;
  }

  .more-text {
    font-size: 26rpx;
    color: #666;
  }

  .more-icon {
    font-size: 24rpx;
    color: #666;
    margin-left: 6rpx;
  }

  .coupon-grid,
  .goods-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20rpx;
  }

  .coupon-card {
    background: #f8f9f3;
    border-radius: 18rpx;
    overflow: hidden;
    padding: 20rpx 20rpx 18rpx;
  }

  .coupon-top {
    height: 150rpx;
    background: #1e3f1c;
    border-radius: 14rpx;
    overflow: hidden;
    margin-bottom: 16rpx;
  }

  .coupon-pic {
    width: 100%;
    height: 100%;
    display: block;
  }

  .coupon-top-content {
    height: 100%;
    padding: 18rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #fff;
  }

  .coupon-amount {
    font-size: 60rpx;
    font-weight: 700;
    line-height: 60rpx;
  }

  .coupon-tag {
    font-size: 26rpx;
    opacity: 0.9;
  }

  .coupon-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #000;
  }

  .coupon-point {
    margin-top: 10rpx;
    display: flex;
    align-items: baseline;
  }

  .coupon-point-num {
    font-size: 44rpx;
    font-weight: 700;
    color: #ff6a00;
    line-height: 44rpx;
  }

  .coupon-point-unit {
    font-size: 26rpx;
    color: #999;
    margin-left: 6rpx;
  }

  .goods-card {
    background: #f8f9f3;
    border-radius: 18rpx;
    overflow: hidden;
    padding: 0 0 18rpx;
  }

  .goods-img {
    width: 100%;
    height: 280rpx;
    display: block;
  }

  .goods-name {
    padding: 16rpx 18rpx 0;
    font-size: 28rpx;
    font-weight: 600;
    color: #000;
    line-height: 40rpx;
    min-height: 80rpx;
  }

  .goods-bottom {
    padding: 10rpx 18rpx 0;
  }

  .goods-point-num {
    font-size: 44rpx;
    font-weight: 700;
    color: #ff6a00;
    line-height: 44rpx;
  }

  .goods-point-unit {
    font-size: 26rpx;
    color: #ff6a00;
    margin-left: 6rpx;
  }

  .goods-plus {
    font-size: 28rpx;
    color: #ff6a00;
    margin-left: 6rpx;
    font-weight: 600;
  }

  .goods-btn {
    width: 150rpx;
    height: 56rpx;
    border-radius: 28rpx;
    background: #1e3f1c;
    color: #fff;
    font-size: 26rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .goods-origin {
    display: inline;
    margin-left: 12rpx;
    font-size: 26rpx;
    color: #999;
    text-decoration: line-through;
  }

  .goods-point {
    display: flex;
    align-items: baseline;
  }

  .vip-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  .vip-item {
    background: #f8f9f3;
    border-radius: 18rpx;
    padding: 20rpx;
    overflow: hidden;
  }

  .vip-img {
    width: 220rpx;
    height: 160rpx;
    border-radius: 14rpx;
    flex-shrink: 0;
  }

  .vip-info {
    flex: 1;
    margin-left: 20rpx;
    min-height: 160rpx;
  }

  .vip-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #000;
    line-height: 42rpx;
  }

  .vip-bottom {
    margin-top: 16rpx;
  }

  .vip-price-main {
    line-height: 44rpx;
  }

  .vip-point-num {
    font-size: 40rpx;
    font-weight: 700;
    color: #ff6a00;
  }

  .vip-point-unit {
    font-size: 24rpx;
    color: #ff6a00;
    margin-left: 6rpx;
  }

  .vip-plus {
    font-size: 24rpx;
    color: #ff6a00;
    margin-left: 6rpx;
    font-weight: 600;
  }

  .vip-origin {
    display: inline;
    margin-left: 12rpx;
    font-size: 26rpx;
    color: #999;
    text-decoration: line-through;
  }

  .vip-btn {
    width: 200rpx;
    height: 72rpx;
    border-radius: 36rpx;
    background: #1e3f1c;
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
</style>
