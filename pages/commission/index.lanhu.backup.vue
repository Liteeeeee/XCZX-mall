<template>
  <s-layout navbar="clear" class="page-wrap" :bgStyle="{ color: '#F8F9F3' }" :onShareAppMessage="shareInfo">
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
          ><text class="sicon-back"></text></uni-icons>
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
          <text class="text_5">收益余额(元)</text>
          <text class="text_6 count-font">{{ showMoney ? fen2yuan(balanceFen) : '***' }}</text>
        </view>
      </view>

      <view class="group_7 flex-col">
        <view class="group_35 flex-row justify-between">
          <view class="text-group_12 flex-col">
            <text class="text_7">提现中</text>
            <text class="text_9 count-font">{{ showMoney ? fen2yuan(withdrawingFen) : '***' }}</text>
          </view>
          <text class="text_8" @tap="onGoWithdrawLog">提现记录</text>
        </view>
        <view :style="{marginTop:'16rpx'}" class="group_36 flex-row justify-between">
          <view class="text-group_13 flex-col">
            <text class="text_10">今日预估收益(元)</text>
            <text class="text_11 count-font">{{ todayExpectedIncome }}</text>
          </view>
          <view class="text-group_14 flex-col">
            <text class="text_12">今日付款订单(次)</text>
            <text class="text_13 count-font">{{ todayPaidOrderCount }}</text>
          </view>
          <view class="text-group_15 flex-col">
            <text class="text_14">今日推广次数(次)</text>
            <text class="text_15 count-font">{{ todayPromoteCount }}</text>
          </view>
        </view>
        <view class="text-wrapper_3 flex-col" @tap="onWithdrawNow">
          <text class="text_16">立即提现</text>
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

        <view v-if="state.pagination.total === 0 && !state.loading" class="empty-text">暂无数据</view>
        <view v-for="item in state.pagination.list" :key="item._key" class="box_21 flex-row">
          <view class="text-group_16 flex-col">
            <text class="text_17">{{ rowTitle(item) }}</text>
            <text class="text_18">{{ formatDate2(item.createTime) }}&nbsp;&nbsp;&nbsp;{{ formatClock(item.createTime) }}</text>
          </view>
          <view class="box_13 flex-col"></view>
          <text class="count-font" :class="rowAmountTextClass(item)">{{ rowAmountText(item) }}</text>
        </view>

        <uni-load-more
          v-if="state.pagination.total > 0"
          :status="state.loadStatus"
          :content-text="{ contentdown: '上拉加载更多' }"
        />
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { SharePageEnum } from '@/sheep/helper/const';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import { concat } from 'lodash-es';

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
    currentTab: 0, // 0 明细 1 收入 2 支出
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
  const totalEarnedFen = computed(
    () =>
      (Number(state.summary?.withdrawPrice) || 0) +
      (Number(state.summary?.brokeragePrice) || 0) +
      (Number(state.summary?.frozenPrice) || 0),
  );

  const todayExpectedIncome = computed(() => '--');
  const todayPaidOrderCount = computed(() => '--');
  const todayPromoteCount = computed(() => '--');

  const tabLineOffset = computed(() => 55 + 174 * state.currentTab);

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

  async function loadList() {
    state.loading = true;
    state.loadStatus = 'loading';
    const baseParams = {
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
    };
    const res =
      state.currentTab === 0
        ? await Promise.all([
            BrokerageApi.getBrokerageRecordPage(baseParams),
            BrokerageApi.getBrokerageWithdrawPage(baseParams),
          ])
        : state.currentTab === 1
          ? await BrokerageApi.getBrokerageRecordPage(baseParams)
          : await BrokerageApi.getBrokerageWithdrawPage(baseParams);
    state.loading = false;
    if (Array.isArray(res)) {
      const [recordRes, withdrawRes] = res;
      const recordList =
        recordRes?.code === 0 && Array.isArray(recordRes?.data?.list) ? recordRes.data.list : [];
      const withdrawList =
        withdrawRes?.code === 0 && Array.isArray(withdrawRes?.data?.list) ? withdrawRes.data.list : [];
      const merged = [
        ...recordList.map((it) => ({ ...it, _kind: 'income', _key: `r-${it.id}` })),
        ...withdrawList.map((it) => ({ ...it, _kind: 'expense', _key: `w-${it.id}` })),
      ].sort((a, b) => Number(b.createTime || 0) - Number(a.createTime || 0));
      state.pagination.list = concat(state.pagination.list, merged);
      const total = (recordRes?.data?.total || 0) + (withdrawRes?.data?.total || 0);
      state.pagination.total = total;
      state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
      return;
    }
    if (res.code !== 0) {
      state.loadStatus = 'more';
      return;
    }
    const kind = state.currentTab === 2 ? 'expense' : 'income';
    state.pagination.list = concat(
      state.pagination.list,
      (res.data?.list || []).map((it) => ({ ...it, _kind: kind, _key: `${kind}-${it.id}` })),
    );
    state.pagination.total = res.data?.total || 0;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function onTabChange(idx) {
    if (state.currentTab === idx) return;
    state.currentTab = idx;
    resetPagination();
    loadList();
  }

  function rowTitle(item) {
    if (item?._kind === 'expense') {
      return item?.statusName || item?.typeName || item?.title || '';
    }
    return item?.title || item?.typeName || '';
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

  function onWithdrawNow() {
    sheep.$router.go('/pages/commission/withdraw');
  }

  function onGoWithdrawLog() {
    sheep.$router.go('/pages/commission/wallet', { type: 2 });
  }

  onLoad(async () => {
    await loadSummary();
    await loadList();
  });

  onReachBottom(() => {
    if (state.loadStatus === 'noMore') return;
    if (state.loading) return;
    state.pagination.pageNo += 1;
    loadList();
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
    background: #F8F9F3;
  }
  .nav-bar-container {
    background: #F8F9F3;
  }

  .nav-title {
    color: rgba(30, 63, 28, 0.9);
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
    margin: 3rpx 145rpx 0 0;
  }

  .text-wrapper_3 {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    border: 1rpx solid rgba(157, 156, 150, 1);
    padding: 21rpx 0 20rpx 0;
    margin: 39rpx 0 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
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
    color: rgba(54, 208, 7, 1);
    font-size: 32rpx;
    font-family: Helvetica, 'Microsoft YaHei', Arial, sans-serif;
    font-weight: normal;
    text-align: right;
    white-space: nowrap;
    line-height: 32rpx;
    margin: 44rpx 0 0 187rpx;
  }

  .text_22 {
    overflow-wrap: break-word;
    color: rgba(255, 0, 0, 1);
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

  .box_21 {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: 1rpx solid rgba(157, 156, 150, 0.3);
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
