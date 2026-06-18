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
      <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

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
          <image class="goods-image" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFill" />
          <view class="goods-main">
            <text class="goods-title">{{ item.name }}</text>
            <text class="goods-desc">{{ item.introduction || '优选好物' }}</text>
            <view class="goods-price">
              <text class="goods-price-unit">￥</text>
              <text class="goods-price-value">{{ fen2yuan(item.price || 0) }}</text>
            </view>
          </view>
        </view>

        <s-empty
          v-if="state.initialized && !state.pagination.list.length"
          text="暂无商品"
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
  import { concat, cloneDeep } from 'lodash-es';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import SpuApi from '@/sheep/api/product/spu';

  const STORAGE_PRODUCT = 'commission_touch_selected_product';

  const state = reactive({
    initialized: false,
    selecting: false,
    selectedSpuId: 0,
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
    state.selectedSpuId = Number(state.selectedProduct?.spuId || 0);
  }

  function isSelected(item) {
    return Number(item?.id || 0) === state.selectedSpuId;
  }

  function buildSelectedProduct(spu, detail) {
    const skuList = Array.isArray(detail?.skus) ? detail.skus : [];
    const selectedSku =
      skuList.find((sku) => Number(sku?.stock || 0) > 0) || skuList[0] || {};
    const skuText = Array.isArray(selectedSku?.properties)
      ? selectedSku.properties.map((property) => property.valueName).filter(Boolean).join('，')
      : '';
    return {
      spuId: Number(spu?.id || detail?.id || 0),
      skuId: Number(selectedSku?.id || 0),
      picUrl: selectedSku?.picUrl || spu?.picUrl || detail?.picUrl || '',
      name: spu?.name || detail?.name || '',
      introduction: spu?.introduction || detail?.introduction || '',
      price: selectedSku?.promotionPrice || selectedSku?.price || spu?.price || detail?.price || 0,
      skuText,
    };
  }

  async function selectItem(item) {
    if (state.selecting) return;
    state.selecting = true;
    const res = await SpuApi.getSpuDetail(item.id);
    state.selecting = false;
    if (res?.code !== 0 || !res?.data) return;
    const selectedProduct = buildSelectedProduct(item, cloneDeep(res.data));
    if (!selectedProduct.skuId) {
      uni.showToast({
        title: '商品规格缺失',
        icon: 'none',
      });
      return;
    }
    state.selectedSpuId = Number(item.id);
    state.selectedProduct = selectedProduct;
  }

  async function loadList() {
    state.loadStatus = 'loading';
    const res = await SpuApi.getSpuPage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
    });
    state.initialized = true;
    if (res?.code !== 0) {
      state.loadStatus = state.pagination.list.length ? 'more' : '';
      return;
    }
    const list = Array.isArray(res?.data?.list) ? res.data.list : [];
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

  .goods-price {
    margin-top: 18rpx;
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

  .footer-placeholder {
    height: 150rpx;
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
