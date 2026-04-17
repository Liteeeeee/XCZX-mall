<!-- 分销 - 订单明细 -->
<template>
  <s-layout title="分销订单" :class="state.scrollTop ? 'order-warp' : ''" navbar="inner">
    <view
      class="header-box"
      :style="[
        {
          marginTop: '-' + Number(statusBarHeight + 88) + 'rpx',
          paddingTop: Number(statusBarHeight + 108) + 'rpx',
        },
      ]"
    >
      <view class="team-data-box ss-flex ss-col-center ss-row-between" style="width: 100%">
        <view class="data-card" style="width: 100%">
          <view class="total-item" style="width: 100%">
            <view class="item-title" style="text-align: center">累计推广订单（单）</view>
            <view class="total-num" style="text-align: center">
              {{ state.totals }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <su-sticky bgColor="#fff">
      <su-tabs
        :list="tabMaps"
        :scrollable="false"
        :current="state.currentTab"
        @change="onTabsChange"
      >
      </su-tabs>
    </su-sticky>

    <view class="order-box">
      <view class="order-item" v-for="item in state.pagination.list" :key="item">
        <view class="order-header">
          <view class="no-box ss-flex ss-col-center ss-row-between">
            <text class="order-code">订单编号：{{ item.bizId }}</text>
            <text class="order-state">
              {{ item.status === 0 ? '待结算' : item.status === 1 ? '已结算' : '已取消' }}
              ( 佣金 {{ fen2yuan(item.price) }} 元 )
            </text>
          </view>
          <view class="order-from ss-flex ss-col-center ss-row-between">
            <view class="from-user ss-flex ss-col-center">
              <text>{{ item.title }}</text>
            </view>
            <view class="order-time">
              {{ sheep.$helper.timeFormat(item.createTime, 'yyyy-mm-dd hh:MM:ss') }}
            </view>
          </view>
        </view>
      </view>
      <s-empty
        v-if="state.pagination.total === 0"
        :icon="sheep.$url.static('/static/order-empty.webp')"
        text="暂无订单"
      />
      <uni-load-more
        v-if="state.pagination.total > 0"
        :status="state.loadStatus"
        :content-text="{
          contentdown: '上拉加载更多',
        }"
        @tap="loadMore"
      />
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad, onPageScroll, onReachBottom } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import { concat } from 'lodash-es';
  import { resetPagination } from '@/sheep/helper/utils';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import { fen2yuan } from '../../sheep/hooks/useGoods';

  const statusBarHeight = sheep.$platform.device.statusBarHeight * 2;
  const headerBg = sheep.$url.css('/static/img/shop/user/withdraw_bg.webp');

  onPageScroll((e) => {
    state.scrollTop = e.scrollTop <= 100;
  });

  const state = reactive({
    totals: 0,
    scrollTop: false,
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
      value: -1,
    },
    {
      name: '待结算',
      value: 0,
    },
    {
      name: '已结算',
      value: 1,
    },
  ];

  function onTabsChange(e) {
    resetPagination(state.pagination);
    state.currentTab = e.index;
    getOrderList();
  }

  async function getOrderList() {
    state.loadStatus = 'loading';
    const tab = tabMaps[state.currentTab];
    const queryParams = {
      pageSize: state.pagination.pageSize,
      pageNo: state.pagination.pageNo,
      bizType: 1,
      status: tab.value,
    };
    if (tab.value < 0) {
      delete queryParams.status;
    }
    const { code, data } = await BrokerageApi.getBrokerageRecordPage(queryParams);
    if (code !== 0) {
      return;
    }
    state.pagination.list = concat(state.pagination.list, data.list);
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
    if (state.currentTab === 0) {
      state.totals = data.total;
    }
  }

  onLoad(() => {
    getOrderList();
  });

  function loadMore() {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getOrderList();
  }

  onReachBottom(() => {
    loadMore();
  });
</script>

<style lang="scss" scoped>
  .header-box {
    box-sizing: border-box;
    padding: 0 20rpx 20rpx 20rpx;
    width: 750rpx;
    background: v-bind(headerBg) no-repeat,
      linear-gradient(90deg, var(--ui-BG-Main), var(--ui-BG-Main-gradient));
    background-size: 750rpx 100%;
  }

  .order-box {
    .order-item {
      background: #ffffff;
      border-radius: 10rpx;
      margin: 20rpx;
    }
  }
</style>
