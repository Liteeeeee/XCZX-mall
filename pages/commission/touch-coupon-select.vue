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
            <text class="nav-title">选择优惠券</text>
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
          class="coupon-item"
          @tap="toggleSelect(item)"
        >
          <s-coupon-list :data="item" type="coupon">
            <template #default>
              <view class="coupon-check" :class="{ 'coupon-check-on': isSelected(item) }">
                <image
                  v-if="isSelected(item)"
                  class="check-icon"
                  src="https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/confirmSelected.png"
                  mode="aspectFit"
                />
              </view>
            </template>
          </s-coupon-list>
        </view>

        <s-empty
          v-if="state.initialized && !state.pagination.list.length"
          text="暂无优惠券"
          :icon="sheep.$url.static('/static/coupon-empty.webp')"
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
  import CouponApi from '@/sheep/api/promotion/coupon';

  const STORAGE_COUPON = 'commission_touch_selected_coupon';

  const state = reactive({
    initialized: false,
    selectedId: 0,
    selectedItem: null,
    loadStatus: '',
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
  });

  function restoreSelected() {
    const current = uni.getStorageSync(STORAGE_COUPON);
    state.selectedItem = current && typeof current === 'object' ? current : null;
    state.selectedId = Number(state.selectedItem?.id || 0);
  }

  function isSelected(item) {
    return Number(item?.id || 0) === state.selectedId;
  }

  function toggleSelect(item) {
    const id = Number(item?.id || 0);
    if (!id) return;
    if (state.selectedId === id) {
      state.selectedId = 0;
      state.selectedItem = null;
      return;
    }
    state.selectedId = id;
    state.selectedItem = item;
  }

  async function loadList() {
    state.loadStatus = 'loading';
    const res = await CouponApi.getCouponTemplatePage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
      type: 2,
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
    if (!state.selectedItem?.id) {
      uni.showToast({
        title: '请选择优惠券',
        icon: 'none',
      });
      return;
    }
    uni.setStorageSync(STORAGE_COUPON, state.selectedItem);
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

  .coupon-item {
    margin-bottom: 24rpx;
  }

  .coupon-check {
    width: 36rpx;
    height: 36rpx;
    border: 2rpx solid rgba(206, 199, 189, 1);
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 1);
    margin-right: 24rpx;
    overflow: hidden;
    display: flex;
  }

  .coupon-check-on {
    border-color: transparent;
    background-color: transparent;
  }

  .check-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .footer-placeholder {
    height: 150rpx;
  }

  .footer {
    position: fixed;
    z-index: 999999;
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
