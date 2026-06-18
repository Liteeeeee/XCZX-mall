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
            <text class="nav-title">选择商品</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view
          v-for="item in state.pagination.list"
          :key="item.id"
          class="goods-row"
          @tap="selectItem(item)"
        >
          <view class="check-box" :class="{ checked: isSelected(item) }">
            <text v-if="isSelected(item)" class="check-mark">✓</text>
          </view>
          <image class="goods-image" :src="sheep.$url.cdn(item.spuPicUrl)" mode="aspectFill" />
          <view class="goods-main">
            <text class="goods-title">{{ item.spuName }}</text>
            <text class="goods-desc">{{ formatItemName(item) }}</text>
            <view class="goods-bottom">
              <view class="goods-price">
                <text class="goods-price-unit">￥</text>
                <text class="goods-price-value">{{ fen2yuan(item.price || 0) }}</text>
              </view>
              <view v-if="item.brokerageText" class="goods-brokerage-tag">
                <text class="goods-brokerage-text">{{ item.brokerageText }}</text>
              </view>
            </view>
          </view>
        </view>

        <s-empty
          v-if="state.initialized && !state.pagination.list.length"
          text="暂无推广商品"
          :icon="sheep.$url.static('/static/goods-empty.webp')"
        />

        <uni-load-more
          v-if="state.pagination.total > 0"
          :auto="true"
          :status="state.loadStatus"
          :content-text="{ contentdown: '上拉加载更多' }"
          @clickLoadMore="loadMore"
        />
      </view>

      <view class="footer-placeholder"></view>
      <view class="footer">
        <view class="footer-btn" @tap="confirmSelect">
          <text class="footer-btn-text">确定选择</text>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import { fen2yuan, fen2yuanSimple } from '@/sheep/hooks/useGoods';
  import SpuApi from '@/sheep/api/product/spu';
  import BrokerageApi from '@/sheep/api/trade/brokerage';

  const STORAGE_PRODUCT = 'commission_touch_selected_product';

  const state = reactive({
    initialized: false,
    selectedSkuId: 0,
    selectedProduct: null,
    loadStatus: '',
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
  });

  function restoreSelected() {
    const current = uni.getStorageSync(STORAGE_PRODUCT);
    state.selectedProduct = current && typeof current === 'object' ? current : null;
    state.selectedSkuId = Number(state.selectedProduct?.skuId || 0);
  }

  function isSelected(item) {
    return Number(item?.id || 0) === state.selectedSkuId;
  }

  function formatItemName(item) {
    const raw = item?.properties;
    let list = raw;
    if (typeof raw === 'string') {
      try {
        list = JSON.parse(raw);
      } catch (e) {
        list = raw;
      }
    }
    if (Array.isArray(list) && list.length) {
      const first = list[0] || {};
      const propertyName = String(first.propertyName ?? first.name ?? '').trim();
      const valueName = String(first.valueName ?? first.value ?? '').trim();
      if (propertyName === '默认' && valueName === '默认') return '默认';
      const text = `${propertyName}${valueName}`.trim();
      if (text) return text;
    }
    return item?.name || '';
  }

  function buildSelectedProduct(item) {
    return {
      spuId: Number(item?.spuId || 0),
      skuId: Number(item?.id || 0),
      picUrl: item?.spuPicUrl || '',
      name: item?.spuName || '',
      introduction: item?.spuName || '',
      price: item?.price || 0,
      skuText: formatItemName(item),
    };
  }

  function buildBrokerageText(item) {
    if (item?.brokeragePercent !== undefined && Number(item.brokeragePercent) > 0) {
      const commissionFen = (Number(item.price || 0) * Number(item.brokeragePercent || 0)) / 100;
      return `推广可赚${fen2yuanSimple(commissionFen)}元`;
    }
    if (item?.brokerageMinPrice === undefined) {
      return '推广可赚计算中';
    }
    if (Number(item.brokerageMinPrice || 0) === Number(item.brokerageMaxPrice || 0)) {
      return `推广可赚${fen2yuanSimple(item.brokerageMinPrice)}元`;
    }
    return `推广可赚${fen2yuanSimple(item.brokerageMinPrice)}~${fen2yuanSimple(
      item.brokerageMaxPrice,
    )}元`;
  }

  async function selectItem(item) {
    const selectedProduct = buildSelectedProduct(item);
    if (!selectedProduct.skuId) return;
    state.selectedSkuId = Number(item.id);
    state.selectedProduct = selectedProduct;
  }

  async function loadList() {
    state.loadStatus = 'loading';
    const res = await SpuApi.getSkuPage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
      brokerageEnabled: true,
    });
    state.initialized = true;
    if (res?.code !== 0) {
      state.loadStatus = state.pagination.list.length ? 'more' : '';
      return;
    }
    const list = Array.isArray(res?.data?.list) ? res.data.list : [];
    list.forEach((item) => {
      item.brokerageText = buildBrokerageText(item);
    });
    await Promise.all(
      list.map(async (item) => {
        try {
          const r = await BrokerageApi.getProductBrokeragePrice(item.spuId);
          item.brokerageMinPrice = r?.data?.brokerageMinPrice;
          item.brokerageMaxPrice = r?.data?.brokerageMaxPrice;
          item.brokerageText = buildBrokerageText(item);
        } catch (e) {}
      }),
    );
    state.pagination.list = concat(state.pagination.list, list);
    state.pagination.total = Number(res?.data?.total || 0);
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function loadMore() {
    if (state.loadStatus === 'noMore') return;
    state.pagination.pageNo += 1;
    loadList();
  }

  function confirmSelect() {
    if (!state.selectedProduct?.skuId) {
      uni.showToast({
        title: '请选择商品',
        icon: 'none',
      });
      return;
    }
    uni.setStorageSync(STORAGE_PRODUCT, state.selectedProduct);
    sheep.$router.back();
  }

  onLoad(() => {
    restoreSelected();
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

  .goods-row {
    display: flex;
    align-items: center;
    padding: 22rpx;
    border-radius: 22rpx;
    background: #fffffa;
    margin-bottom: 20rpx;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.04);
  }

  .check-box {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(206, 199, 189, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 18rpx;
    flex-shrink: 0;
    background: #fff;
  }

  .check-box.checked {
    background: #1e3f1c;
    border-color: #1e3f1c;
  }

  .check-mark {
    color: #fff;
    font-size: 26rpx;
    line-height: 26rpx;
  }

  .goods-image {
    width: 164rpx;
    height: 164rpx;
    border-radius: 12rpx;
    flex-shrink: 0;
    background: #f2f2f2;
  }

  .goods-main {
    min-width: 0;
    flex: 1;
    margin-left: 20rpx;
  }

  .goods-title {
    display: block;
    color: #2d2d2d;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 42rpx;
  }

  .goods-desc {
    display: block;
    margin-top: 8rpx;
    color: #9a9a9a;
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .goods-bottom {
    margin-top: 18rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .goods-price {
    color: #2d2d2d;
    display: flex;
    align-items: baseline;
  }

  .goods-price-unit {
    font-size: 26rpx;
    line-height: 32rpx;
  }

  .goods-price-value {
    font-size: 42rpx;
    font-weight: 600;
    line-height: 48rpx;
  }

  .goods-brokerage-tag {
    flex-shrink: 0;
    padding: 10rpx 18rpx;
    border-radius: 10rpx;
    border: 1px solid #fce7e0;
    background: #fff7f5;
  }

  .goods-brokerage-text {
    color: #f86306;
    font-size: 24rpx;
    font-weight: 500;
    line-height: 32rpx;
  }

  .footer-placeholder {
    height: 170rpx;
  }

  .footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    padding: 22rpx 24rpx calc(22rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    background: #f6f7f2;
  }

  .footer-btn {
    height: 100rpx;
    border-radius: 22rpx;
    background: #1e3f1c;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .footer-btn-text {
    color: #ffffff;
    font-size: 34rpx;
    font-weight: 600;
    line-height: 48rpx;
  }
</style>
