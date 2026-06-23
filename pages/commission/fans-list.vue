<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F6F7F2' }">
    <view class="page">
      <view class="fixed-header">
        <su-status-bar />
        <view
          class="nav-bar-container"
          :style="{
            position: 'relative',
            height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px',
          }"
        >
          <view
            class="nav-bar-inner"
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
              color="rgba(0, 0, 0, 0.9)"
              @tap="sheep.$router.back()"
              class="nav-back"
            />
            <text class="nav-title">{{ state.title }}</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view class="list-head">
          <text class="list-head-title"></text>
          <text class="list-head-count">共 {{ state.pagination.total }} 位</text>
        </view>

        <view class="list-card">
          <template v-if="state.pagination.list.length">
            <fan-customer-card
              v-for="(item, index) in state.pagination.list"
              :key="item._key"
              :item="item"
              :show-member-tag="state.goodFan"
              :show-divider="index !== state.pagination.list.length - 1"
              @archive="handleArchiveTap"
            />
          </template>
          <view v-else-if="!state.loading" class="empty-state">
            <image class="empty-image" :src="emptyIcon" mode="aspectFit" />
          </view>
        </view>

        <uni-load-more
          v-if="state.pagination.total > 0"
          :auto="true"
          :status="state.loadStatus"
          :content-text="{ contentdown: '上拉加载更多' }"
          @clickLoadMore="loadMore"
        />
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import fanCustomerCard from './components/fan-customer-card.vue';

  const emptyIcon = sheep.$url.cdn('/mp/static/智能客户管家/empty.webp');

  const state = reactive({
    title: '粉丝客户',
    goodFan: false,
    loading: false,
    loadStatus: '',
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
  });

  function normalizeList(list) {
    return (Array.isArray(list) ? list : [])
      .map((item, index) => ({
        ...item,
        nickname: item?.nickname || item?.customerNickname || item?.userNickname || '',
        mobile: item?.mobile || item?.memberMobile || item?.phone || '',
        bindUserTime: item?.bindUserTime || item?.registerTime || item?.createTime || 0,
        lastOnlineTime: item?.lastOnlineTime || item?.lastLoginTime || 0,
        memberLevelName:
          item?.memberLevelName || (Number(item?.memberLevel || 0) > 0 ? '会员客户' : ''),
        _key: `fan-list-${
          item.id || item.userId || item.bindUserId || state.pagination.pageNo
        }-${index}`,
      }))
      .sort((a, b) => {
        const aTime = Number(
          a?.bindUserTime ||
            a?.registerTime ||
            a?.brokerageTime ||
            a?.createTime ||
            a?.createTimeMillis ||
            0,
        );
        const bTime = Number(
          b?.bindUserTime ||
            b?.registerTime ||
            b?.brokerageTime ||
            b?.createTime ||
            b?.createTimeMillis ||
            0,
        );
        return bTime - aTime;
      });
  }

  function resetPagination() {
    state.pagination.list = [];
    state.pagination.total = 0;
    state.pagination.pageNo = 1;
    state.loadStatus = '';
  }

  async function loadList() {
    if (state.loading) return;
    state.loading = true;
    state.loadStatus = 'loading';
    const res = await BrokerageApi.getBrokerageCustomerPage(
      {
        pageNo: state.pagination.pageNo,
        pageSize: state.pagination.pageSize,
        goodFan: state.goodFan,
      },
      { showLoading: state.pagination.pageNo === 1 },
    );
    state.loading = false;
    if (res?.code !== 0) {
      state.loadStatus = state.pagination.list.length ? 'more' : '';
      return;
    }
    const rawList = Array.isArray(res?.data?.list)
      ? res.data.list
      : Array.isArray(res?.data?.records)
      ? res.data.records
      : [];
    const mergedList = normalizeList(rawList);
    state.pagination.list = concat(state.pagination.list, mergedList);
    state.pagination.total = Number(res?.data?.total || res?.data?.totalCount || 0);
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function loadMore() {
    if (state.loadStatus === 'noMore' || state.loading) return;
    state.pagination.pageNo += 1;
    loadList();
  }

  function handleArchiveTap(item = {}) {
    const memberId = Number(item?.memberId || item?.id || 0);
    if (!memberId) {
      uni.showToast({
        title: '客户信息缺失',
        icon: 'none',
      });
      return;
    }
    sheep.$router.go('/pages/commission/customer-archive', {
      memberId,
      avatar: item?.avatar || item?.userAvatar || item?.memberAvatar || '',
      memberLevel: item?.memberLevel || 0,
      userNickname: item?.userNickname || item?.nickname || '',
      customerNickname: item?.customerNickname || '',
      memberMobile: item?.memberMobile || item?.mobile || '',
    });
  }

  onLoad((options) => {
    state.title = options?.title || '粉丝客户';
    state.goodFan = String(options?.goodFan) === 'true';
    resetPagination();
    loadList();
  });

  onReachBottom(() => {
    loadMore();
  });
</script>

<style lang="scss" scoped>
  .page {
    width: 750rpx;
    min-height: 100vh;
    background: #f6f7f2;
  }

  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 10;
    background: #f6f7f2;
  }

  .nav-bar-inner {
    display: flex;
    align-items: center;
  }

  .nav-back {
    margin-left: 34rpx;
  }

  .nav-title {
    margin-left: 14rpx;
    color: #111111;
    font-size: 36rpx;
    font-weight: 500;
    line-height: 50rpx;
  }

  .page-body {
    padding: 24rpx;
  }

  .list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  .list-head-title {
    color: #222222;
    font-size: 38rpx;
    font-weight: 600;
    line-height: 54rpx;
  }

  .list-head-count {
    color: #8e8e8e;
    font-size: 26rpx;
    line-height: 36rpx;
  }

  .list-card {
    padding: 0 24rpx;
    border-radius: 24rpx;
    background: #ffffff;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.05);
  }

  .empty-state {
    height: 429rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-image {
    width: 100%;
    height: 222rpx;
  }
</style>
