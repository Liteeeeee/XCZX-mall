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
            <text class="nav-title">一键触达</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view class="tips-card">
          <text class="tips-text">为防止频繁发送信息给客户带来困扰，限制每日发送10条。</text>
        </view>

        <view class="list-card">
          <template v-if="state.pagination.list.length">
            <view
              v-for="(item, index) in state.pagination.list"
              :key="item._key"
              class="customer-row"
              :class="{ 'with-divider': index !== state.pagination.list.length - 1 }"
              @tap="toggleSelect(item)"
            >
              <image class="avatar" :src="resolveAvatar(item)" mode="aspectFill" />
              <view class="customer-body">
                <view class="customer-main">
                  <text class="customer-name">{{
                    formatNickname(item?.nickname || item?.customerNickname || item?.userNickname)
                  }}</text>
                  <text class="meta-text">手机号：{{ formatMobile(item) }}</text>
                  <text class="meta-text">最后上线：{{ formatDate(getLastOnlineTime(item)) }}</text>
                </view>
                <view class="customer-side">
                  <view class="check-box" :class="{ checked: isSelected(item) }">
                    <text v-if="isSelected(item)" class="check-mark">✓</text>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <s-empty
            v-else-if="!state.loading"
            text="暂无客户"
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

      <view class="footer-placeholder"></view>
      <view class="footer">
        <view class="footer-btn" @tap="confirmSelect">
          <text class="footer-btn-text">选择客户</text>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import BrokerageApi from '@/sheep/api/trade/brokerage';

  const STORAGE_CUSTOMERS = 'commission_touch_selected_customers';

  const state = reactive({
    loading: false,
    loadStatus: '',
    selectedMap: {},
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
  });

  const selectedCount = computed(() => Object.keys(state.selectedMap).length);

  function getMemberId(item) {
    return Number(item?.memberId || item?.id || item?.userId || 0);
  }

  function resolveAvatar(item) {
    return sheep.$url.avatar(
      item?.avatar ||
        item?.userAvatar ||
        item?.memberAvatar ||
        item?.headImg ||
        item?.headUrl ||
        '',
    );
  }

  function formatNickname(name) {
    const text = String(name || '').trim();
    if (!text) return '未命名用户';
    if (text.length <= 10) return text;
    return `${text.slice(0, 10)}...`;
  }

  function formatMobile(item) {
    const mobile = String(
      item?.mobile ||
        item?.phone ||
        item?.bindMobile ||
        item?.userMobile ||
        item?.maskedMobile ||
        item?.memberMobile ||
        '',
    ).trim();
    if (!mobile) return '--';
    if (mobile.includes('*')) return mobile;
    return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  }

  function getLastOnlineTime(item) {
    return (
      item?.lastOnlineTime ||
      item?.lastLoginTime ||
      item?.lastActiveTime ||
      item?.lastVisitTime ||
      item?.updateTime ||
      0
    );
  }

  function formatDate(value) {
    if (!value) return '--';
    return sheep.$helper.timeFormat(value, 'yyyy.mm.dd');
  }

  function normalizeList(list) {
    return (Array.isArray(list) ? list : []).map((item, index) => ({
      ...item,
      nickname: item?.nickname || item?.customerNickname || item?.userNickname || '',
      mobile: item?.mobile || item?.memberMobile || item?.phone || '',
      lastOnlineTime: getLastOnlineTime(item),
      _key: `touch-customer-${getMemberId(item) || state.pagination.pageNo}-${index}`,
    }));
  }

  function isSelected(item) {
    const memberId = getMemberId(item);
    if (!memberId) return false;
    return Boolean(state.selectedMap[String(memberId)]);
  }

  function toggleSelect(item) {
    const memberId = getMemberId(item);
    if (!memberId) return;
    const key = String(memberId);
    if (state.selectedMap[key]) {
      delete state.selectedMap[key];
      return;
    }
    state.selectedMap[key] = {
      memberId,
      nickname: item?.nickname || item?.customerNickname || item?.userNickname || '',
      customerNickname: item?.customerNickname || '',
      userNickname: item?.userNickname || '',
      mobile: item?.mobile || item?.memberMobile || item?.phone || '',
      avatar: item?.avatar || item?.userAvatar || item?.memberAvatar || '',
      lastOnlineTime: getLastOnlineTime(item),
    };
  }

  function resetPagination() {
    state.pagination.list = [];
    state.pagination.total = 0;
    state.pagination.pageNo = 1;
    state.loadStatus = '';
  }

  async function loadList() {
    if (state.loading) return;
    state.loading = true;
    state.loadStatus = 'loading';
    const res = await BrokerageApi.getBrokerageCustomerPage(
      {
        pageNo: state.pagination.pageNo,
        pageSize: state.pagination.pageSize,
      },
      { showLoading: state.pagination.pageNo === 1 },
    );
    state.loading = false;
    if (res?.code !== 0) {
      state.loadStatus = state.pagination.list.length ? 'more' : '';
      return;
    }
    const rawList = Array.isArray(res?.data?.list)
      ? res.data.list
      : Array.isArray(res?.data?.records)
      ? res.data.records
      : [];
    const mergedList = normalizeList(rawList);
    state.pagination.list = concat(state.pagination.list, mergedList);
    state.pagination.total = Number(res?.data?.total || res?.data?.totalCount || 0);
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function loadMore() {
    if (state.loading || state.loadStatus === 'noMore') return;
    state.pagination.pageNo += 1;
    loadList();
  }

  function restoreSelected() {
    const data = uni.getStorageSync(STORAGE_CUSTOMERS);
    if (Array.isArray(data) && data.length) {
      const map = {};
      data.forEach((it) => {
        const memberId = Number(it?.memberId || 0);
        if (!memberId) return;
        map[String(memberId)] = it;
      });
      state.selectedMap = map;
    } else {
      state.selectedMap = {};
    }
  }

  function confirmSelect() {
    if (!selectedCount.value) {
      uni.showToast({
        title: '请先选择客户',
        icon: 'none',
      });
      return;
    }
    const selectedList = Object.values(state.selectedMap);
    uni.setStorageSync(STORAGE_CUSTOMERS, selectedList);
    sheep.$router.go('/pages/commission/touch-type');
  }

  onLoad(() => {
    restoreSelected();
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
    padding: 24rpx 24rpx 0;
  }

  .tips-card {
    padding: 22rpx 22rpx;
    border-radius: 18rpx;
    background: #f3efe7;
    margin-bottom: 20rpx;
  }

  .tips-text {
    color: #b3a58a;
    font-size: 26rpx;
    line-height: 36rpx;
  }

  .list-card {
    padding: 0 24rpx;
    border-radius: 24rpx;
    background: #ffffff;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.05);
  }

  .customer-row {
    display: flex;
    align-items: flex-start;
    padding: 26rpx 0;
  }

  .with-divider {
    border-bottom: 2rpx solid rgba(24, 37, 19, 0.08);
  }

  .avatar {
    width: 104rpx;
    height: 104rpx;
    border-radius: 52rpx;
    flex-shrink: 0;
  }

  .customer-body {
    flex: 1;
    min-width: 0;
    margin-left: 24rpx;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 20rpx;
  }

  .customer-main {
    flex: 1;
    min-width: 0;
  }

  .customer-name {
    display: block;
    color: #2d2d2d;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
    margin-bottom: 10rpx;
  }

  .meta-text {
    display: block;
    color: #979797;
    font-size: 25rpx;
    line-height: 36rpx;
    margin-top: 4rpx;
  }

  .customer-side {
    width: 80rpx;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  .check-box {
    width: 44rpx;
    height: 44rpx;
    border-radius: 10rpx;
    border: 2rpx solid rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .check-box.checked {
    background: #121212;
    border-color: #121212;
  }

  .check-mark {
    color: #ffffff;
    font-size: 30rpx;
    line-height: 30rpx;
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
