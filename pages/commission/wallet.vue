<!-- 分销 - 佣金明细 -->
<template>
  <s-layout class="wallet-wrap" title="佣金明细" navbar="clean">
    <view class="full-page-bg">
      <image :src="sheep.$url.static('/static/jifenbg.webp')" mode="widthFix" class="bg-img" />
    </view>
    <view class="header-box">
      <su-status-bar />
      <view
        class="custom-nav"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view class="nav-inner ss-flex ss-col-center">
          <view
            class="left-box ss-flex ss-col-center ss-p-l-30 ss-p-r-20"
            @tap="sheep.$router.back()"
          >
            <text class="sicon-back"></text>
          </view>
          <view class="title">收益明细</view>
        </view>
      </view>

      <view class="score-container ss-flex-col ss-p-x-40">
        <view class="score-box ss-flex ss-row-between ss-col-center">
          <view class="ss-flex-col">
            <view class="ss-m-b-10 ss-flex ss-col-center">
              <text class="all-title">当前收益(元)</text>
              <view
                @tap="state.showMoney = !state.showMoney"
                class="ss-eye-icon ss-m-l-10"
                :class="state.showMoney ? 'cicon-eye' : 'cicon-eye-off'"
              />
            </view>
            <text class="all-num">{{
              state.showMoney ? fen2yuan(state.summary.withdrawPrice || 0) : '*****'
            }}</text>
          </view>

          <view class="ss-flex">
            <view
              class="use-btn ss-flex ss-row-center ss-col-center ss-m-r-20"
              @tap="sheep.$router.go('/pages/commission/withdraw')"
            >
              提现
            </view>
            <view
              class="use-btn-outline ss-flex ss-row-center ss-col-center"
              @tap="state.showModal = true"
            >
              转余额
            </view>
          </view>
        </view>

        <view class="ss-flex ss-m-t-40 sub-info-box">
          <view class="ss-flex-col ss-flex-1">
            <view class="sub-title">冻结收益</view>
            <view class="sub-num">{{
              state.showMoney ? fen2yuan(state.summary.frozenPrice || 0) : '*****'
            }}</view>
          </view>
          <view class="ss-flex-col ss-flex-1">
            <view class="sub-title">可提现收益</view>
            <view class="sub-num">{{
              state.showMoney ? fen2yuan(state.summary.brokeragePrice || 0) : '*****'
            }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- tab -->
    <su-sticky :customNavHeight="sys_navBar">
      <view class="section_2 flex-col">
        <view class="text-wrapper_4 flex-row justify-between" style="width: 350rpx; margin: 0 auto">
          <text
            class="tab-item"
            :class="state.currentTab === 0 ? 'text_6' : 'text_7'"
            @tap="onChangeTab(0)"
            >获得收益</text
          >
          <text
            class="tab-item"
            :class="state.currentTab === 1 ? 'text_6' : 'text_7'"
            @tap="onChangeTab(1)"
            >提现</text
          >
        </view>
        <view class="group_39 flex-row" style="width: 350rpx; margin: 27rpx auto 0">
          <view
            class="block_12 flex-col"
            :style="{ transform: `translateX(${state.currentTab * 286}rpx)` }"
          ></view>
        </view>
      </view>
    </su-sticky>

    <!-- list -->
    <view class="list-box">
      <!-- 日期筛选 -->
      <view class="filter-box ss-flex ss-col-center ss-row-between ss-p-t-20 ss-p-b-10">
        <uni-datetime-picker
          v-model="state.date"
          type="daterange"
          @change="onChangeTime"
          :end="state.today"
        >
          <button class="ss-reset-button date-btn ss-flex ss-col-center">
            <text>{{ dateFilterText }}</text>
            <text class="cicon-drop-down ss-seldate-icon ss-m-l-10" />
          </button>
        </uni-datetime-picker>
      </view>

      <view v-if="state.pagination.total > 0">
        <!-- 分佣列表 -->
        <view v-if="state.currentTab === 0">
          <view class="list-item ss-flex-col" v-for="item in state.pagination.list" :key="item.id">
            <view class="ss-flex ss-col-center ss-row-between ss-m-b-20">
              <view class="name ss-line-1">{{ item.title }}</view>
              <view class="money">
                <text v-if="item.price >= 0" class="add">+{{ fen2yuan(item.price) }}</text>
                <text v-else class="minus">{{ fen2yuan(item.price) }}</text>
              </view>
            </view>
            <view class="ss-flex ss-row-between ss-col-center">
              <view class="time">{{
                sheep.$helper.timeFormat(item.createTime, 'yyyy.mm.dd hh:MM')
              }}</view>
              <view class="status" :class="'status-' + item.status">{{ item.statusName }}</view>
            </view>
          </view>
        </view>
        <!-- 提现列表 -->
        <view v-else>
          <view class="list-item ss-flex-col" v-for="item in state.pagination.list" :key="item.id">
            <view class="ss-flex ss-col-center ss-row-between ss-m-b-20">
              <view class="name ss-line-1">{{ item.typeName }}</view>
              <view class="money">
                <text class="minus">{{ fen2yuan(item.price) }}</text>
              </view>
            </view>
            <view class="ss-flex ss-row-between ss-col-center">
              <view class="time">{{
                sheep.$helper.timeFormat(item.createTime, 'yyyy.mm.dd hh:MM')
              }}</view>
              <button
                v-if="item.status === 10 && item.type === 5 && item.payTransferId > 0"
                class="ss-reset-button confirm-btn"
                @tap="onRequestMerchantTransfer(item)"
              >
                确认收款
              </button>
              <view v-else class="status" :class="'status-' + item.status">{{
                item.statusName
              }}</view>
            </view>
          </view>
        </view>
      </view>
      <s-empty v-else text="暂无数据" :icon="sheep.$url.static('/static/data-empty.webp')" />
    </view>

    <uni-load-more
      v-if="state.pagination.total > 0"
      :status="state.loadStatus"
      :content-text="{
        contentdown: '上拉加载更多',
      }"
    />

    <!-- 转余额弹框 -->
    <su-popup
      :show="state.showModal"
      type="bottom"
      round="20"
      @close="state.showModal = false"
      showClose
    >
      <view class="ss-p-x-20 ss-p-y-30">
        <view class="model-title ss-m-b-30 ss-m-l-20">转余额</view>
        <view class="model-subtitle ss-m-b-100 ss-m-l-20">将您的收益转到余额中继续消费</view>
        <view class="input-box ss-flex ss-col-center border-bottom ss-m-b-70 ss-m-x-20">
          <view class="unit">￥</view>
          <uni-easyinput
            :inputBorder="false"
            class="ss-flex-1 ss-p-l-10"
            v-model="state.price"
            type="number"
            placeholder="请输入金额"
          />
        </view>
        <button class="ss-reset-button model-btn" @tap="onConfirm"> 确定 </button>
      </view>
    </su-popup>
  </s-layout>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import dayjs from 'dayjs';
  import { concat } from 'lodash-es';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import { resetPagination } from '@/sheep/helper/utils';
  import PayTransferApi from '@/sheep/api/pay/transfer';

  const sys_navBar = sheep.$platform.navbar;

  const state = reactive({
    showMoney: false,
    summary: {}, // 分销信息

    today: '',
    date: [],
    currentTab: 0,
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 8,
    },
    loadStatus: '',

    price: undefined,
    showModal: false,
  });

  const dateFilterText = computed(() => {
    if (state.date[0] === state.date[1]) {
      return state.date[0];
    } else {
      return state.date.join('~');
    }
  });

  async function getLogList() {
    state.loadStatus = 'loading';
    let { code, data } = await (state.currentTab === 0
      ? BrokerageApi.getBrokerageRecordPage({
          pageSize: state.pagination.pageSize,
          pageNo: state.pagination.pageNo,
          'createTime[0]': state.date[0] + ' 00:00:00',
          'createTime[1]': state.date[1] + ' 23:59:59',
        })
      : BrokerageApi.getBrokerageWithdrawPage({
          pageSize: state.pagination.pageSize,
          pageNo: state.pagination.pageNo,
          'createTime[0]': state.date[0] + ' 00:00:00',
          'createTime[1]': state.date[1] + ' 23:59:59',
        }));
    if (code !== 0) {
      return;
    }
    state.pagination.list = concat(state.pagination.list, data.list);
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function onChangeTab(index) {
    resetPagination(state.pagination);
    state.currentTab = index;
    getLogList();
  }

  function onChangeTime(e) {
    state.date[0] = e[0];
    state.date[1] = e[e.length - 1];
    resetPagination(state.pagination);
    getLogList();
  }

  // 确认操作（转账到余额）
  async function onConfirm() {
    if (state.price <= 0) {
      sheep.$helper.toast('请输入正确的金额');
      return;
    }
    uni.showModal({
      title: '提示',
      content: '确认把您的佣金转入到余额钱包中？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const { code } = await BrokerageApi.createBrokerageWithdraw({
          type: 1, // 钱包
          price: state.price * 100,
        });
        if (code === 0) {
          state.showModal = false;
          await getAgentInfo();
          onChangeTab(1);
        }
      },
    });
  }

  async function getAgentInfo() {
    const { code, data } = await BrokerageApi.getBrokerageUserSummary();
    if (code !== 0) {
      return;
    }
    state.summary = data;
  }

  // 微信场景下：用户确认收款
  // 可见 https://pay.weixin.qq.com/doc/v3/merchant/4012716430 文档
  async function onRequestMerchantTransfer(item) {
    const requestMerchantTransfer = sheep.$platform.useProvider()
      ? sheep.$platform.useProvider().requestMerchantTransfer
      : undefined;
    if (!requestMerchantTransfer) {
      sheep.$helper.toast('仅微信平台支持该功能');
      return;
    }
    // 获取提现详情
    const { code, data } = await BrokerageApi.getBrokerageWithdraw(item.id);
    if (code !== 0) {
      return;
    }
    if (data.status === 11) {
      sheep.$helper.toast('该提现单已确认收款');
      item.status = 11;
      return;
    }
    if (!data.transferChannelMchId || !data.transferChannelPackageInfo) {
      sheep.$helper.toast('提现信息异常，请稍后再试');
      return;
    }
    // 调用微信确认收款
    const payTransferId = data.payTransferId;
    await requestMerchantTransfer(
      data.transferChannelMchId,
      data.transferChannelPackageInfo,
      async (res) => {
        if (res.result !== 'success') {
          sheep.$helper.toast(res.errMsg);
          return;
        }
        // 同步转账单状态
        try {
          const syncTransferResult = await PayTransferApi.syncTransfer(payTransferId);
          console.log('syncTransferResult 结果', syncTransferResult);
        } catch (e) {
          console.error('syncTransferResult 异常', e);
        }
        // 查询提现单最新状态
        const { data } = await BrokerageApi.getBrokerageWithdraw(item.id);
        if (data && data.status !== 11) {
          sheep.$helper.toast('确认收款成功，但数据存在延迟，请以实际【微信支付】到账为准');
          return;
        }
        sheep.$helper.toast('确认收款成功');
        // 更新到列表中
        item.status = 11;
      },
    );
  }

  onLoad(async (options) => {
    state.today = dayjs().format('YYYY-MM-DD');
    state.date = [state.today, state.today];
    if (options.type === '2') {
      // 切换到"提现" tab 下
      state.currentTab = 1;
    }
    getLogList();
    getAgentInfo();
  });

  onReachBottom(() => {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getLogList();
  });
</script>

<style lang="scss" scoped>
  .full-page-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: -1;
    .bg-img {
      width: 100%;
    }
  }

  .custom-nav {
    position: relative;
    width: 100%;

    .nav-inner {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 100%;
      width: 100%;

      .left-box {
        .sicon-back {
          font-size: 32rpx;
          color: #1e3f1c;
        }
      }

      .title {
        font-size: 32rpx;
        font-weight: 500;
        color: #1e3f1c;
      }
    }
  }

  .header-box {
    width: 100%;
    background: url('https://file.sheepjs.com/storage/img/2024/11/12/3df8a9a4b8784d1ab1b83d81f2113f8c.webp')
      no-repeat;
    background-size: 100% 100%;
    padding: 0 0 120rpx 0;
    box-sizing: border-box;

    .score-container {
      padding-top: 30rpx;
    }

    .score-box {
      .all-num {
        font-size: 64rpx;
        font-family: AlibabaPuHuiTiB;
        color: #000000;
        line-height: 88rpx;
      }

      .all-title {
        font-size: 28rpx;
        color: #9d9c96;
        line-height: 40rpx;
      }

      .ss-eye-icon {
        font-size: 36rpx;
        color: #9d9c96;
      }
    }

    .use-btn {
      background: linear-gradient(270deg, #0f5c31 0%, #06943f 100%);
      border-radius: 34rpx;
      padding: 0 39rpx;
      height: 68rpx;
      font-size: 28rpx;
      color: #fffefa;
    }

    .use-btn-outline {
      border: 2rpx solid #0f5c31;
      border-radius: 34rpx;
      padding: 0 39rpx;
      height: 64rpx;
      font-size: 28rpx;
      color: #0f5c31;
      background: transparent;
    }

    .sub-info-box {
      .sub-title {
        font-size: 24rpx;
        color: #9d9c96;
        margin-bottom: 8rpx;
      }
      .sub-num {
        font-size: 32rpx;
        font-family: AlibabaPuHuiTiB;
        color: #000000;
      }
    }
  }

  // 筛选
  .section_2 {
    background-image: linear-gradient(
      180deg,
      rgba(255, 255, 253, 0.8) 0,
      rgba(234, 243, 229, 0.8) 100%
    );
    border-radius: 22px 22px 0px 0px;
    padding: 38rpx 82rpx 0 82rpx;
    margin: -80rpx 33rpx 0;
    position: relative;
    z-index: 1;
  }
  .text-wrapper_4 {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .text_6 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    line-height: 45rpx;
  }
  .text_7 {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 32rpx;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 45rpx;
  }
  .group_39 {
    display: flex;
    flex-direction: row;
  }
  .block_12 {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 45px;
    width: 64rpx;
    height: 10rpx;
    transition: transform 0.3s;
  }

  .list-box {
    background: #fffefa;
    margin: 0 33rpx;
    padding: 0 30rpx;
    border-radius: 0 0 22rpx 22rpx;
    position: relative;
    z-index: 1;

    .filter-box {
      .date-btn {
        background-color: rgba(248, 249, 243, 1);
        border-radius: 27rpx;
        padding: 0 20rpx;
        font-size: 24rpx;
        font-weight: 500;
        color: rgba(61, 61, 60, 1);
        height: 54rpx;

        .ss-seldate-icon {
          font-size: 24rpx;
          color: rgba(61, 61, 60, 1);
        }
      }
    }

    .list-item {
      border-bottom: 1rpx solid rgba(157, 156, 150, 0.3);
      padding: 30rpx 0;
      &:last-child {
        border-bottom: none;
      }

      .name {
        font-size: 28rpx;
        font-weight: 500;
        color: rgba(0, 0, 0, 1);
        line-height: 28rpx;
        width: 400rpx;
      }

      .time {
        font-size: 24rpx;
        font-weight: normal;
        color: rgba(157, 156, 150, 1);
        line-height: 28rpx;
      }

      .money {
        .add {
          font-size: 32rpx;
          font-family: Helvetica;
          font-weight: normal;
          color: rgba(54, 208, 7, 1);
        }
        .minus {
          font-size: 32rpx;
          font-family: Helvetica;
          font-weight: normal;
          color: rgba(255, 0, 0, 1);
        }
      }

      .status {
        font-size: 24rpx;
        &.status-0 {
          color: #ff9900;
        }
        &.status-1 {
          color: #19be6b;
        }
        &.status-2 {
          color: #fa3534;
        }
      }

      .confirm-btn {
        font-size: 22rpx;
        color: #fffefa;
        background: linear-gradient(270deg, #0f5c31 0%, #06943f 100%);
        padding: 4rpx 16rpx;
        margin: 0;
        line-height: 1.4;
        border-radius: 20rpx;
      }
    }
  }

  .model-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333333;
  }

  .model-subtitle {
    font-size: 26rpx;
    color: #c2c7cf;
  }

  .model-btn {
    width: 100%;
    height: 80rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 500;
    color: #ffffff;
    line-height: normal;
    background: linear-gradient(270deg, #0f5c31 0%, #06943f 100%);
  }

  .input-box {
    height: 100rpx;

    .unit {
      font-size: 48rpx;
      color: #333;
      font-weight: 500;
      line-height: normal;
    }

    :deep(.uni-easyinput__placeholder-class) {
      font-size: 30rpx;
      height: 40rpx;
      line-height: normal;
    }
  }
</style>
