<template>
  <s-layout
    navbar="clear"
    class="page-wrap"
    :bgStyle="{ color: '#F8F9F3' }"
    :onShareAppMessage="shareInfo"
  >
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
            top: 48 + 'rpx',
            transform: 'translateY(-50%)',
            height: '100%',
            left: '0',
            width: '100%',
          }"
        >
          <uni-icons
            type="left"
            size="22"
            color="rgba(30, 63, 28, 0.9)"
            @tap="sheep.$router.back()"
            class="ss-m-l-20"
            ><text class="sicon-back"></text
          ></uni-icons>
          <text class="nav-title ss-m-l-10">推广收益</text>
        </view>
      </view>
    </view>

    <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

    <view class="page-body">
      <view class="box_12 flex-row justify-between">
        <view class="text-group_10 flex-col">
          <text class="text_3">累计获得推广收益(元)</text>
          <text class="text_4 count-font">{{ showMoney ? fen2yuan(totalEarnedFen) : '***' }}</text>
        </view>
        <view class="text-group_11 flex-col">
          <view class="frozen-label-row flex-row align-center">
            <text class="text_3">冻结中</text>
            <view class="frozen-tip-trigger" @tap.stop="onToggleFrozenTip">
              <uni-icons type="info" size="16" color="rgba(102, 102, 102, 0.8)" />
            </view>
            <view v-if="state.showFrozenTip" class="frozen-tip">
              <text class="frozen-tip-text">{{ frozenTipText }}</text>
            </view>
          </view>
          <text class="text_4 count-font">{{ showMoney ? fen2yuan(withdrawingFen) : '***' }}</text>
        </view>
      </view>

      <view class="group_7 flex-col">
        <view class="group_35 flex-row justify-between">
          <view class="text-group_12 flex-col">
            <text class="text_5">收益余额(元)</text>
            <text class="text_6 count-font">{{ showMoney ? fen2yuan(balanceFen) : '***' }}</text>
          </view>
          <text class="text_8" @tap="onGoWithdrawLog">提现记录</text>
        </view>
        <view :style="{ marginTop: '16rpx' }" class="group_36 flex-row justify-between">
          <view class="text-group_13 flex-col flex-1">
            <text class="text_10">今日推广收益(元)</text>
            <text class="text_11 count-font">{{ todayExpectedIncome }}</text>
          </view>
          <view class="text-group_14 flex-col flex-1">
            <text class="text_12">累计推广订单(次)</text>
            <text class="text_13 count-font">{{ todayPaidOrderCount }}</text>
          </view>
          <view class="text-group_15 flex-col flex-1">
            <text class="text_14">今日增长订单(次)</text>
            <text class="text_15 count-font">{{ todayPromoteCount }}</text>
          </view>
        </view>
        <view class="text-wrapper_3 flex-col" @tap="onWithdrawNow">
          <text class="text_16">立即提现</text>
        </view>
        <view class="withdraw-notice-box flex-col">
          <text class="withdraw-notice-text">{{ withdrawThresholdTip }}</text>
          <text class="withdraw-notice-text">{{ withdrawArrivalTip }}</text>
        </view>
      </view>

      <view class="withdraw-rule-card flex-col">
        <view class="withdraw-rule-head flex-row align-center justify-between">
          <text class="withdraw-rule-title">提现规则</text>
        </view>
        <view class="withdraw-rule-list flex-col">
          <view
            v-for="(item, idx) in withdrawRuleItems"
            :key="idx"
            class="withdraw-rule-row flex-row justify-between"
          >
            <text class="withdraw-rule-label">{{ item.label }}</text>
            <text class="withdraw-rule-value">{{ item.value }}</text>
          </view>
        </view>
      </view>

      <view class="group_9 flex-col">
        <view class="group_15 flex-col">
          <view class="text-wrapper_5 flex-row justify-between">
            <view class="tab" :class="{ active: state.currentTab === 0 }" @tap="onTabChange(0)">
              <text :class="state.currentTab === 0 ? 'text_32' : 'text_33'">明细</text>
            </view>
            <view class="tab" :class="{ active: state.currentTab === 1 }" @tap="onTabChange(1)">
              <text :class="state.currentTab === 1 ? 'text_32' : 'text_33'">收入</text>
            </view>
            <view class="tab" :class="{ active: state.currentTab === 2 }" @tap="onTabChange(2)">
              <text :class="state.currentTab === 2 ? 'text_32' : 'text_34'">支出</text>
            </view>
          </view>
          <view class="group_37">
            <view class="box_16" :style="{ transform: `translateX(${tabLineOffset}rpx)` }"></view>
          </view>
        </view>

        <view v-if="state.pagination.list.length === 0 && !state.loading" class="empty-text"
          >暂无更多数据</view
        >
        <view
          v-for="item in state.pagination.list"
          :key="item._key"
          class="box_21 justify-between flex-row"
        >
          <view class="text-group_16 flex-col">
            <text class="text_17">{{ rowTitle(item) }}</text>
            <text class="text_18"
              >{{ formatDate2(item.createTime) }}&nbsp;&nbsp;&nbsp;{{
                formatClock(item.createTime)
              }}</text
            >
          </view>
          <view class="amount-col">
            <text class="count-font" :class="rowAmountTextClass(item)">{{
              rowAmountText(item)
            }}</text>
            <text v-if="item.statusName" class="row-status" :class="rowStatusTextClass(item)">{{
              item.statusName
            }}</text>
          </view>
        </view>

        <uni-load-more
          v-if="state.pagination.list.length > 0"
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
  import { computed, reactive } from 'vue';
  import { onShow, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { SharePageEnum } from '@/sheep/helper/const';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import { concat } from 'lodash-es';
  import TradeConfigApi from '@/sheep/api/trade/config';
  import BrokerageWithdrawConfigApi from '@/sheep/api/trade/brokerageWithdrawConfig';

  /** 分销邀请 */
  const shareInfo = computed(() => {
    return sheep.$platform.share.getShareInfo(
      {
        params: {
          page: SharePageEnum.HOME.value, // 用户通邀请进入到首页
        },
      },
      {
        type: 'user',
      },
    );
  });

  const navCenterY = computed(() => {
    const statusBarHeight = sheep.$platform.device?.statusBarHeight || 0;
    const capsule = sheep.$platform.capsule || {};
    const center =
      (Number(capsule.top) || statusBarHeight) +
      (Number(capsule.height) || 32) / 2 -
      statusBarHeight;
    const height = Number(sheep.$platform.navbar) - statusBarHeight;
    if (!Number.isFinite(center) || !Number.isFinite(height) || height <= 0) return height / 2;
    return Math.max(0, Math.min(center, height));
  });

  const state = reactive({
    loading: false,
    showMoney: true,
    summary: {},
    todayStatistics: {},
    brokerageUser: {},
    frozenDays: 0,
    minPrice: 0,
    maxPrice: 0,
    withdrawDailyTimes: 1,
    withdrawTimeRange: '全天可申请',
    withdrawArrivalTime: '审核通过后1-3个工作日到账',
    withdrawAuditTime: '提交后1-3个工作日完成审核',
    currentTab: 0, // 0 明细 1 收入 2 支出
    showFrozenTip: false,
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 10,
    },
    loadStatus: '',
  });

  const showMoney = computed(() => state.showMoney);
  const balanceFen = computed(() => Number(state.summary?.brokeragePrice) || 0);
  const withdrawingFen = computed(() => Number(state.summary?.frozenPrice) || 0);
  const totalEarnedFen = computed(() => Number(state.brokerageUser?.historyBrokeragePrice) || 0);
  const frozenTipText = computed(() => {
    const days = Number(state.frozenDays || 0) || 0;
    if (days <= 0) return '存在售后冻结期，确认收货无纠纷后自动解冻';
    return `${days}天售后冻结期，确认收货无纠纷后自动解冻`;
  });

  const todayExpectedIncome = computed(() => {
    return fen2yuan(Number(state.todayStatistics?.todayBrokeragePrice || 0));
  });
  const todayPaidOrderCount = computed(() => {
    return Number(state.todayStatistics?.totalOrderCount || 0);
  });
  const todayPromoteCount = computed(() => {
    return Number(state.todayStatistics?.todayOrderCount || 0);
  });

  const tabLineOffset = computed(() => 55 + 174 * state.currentTab);

  const withdrawRuleItems = computed(() => {
    const balanceYuan = fen2yuan(balanceFen.value || 0);
    const frozenYuan = fen2yuan(withdrawingFen.value || 0);
    const frozenDays = Number(state.frozenDays || 0) || 0;
    const minLimit = Number(state.minPrice || 0) || 0;
    const maxLimit = Number(state.maxPrice || 0) || 0;
    const actualMin = minLimit > 0 ? minLimit : 200;
    const daily = Number(state.withdrawDailyTimes || 0) || 1;
    const timeRange = state.withdrawTimeRange || '全天可申请';
    const auditTime = state.withdrawAuditTime || '提交后1-3个工作日完成审核';
    const arrivalTime = state.withdrawArrivalTime || '审核通过后1-3个工作日到账';
    return [
      { label: '可提现额度', value: `${balanceYuan}元` },
      { label: '提现门槛', value: `账户可提现金额满${actualMin}元后方可申请提现` },
      { label: '每日次数', value: `${daily}次` },
      {
        label: '单笔额度',
        value: `最低${actualMin}元${maxLimit > 0 ? `，最高${maxLimit}元` : ''}`,
      },
      { label: '提现时间', value: timeRange },
      { label: '审核时间', value: auditTime },
      { label: '到账时间', value: arrivalTime },
      { label: '到账说明', value: '提现申请提交后进入审核流程，非即时到账' },
      { label: '冻结期', value: frozenDays > 0 ? `${frozenDays}天（冻结期内收益不可提现）` : '无' },
      { label: '冻结收益', value: `${frozenYuan}元` },
      { label: '申请限制', value: '同一时间仅可提交1笔，审核结束后可再次申请' },
    ];
  });

  const withdrawThresholdTip = computed(() => {
    const minLimit = Number(state.minPrice || 0) || 0;
    const actualMin = minLimit > 0 ? minLimit : 200;
    return `提现门槛：账户可提现金额满${actualMin}元后方可申请提现`;
  });

  const withdrawArrivalTip = computed(() => {
    const arrivalTime = state.withdrawArrivalTime || '审核通过后1-3个工作日到账';
    return `到账说明：提现申请提交后需平台审核，非即时到账，通常${arrivalTime}`;
  });

  function formatDate(t) {
    if (!t) return '';
    return sheep.$helper.timeFormat(t, 'yyyy.mm.dd');
  }

  function formatDate2(t) {
    if (!t) return '';
    return sheep.$helper.timeFormat(t, 'yyyy.mm.dd');
  }

  function formatClock(t) {
    if (!t) return '';
    return sheep.$helper.timeFormat(t, 'hh:MM');
  }

  function resetPagination() {
    state.pagination.list = [];
    state.pagination.total = 0;
    state.pagination.pageNo = 1;
    state.loadStatus = '';
  }

  async function loadSummary() {
    const { code, data } = await BrokerageApi.getBrokerageUserSummary();
    if (code !== 0) return;
    state.summary = data || {};
  }

  async function loadBrokerageUser() {
    const res = await BrokerageApi.getBrokerageUser();
    if (res.code === 0) {
      state.brokerageUser = res.data || {};
    }
  }

  async function loadTodayStatistics() {
    const res = await BrokerageApi.getBrokerageRecordTodayStatistics();
    if (!res || typeof res !== 'object') return;
    if (res.code !== 0) return;
    state.todayStatistics = res.data || {};
  }

  async function loadTradeConfig() {
    const { code, data } = await TradeConfigApi.getTradeConfig();
    if (code !== 0) return;
    state.frozenDays = Number(data?.brokerageFrozenDays || 0) || 0;
  }

  function normalizeWithdrawPrice(value) {
    const n = Number(value);
    if (!n || n <= 0) {
      return 0;
    }
    return n / 100;
  }

  function pickNumber(obj, keys = []) {
    if (!obj) {
      return 0;
    }
    for (const k of keys) {
      const v = obj[k];
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) {
        return n;
      }
    }
    return 0;
  }

  function pickString(obj, keys = []) {
    if (!obj) return '';
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return '';
  }

  function pickTimeRange(obj) {
    if (!obj) return '';
    const start =
      pickString(obj, ['withdrawStartTime', 'startTime', 'timeStart', 'withdrawTimeStart']) || '';
    const end = pickString(obj, ['withdrawEndTime', 'endTime', 'timeEnd', 'withdrawTimeEnd']) || '';
    if (start && end) return `${start}-${end}`;
    return '';
  }

  async function loadWithdrawConfig() {
    const code = 'default';
    const { code: resCode, data } = await BrokerageWithdrawConfigApi.getBrokerageWithdrawConfig(
      code,
    );
    if (resCode !== 0 || !data) return;

    const minRaw = pickNumber(data, [
      'minPrice',
      'withdrawMinPrice',
      'minWithdrawPrice',
      'minWithdrawAmount',
      'minAmount',
    ]);
    const maxRaw = pickNumber(data, [
      'maxPrice',
      'withdrawMaxPrice',
      'maxWithdrawPrice',
      'maxWithdrawAmount',
      'maxAmount',
    ]);
    state.minPrice = normalizeWithdrawPrice(minRaw);
    state.maxPrice = normalizeWithdrawPrice(maxRaw);

    const dailyTimes = pickNumber(data, [
      'withdrawDailyTimes',
      'dailyTimes',
      'dayTimes',
      'maxTimesPerDay',
      'dayWithdrawLimit',
      'dayWithdrawTimes',
    ]);
    if (dailyTimes > 0) {
      state.withdrawDailyTimes = dailyTimes;
    }

    const timeRange =
      pickString(data, ['withdrawTimeRange', 'withdrawTime', 'timeRange', 'availableTime']) ||
      pickTimeRange(data);
    if (timeRange) {
      state.withdrawTimeRange = timeRange;
    }

    const auditTime = pickString(data, [
      'withdrawAuditTime',
      'auditTime',
      'reviewTime',
      'auditDesc',
    ]);
    if (auditTime) {
      state.withdrawAuditTime = auditTime;
    }

    const arrivalTime = pickString(data, [
      'withdrawArrivalTime',
      'arrivalTime',
      'transferTime',
      '到账时间',
      'arrivalDesc',
    ]);
    if (arrivalTime) {
      state.withdrawArrivalTime = arrivalTime;
    }
  }

  async function loadList() {
    state.loading = true;
    state.loadStatus = 'loading';
    const baseParams = {
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
    };

    const queryParams = { ...baseParams };
    if (state.currentTab === 1) {
      queryParams.priceType = 1;
    } else if (state.currentTab === 2) {
      queryParams.priceType = 2;
    }

    const res = await BrokerageApi.getBrokerageRecordPage(queryParams);

    state.loading = false;

    if (res.code !== 0) {
      state.loadStatus = 'more';
      return;
    }

    const originList = res.data?.list || [];
    const total = Number(res.data?.total ?? res.data?.totalCount ?? res.data?.count ?? 0);
    const hasTotal = total > 0;
    const isLastPage =
      originList.length < state.pagination.pageSize ||
      (hasTotal && state.pagination.pageNo * state.pagination.pageSize >= total);

    const list = originList;

    state.pagination.list = concat(
      state.pagination.list,
      list.map((it) => ({
        ...it,
        _kind: it.price > 0 ? 'income' : 'expense',
        _key: `r-${it.id}`,
      })),
    );
    state.pagination.total = total;
    state.loadStatus = isLastPage ? 'noMore' : 'more';
  }

  function onTabChange(idx) {
    if (state.currentTab === idx) return;
    state.currentTab = idx;
    resetPagination();
    loadList();
  }

  function rowTitle(item) {
    let title = item.title || item.bizId || '未知记录';
    if (item.bizType === 1) {
      title = '订单推广佣金';
    } else if (item.bizType === 2) {
      title = '提现申请';
    }
    return title.length > 15 ? title.slice(0, 14) + '...' : title;
  }

  function rowAmount(item) {
    if (!showMoney.value) return '***';
    const price = Number(item?.price) || 0;
    if (item?._kind === 'expense') {
      const statusName = String(item?.statusName || '');
      if (statusName.includes('取消')) return fen2yuan(Math.abs(price));
      return `-${fen2yuan(Math.abs(price))}`;
    }
    return `+${fen2yuan(Math.abs(price))}`;
  }

  function rowAmountClass(item) {
    if (!showMoney.value) return '';
    if (item?._kind === 'expense') {
      const statusName = String(item?.statusName || '');
      if (statusName.includes('取消')) return 'amount-cancel';
      return 'amount-minus';
    }
    return 'amount-add';
  }

  function rowAmountText(item) {
    if (!showMoney.value) return '***';
    const price = Number(item?.price) || 0;
    if (item?._kind === 'expense') {
      const statusName = String(item?.statusName || '');
      if (statusName.includes('取消')) return fen2yuan(Math.abs(price));
      return `-${fen2yuan(Math.abs(price))}`;
    }
    return `+${fen2yuan(Math.abs(price))}`;
  }

  function rowAmountTextClass(item) {
    if (!showMoney.value) return 'text_31';
    if (item?._kind === 'expense') {
      const statusName = String(item?.statusName || '');
      if (statusName.includes('取消')) return 'text_31';
      return 'text_22';
    }
    return 'text_19';
  }

  function rowStatusTextClass(item) {
    const status = Number(item?.status);
    if (status === 1) return 'status-settled';
    if (status === 2) return 'status-cancel';
    return 'status-pending';
  }

  function onWithdrawNow() {
    sheep.$router.go('/pages/commission/withdraw');
  }

  function onGoWithdrawLog() {
    sheep.$router.go('/pages/commission/wallet', { type: 2 });
  }

  let frozenTipTimer;
  function onToggleFrozenTip() {
    state.showFrozenTip = !state.showFrozenTip;
    if (state.showFrozenTip) {
      clearTimeout(frozenTipTimer);
      frozenTipTimer = setTimeout(() => {
        state.showFrozenTip = false;
      }, 3000);
    }
  }

  onShow(async () => {
    resetPagination();
    await Promise.all([
      loadSummary(),
      loadTodayStatistics(),
      loadBrokerageUser(),
      loadTradeConfig(),
      loadWithdrawConfig(),
    ]);
    await loadList();
  });

  onPullDownRefresh(async () => {
    try {
      resetPagination();
      await Promise.all([
        loadSummary(),
        loadTodayStatistics(),
        loadBrokerageUser(),
        loadTradeConfig(),
        loadWithdrawConfig(),
      ]);
      await loadList();
    } finally {
      uni.stopPullDownRefresh();
    }
  });

  function loadMore() {
    if (state.loadStatus === 'noMore') return;
    if (state.loading) return;
    state.pagination.pageNo += 1;
    loadList();
  }

  onReachBottom(() => {
    loadMore();
  });
</script>

<style lang="scss" scoped>
  .flex-col {
    display: flex;
    flex-direction: column;
  }
  .flex-row {
    display: flex;
    flex-direction: row;
  }
  .justify-start {
    display: flex;
    justify-content: flex-start;
  }
  .justify-center {
    display: flex;
    justify-content: center;
  }
  .justify-end {
    display: flex;
    justify-content: flex-end;
  }
  .justify-between {
    display: flex;
    justify-content: space-between;
  }
  .align-center {
    display: flex;
    align-items: center;
  }

  .page-wrap {
    background-color: rgba(248, 249, 243, 1);
  }

  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    background: #f8f9f3;
  }
  .nav-bar-container {
    background: #f8f9f3;
  }

  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
    line-height: 50rpx;
  }

  .header-placeholder {
    width: 100%;
  }

  .page-body {
    padding-bottom: 40rpx;
    background-color: rgba(248, 249, 243, 1);
  }

  .box_12 {
    background-color: rgba(255, 254, 250, 1);
    border-radius: 20rpx;
    width: 686rpx;
    align-self: center;
    padding: 47rpx 115rpx 40rpx 32rpx;
    margin: 31rpx auto 0 auto;
    box-sizing: border-box;
  }

  .text_3,
  .text_5 {
    overflow-wrap: break-word;
    color: rgba(102, 102, 102, 0.8);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 37rpx;
  }

  .frozen-label-row {
    position: relative;
  }

  .frozen-tip-trigger {
    margin-left: 10rpx;
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .frozen-tip {
    position: absolute;
    left: 50%;
    top: 44rpx;
    width: 217rpx;
    transform: translateX(-50%);
    padding: 14rpx 16rpx;
    background: rgba(255, 255, 255, 1);
    border-radius: 14rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    z-index: 10;
  }

  .frozen-tip::after {
    content: '';
    position: absolute;
    left: 50%;
    top: -14rpx;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 14rpx solid transparent;
    border-right: 14rpx solid transparent;
    border-bottom: 14rpx solid rgba(255, 255, 255, 1);
  }

  .frozen-tip-text {
    color: rgba(61, 61, 60, 1);
    font-size: 20rpx;
    line-height: 28rpx;
    white-space: normal;
  }

  .text_4,
  .text_6 {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 58rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 67rpx;
    margin-top: 9rpx;
  }
  .text_4 {
    margin: 9rpx 71rpx 0 0;
  }
  .text_6 {
    margin: 9rpx 64rpx 0 0;
  }

  .group_7 {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    width: 686rpx;
    align-self: center;
    padding: 34rpx 32rpx 47rpx 32rpx;
    margin: 20rpx auto 0 auto;
    box-sizing: border-box;
  }

  .withdraw-rule-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    width: 686rpx;
    align-self: center;
    padding: 34rpx 32rpx 36rpx 32rpx;
    margin: 20rpx auto 0 auto;
    box-sizing: border-box;
  }

  .withdraw-rule-title {
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 40rpx;
  }

  .withdraw-rule-row {
    padding: 14rpx 0;
    border-bottom: 2rpx solid rgba(157, 156, 150, 0.2);
  }

  .withdraw-rule-row:last-child {
    border-bottom: none;
  }

  .withdraw-rule-label {
    color: rgba(102, 102, 102, 0.8);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    line-height: 37rpx;
    flex-shrink: 0;
    width: 180rpx;
  }

  .withdraw-rule-value {
    color: rgba(61, 61, 60, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    line-height: 37rpx;
    flex: 1;
    text-align: right;
    white-space: normal;
  }

  .text_7 {
    overflow-wrap: break-word;
    color: rgba(102, 102, 102, 0.8);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
  }

  .text_9 {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 44rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 51rpx;
    margin-top: 9rpx;
  }

  .text_8 {
    overflow-wrap: break-word;
    color: rgba(181, 158, 109, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 37rpx;
  }

  .stats-bottom {
    margin-top: 36rpx;
  }

  .text_10,
  .text_12,
  .text_14 {
    overflow-wrap: break-word;
    color: rgba(102, 102, 102, 0.8);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
  }

  .text_11,
  .text_13,
  .text_15 {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 40rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 47rpx;
    margin-top: 3rpx;
  }
  .text_11,
  .text_13,
  .text_15 {
    margin-top: 3rpx;
  }

  .flex-1 {
    flex: 1;
    align-items: center;
  }

  .text-wrapper_3 {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    border: 2rpx solid rgba(157, 156, 150, 1);
    padding: 21rpx 0 20rpx 0;
    margin: 39rpx 0 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .withdraw-notice-box {
    margin-top: 20rpx;
    padding: 18rpx 20rpx;
    background: rgba(248, 249, 243, 1);
    border-radius: 18rpx;
  }

  .withdraw-notice-text {
    color: rgba(102, 102, 102, 1);
    font-size: 24rpx;
    line-height: 36rpx;
    white-space: normal;
  }

  .withdraw-notice-text + .withdraw-notice-text {
    margin-top: 6rpx;
  }

  .text_16 {
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 45rpx;
  }

  .group_9 {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    align-self: center;
    width: 686rpx;
    position: relative;
    margin: 26rpx auto 0 auto;
    overflow: hidden;
    padding: 120rpx 29rpx 140rpx 30rpx;
    box-sizing: border-box;
  }

  .group_15 {
    background-image: linear-gradient(
      180deg,
      rgba(255, 255, 253, 0.8) 0,
      rgba(234, 243, 229, 0.8) 100%
    );
    border-radius: 22rpx 22rpx 0 0;
    height: 120rpx;
    padding: 38rpx 82rpx 0 82rpx;
    box-sizing: border-box;
    width: 686rpx;
    position: absolute;
    left: 1rpx;
    top: 0;
  }

  .text-wrapper_5 {
    width: 522rpx;
  }

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .text_32 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    line-height: 45rpx;
  }

  .text_33,
  .text_34 {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 45rpx;
  }

  .tab.active .text_33,
  .tab.active .text_34 {
    color: rgba(30, 63, 28, 1);
    font-family: PingFangSC-Medium;
    font-weight: 500;
  }

  .group_37 {
    margin-top: 27rpx;
    width: 522rpx;
    height: 10rpx;
    position: relative;
  }

  .box_16 {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 45rpx;
    width: 64rpx;
    height: 10rpx;
    position: absolute;
    left: 0;
    top: 0;
  }

  .text-group_16 {
    margin: 24rpx 0 24rpx 0;
  }

  .text_17 {
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 28rpx;
    margin-right: 33rpx;
  }

  .text_18 {
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 28rpx;
    margin-top: 16rpx;
  }

  .box_13 {
    background-color: rgba(74, 96, 178, 0);
    width: 12rpx;
    height: 120rpx;
    margin-left: 119rpx;
  }

  .text_19 {
    overflow-wrap: break-word;
    color: #1d2129;
    font-size: 32rpx;
    font-family: Helvetica, 'Microsoft YaHei', Arial, sans-serif;
    font-weight: normal;
    text-align: right;
    white-space: nowrap;
    line-height: 32rpx;
  }

  .text_22 {
    overflow-wrap: break-word;
    color: #1d2129;
    font-size: 32rpx;
    font-family: Helvetica;
    font-weight: normal;
    text-align: right;
    white-space: nowrap;
    line-height: 32rpx;
    margin: 44rpx 0 0 187rpx;
  }

  .text_31 {
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 32rpx;
    font-family: Helvetica;
    font-weight: normal;
    text-align: right;
    white-space: nowrap;
    line-height: 32rpx;
    margin: 44rpx 0 0 187rpx;
  }

  .amount-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .amount-col .text_22,
  .amount-col .text_31 {
    margin: 0;
  }

  .row-status {
    margin-top: 10rpx;
    font-size: 22rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: right;
    white-space: nowrap;
    line-height: 22rpx;
  }

  .status-pending {
    color: #9d9c96;
  }

  .status-settled {
    color: #2ec21b;
  }

  .status-cancel {
    color: #c21b1b;
  }

  .box_21 {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: 2rpx solid rgba(157, 156, 150, 0.3);
  }

  .box_21:last-child {
    border-bottom: none;
  }

  .empty-text {
    text-align: center;
    font-size: 28rpx;
    color: rgba(157, 156, 150, 1);
    padding: 60rpx 0;
  }
</style>
