<!-- 售后列表 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view
          class="nav-bar-inner ss-flex ss-col-center"
          :style="{ height: '100%', paddingLeft: '20rpx' }"
        >
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <text class="nav-title ss-m-l-10">售后列表</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <view class="aftersale-page">
      <view class="tabs-card">
        <su-tabs
          :list="tabMaps"
          :scrollable="true"
          @change="onTabsChange"
          :current="state.currentTab"
          :activeStyle="{ color: '#1E3F1C', fontSize: '32rpx', fontWeight: 600 }"
          :inactiveStyle="{ color: '#1D2129', fontSize: '32rpx', fontWeight: 'normal' }"
          lineColor="#1E3F1C"
          lineWidth="32"
          lineHeight="6"
        />
      </view>

      <s-empty
        v-if="state.pagination.total === 0"
        :icon="sheep.$url.static('/static/data-empty.webp')"
        text="暂无数据"
      />

      <view v-if="state.pagination.total > 0">
        <view
          class="list-box"
          v-for="order in state.pagination.list"
          :key="order.id"
          @tap="sheep.$router.go('/pages/order/aftersale/detail', { id: order.id })"
        >
          <view class="order-head ss-flex ss-col-center ss-row-between">
            <text class="no">服务单号：{{ order.no }}</text>
            <text class="state">{{ formatAfterSaleStatus(order) }}</text>
          </view>
          <s-goods-item
            :img="order.picUrl"
            :title="order.spuName"
            :skuText="order.properties.map((property) => property.valueName).join(' ')"
            :price="order.refundPrice"
          />
          <!-- <view class="apply-box ss-flex ss-col-center ss-row-between border-bottom ss-p-x-20">
            <view class="ss-flex ss-col-center">
              <view class="title ss-m-r-20">{{ order.way === 10 ? '仅退款' : '退款退货' }}</view>
              <view class="value">{{ formatAfterSaleStatusDescription(order) }}</view>
            </view>
            <text class="_icon-forward"></text>
          </view> -->
          <view class="tool-btn-box ss-flex ss-col-center ss-row-right ss-p-r-20">
            <view>
              <button
                class="ss-reset-button tool-btn"
                @tap.stop="onApply(order.id)"
                v-if="order?.buttons.includes('cancel')"
              >
                取消申请
              </button>
            </view>
          </view>
        </view>
      </view>

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
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import { concat } from 'lodash-es';
  import {
    formatAfterSaleStatus,
    formatAfterSaleStatusDescription,
    handleAfterSaleButtons,
  } from '@/sheep/hooks/useGoods';
  import AfterSaleApi from '@/sheep/api/trade/afterSale';
  import { resetPagination } from '@/sheep/helper/utils';

  const state = reactive({
    currentTab: 0,
    showApply: false,
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
    loadStatus: '',
  });

  const tabMaps = [
    {
      name: '全部',
      value: [],
    },
    {
      name: '申请中',
      value: [10],
    },
    {
      name: '处理中',
      value: [20, 30, 40],
    },
    {
      name: '已完成',
      value: [50],
    },
    {
      name: '已拒绝',
      value: [61, 62, 63],
    },
  ];

  // 切换选项卡
  function onTabsChange(e) {
    resetPagination(state.pagination);
    state.currentTab = e.index;
    getOrderList();
  }

  // 获取售后列表
  async function getOrderList() {
    state.loadStatus = 'loading';
    let { data, code } = await AfterSaleApi.getAfterSalePage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
      statuses: tabMaps[state.currentTab].value.join(','),
    });
    if (code !== 0) {
      return;
    }
    data.list.forEach((order) => handleAfterSaleButtons(order));
    state.pagination.list = concat(state.pagination.list, data.list);
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function onApply(orderId) {
    uni.showModal({
      title: '提示',
      content: '确定要取消此申请吗？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const { code } = await AfterSaleApi.cancelAfterSale(orderId);
        if (code === 0) {
          resetPagination(state.pagination);
          await getOrderList();
        }
      },
    });
  }

  onLoad(async (options) => {
    if (options.type) {
      state.currentTab = options.type;
    }
    await getOrderList();
  });

  // 加载更多
  function loadMore() {
    if (state.loadStatus === 'noMore') {
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
    height: 60rpx;
    color: #000000;
    font-size: 40rpx;
  }

  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
  }

  .aftersale-page {
    padding: 20rpx 24rpx 32rpx;
    background: #f8f9f3;
    min-height: calc(100vh - var(--window-top));
    box-sizing: border-box;
  }

  .tabs-card {
    border-radius: 20rpx;
    padding: 8rpx 12rpx;
  }

  .list-box {
    background-color: #fff;
    margin: 20rpx 0 0;
    border-radius: 20rpx;
    overflow: hidden;

    .order-head {
      padding: 0 25rpx;
      height: 77rpx;

      .no {
        font-size: 24rpx;
        color: #3d3d3c;
      }

      .state {
        font-size: 24rpx;
        color: #1e3f1c;
        font-weight: 500;
      }
    }

    .apply-box {
      height: 82rpx;

      .title {
        font-size: 24rpx;
      }

      .value {
        font-size: 22rpx;
        color: $dark-6;
      }
    }

    .tool-btn-box {
      height: 100rpx;

      .tool-btn {
        width: 160rpx;
        height: 60rpx;
        background: #f6f6f6;
        border-radius: 30rpx;
        font-size: 26rpx;
        font-weight: 400;
      }
    }
  }
</style>
