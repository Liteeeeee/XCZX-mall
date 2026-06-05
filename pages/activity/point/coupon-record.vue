<template>
  <s-layout class="coupon-record-wrap" navbar="clear" :bgStyle="{ backgroundColor: '#f8f9f3' }">
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
          <view class="title">兑换记录</view>
        </view>
      </view>
    </view>

    <s-empty
      v-if="state.pagination.total === 0 && state.loadStatus !== 'loading'"
      :icon="sheep.$url.static('/static/data-empty.webp')"
      text="暂无兑换记录"
    />

    <view v-else class="list-box">
      <view v-for="item in state.pagination.list" :key="item.id" class="list-item">
        <view class="row-1 ss-flex ss-row-between ss-col-center">
          <view class="name ss-line-1">{{
            item.name || item.couponName || item.couponTemplateName
          }}</view>
          <view class="status" :class="statusClass(item.status)">{{
            statusText(item.status)
          }}</view>
        </view>
        <view class="row-2 ss-flex ss-row-between ss-col-center">
          <view class="time">{{ formatTime(item.createTime) }}</view>
          <view class="point">
            <text class="point-num">{{ item.point }}</text>
            <text class="point-unit">积分</text>
          </view>
        </view>
      </view>
    </view>

    <uni-load-more
      v-if="state.pagination.total > 0"
      :auto="true"
      :status="state.loadStatus"
      :content-text="{ contentdown: '上拉加载更多' }"
      @clickLoadMore="loadMore"
    />
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import { concat } from 'lodash-es';
  import { resetPagination } from '@/sheep/helper/utils';
  import PointCouponExchangeApi from '@/sheep/api/promotion/pointCouponExchange';

  const state = reactive({
    loading: false,
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
    loadStatus: '',
  });

  function statusText(status) {
    if (status === 1) return '成功';
    if (status === 2) return '失败';
    if (status === 0) return '处理中';
    return '未知';
  }

  function statusClass(status) {
    if (status === 1) return 'status-success';
    if (status === 2) return 'status-fail';
    if (status === 0) return 'status-pending';
    return '';
  }

  function formatTime(time) {
    if (!time) return '';
    return sheep.$helper.timeFormat(time, 'yyyy.mm.dd hh:MM');
  }

  async function getRecordPage() {
    if (state.loading) return;
    state.loading = true;
    state.loadStatus = 'loading';
    const res = await PointCouponExchangeApi.getPointCouponExchangeRecordPage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
    });
    state.loading = false;
    if (typeof res?.code === 'number' && res.code !== 0) {
      state.loadStatus = '';
      return;
    }
    const data = res?.data ?? res;
    const list = data?.list || data?.records || [];
    const total = Number(data?.total ?? data?.totalCount ?? data?.count ?? 0);
    state.pagination.list = concat(state.pagination.list, list);
    state.pagination.total = total || state.pagination.list.length;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function loadMore() {
    if (state.loadStatus === 'noMore') return;
    if (state.loading) return;
    state.pagination.pageNo++;
    getRecordPage();
  }

  onReachBottom(() => {
    loadMore();
  });

  onLoad(() => {
    resetPagination(state.pagination);
    state.loadStatus = '';
    getRecordPage();
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

  .list-box {
    padding: 20rpx 24rpx 0;
  }

  .list-item {
    background: #fff;
    border-radius: 18rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
  }

  .name {
    font-size: 30rpx;
    font-weight: 600;
    color: #000;
    flex: 1;
    padding-right: 20rpx;
  }

  .status {
    font-size: 26rpx;
    font-weight: 600;
  }

  .status-success {
    color: #1e3f1c;
  }

  .status-fail {
    color: #ff2b2b;
  }

  .status-pending {
    color: #ff6a00;
  }

  .row-2 {
    margin-top: 16rpx;
  }

  .time {
    font-size: 26rpx;
    color: #999;
  }

  .point-num {
    font-size: 34rpx;
    font-weight: 700;
    color: #ff6a00;
    line-height: 34rpx;
  }

  .point-unit {
    font-size: 26rpx;
    color: #999;
    margin-left: 6rpx;
  }
</style>
