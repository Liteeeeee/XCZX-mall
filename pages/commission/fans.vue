<template>
  <s-layout navbar="clear" :bgStyle="{ color: 'rgba(248, 249, 243, 1.0)' }">
    <view class="page flex-col">
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
            class="nav-bar-inner flex-row align-center"
            :style="{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '100%',
              left: '0',
              width: '100%',
            }"
          >
            <uni-icons type="left" size="22" color="rgba(0, 0, 0, 0.9)" @tap="sheep.$router.back()" class="nav-back" />
            <text class="nav-title">粉丝</text>
          </view>
        </view>
      </view>
      <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

      <view class="page-body">
        <view class="section_7 flex-row justify-between">
          <view class="text-group_3 flex-col">
            <text class="text_2 count-font">{{ totalFans }}</text>
            <text class="text_3">粉丝</text>
          </view>
          <view class="text-group_4 flex-col">
            <text class="text_4 count-font">{{ todayNewFans }}</text>
            <text class="text_5">今日新增粉丝</text>
          </view>
        </view>

        <view class="list">
          <view class="fan-row flex-row" v-for="item in state.pagination.list" :key="item._key">
            <image class="avatar" :src="sheep.$url.avatar(item.avatar)" mode="aspectFill" />
            <view class="fan-text flex-col">
              <text class="text_6">{{ item.nickname }}</text>
              <text class="text_7">{{ formatDateTime(item.bindUserTime) }}</text>
            </view>
          </view>

          <view v-if="state.pagination.total === 0 && !state.loading" class="empty-text">暂无数据</view>
          <uni-load-more
            v-if="state.pagination.total > 0"
            :status="state.loadStatus"
            :content-text="{ contentdown: '上拉加载更多' }"
          />
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import BrokerageApi from '@/sheep/api/trade/brokerage';

  const state = reactive({
    loading: false,
    todayNewFansCount: 0,
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
    loadStatus: '',
  });

  const totalFans = computed(() => {
    return Number(state.pagination.total || 0);
  });

  const todayNewFans = computed(() => {
    return Number(state.todayNewFansCount || 0);
  });

  function formatDateTime(t) {
    if (!t) return '';
    const d = sheep.$helper.timeFormat(t, 'yyyy.mm.dd');
    const h = sheep.$helper.timeFormat(t, 'hh:MM');
    return `${d}   ${h}`;
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
    const params = {
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
    };
    const res = await BrokerageApi.getBrokerageUserFansPage(params);
    state.loading = false;
    if (!res || typeof res !== 'object' || res?.code !== 0) {
      state.loadStatus = 'more';
      return;
    }

    const list1 = Array.isArray(res?.data?.list)
      ? res.data.list
      : Array.isArray(res?.data?.records)
        ? res.data.records
        : [];
    const merged = list1
      .map((it, index) => ({
        ...it,
        brokerageTime: it.brokerageTime || it.createTime || it.createTimeMillis || 0,
        _key: `fan-${it.id || it.userId || state.pagination.pageNo + '-' + index}`,
      }))
      .sort((a, b) => Number(b.brokerageTime || 0) - Number(a.brokerageTime || 0));

    state.pagination.list = concat(state.pagination.list, merged);
    state.pagination.total = Number(res?.data?.total || res?.data?.totalCount || 0);
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  onLoad((options) => {
    state.todayNewFansCount = Number(options?.todayFirstFansCount || options?.todayNewFansCount || 0);
    resetPagination();
    loadList();
  });

  onReachBottom(() => {
    if (state.loadStatus === 'noMore') return;
    if (state.loading) return;
    state.pagination.pageNo += 1;
    loadList();
  });
</script>

<style lang="scss" scoped>
  .page {
    background-color: rgba(248, 249, 243, 1);
    width: 750rpx;
    min-height: 100vh;
  }

  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 10;
    background-color: rgba(248, 249, 243, 1);
  }

  .header-placeholder {
    width: 100%;
  }

  .nav-back {
    margin-left: 34rpx;
  }

  .nav-title {
    overflow-wrap: break-word;
    color: #000000;
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 50rpx;
    margin-left: 14rpx;
  }

  .page-body {
    padding-bottom: 40rpx;
    background-color: rgba(248, 249, 243, 1);
  }

  .section_7 {
    box-shadow: 0rpx 6rpx 10rpx 0rpx rgba(0, 0, 0, 0.05);
    background-color: rgba(248, 249, 243, 1);
    border-radius: 0rpx 0rpx 20rpx 20rpx;
    padding: 17rpx 108rpx 23rpx 108rpx;
  }

  .text_2,
  .text_4 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 46rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
    line-height: 53rpx;
  }

  .text_3,
  .text_5 {
    overflow-wrap: break-word;
    color: rgba(51, 51, 51, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 37rpx;
    margin-top: 10rpx;
  }

  .list {
    padding: 0 32rpx;
  }

  .fan-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    min-height: 180rpx;
    border-bottom: 1rpx solid rgba(157, 156, 150, 0.3);
  }

  .fan-row:last-child {
    border-bottom: none;
  }

  .avatar {
    border-radius: 50%;
    width: 120rpx;
    height: 120rpx;
    margin: 30rpx 0 30rpx 0;
  }

  .fan-text {
    margin-left: 31rpx;
  }

  .text_6 {
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 28rpx;
    margin-right: 33rpx;
  }

  .text_7 {
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 28rpx;
    margin-top: 28rpx;
  }

  .empty-text {
    text-align: center;
    font-size: 28rpx;
    color: rgba(157, 156, 150, 1);
    padding: 60rpx 0;
  }

  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .justify-between {
    display: flex;
    justify-content: space-between;
  }

  .justify-center {
    display: flex;
    justify-content: center;
  }

  .align-center {
    display: flex;
    align-items: center;
  }
</style>
