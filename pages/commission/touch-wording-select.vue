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
            <text class="nav-title">选择话术</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view class="list-card">
          <template v-if="state.pagination.list.length">
            <view
              v-for="(item, index) in state.pagination.list"
              :key="item._key"
              class="row"
              :class="{ 'with-divider': index !== state.pagination.list.length - 1 }"
              @tap="selectItem(item)"
            >
              <view class="row-main">
                <text class="row-text">{{ item.content }}</text>
              </view>
              <view class="row-right">
                <view v-if="isSelected(item)" class="selected-dot"></view>
                <uni-icons type="right" size="16" color="#B0B0B0" />
              </view>
            </view>
          </template>

          <s-empty
            v-else-if="state.initialized && !state.loading"
            text="暂无话术"
            :icon="sheep.$url.static('/static/data-empty.webp')"
          />
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
  import { computed, reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import WordingApi from '@/sheep/api/member/wording';

  const STORAGE_CATEGORY = 'commission_touch_selected_category';
  const STORAGE_WORDING = 'commission_touch_selected_wording';

  const state = reactive({
    loading: false,
    initialized: false,
    loadStatus: '',
    category: null,
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
  });

  const selectedWordingId = computed(() => {
    const current = uni.getStorageSync(STORAGE_WORDING);
    return current?.id ? String(current.id) : '';
  });

  function normalizeList(list) {
    return (Array.isArray(list) ? list : [])
      .map((item, index) => {
        const content =
          item?.smsTemplate?.content ||
          item?.content ||
          item?.wordingContent ||
          item?.templateContent ||
          item?.template ||
          item?.body ||
          item?.text ||
          '';
        return {
          ...item,
          content: String(content || '').trim(),
          _key: `touch-wording-${item?.id || item?.code || index}`,
        };
      })
      .filter((item) => item.content);
  }

  function isSelected(item) {
    return selectedWordingId.value && String(item?.id || '') === selectedWordingId.value;
  }

  function resetPagination() {
    state.pagination.list = [];
    state.pagination.total = 0;
    state.pagination.pageNo = 1;
    state.loadStatus = '';
  }

  async function loadList() {
    if (state.loading) return;
    if (!state.category?.code) {
      state.initialized = true;
      return;
    }
    state.loading = true;
    state.loadStatus = 'loading';
    const res = await WordingApi.getWordingPage(
      {
        pageNo: state.pagination.pageNo,
        pageSize: state.pagination.pageSize,
        categoryCode: state.category.code,
        typeCode: 'SMS',
      },
      { showLoading: state.pagination.pageNo === 1 },
    );
    state.loading = false;
    state.initialized = true;
    if (res?.code !== 0) {
      state.loadStatus = state.pagination.list.length ? 'more' : '';
      return;
    }
    const rawList = Array.isArray(res?.data?.list)
      ? res.data.list
      : Array.isArray(res?.data?.records)
      ? res.data.records
      : Array.isArray(res?.data)
      ? res.data
      : [];
    const mergedList = normalizeList(rawList);
    state.pagination.list = concat(state.pagination.list, mergedList);
    state.pagination.total = Number(
      res?.data?.total || res?.data?.totalCount || state.pagination.list.length || 0,
    );
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function loadMore() {
    if (state.loading || state.loadStatus === 'noMore') return;
    state.pagination.pageNo += 1;
    loadList();
  }

  function selectItem(item) {
    if (!item) return;
    uni.setStorageSync(STORAGE_WORDING, item);
    sheep.$router.back();
  }

  onLoad(() => {
    const category = uni.getStorageSync(STORAGE_CATEGORY);
    state.category = category && typeof category === 'object' ? category : null;
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

  .list-card {
    padding: 0 24rpx;
    border-radius: 24rpx;
    background: #ffffff;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.05);
  }

  .row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 26rpx 0;
    gap: 18rpx;
  }

  .with-divider {
    border-bottom: 2rpx solid rgba(24, 37, 19, 0.08);
  }

  .row-main {
    flex: 1;
    min-width: 0;
  }

  .row-text {
    color: #4a4a4a;
    font-size: 30rpx;
    line-height: 44rpx;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .row-right {
    display: flex;
    align-items: center;
    gap: 10rpx;
    flex-shrink: 0;
  }

  .selected-dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 7rpx;
    background: #1e3f1c;
  }
</style>
