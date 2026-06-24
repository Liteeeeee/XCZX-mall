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
            <text class="nav-title">智能管家助手</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view class="stats-grid">
          <view class="stat-card stat-card-muted">
            <view class="stat-top">
              <view class="stat-icon">
                <image class="stat-image" :src="countIcon" mode="aspectFit" />
              </view>
              <text class="stat-label">粉丝总数</text>
            </view>
            <text class="stat-value count-font">{{ totalFans }}</text>
          </view>
          <view class="stat-card">
            <view class="stat-top">
              <view class="stat-icon">
                <image class="stat-image" :src="neoIcon" mode="aspectFit" />
              </view>
              <text class="stat-label">今日新增</text>
            </view>
            <text class="stat-value count-font">{{ todayNewFans }}</text>
          </view>
          <view class="stat-card">
            <view class="stat-top">
              <view class="stat-icon">
                <image class="stat-image" :src="lostIcon" mode="aspectFit" />
              </view>
              <text class="stat-label">流失提醒</text>
            </view>
            <text class="stat-value count-font">{{ lossReminderCount }}</text>
          </view>
        </view>

        <view class="action-grid">
          <view class="action-card action-card-blue" @tap="handleActionTap('话术资源')">
            <view class="action-icon-box">
              <image class="action-image" :src="tempIcon" mode="aspectFit" />
            </view>
            <text class="action-title">话术资源</text>
          </view>
          <view class="action-card action-card-cyan" @tap="handleActionTap('一键触达')">
            <view class="action-icon-box">
              <image class="action-image" :src="touchIcon" mode="aspectFit" />
            </view>
            <text class="action-title">一键触达</text>
          </view>
          <view class="action-card action-card-warm" @tap="handleActionTap('关怀提醒')">
            <view class="action-icon-box">
              <image class="action-image" :src="careIcon" mode="aspectFit" />
            </view>
            <text class="action-title">关怀提醒</text>
          </view>
        </view>

        <view class="customer-section">
          <view class="section-head">
            <view class="section-title-wrap">
              <text class="section-title">优质粉丝客户</text>
              <text class="section-count">（{{ goodFans.total }}）</text>
            </view>
            <view class="section-more" @tap="goFanList(true)">
              <text class="section-more-text">查看更多</text>
              <uni-icons type="right" size="12" color="#999999" />
            </view>
          </view>
          <view class="section-card">
            <template v-if="goodFans.list.length">
              <fan-customer-card
                v-for="(item, index) in goodFans.list"
                :key="item._key"
                :item="item"
                :show-member-tag="true"
                :show-divider="index !== goodFans.list.length - 1"
                @archive="handleArchiveTap"
              />
            </template>
            <view v-else class="empty-state">
              <image class="empty-image" :src="emptyIcon" mode="aspectFit" />
            </view>
          </view>
        </view>

        <view class="customer-section">
          <view class="section-head">
            <view class="section-title-wrap">
              <text class="section-title">普通粉丝客户</text>
              <text class="section-count">（{{ normalFans.total }}）</text>
            </view>
            <view class="section-more" @tap="goFanList(false)">
              <text class="section-more-text">查看更多</text>
              <uni-icons type="right" size="12" color="#999999" />
            </view>
          </view>
          <view class="section-card">
            <template v-if="normalFans.list.length">
              <fan-customer-card
                v-for="(item, index) in normalFans.list"
                :key="item._key"
                :item="item"
                :show-divider="index !== normalFans.list.length - 1"
                @archive="handleArchiveTap"
              />
            </template>
            <view v-else class="empty-state">
              <image class="empty-image" :src="emptyIcon" mode="aspectFit" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import fanCustomerCard from './components/fan-customer-card.vue';

  const touchIcon = sheep.$url.cdn('/mp/static/智能客户管家/触达@2x.webp');
  const tempIcon = sheep.$url.cdn('/mp/static/智能客户管家/话术@2x.webp');
  const careIcon = sheep.$url.cdn('/mp/static/智能客户管家/异常@2x.webp');
  const countIcon = sheep.$url.cdn('/mp/static/智能客户管家/总数@2x.webp');
  const neoIcon = sheep.$url.cdn('/mp/static/智能客户管家/新增@2x.webp');
  const lostIcon = sheep.$url.cdn('/mp/static/智能客户管家/流失@2x.webp');
  const emptyIcon = sheep.$url.cdn('/mp/static/智能客户管家/empty.webp');
  const state = reactive({
    summary: {},
    fallbackTodayNewFans: 0,
    archiveStatistics: {},
    previewMap: {
      good: {
        list: [],
        total: 0,
      },
      normal: {
        list: [],
        total: 0,
      },
    },
  });

  const totalFans = computed(() => {
    return Number(
      state.summary?.totalFirstFansCount ||
        state.summary?.fansCount ||
        state.summary?.totalFansCount ||
        goodFans.value.total + normalFans.value.total ||
        0,
    );
  });

  const todayNewFans = computed(() => {
    return Number(
      state.summary?.todayFirstFansCount ||
        state.summary?.todayNewFansCount ||
        state.fallbackTodayNewFans ||
        0,
    );
  });

  const lossReminderCount = computed(() => {
    return Number(
      state.archiveStatistics?.churnWarningCount ||
        state.archiveStatistics?.lossReminderCount ||
        state.archiveStatistics?.warnFanCount ||
        state.archiveStatistics?.warnCount ||
        state.archiveStatistics?.lossCount ||
        state.archiveStatistics?.churnCount ||
        state.archiveStatistics?.churn ||
        state.summary?.lossReminderCount ||
        state.summary?.lostFanCount ||
        state.summary?.warnFanCount ||
        state.summary?.lossFansCount ||
        0,
    );
  });

  const goodFans = computed(() => state.previewMap.good);
  const normalFans = computed(() => state.previewMap.normal);

  function normalizeList(list, prefix) {
    return (Array.isArray(list) ? list : [])
      .map((item, index) => ({
        ...item,
        nickname: item?.nickname || item?.customerNickname || item?.userNickname || '',
        mobile: item?.mobile || item?.memberMobile || item?.phone || '',
        bindUserTime: item?.bindUserTime || item?.registerTime || item?.createTime || 0,
        lastOnlineTime: item?.lastOnlineTime || item?.lastLoginTime || 0,
        memberLevelName:
          item?.memberLevelName || (Number(item?.memberLevel || 0) > 0 ? '会员客户' : ''),
        _key: `${prefix}-${item.id || item.userId || item.bindUserId || index}`,
      }))
      .sort((a, b) => {
        const aTime = Number(
          a?.bindUserTime ||
            a?.registerTime ||
            a?.brokerageTime ||
            a?.createTime ||
            a?.createTimeMillis ||
            0,
        );
        const bTime = Number(
          b?.bindUserTime ||
            b?.registerTime ||
            b?.brokerageTime ||
            b?.createTime ||
            b?.createTimeMillis ||
            0,
        );
        return bTime - aTime;
      });
  }

  async function loadSummary() {
    const res = await BrokerageApi.getBrokerageUserSummary({ showLoading: false });
    if (res?.code !== 0 || typeof res?.data !== 'object') return;
    state.summary = res.data || {};
  }

  async function loadArchiveStatistics() {
    const res = await BrokerageApi.getBrokerageCustomerStatistics({}, { showLoading: false });
    if (res?.code !== 0) {
      state.archiveStatistics = {};
      return;
    }
    state.archiveStatistics = res?.data || {};
  }

  async function loadPreviewList(goodFan) {
    const res = await BrokerageApi.getBrokerageCustomerPage(
      {
        pageNo: 1,
        pageSize: 4,
        goodFan,
      },
      { showLoading: false },
    );
    const target = goodFan ? state.previewMap.good : state.previewMap.normal;
    if (res?.code !== 0) {
      target.list = [];
      target.total = 0;
      return;
    }
    const rawList = Array.isArray(res?.data?.list)
      ? res.data.list
      : Array.isArray(res?.data?.records)
      ? res.data.records
      : [];
    target.list = normalizeList(rawList, goodFan ? 'good-fan' : 'normal-fan');
    target.total = Number(res?.data?.total || res?.data?.totalCount || target.list.length || 0);
  }

  async function loadPageData() {
    await Promise.all([
      loadSummary(),
      loadArchiveStatistics(),
      loadPreviewList(true),
      loadPreviewList(false),
    ]);
  }

  function goFanList(goodFan) {
    sheep.$router.go('/pages/commission/fans-list', {
      goodFan,
      title: goodFan ? '优质粉丝客户' : '普通粉丝客户',
    });
  }

  function handleActionTap(name) {
    if (name === '话术资源') {
      sheep.$router.go('/pages/commission/wording-resource');
      return;
    }
    if (name === '一键触达') {
      sheep.$router.go('/pages/commission/touch-user-select');
      return;
    }
    if (name === '关怀提醒') {
      sheep.$router.go('/pages/commission/care-reminder');
      return;
    }
    uni.showToast({
      title: `${name}功能开发中`,
      icon: 'none',
    });
  }

  function handleArchiveTap(item = {}) {
    const memberId = Number(item?.memberId || item?.id || 0);
    if (!memberId) {
      uni.showToast({
        title: '客户信息缺失',
        icon: 'none',
      });
      return;
    }
    sheep.$router.go('/pages/commission/customer-archive', {
      memberId,
      avatar: item?.avatar || item?.userAvatar || item?.memberAvatar || '',
      memberLevel: item?.memberLevel || 0,
      userNickname: item?.userNickname || item?.nickname || '',
      customerNickname: item?.customerNickname || '',
      memberMobile: item?.memberMobile || item?.mobile || '',
    });
  }

  onLoad((options) => {
    state.fallbackTodayNewFans = Number(
      options?.todayFirstFansCount || options?.todayNewFansCount || 0,
    );
  });

  onShow(() => {
    loadPageData();
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
    padding: 20rpx 24rpx 44rpx;
  }

  .stats-grid {
    display: flex;
    flex-direction: row;
    gap: 16rpx;
  }

  .action-grid {
    display: flex;
    flex-direction: row;
    gap: 16rpx;
  }

  .stat-card,
  .action-card {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 120rpx;
    padding: 22rpx 20rpx;
    border-radius: 24rpx;
    box-sizing: border-box;
  }

  .stat-card {
    background: #ffffff;
    border: 2rpx solid rgba(17, 17, 17, 0.04);
  }

  .stat-card-muted {
    background: #ffffff;
  }

  .stat-top {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  .stat-icon {
    width: 34rpx;
    height: 34rpx;
    border-radius: 10rpx;
    flex-shrink: 0;
  }

  .stat-icon-gray {
    background: linear-gradient(135deg, #91b6ff 0%, #4d82ff 100%);
  }

  .stat-icon-green {
    background: linear-gradient(135deg, #6ce2cc 0%, #3ec0a5 100%);
  }

  .stat-icon-orange {
    background: linear-gradient(135deg, #ffbf7a 0%, #ff8b5e 100%);
  }

  .stat-image {
    width: 32rpx;
    height: 32rpx;
  }

  .stat-label {
    color: #8a8a8a;
    font-size: 28rpx;
    line-height: 40rpx;
  }

  .stat-value {
    margin-top: 8rpx;
    color: #2a2a2a;
    font-size: 58rpx;
    font-weight: 700;
    line-height: 64rpx;
  }

  .action-grid {
    margin-top: 20rpx;
  }

  .action-card {
    align-items: center;
    background: #ffffff;
    border: 2rpx solid rgba(17, 17, 17, 0.05);
    padding: 24rpx 14rpx;
  }

  .action-card-blue {
    background: #f2f6ff;
  }

  .action-card-cyan {
    background: #eefaf8;
  }

  .action-card-warm {
    background: #fff7ef;
  }

  .action-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 68rpx;
    height: 68rpx;
    border-radius: 10rpx;
    box-sizing: border-box;
  }

  .action-image {
    width: 68rpx;
    height: 68rpx;
  }

  .action-title {
    margin-top: 18rpx;
    color: #4b4b4b;
    font-size: 28rpx;
    line-height: 48rpx;
  }

  .customer-section {
    margin-top: 28rpx;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  .section-title-wrap {
    display: flex;
    align-items: center;
  }

  .section-title {
    color: #222222;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 56rpx;
  }

  .section-count {
    color: #222222;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
    margin-left: 8rpx;
  }

  .section-more {
    display: flex;
    align-items: center;
  }

  .section-more-text {
    color: #999999;
    font-size: 28rpx;
    line-height: 40rpx;
    margin-right: 4rpx;
  }

  .section-card {
    padding: 0 24rpx;
    border-radius: 24rpx;
    background: #ffffff;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.05);
  }

  .empty-state {
    height: 429rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-image {
    width: 100%;
    height: 222rpx;
  }
</style>
