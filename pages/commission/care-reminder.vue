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
            <text class="nav-title">关怀提醒</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view class="remind-grid">
          <view class="remind-card" @tap="scrollTo('birthday')">
            <view class="remind-top">
              <view class="remind-icon remind-icon-birthday">
                <image class="remind-image" :src="birthdayIcon" mode="aspectFit" />
              </view>
              <text class="remind-label">生日提醒</text>
            </view>
            <text class="remind-value count-font">{{ birthday.total }}</text>
          </view>
          <view class="remind-card" @tap="scrollTo('churn')">
            <view class="remind-top">
              <view class="remind-icon remind-icon-churn">
                <image class="remind-image" :src="churnIcon" mode="aspectFit" />
              </view>
              <text class="remind-label">流失预警</text>
            </view>
            <text class="remind-value count-font">{{ churn.total }}</text>
          </view>
          <view class="remind-card" @tap="scrollTo('potential')">
            <view class="remind-top">
              <view class="remind-icon remind-icon-potential">
                <image class="remind-image" :src="potentialIcon" mode="aspectFit" />
              </view>
              <text class="remind-label">潜在购买</text>
            </view>
            <text class="remind-value count-font">{{ potential.total }}</text>
          </view>
        </view>

        <view class="customer-section" id="birthday">
          <view class="section-head">
            <view class="section-title-wrap">
              <text class="section-title">3日内生日</text>
              <text class="section-count">（{{ birthday.total }}）</text>
            </view>
          </view>
          <view class="section-card">
            <template v-if="birthday.list.length">
              <fan-customer-card
                v-for="(item, index) in birthday.list"
                :key="item._key"
                :item="item"
                :show-member-tag="isMember(item)"
                :show-divider="index !== birthday.list.length - 1"
                @archive="handleArchiveTap"
              />
            </template>
            <view v-else class="empty-state">
              <image class="empty-image" :src="emptyIcon" mode="aspectFit" />
            </view>
          </view>
        </view>

        <view class="customer-section" id="churn">
          <view class="section-head">
            <view class="section-title-wrap">
              <text class="section-title">流失预警</text>
              <text class="section-count">（{{ churn.total }}）</text>
            </view>
          </view>
          <view class="section-card">
            <template v-if="churn.list.length">
              <fan-customer-card
                v-for="(item, index) in churn.list"
                :key="item._key"
                :item="item"
                :show-member-tag="isMember(item)"
                :show-divider="index !== churn.list.length - 1"
                @archive="handleArchiveTap"
              />
            </template>
            <view v-else class="empty-state">
              <image class="empty-image" :src="emptyIcon" mode="aspectFit" />
            </view>
          </view>
        </view>

        <view class="customer-section" id="potential">
          <view class="section-head">
            <view class="section-title-wrap">
              <text class="section-title">潜在购买</text>
              <text class="section-count">（{{ potential.total }}）</text>
            </view>
          </view>
          <view class="section-card">
            <template v-if="potential.list.length">
              <fan-customer-card
                v-for="(item, index) in potential.list"
                :key="item._key"
                :item="item"
                :show-member-tag="isMember(item)"
                :show-divider="index !== potential.list.length - 1"
                @archive="handleArchiveTap"
              />
            </template>
            <view v-else class="empty-state">
              <image class="empty-image" :src="emptyIcon" mode="aspectFit" />
            </view>
          </view>
        </view>

        <view class="footer-placeholder"></view>
      </view>

      <view class="footer">
        <view class="footer-btn" @tap="goTouch">
          <text class="footer-btn-text">发起触达</text>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { reactive } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import fanCustomerCard from './components/fan-customer-card.vue';

  const birthdayIcon = sheep.$url.cdn('/mp/static/关怀提醒/生日@2x.png');
  const churnIcon = sheep.$url.cdn('/mp/static/关怀提醒/流失@2x.png');
  const potentialIcon = sheep.$url.cdn('/mp/static/关怀提醒/潜在@2x.png');
  const emptyIcon = sheep.$url.cdn('/mp/static/智能客户管家/empty.webp');

  const state = reactive({
    birthday: {
      list: [],
      total: 0,
    },
    churn: {
      list: [],
      total: 0,
    },
    potential: {
      list: [],
      total: 0,
    },
  });

  const birthday = state.birthday;
  const churn = state.churn;
  const potential = state.potential;

  function normalizeList(list, prefix) {
    const raw = Array.isArray(list) ? list : [];
    return raw.map((item, index) => ({
      ...item,
      _key: `${prefix}-${item?.memberId || item?.id || index}-${index}`,
    }));
  }

  function isMember(item) {
    return Number(item?.memberLevel || 0) > 0;
  }

  async function loadBirthday() {
    const res = await BrokerageApi.getBrokerageCustomerBirthdayPage(
      {
        pageNo: 1,
        pageSize: 5,
      },
      { showLoading: false },
    );
    if (res?.code !== 0) {
      birthday.list = [];
      birthday.total = 0;
      return;
    }
    const list = Array.isArray(res?.data?.list)
      ? res.data.list
      : Array.isArray(res?.data?.records)
      ? res.data.records
      : [];
    birthday.list = normalizeList(list, 'birthday');
    birthday.total = Number(res?.data?.total || res?.data?.totalCount || birthday.list.length || 0);
  }

  async function loadChurn() {
    const res = await BrokerageApi.getBrokerageCustomerChurnWarningPage(
      {
        pageNo: 1,
        pageSize: 5,
      },
      { showLoading: false },
    );
    if (res?.code !== 0) {
      churn.list = [];
      churn.total = 0;
      return;
    }
    const list = Array.isArray(res?.data?.list)
      ? res.data.list
      : Array.isArray(res?.data?.records)
      ? res.data.records
      : [];
    churn.list = normalizeList(list, 'churn');
    churn.total = Number(res?.data?.total || res?.data?.totalCount || churn.list.length || 0);
  }

  async function loadPotential() {
    const res = await BrokerageApi.getBrokerageCustomerPotentialPurchasePage(
      {
        pageNo: 1,
        pageSize: 5,
      },
      { showLoading: false },
    );
    if (res?.code !== 0) {
      potential.list = [];
      potential.total = 0;
      return;
    }
    const list = Array.isArray(res?.data?.list)
      ? res.data.list
      : Array.isArray(res?.data?.records)
      ? res.data.records
      : [];
    potential.list = normalizeList(list, 'potential');
    potential.total = Number(
      res?.data?.total || res?.data?.totalCount || potential.list.length || 0,
    );
  }

  async function loadPageData() {
    await Promise.all([loadBirthday(), loadChurn(), loadPotential()]);
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

  function goTouch() {
    sheep.$router.go('/pages/commission/touch-user-select');
  }

  function scrollTo(anchor) {
    uni.pageScrollTo({
      selector: `#${anchor}`,
      duration: 300,
    });
  }

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
    padding: 24rpx 24rpx 0;
  }

  .remind-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18rpx;
  }

  .remind-card {
    padding: 22rpx 20rpx 18rpx;
    border-radius: 18rpx;
    background: #fffffa;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.04);
  }

  .remind-top {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
  }

  .remind-icon {
    width: 32rpx;
    height: 32rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remind-icon-birthday {
    background: rgba(255, 186, 45, 0.16);
  }

  .remind-icon-churn {
    background: rgba(255, 89, 89, 0.14);
  }

  .remind-icon-potential {
    background: rgba(76, 175, 80, 0.14);
  }

  .remind-image {
    width: 32rpx;
    height: 32rpx;
  }

  .remind-label {
    color: #2d2d2d;
    font-size: 26rpx;
    font-weight: 600;
    line-height: 36rpx;
  }

  .remind-value {
    color: #2d2d2d;
    font-size: 40rpx;
    font-weight: 700;
    line-height: 54rpx;
  }

  .customer-section {
    margin-top: 22rpx;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 18rpx 0;
  }

  .section-title-wrap {
    display: flex;
    align-items: baseline;
  }

  .section-title {
    color: #2d2d2d;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
  }

  .section-count {
    color: #2d2d2d;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 42rpx;
    margin-left: 6rpx;
  }

  .section-card {
    padding: 0 26rpx;
    border-radius: 20rpx;
    background: #fffffa;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.04);
  }

  .empty-state {
    padding: 42rpx 0 56rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .empty-image {
    width: 320rpx;
    height: 220rpx;
  }

  .empty-text {
    margin-top: 10rpx;
    color: rgba(165, 165, 165, 1);
    font-size: 26rpx;
    line-height: 36rpx;
  }

  .footer-placeholder {
    height: 218rpx;
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
