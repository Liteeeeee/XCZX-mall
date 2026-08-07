<!-- 搜索界面 -->
<template>
  <s-layout :bgStyle="{ color: '#fff' }" navbar="clear">
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
          class="nav-bar-inner ss-flex ss-col-center"
          :style="{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            height: '100%',
            left: '0',
            width: '100%',
            paddingRight: '24rpx',
            boxSizing: 'border-box',
          }"
        >
          <view class="left-back ss-flex ss-col-center" @tap="onBack">
            <uni-icons type="left" size="22" color="#000" class="ss-m-l-20"></uni-icons>
          </view>
          <text class="nav-title ss-m-l-10">搜索</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

    <scroll-view
      class="result-scroll"
      scroll-y
      :show-scrollbar="false"
      :style="{ height: bodyHeight + 'px' }"
      :lower-threshold="80"
      @scrolltolower="onLoadMore"
    >
      <view class="page-body">
        <!-- ★ 搜索框挪到页面内部（顶部导航栏里只放「搜索」标题） -->
        <view class="search-block">
          <view class="search-wrap-inner">
            <view class="search-inner ss-flex ss-col-center">
              <uni-icons
                type="search"
                size="16"
                color="rgba(157, 156, 150, 1)"
                class="search-icon"
              />
              <input
                v-model="state.keyword"
                class="search-input"
                confirm-type="search"
                :focus="state.autoFocus"
                :placeholder="state.hasSearched ? '' : '搜索您想要的商品'"
                placeholder-class="search-placeholder"
                @input="onInputKeyword"
                @confirm="onSearch(state.keyword)"
              />
              <view v-if="state.keyword" class="search-clear" @tap="onClearKeyword">
                <uni-icons type="clear" size="14" color="rgba(157, 156, 150, 1)"></uni-icons>
              </view>
            </view>
          </view>
          <view class="search-action" @tap="onSearch(state.keyword)">搜索</view>
        </view>

        <view v-if="!state.hasSearched" class="before-search">
          <view class="ss-flex ss-row-between ss-col-center ss-m-t-16">
            <view class="history-title">搜索历史</view>
            <button class="clean-history ss-reset-button" @tap="onDelete">清除搜索历史</button>
          </view>
          <view class="ss-flex ss-col-center ss-row-left ss-flex-wrap ss-m-t-16">
            <button
              class="history-btn ss-reset-button"
              @tap="onSearch(item)"
              v-for="(item, index) in state.historyList"
              :key="index"
            >
              {{ item }}
            </button>
          </view>
        </view>

        <template v-else>
          <view class="result-meta ss-m-t-20 ss-m-b-16" v-if="state.total > 0">
            <text class="result-count">共找到 {{ state.total }} 件商品</text>
          </view>

          <view class="goods-grid" v-if="state.list.length > 0">
            <view
              class="goods-box"
              v-for="(item, index) in state.list"
              :key="item.id || 's_' + index"
              @tap="onItemTap(item)"
            >
              <image class="goods-img" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFill" />
              <view class="goods-content">
                <view class="goods-title ss-line-2">{{ item.name }}</view>
                <view class="goods-intro ss-line-1" v-if="item.introduction">
                  {{ item.introduction }}
                </view>
                <view class="goods-foot ss-flex ss-row-between ss-col-end">
                  <view class="price-wrap">
                    <text class="price-sym">¥</text>
                    <text class="price-num">{{ priceText(item) }}</text>
                  </view>
                  <view class="sold-count" v-if="soldText(item)">
                    {{ soldText(item) }}
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="load-tip ss-m-t-20 ss-m-b-40" v-if="state.loading">
            <text>加载中...</text>
          </view>
          <view
            class="load-tip ss-m-t-20 ss-m-b-40"
            v-else-if="state.list.length > 0 && !state.hasMore"
          >
            <text>已经到底啦~</text>
          </view>
          <view class="empty-state" v-else-if="state.list.length === 0 && !state.loading">
            <view class="empty-illu" :class="{ 'empty-illu-ill': true }"></view>
            <text class="empty-title">未找到相关商品</text>
            <text class="empty-sub">换个关键字试试，或返回浏览其他商品</text>
            <view class="empty-actions ss-flex ss-col-center">
              <view class="empty-btn" @tap="onClearAndRefocus">重新搜索</view>
              <view class="empty-btn empty-btn-ghost" @tap="onBackToCategory">返回分类</view>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
  </s-layout>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import sheep from '@/sheep';
  import { onLoad, onReady } from '@dcloudio/uni-app';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import SpuApi from '@/sheep/api/product/spu';

  const PAGE_SIZE = 20;

  const { safeArea } = sheep.$platform.device;
  const tabbarOffset = 0;
  const pageHeight = computed(() =>
    Math.max(
      0,
      (Number(safeArea?.height) || Number(uni.getSystemInfoSync().windowHeight) || 667) -
        tabbarOffset,
    ),
  );
  const bodyHeight = computed(() =>
    Math.max(0, pageHeight.value - Number(sheep.$platform.navbar || 0)),
  );

  const state = reactive({
    historyList: [],
    keyword: '',
    autoFocus: false,
    hasSearched: false,
    list: [],
    total: 0,
    pageNo: 1,
    hasMore: false,
    loading: false,
  });

  function onBack() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
    if (pages && pages.length > 1) {
      sheep.$router.back();
    } else {
      sheep.$router.go('/pages/index/category');
    }
  }

  function onClearKeyword() {
    state.keyword = '';
  }

  function onClearAndRefocus() {
    state.keyword = '';
    state.hasSearched = false;
    state.list = [];
    state.total = 0;
    state.hasMore = false;
    state.pageNo = 1;
    state.autoFocus = true;
  }

  function onBackToCategory() {
    sheep.$router.go('/pages/index/category');
  }

  function onInputKeyword(e) {
    const v = typeof e === 'object' ? e?.value ?? e?.detail?.value : e;
    state.keyword = typeof v === 'string' ? v : '';
  }

  function saveSearchHistory(keyword) {
    const kw = (keyword || '').trim();
    if (!kw) return;
    if (state.historyList.includes(kw)) {
      state.historyList.splice(state.historyList.indexOf(kw), 1);
    }
    state.historyList.unshift(kw);
    if (state.historyList.length >= 10) {
      state.historyList.length = 10;
    }
    uni.setStorageSync('searchHistory', state.historyList);
  }

  async function onSearch(keyword) {
    const kw = (typeof keyword === 'string' ? keyword : state.keyword || '').trim();
    if (!kw) {
      uni.showToast({ title: '请输入关键字', icon: 'none' });
      return;
    }
    state.keyword = kw;
    saveSearchHistory(kw);
    state.hasSearched = true;
    state.pageNo = 1;
    state.list = [];
    state.total = 0;
    state.hasMore = false;
    await fetchPage(true);
  }

  async function onLoadMore() {
    if (state.loading) return;
    if (!state.hasMore) return;
    state.pageNo += 1;
    await fetchPage(false);
  }

  async function fetchPage(reset) {
    if (state.loading) return;
    state.loading = true;
    try {
      const res = await SpuApi.getSpuPage({
        keyword: state.keyword,
        pageNo: state.pageNo,
        pageSize: PAGE_SIZE,
      });
      if (!res || res.code !== 0) return;
      const data = res.data || {};
      const list = Array.isArray(data.list) ? data.list : [];
      const total = Number(data.total || 0);
      state.total = total;
      if (reset) {
        state.list = list;
      } else {
        state.list = state.list.concat(list);
      }
      state.hasMore = state.list.length < total && list.length > 0;
    } finally {
      state.loading = false;
    }
  }

  function onItemTap(item) {
    if (!item) return;
    const id = Number(item.id || item.spuId || 0);
    if (!id) return;
    sheep.$router.go('/pages/goods/index', { id });
  }

  function priceText(item) {
    const raw = item?.price;
    if (raw === undefined || raw === null || raw === '') return '';
    const n = Number(raw);
    if (!Number.isFinite(n)) return '';
    const text = fen2yuan(n);
    return text;
  }

  function soldText(item) {
    const raw = item?.salesCount ?? item?.soldCount;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return '';
    return `已售${n}`;
  }

  function onDelete() {
    uni.showModal({
      title: '提示',
      content: '确认清除搜索历史吗？',
      success: function (res) {
        if (res.confirm) {
          state.historyList = [];
          uni.removeStorageSync('searchHistory');
        }
      },
    });
  }

  onLoad((options) => {
    state.historyList = uni.getStorageSync('searchHistory') || [];
    const pre = (options?.keyword || options?.kw || '').trim();
    if (pre) {
      state.keyword = pre;
      onSearch(pre);
    }
  });

  onReady(() => {
    setTimeout(() => {
      state.autoFocus = true;
    }, 80);
  });
</script>

<style lang="scss" scoped>
  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 1000;
    background-color: #fff;
  }

  .nav-title {
    font-size: 36rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    color: #000000;
  }

  .result-scroll {
    width: 100%;
    background: #fff;
  }

  .page-body {
    padding: 0 24rpx;
    min-height: 100%;
    box-sizing: border-box;
    background: #fff;
  }

  /* ★ 页面内部搜索块（搜索框 + 搜索按钮） */
  .search-block {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-top: 16rpx;
  }

  .search-wrap-inner {
    flex: 1;
    min-width: 0;
    background: rgba(157, 156, 150, 0.1);
    border-radius: 20rpx;
    padding: 18rpx 28rpx 17rpx 28rpx;
    box-sizing: border-box;
  }

  .search-inner {
    height: 36rpx;
  }

  .search-icon {
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    margin-left: 14rpx;
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    line-height: 33rpx;
    color: rgba(61, 61, 60, 1);
    height: 36rpx;
    min-height: 36rpx;
  }

  .search-clear {
    flex-shrink: 0;
    width: 32rpx;
    height: 32rpx;
    margin-left: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-action {
    flex-shrink: 0;
    margin-left: 20rpx;
    font-size: 28rpx;
    color: rgba(61, 61, 60, 1);
    font-weight: 500;
    line-height: 36rpx;
    padding: 18rpx 0 17rpx 0;
  }

  :deep() {
    .search-placeholder {
      color: rgba(157, 156, 150, 1);
    }
  }

  .before-search {
    background: #fff;
    min-height: 100%;
  }

  .history-title {
    font-weight: bold;
    color: #333333;
    font-size: 30rpx;
  }

  .clean-history {
    font-weight: 500;
    color: #999999;
    font-size: 28rpx;
  }

  .history-btn {
    padding: 0 38rpx;
    height: 60rpx;
    background: #f5f6f8;
    border-radius: 30rpx;
    font-size: 28rpx;
    color: #333333;
    max-width: 690rpx;
    margin: 0 20rpx 20rpx 0;
  }

  .result-meta {
    .result-count {
      font-size: 26rpx;
      color: #999;
    }
  }

  .goods-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-content: flex-start;
  }

  .goods-box {
    width: calc((100% - 20rpx) / 2);
    margin-bottom: 24rpx;
    background: #fff;
    border-radius: 12rpx;
    overflow: hidden;
    box-shadow: 0px 0px 20rpx 4rpx rgba(199, 199, 199, 0.18);

    .goods-img {
      width: 100%;
      height: 340rpx;
      display: block;
      background: #f6f7f9;
    }

    .goods-content {
      padding: 16rpx 18rpx 20rpx 18rpx;
    }

    .goods-title {
      font-size: 26rpx;
      font-weight: 600;
      color: #222;
      line-height: 36rpx;
      min-height: 72rpx;
    }

    .goods-intro {
      margin-top: 6rpx;
      font-size: 22rpx;
      color: #999;
      line-height: 32rpx;
    }

    .goods-foot {
      margin-top: 14rpx;
    }

    .price-wrap {
      color: #e1212b;
      display: flex;
      align-items: baseline;
      .price-sym {
        font-size: 22rpx;
        font-weight: 600;
        margin-right: 2rpx;
      }
      .price-num {
        font-size: 32rpx;
        font-weight: 700;
        font-family: OPPOSANS;
      }
    }

    .sold-count {
      font-size: 22rpx;
      color: #aaa;
    }

    &:nth-child(2n + 1) {
      margin-right: 20rpx;
    }
  }

  .load-tip {
    width: 100%;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }

  /* ★ 空态：未找到相关商品 */
  .empty-state {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0 80rpx 0;
    box-sizing: border-box;
  }

  .empty-illu {
    width: 220rpx;
    height: 220rpx;
    border-radius: 50%;
    background: rgba(157, 156, 150, 0.12);
    position: relative;
    margin-bottom: 32rpx;
  }

  .empty-illu::before,
  .empty-illu::after {
    content: '';
    position: absolute;
    background: #ffffff;
    border-radius: 50%;
  }

  .empty-illu::before {
    width: 80rpx;
    height: 80rpx;
    left: 50%;
    top: 38rpx;
    transform: translateX(-50%);
    box-shadow: 0 0 0 6rpx rgba(157, 156, 150, 0.2);
  }

  .empty-illu::after {
    width: 28rpx;
    height: 28rpx;
    left: 50%;
    top: 68rpx;
    transform: translateX(-50%);
    background: rgba(157, 156, 150, 0.4);
  }

  .empty-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333333;
    line-height: 42rpx;
    margin-bottom: 12rpx;
  }

  .empty-sub {
    font-size: 24rpx;
    color: #999999;
    line-height: 36rpx;
    margin-bottom: 40rpx;
    text-align: center;
    padding: 0 48rpx;
  }

  .empty-actions {
    gap: 20rpx;
  }

  .empty-btn {
    min-width: 220rpx;
    height: 72rpx;
    line-height: 72rpx;
    text-align: center;
    padding: 0 36rpx;
    border-radius: 36rpx;
    font-size: 28rpx;
    color: #ffffff;
    background: #1e3f1c;
    font-weight: 500;
  }

  .empty-btn-ghost {
    background: #ffffff;
    color: #1e3f1c;
    border: 2rpx solid #1e3f1c;
  }
</style>
