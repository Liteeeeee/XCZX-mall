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
            <text class="nav-title">选择触达类型</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view class="list-card">
          <view
            v-for="(item, index) in state.list"
            :key="item.code"
            class="list-row"
            :class="{ 'with-divider': index !== state.list.length - 1 }"
            @tap="selectItem(item)"
          >
            <text class="row-text">{{ item.name }}</text>
            <view class="row-right">
              <view v-if="isSelected(item)" class="selected-dot"></view>
              <uni-icons type="right" size="16" color="#B0B0B0" />
            </view>
          </view>
        </view>

        <s-empty
          v-if="!state.loading && !state.list.length"
          text="暂无触达类型"
          :icon="sheep.$url.static('/static/data-empty.webp')"
        />
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import WordingApi from '@/sheep/api/member/wording';

  const STORAGE_CATEGORY = 'commission_touch_selected_category';
  const STORAGE_WORDING = 'commission_touch_selected_wording';

  const state = reactive({
    loading: false,
    list: [],
  });

  const selectedCode = computed(() => {
    const current = uni.getStorageSync(STORAGE_CATEGORY);
    return current?.code ? String(current.code) : '';
  });

  function normalizeList(list) {
    return (Array.isArray(list) ? list : [])
      .map((item, index) => ({
        name: item?.name || item?.categoryName || item?.title || `分类${index + 1}`,
        code: item?.code || item?.categoryCode || item?.id || `${index}`,
      }))
      .filter((item) => item.code !== undefined && item.code !== null && item.name);
  }

  function isSelected(item) {
    return selectedCode.value && String(item.code) === selectedCode.value;
  }

  async function loadList() {
    if (state.loading) return;
    state.loading = true;
    const res = await WordingApi.getWordingCategoryList({ showLoading: true });
    state.loading = false;
    if (res?.code !== 0) {
      state.list = [];
      return;
    }
    state.list = normalizeList(res?.data);
  }

  function selectItem(item) {
    if (!item?.code) return;
    uni.setStorageSync(STORAGE_CATEGORY, item);
    uni.removeStorageSync(STORAGE_WORDING);
    sheep.$router.back();
  }

  onLoad(() => {
    loadList();
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

  .list-card {
    padding: 0 24rpx;
    border-radius: 24rpx;
    background: #ffffff;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.05);
  }

  .list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 26rpx 0;
  }

  .with-divider {
    border-bottom: 2rpx solid rgba(24, 37, 19, 0.08);
  }

  .row-text {
    color: #2d2d2d;
    font-size: 30rpx;
    font-weight: 500;
    line-height: 42rpx;
  }

  .row-right {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  .selected-dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 7rpx;
    background: #1e3f1c;
  }
</style>
