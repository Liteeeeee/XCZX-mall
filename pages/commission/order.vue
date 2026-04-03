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
            <text class="nav-title">订单</text>
            
          </view>
        </view>
      </view>
      <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

      <view class="group_23 flex-col">
        <view class="box_6 flex-col">
          <view class="text-wrapper_7 flex-row">
            <view class="tab" @tap="onTabChange(0)">
              <text class="text_2" v-if="state.currentTab === 0">全部</text>
              <text class="text_3" v-else>全部</text>
            </view>
            <view class="tab" @tap="onTabChange(1)">
              <text class="text_2" v-if="state.currentTab === 1">待结算</text>
              <text class="text_4" v-else>待结算</text>
            </view>
            <view class="tab" @tap="onTabChange(2)">
              <text class="text_2" v-if="state.currentTab === 2">已结算</text>
              <text class="text_4" v-else>已结算</text>
            </view>
            <view class="tab" @tap="onTabChange(3)">
              <text class="text_2" v-if="state.currentTab === 3">已取消</text>
              <text class="text_5" v-else>已取消</text>
            </view>
          </view>
          <view class="group_24 flex-row">
            <view class="box_7 flex-col" :style="{ transform: `translateX(${tabLineOffset}rpx)` }"></view>
          </view>
        </view>

        <view class="block_7 flex-col">
          <view class="order-card flex-row justify-between" v-for="item in state.pagination.list" :key="item.id">
            <image class="box_12 flex-col" :src="sheep.$url.cdn(item._picUrl || '')" mode="aspectFill" />
            <view class="group_26 flex-col">
              <view class="text-group_2 flex-col">
                <text class="text_7 ss-ellipsis-1">{{ item._spuName || item.title || '' }}</text>
                <text class="text_8">下单时间：{{ formatDateTime(item._orderCreateTime || item.createTime) }}</text>
                <text class="text_9">付款金额：¥{{ fen2yuan(item._payPrice) }}</text>
              </view>
              <view class="box_26 flex-row justify-between">
                <text class="text_10">预估可赚{{ toYuanInt(item.price) }}元</text>
                <view class="status-tag" :class="statusTagClass(item)">
                  <text class="status-text" :class="statusTextClass(item)">{{ statusText(item) }}</text>
                </view>
              </view>
            </view>
          </view>

          <s-empty v-if="state.pagination.total === 0 && state.loadStatus !== 'loading'" :icon="sheep.$url.static('/static/order-empty.webp')" text="暂无订单" />
          <uni-load-more
            v-if="state.pagination.total > 0"
            :status="state.loadStatus"
            :content-text="{ contentdown: '上拉加载更多' }"
            @tap="loadMore"
          />
        </view>
      </view>

      <commission-auth />
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import OrderApi from '@/sheep/api/trade/order';
  import commissionAuth from './components/commission-auth.vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const state = reactive({
    currentTab: 0,
    loadStatus: '',
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 8,
    },
  });

  const tabMaps = [
    {
      name: '全部',
      value: undefined,
    },
    {
      name: '待结算',
      value: 0,
    },
    {
      name: '已结算',
      value: 1,
    },
    {
      name: '已取消',
      value: 2,
    },
  ];

  const tabLineOffset = computed(() => {
    return 24 + 170 * state.currentTab;
  });

  function resetPagination() {
    state.pagination.list = [];
    state.pagination.total = 0;
    state.pagination.pageNo = 1;
    state.loadStatus = '';
  }

  function onTabChange(index) {
    if (state.currentTab === index) {
      return;
    }
    state.currentTab = index;
    resetPagination();
    getOrderList();
  }

  function toYuanInt(fen) {
    const n = Number(fen || 0);
    if (!Number.isFinite(n)) {
      return '0';
    }
    return String(Math.floor(n / 100));
  }

  function formatDateTime(t) {
    if (!t) return '';
    return sheep.$helper.timeFormat(t, 'yyyy-mm-dd hh:MM:ss');
  }

  function statusText(item) {
    if (item?.status === 0) return '待结算';
    if (item?.status === 1) return '已结算';
    if (item?.status === 2) return '已取消';
    return '待结算';
  }

  function statusTagClass(item) {
    if (item?.status === 0) return 'tag-pending';
    if (item?.status === 1) return 'tag-settled';
    if (item?.status === 2) return 'tag-cancel';
    return 'tag-pending';
  }

  function statusTextClass(item) {
    if (item?.status === 0) return 'text-pending';
    if (item?.status === 1) return 'text-settled';
    if (item?.status === 2) return 'text-cancel';
    return 'text-pending';
  }

  async function enrichOrders(list) {
    await Promise.all(
      (list || []).map(async (item) => {
        const orderId = item?.bizId;
        if (!orderId) return;
        try {
          const { code, data } = await OrderApi.getOrderDetail(orderId);
          if (code !== 0 || !data) return;
          const firstItem = Array.isArray(data.items) ? data.items[0] : undefined;
          item._payPrice = Number(data.payPrice || 0);
          item._orderCreateTime = data.createTime || item.createTime;
          item._spuName = firstItem?.spuName || item.title;
          item._picUrl = firstItem?.picUrl || '';
        } catch (e) {}
      }),
    );
  }

  async function getOrderList() {
    state.loadStatus = 'loading';
    const tab = tabMaps[state.currentTab] || tabMaps[0];
    const queryParams = {
      pageSize: state.pagination.pageSize,
      pageNo: state.pagination.pageNo,
      bizType: 1, // 获得推广佣金
      status: tab.value,
    };
    if (tab.value === undefined) {
      delete queryParams.status;
    }
    const { code, data } = await BrokerageApi.getBrokerageRecordPage(queryParams);
    if (code !== 0) {
      state.loadStatus = 'more';
      return;
    }
    const list = Array.isArray(data.list) ? data.list : [];
    await enrichOrders(list);
    state.pagination.list = concat(state.pagination.list, list);
    state.pagination.total = data.total || 0;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  onLoad(() => {
    getOrderList();
  });

  // 加载更多
  function loadMore() {
    if (state.loadStatus === 'noMore' || state.loadStatus === 'loading') {
      return;
    }
    state.pagination.pageNo++;
    getOrderList();
  }

  // 上拉加载更多
  onReachBottom(() => {
    loadMore();
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
    color: rgba(0, 0, 0, 0.9);
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 50rpx;
    margin: 6rpx 0 0 14rpx;
  }

  .box_21 {
    background-color: rgba(255, 255, 255, 0.594);
    border-radius: 50rpx;
    width: 174rpx;
    border: 1rpx solid rgba(151, 151, 151, 0.198);
    padding: 12rpx 26rpx 13rpx 26rpx;
    margin-left: auto;
    margin-right: 16rpx;
  }

  .box_22 {
    background-color: rgba(0, 0, 0, 1);
    width: 37rpx;
    margin: 13rpx 0 11rpx 0;
  }

  .section_11 {
    width: 8rpx;
    height: 8rpx;
    margin: 3rpx 0 2rpx 0;
  }

  .section_12 {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    width: 13rpx;
    height: 13rpx;
  }

  .section_13 {
    width: 8rpx;
    height: 8rpx;
    margin: 3rpx 0 2rpx 0;
  }

  .box_23 {
    background-color: rgba(0, 0, 0, 0.2);
    width: 1rpx;
    height: 37rpx;
    margin-left: 23rpx;
  }

  .box_24 {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    margin: 2rpx 0 1rpx 25rpx;
    padding: 4rpx;
  }

  .box_25 {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    padding: 7rpx;
  }

  .section_14 {
    width: 12rpx;
    height: 12rpx;
  }

  .group_23 {
  }

  .box_6 {
    background-color: rgba(248, 249, 243, 1);
    position: relative;
    padding: 48rpx 46rpx 0 54rpx;
  }

  .text-wrapper_7 {
    width: 100%;
  }

  .tab {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .text_2 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
    line-height: 48rpx;
  }

  .text_3,
  .text_4,
  .text_5 {
    overflow-wrap: break-word;
    color: rgba(29, 33, 41, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 48rpx;
  }

  .group_24 {
    margin: 18rpx 0 0 0;
    width: 686rpx;
    position: relative;
    height: 6rpx;
  }

  .box_7 {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 1998rpx;
    width: 120rpx;
    height: 6rpx;
    will-change: transform;
  }

  .block_7 {
    width: 686rpx;
    align-self: center;
    margin-top: 24rpx;
    padding-bottom: 40rpx;
  }

  .order-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    width: 686rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
  }

  .box_12 {
    border-radius: 20rpx;
    width: 210rpx;
    height: 210rpx;
    background-color: rgba(248, 249, 243, 1);
  }

  .group_26 {
    width: 404rpx;
  }

  .text_7 {
    overflow-wrap: break-word;
    color: rgba(29, 33, 41, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .text_8,
  .text_9 {
    overflow-wrap: break-word;
    color: rgba(135, 145, 157, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
    margin-top: 14rpx;
  }

  .box_26 {
    width: 404rpx;
    margin-top: 12rpx;
  }

  .text_10 {
    overflow-wrap: break-word;
    color: rgba(248, 99, 6, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
    margin-top: 21rpx;
  }

  .status-tag {
    border-radius: 10rpx;
    border-width: 1rpx;
    border-style: solid;
    padding: 9rpx 21rpx 10rpx 22rpx;
    margin-top: 12rpx;
  }

  .tag-pending {
    background-color: rgba(255, 245, 245, 1);
    border-color: rgba(252, 224, 224, 1);
  }

  .tag-settled {
    background-color: rgba(246, 255, 245, 1);
    border-color: rgba(231, 252, 224, 1);
  }

  .tag-cancel {
    background-color: rgba(249, 249, 249, 1);
    border-color: rgba(157, 156, 150, 1);
  }

  .status-text {
    overflow-wrap: break-word;
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
  }

  .text-pending {
    color: rgba(255, 51, 51, 1);
  }

  .text-settled {
    color: rgba(29, 193, 25, 1);
  }

  .text-cancel {
    color: rgba(157, 156, 150, 1);
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

  .align-center {
    display: flex;
    align-items: center;
  }
</style>
