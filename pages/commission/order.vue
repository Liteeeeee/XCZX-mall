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
            <view class="tab" v-for="(tab, index) in tabMaps" :key="index" @tap="onTabChange(index)">
              <view class="tab-inner flex-col align-center">
                <text class="text_2" v-if="state.currentTab === index">{{ tab.name }}</text>
                <text class="text_3" v-else>{{ tab.name }}</text>
                <view v-if="state.currentTab === index" class="tab-line"></view>
              </view>
            </view>
          </view>
        </view>

        <view class="block_7 flex-col">
          <view
            class="order-card flex-col"
            :class="{
              'order-card-multi': isMultiItems(item),
            }"
            v-for="item in state.pagination.list"
            :key="item.id || item.bizId || item.orderId || item._orderNo"
          >
            <view class="order-head flex-row justify-between" :class="{ 'order-head-multi': isMultiItems(item) }">
              <view class="order-no-wrap">
                <text class="order-no">订单编号：{{ item._orderNo || item.bizId || '' }}</text>
              </view>
              <text class="order-status" :class="commissionStatusClass(item)">{{ commissionStatusText(item) }}</text>
            </view>

            <view class="order-divider"></view>
            <view v-if="!isMultiItems(item)" class="order-body flex-row justify-between">
              <image class="box_12 flex-col" :src="sheep.$url.cdn(item._picUrl || '')" mode="aspectFill" />
              <view class="group_26 flex-col">
                <view class="text-group_2 flex-col">
                  <text class="text_7 ss-ellipsis-1">{{ item._spuName || item.title || '' }}</text>
                  <text class="text_8">下单时间：{{ formatDateTime(item._orderCreateTime || item.createTime) }}</text>
                  <text class="text_9">付款金额：¥{{ fen2yuan(item._payPrice) }}</text>
                </view>
                <view class="order-meta flex-row justify-between">
                  <text class="order-qty">数量*{{ item._totalCount || item._count || 1 }}</text>
                  <text class="order-earn">预估可赚{{ toYuanInt(item.brokeragePrice ?? item.price) }}元</text>
                </view>
              </view>
            </view>

            <view v-else class="multi-body flex-col">
              <view
                class="multi-item-row flex-row justify-between"
                v-for="(goods, idx) in item._itemsDisplay"
                :key="goods.id || goods.spuId || goods.skuId || idx"
                :class="{ 'multi-item-fade': shouldGrayGoods(goods) }"
              >
                <image class="box_12 flex-col" :src="sheep.$url.cdn(goods.picUrl || '')" mode="aspectFill" />
                <view class="group_26 flex-col">
                  <text class="text_7 ss-ellipsis-1">{{ goods.spuName || '' }}</text>
                  <text class="text_8">商品原价：¥{{ fen2yuan(goods.originalPrice) }}</text>
                  <text class="text_8">实付金额：¥{{ fen2yuan(goods.payPrice) }}</text>
                  <view class="order-meta flex-row justify-between">
                    <text class="order-qty">数量*{{ goods.count || 1 }}</text>
                    <text class="order-earn">预估可赚{{ toYuanInt(goods.brokeragePrice) }}元</text>
                  </view>
                </view>
              </view>
              <view class="multi-footer flex-col">
                <text class="multi-time">下单时间：{{ formatDateTime(item._orderCreateTime || item.createTime) }}</text>
                <text class="multi-total-earn">预估总收益可赚{{ toYuanInt(item.brokeragePrice ?? item.price) }}元</text>
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
  import { reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
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
      value: 10,
    },
    {
      name: '已结算',
      value: 30,
    },
    {
      name: '已取消',
      value: 40,
    },
  ];

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

  function isMultiItems(item) {
    return Array.isArray(item?.items) && item.items.length >= 2;
  }

  function formatDateTime(t) {
    if (!t) return '';
    return sheep.$helper.timeFormat(t, 'yyyy-mm-dd hh:MM:ss');
  }

  function shouldGrayGoods(goods) {
    return Number(goods?.afterSaleStatus || 0) > 0;
  }

  function statusText(item) {
    if (item?.status === 0) return '待支付';
    if (item?.status === 10) return '待发货';
    if (item?.status === 20) return '已发货';
    if (item?.status === 30) return '已完成';
    if (item?.status === 40) return '已取消';
    return '';
  }

  function commissionStatusText(item) {
    if (item?.status === 40) return '已取消';
    if (item?.status === 30) return '已结算';
    return '待结算';
  }

  function commissionStatusClass(item) {
    if (item?.status === 40) return 'status-cancel';
    if (item?.status === 30) return 'status-settled';
    return 'status-pending';
  }

  function statusTagClass(item) {
    if (item?.status === 0) return 'tag-pending';
    if (item?.status === 10) return 'tag-settled';
    if (item?.status === 20) return 'tag-cancel';
    return 'tag-pending';
  }

  function statusTextClass(item) {
    if (item?.status === 0) return 'text-pending';
    if (item?.status === 10) return 'text-settled';
    if (item?.status === 20) return 'text-cancel';
    return 'text-pending';
  }

  function normalizeOrderItem(item) {
    const data = item || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const totalBrokerage = Number(data.brokeragePrice ?? data.price ?? 0);
    const countSum = items.reduce((sum, it) => sum + Number(it?.count || 0), 0);
    const safeCountSum = countSum || 1;
    const normalizedItems = items.map((it) => {
      const count = Number(it?.count || 0);
      const ratio = count > 0 ? count / safeCountSum : 1 / safeCountSum;
      const lineBrokerage = Number(it?.brokeragePrice ?? Math.floor(totalBrokerage * ratio));
      return {
        ...it,
        spuName: it?.spuName || it?.name || '',
        picUrl: it?.picUrl || it?.image || '',
        originalPrice: Number(it?.originalPrice ?? it?.price ?? it?.spuPrice ?? 0),
        payPrice: Number(it?.payPrice ?? it?.orderPayPrice ?? it?.price ?? 0),
        count,
        brokeragePrice: lineBrokerage,
      };
    });
    const orderNo = data.orderNo || data.no || data._orderNo || '';
    const payPrice = Number(
      data.payPrice ?? data.orderPayPrice ?? data._payPrice ?? data.payAmount ?? 0,
    );
    const orderCreateTime = data.orderCreateTime || data.orderTime || data._orderCreateTime || data.createTime;
    const firstItem = normalizedItems[0] || {};
    const spuName = firstItem.spuName || data.spuName || data.productName || data._spuName || data.title || '';
    const picUrl = firstItem.picUrl || data.picUrl || data.productPicUrl || data._picUrl || '';
    const count = Number(firstItem.count ?? data.count ?? data.productCount ?? data._count ?? 0);
    const totalCount = normalizedItems.reduce((sum, it) => sum + Number(it?.count || 0), 0);
    return {
      ...data,
      _orderNo: orderNo || data.bizId || '',
      _payPrice: payPrice,
      _orderCreateTime: orderCreateTime,
      _spuName: spuName,
      _picUrl: picUrl,
      _count: count,
      _totalCount: totalCount,
      _itemsDisplay: normalizedItems,
    };
  }

  async function getOrderList() {
    state.loadStatus = 'loading';
    const tab = tabMaps[state.currentTab] || tabMaps[0];
    const queryParams = {
      pageSize: state.pagination.pageSize,
      pageNo: state.pagination.pageNo,
      status: tab.value,
    };
    if (tab.value === undefined) {
      delete queryParams.status;
    }
    const { code, data } = await BrokerageApi.getBrokerageRecordOrderPage(queryParams);
    if (code !== 0) {
      state.loadStatus = 'more';
      return;
    }
    const list = Array.isArray(data.list) ? data.list : [];
    const normalized = list.map(normalizeOrderItem);
    state.pagination.list = concat(state.pagination.list, normalized);
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

  .tab-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
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

  .tab-line {
    margin-top: 18rpx;
    background-color: rgba(30, 63, 28, 1);
    border-radius: 1998rpx;
    width: 32rpx;
    height: 6rpx;
  }

  .block_7 {
    width: 686rpx;
    margin: 24rpx 25rpx 0 39rpx;
    padding-bottom: 40rpx;
  }

  .order-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    position: relative;
    width: 686rpx;
    min-height: 320rpx;
    padding: 62rpx 25rpx 24rpx 21rpx;
    margin-bottom: 24rpx;
    box-sizing: border-box;
  }

  .order-card-multi {
    padding-top: 15rpx;
    padding-bottom: 20rpx;
  }

  .order-head {
    position: absolute;
    left: 21rpx;
    top: 15rpx;
    width: 641rpx;
  }

  .order-card-multi .order-head {
    position: relative;
    left: 0;
    top: 0;
    width: 641rpx;
    margin-bottom: 12rpx;
  }

  .order-no {
    overflow-wrap: break-word;
    color: #87919D;
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
  }

  .order-no-wrap {
    flex: 1;
    min-width: 0;
  }

  .order-status {
    overflow-wrap: break-word;
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: right;
    white-space: nowrap;
    line-height: 33rpx;
  }

  .status-pending {
    color: rgba(245, 63, 63, 1);
  }

  .status-cancel {
    color: rgba(157, 156, 150, 1);
  }

  .status-settled {
    color: rgba(67, 212, 12, 1);
  }

  .order-divider {
    border-bottom: 1rpx solid rgba(151, 151, 151, 0.2);
  }

  .order-body {
    width: 640rpx;
    margin-top: 23rpx;
  }

  .multi-body {
    margin-top: 23rpx;
    width: 640rpx;
  }

  .multi-item-row {
    width: 640rpx;
    margin-bottom: 18rpx;
  }

  .multi-item-fade {
    opacity: 0.4;
  }

  .multi-footer {
    width: 640rpx;
    align-items: flex-end;
  }

  .multi-time {
    overflow-wrap: break-word;
    color: rgba(135, 145, 157, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: right;
    white-space: nowrap;
    line-height: 33rpx;
    align-self: flex-end;
  }

  .multi-total-earn {
    overflow-wrap: break-word;
    color: rgba(248, 99, 6, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 400;
    text-align: right;
    white-space: nowrap;
    line-height: 33rpx;
    align-self: flex-end;
  }

  .box_12 {
    border-radius: 20rpx;
    width: 210rpx;
    height: 210rpx;
    background-color: rgba(248, 249, 243, 1);
  }

  .group_26 {
    width: 406rpx;
    margin: 7rpx 0 7rpx 0;
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
    margin-top: 20rpx;
  }

  .order-meta {
    width: 406rpx;
    margin-top: 18rpx;
  }

  .order-qty {
    overflow-wrap: break-word;
    color: rgba(135, 145, 157, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
  }

  .order-earn {
    overflow-wrap: break-word;
    color: rgba(248, 99, 6, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
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
