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
            <text class="nav-title">话术资源</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view v-if="state.categoryList.length" class="tabs-wrap">
          <su-tabs
            :list="state.categoryList"
            :current="state.currentTab"
            :scrollable="false"
            lineColor="#1E4D2B"
            :lineWidth="28"
            :activeStyle="{
              color: '#1E4D2B',
              fontSize: '32rpx',
              fontWeight: 600,
            }"
            :inactiveStyle="{
              color: '#2F2F2F',
              fontSize: '32rpx',
              fontWeight: 600,
            }"
            :itemStyle="{
              height: '90rpx',
            }"
            @change="onTabsChange"
          />
        </view>

        <view v-if="state.pagination.list.length" class="resource-list">
          <view
            v-for="item in state.pagination.list"
            :key="item._key"
            class="resource-card"
            @tap="handleCopy(item)"
          >
            <text class="resource-content">{{ item.content }}</text>
          </view>
        </view>

        <s-empty
          v-else-if="state.initialized && !state.loading"
          text="暂无话术资源"
          :icon="sheep.$url.static('/static/data-empty.webp')"
        />

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
  import { reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import WordingApi from '@/sheep/api/member/wording';

  const state = reactive({
    loading: false,
    initialized: false,
    currentTab: 0,
    loadStatus: '',
    categoryList: [],
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
  });

  function normalizeCategoryList(list) {
    return (Array.isArray(list) ? list : [])
      .map((item, index) => ({
        name: item?.name || item?.categoryName || item?.title || `分类${index + 1}`,
        code: item?.code || item?.categoryCode || item?.id || `${index}`,
      }))
      .filter((item) => item.code !== undefined && item.code !== null && item.name);
  }

  function normalizeWordingList(list) {
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
        const title =
          item?.name ||
          item?.title ||
          item?.wordingName ||
          item?.templateName ||
          item?.subject ||
          '';
        return {
          ...item,
          title: content && title !== content ? title : '',
          content: String(content || title || '').trim(),
          _key: `wording-${item?.id || item?.code || item?.wordingCode || index}`,
        };
      })
      .filter((item) => item.content);
  }

  function resetPagination() {
    state.pagination.list = [];
    state.pagination.total = 0;
    state.pagination.pageNo = 1;
    state.loadStatus = '';
  }

  function getCurrentCategory() {
    return state.categoryList[state.currentTab] || {};
  }

  async function loadCategoryList() {
    const res = await WordingApi.getWordingCategoryList({ showLoading: false });
    if (res?.code !== 0) {
      state.categoryList = [];
      return;
    }
    state.categoryList = normalizeCategoryList(res?.data);
  }

  async function loadList(reset = false) {
    if (state.loading) return;
    if (reset) {
      resetPagination();
    }
    if (!state.categoryList.length) {
      state.initialized = true;
      return;
    }
    state.loading = true;
    state.loadStatus = 'loading';
    const currentCategory = getCurrentCategory();
    const res = await WordingApi.getWordingPage(
      {
        pageNo: state.pagination.pageNo,
        pageSize: state.pagination.pageSize,
        categoryCode: currentCategory.code,
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
    const mergedList = normalizeWordingList(rawList);
    state.pagination.list = concat(state.pagination.list, mergedList);
    state.pagination.total = Number(
      res?.data?.total || res?.data?.totalCount || state.pagination.list.length || 0,
    );
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  async function loadPageData() {
    state.initialized = false;
    await loadCategoryList();
    await loadList(true);
  }

  function onTabsChange(e) {
    state.currentTab = e.index;
    loadList(true);
  }

  function loadMore() {
    if (state.loading || state.loadStatus === 'noMore') return;
    state.pagination.pageNo += 1;
    loadList();
  }

  function handleCopy(item = {}) {
    if (!item?.content) return;
    uni.setClipboardData({
      data: item.content,
      showToast: false,
      success: () => {
        uni.showToast({
          title: '已复制话术',
          icon: 'none',
        });
      },
    });
  }

  onLoad(() => {
    loadPageData();
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
    padding: 10rpx 24rpx 40rpx;
  }

  .tabs-wrap {
    margin-bottom: 18rpx;
    padding: 0 4rpx;
  }

  .resource-list {
    display: flex;
    flex-direction: column;
    gap: 18rpx;
  }

  .resource-card {
    padding: 28rpx 26rpx;
    border-radius: 24rpx;
    background: #ffffff;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.04);
  }

  .resource-title {
    display: block;
    margin-bottom: 12rpx;
    color: #303030;
    font-size: 28rpx;
    font-weight: 600;
    line-height: 40rpx;
  }

  .resource-content {
    color: #666666;
    font-size: 28rpx;
    line-height: 48rpx;
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
