<!-- 我的钱包 -->
<template>
  <s-layout
    class="wallet-wrap"
    navbar="clear"
    :bgStyle="{ color: 'rgba(248, 250, 251, 1)' }"
    @scrolltolower="loadMore"
  >
    <view class="wallet-page-bg">
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
          }"
        >
          <uni-icons
            type="left"
            size="22"
            color="#000"
            @tap="sheep.$router.back()"
            class="ss-m-l-20"
          ></uni-icons>
          <text class="nav-title ss-m-l-10">消费明细</text>
        </view>
      </view>
      <view v-if="state.pagination.total === 0" style="padding-top: 100rpx">
        <s-empty text="暂无数据" :icon="sheep.$url.static('/static/data-empty.webp')" />
      </view>

      <view v-if="state.pagination.total > 0" class="list-container">
        <view
          class="wallet-list flex-row justify-between"
          v-for="item in state.pagination.list"
          :key="item.id"
        >
          <view class="list-content flex-col">
            <text class="title ss-line-1">
              {{ item.title }}
            </text>
            <text class="time">
              {{ sheep.$helper.timeFormat(item.createTime, 'yyyy.mm.dd   hh:MM') }}
            </text>
          </view>
          <view class="money-box flex-col justify-center">
            <text v-if="item.price >= 0" class="add">+{{ fen2yuan(item.price) }}</text>
            <text v-else class="minus">{{ fen2yuan(item.price) }}</text>
          </view>
        </view>
      </view>
      <uni-load-more
        v-if="state.pagination.total > 0"
        :status="state.loadStatus"
        :content-text="{
          contentdown: '上拉加载更多',
        }"
        @tap="loadMore"
      />
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import dayjs from 'dayjs';
  import PayWalletApi from '@/sheep/api/pay/wallet';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import { resetPagination } from '@/sheep/helper/utils';

  const headerBg = sheep.$url.css('/static/img/shop/user/wallet_card_bg.webp');
  const statusBarHeight = sheep.$platform.device.statusBarHeight;
  const navbarHeight = sheep.$platform.navbar;

  // 数据
  const state = reactive({
    showMoney: false,
    date: [], // 筛选的时间段
    currentTab: 0,
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 8,
    },
    summary: {
      totalIncome: 0,
      totalExpense: 0,
    },
    loadStatus: '',
    today: '',
  });

  const tabMaps = [
    {
      name: '全部',
      value: '',
    },
    {
      name: '收入',
      value: '1',
    },
    {
      name: '支出',
      value: '2',
    },
  ];

  const userWallet = computed(() => sheep.$store('user').userWallet);

  // 格式化时间段
  const dateFilterText = computed(() => {
    if (state.date[0] === state.date[1]) {
      return state.date[0];
    } else {
      return state.date.join('~');
    }
  });

  // 获得钱包记录分页
  async function getLogList() {
    if (state.loadStatus === 'loading') return;

    state.loadStatus = 'loading';
    const { data, code } = await PayWalletApi.getWalletTransactionPage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
    });
    if (code !== 0) {
      state.loadStatus = 'more';
      return;
    }
    state.pagination.list = state.pagination.list.concat(data.list);
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  // 获得钱包统计
  async function getSummary() {
    const { data, code } = await PayWalletApi.getWalletTransactionSummary({
      createTime: [state.date[0] + ' 00:00:00', state.date[1] + ' 23:59:59'],
    });
    if (code !== 0) {
      return;
    }
    state.summary = data;
  }

  onLoad(() => {
    getLogList();
    // 刷新钱包的缓存
    sheep.$store('user').getWallet();
  });

  // 处理 tab 切换
  function onChange(e) {
    state.currentTab = e.index;
    // 重新加载列表
    resetPagination(state.pagination);
    getLogList();
    getSummary();
  }

  // 处理时间筛选
  function onChangeTime(e) {
    state.date[0] = e[0];
    state.date[1] = e[e.length - 1];
    // 重新加载列表
    resetPagination(state.pagination);
    getLogList();
    getSummary();
  }

  // 加载更多
  function loadMore() {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getLogList();
  }

  // 监听页面滚动到底部
  onReachBottom(() => {
    loadMore();
  });
</script>

<style lang="scss" scoped>
  // 钱包
  .wallet-page-bg {
    background-color: rgba(248, 250, 251, 1);
    min-height: 100vh;
  }
  .header-box {
    background-color: rgba(248, 250, 251, 1);
    padding: 30rpx;

    .card-box {
      width: 100%;
      min-height: 300rpx;
      padding: 40rpx;
      background-size: 100% 100%;
      border-radius: 30rpx;
      overflow: hidden;
      position: relative;
      z-index: 1;
      box-sizing: border-box;

      &::after {
        content: '';
        display: block;
        width: 100%;
        height: 100%;
        z-index: 2;
        position: absolute;
        top: 0;
        left: 0;
        background: v-bind(headerBg) no-repeat;
        pointer-events: none;
      }

      .card-head {
        color: $white;
        font-size: 30rpx;
      }

      .ss-eye-icon {
        font-size: 40rpx;
        color: $white;
      }

      .money-num {
        font-size: 70rpx;
        line-height: 70rpx;
        font-weight: 500;
        color: $white;
        position: relative;
        z-index: 9;
        font-family: OPPOSANS;
      }

      .topup-btn {
        height: 60rpx;
        line-height: 60rpx;
        background: $white;
        border-radius: 30rpx;
        padding: 0 40rpx;
        font-size: 26rpx;
        font-weight: 500;
        position: relative;
        z-index: 9;
      }
    }
  }

  // 筛选

  .filter-box {
    height: 114rpx;
    background-color: rgba(248, 250, 251, 1);

    .total-box {
      font-size: 24rpx;
      font-weight: 500;
      color: $dark-9;
    }

    .date-btn {
      background-color: $white;
      line-height: 54rpx;
      border-radius: 27rpx;
      padding: 0 20rpx;
      font-size: 24rpx;
      font-weight: 500;
      color: $dark-6;

      .ss-seldate-icon {
        font-size: 50rpx;
        color: $dark-9;
      }
    }
  }

  .tabs-box {
    background: rgba(248, 250, 251, 1);
  }

  // tab
  .wallet-tab-card {
    .tab-item {
      height: 80rpx;
      position: relative;

      .tab-title {
        font-size: 30rpx;
      }

      .cur-tab-title {
        font-weight: $font-weight-bold;
      }

      .tab-line {
        width: 60rpx;
        height: 6rpx;
        border-radius: 6rpx;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 2rpx;
        background-color: var(--ui-BG-Main);
      }
    }
  }

  .list-container {
    background-color: rgba(255, 254, 250, 1);
    border-radius: 22rpx;
    margin: 40rpx 31rpx 0 33rpx;
    padding: 0 30rpx 40rpx 29rpx;
  }

  .wallet-list {
    position: relative;
    padding: 24rpx 0;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 626rpx;
      height: 1rpx;
      border-bottom: 1rpx solid rgba(157, 156, 150, 0.3);
    }

    &:last-child::after {
      display: none;
    }

    .list-content {
      justify-content: center;

      .title {
        color: rgba(0, 0, 0, 1);
        font-size: 28rpx;
        font-family: PingFangSC-Medium;
        font-weight: 500;
        line-height: 28rpx;
        width: 400rpx;
      }

      .time {
        color: rgba(157, 156, 150, 1);
        font-size: 28rpx;
        font-family: PingFangSC-Regular;
        font-weight: normal;
        line-height: 28rpx;
        margin-top: 16rpx;
      }
    }

    .money-box {
      font-family: Helvetica, 'Microsoft YaHei', Arial, sans-serif;
      font-size: 32rpx;
      font-weight: normal;
      text-align: right;
      line-height: 32rpx;

      .add {
        color: rgba(54, 208, 7, 1);
      }

      .minus {
        color: rgba(255, 0, 0, 1);
      }
    }
  }

  .flex-col {
    display: flex;
    flex-direction: column;
  }
  .flex-row {
    display: flex;
    flex-direction: row;
  }
  .justify-between {
    justify-content: space-between;
  }
  .justify-center {
    justify-content: center;
  }
  .nav-title {
    color: rgba(0, 0, 0, 0.9);
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 50rpx;
  }
</style>
