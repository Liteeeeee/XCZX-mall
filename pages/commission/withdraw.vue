<!-- 分佣提现 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: 'rgba(248, 249, 243, 1.0)' }">
    <view class="page flex-col">
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
            class="nav-bar-inner flex-row align-center"
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
            <text class="nav-title">提现</text>
          </view>
        </view>
      </view>
      <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

      <view class="account-card flex-row justify-between" @tap="onAccountSelect(true)">
        <text class="account-label">提现账号</text>
        <text class="account-value">{{ withdrawAccountText }}</text>
      </view>

      <view class="amount-card flex-col">
        <text class="amount-label">提现金额</text>
        <view class="amount-row flex-row align-end">
          <text class="currency">¥</text>
          <input
            class="amount-input"
            v-model="state.accountInfo.price"
            type="digit"
            placeholder="0.00"
            placeholder-class="amount-placeholder"
          />
          <text class="withdraw-all" @tap="onWithdrawAll">全部提现</text>
        </view>
        <view class="divider-line"></view>
        <text class="balance-tip">可提现余额{{ fen2yuan(state.brokerageInfo.brokeragePrice) }}元</text>
      </view>

      <su-fixed bottom placeholder :bgStyles="{ backgroundColor: 'rgba(255, 255, 250, 1.0)' }">
        <view class="bottom-bar flex-col">
          <button class="ss-reset-button apply-btn" @tap="onConfirm">
            <text class="apply-btn-text">申请提现</text>
          </button>
        </view>
      </su-fixed>

      <account-type-select
        :show="state.accountSelect"
        @close="onAccountSelect(false)"
        round="10"
        v-model="state.accountInfo"
        :methods="state.withdrawTypes"
      />
    </view>
  </s-layout>
</template>

<script setup>
  import { onBeforeMount, reactive, computed } from 'vue';
  import sheep from '@/sheep';
  import accountTypeSelect from './components/account-type-select.vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import TradeConfigApi from '@/sheep/api/trade/config';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import { getWeixinPayChannelCode, goBindWeixin } from '@/sheep/platform/pay';

  const state = reactive({
    accountInfo: {
      // 提现表单
      type: undefined,
      price: '',
      userAccount: undefined,
      userName: undefined,
      qrCodeUrl: undefined,
      bankName: undefined,
      bankAddress: undefined,
    },

    accountSelect: false,

    brokerageInfo: {}, // 分销信息

    frozenDays: 0, // 冻结天数
    minPrice: 0, // 最低提现金额
    withdrawTypes: [], // 提现方式
  });

  const withdrawAccountText = computed(() => {
    const t = String(state.accountInfo.type || '');
    if (t === '1') return '钱包余额';
    if (t === '2') return '银行卡转账';
    if (t === '3') return '微信收款码';
    if (t === '4') return '支付宝收款码';
    if (t === '5') return '微信钱包';
    if (t === '6') return '支付宝余额';
    return '请选择';
  });

  function onWithdrawAll() {
    state.accountInfo.price = fen2yuan(state.brokerageInfo.brokeragePrice);
  }

  // 打开提现方式的弹窗
  const onAccountSelect = (e) => {
    state.accountSelect = e;
  };

  // 提交提现
  const onConfirm = async () => {
    // 参数校验
    const price = Number(state.accountInfo.price);
    const maxPrice = Number(state.brokerageInfo.brokeragePrice || 0) / 100;
    if (!price || price <= 0 || price > maxPrice) {
      sheep.$helper.toast('请输入正确的提现金额');
      return;
    }
    if (!state.accountInfo.type) {
      sheep.$helper.toast('请选择提现方式');
      return;
    }
    if (!['1', '5'].includes(String(state.accountInfo.type))) {
      sheep.$helper.toast('暂不支持该提现方式');
      return;
    }
    let openid;
    if (String(state.accountInfo.type) === '5') {
      openid = await sheep.$platform.useProvider('wechat').getOpenid();
      // 如果获取不到 openid，微信无法发起支付，此时需要引导
      if (!openid) {
        goBindWeixin();
        return;
      }
    }

    // 提交请求
    const data = {
      ...state.accountInfo,
      price: price * 100,
    };
    if (String(state.accountInfo.type) === '5') {
      data.userAccount = openid;
      data.transferChannelCode = getWeixinPayChannelCode();
    } else {
      delete data.userAccount;
      delete data.transferChannelCode;
    }
    let { code } = await BrokerageApi.createBrokerageWithdraw(data);
    if (code !== 0) {
      return;
    }
    // 提示
    uni.showModal({
      title: '操作成功',
      content: '您的提现申请已成功提交',
      cancelText: '继续提现',
      confirmText: '查看记录',
      success: (res) => {
        if (res.confirm) {
          sheep.$router.go('/pages/commission/wallet', { type: 2 });
          return;
        }
        getBrokerageUser();
        state.accountInfo = {};
      },
    });
  };

  // 获得分销配置
  async function getWithdrawRules() {
    let { code, data } = await TradeConfigApi.getTradeConfig();
    if (code !== 0) {
      return;
    }
    if (data) {
      state.minPrice = data.brokerageWithdrawMinPrice || 0;
      state.frozenDays = data.brokerageFrozenDays || 0;
      const enabled = (data.brokerageWithdrawTypes || []).filter((v) => [1, 5].includes(Number(v)));
      state.withdrawTypes = enabled.length ? enabled : [1, 5];
    }
  }

  // 获得分销信息
  async function getBrokerageUser() {
    const { data, code } = await BrokerageApi.getBrokerageUser();
    if (code === 0) {
      state.brokerageInfo = data;
    }
  }

  onBeforeMount(() => {
    getWithdrawRules();
    getBrokerageUser();
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

  .justify-between {
    display: flex;
    justify-content: space-between;
  }

  .align-center {
    display: flex;
    align-items: center;
  }

  .align-end {
    display: flex;
    align-items: flex-end;
  }

  .page {
    background-color: rgba(248, 249, 243, 1.0);
    width: 750rpx;
    min-height: 100vh;
  }

  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 10;
    background-color: rgba(248, 249, 243, 1.0);
  }

  .header-placeholder {
    width: 100%;
  }

  .nav-back {
    margin-left: 34rpx;
  }

  .nav-title {
    overflow-wrap: break-word;
    color: #000000;
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 50rpx;
    margin-left: 14rpx;
  }

  .account-card {
    background-color: rgba(255, 255, 250, 1.0);
    border-radius: 30rpx;
    width: 680rpx;
    margin: 18rpx 38rpx 0 32rpx;
    padding: 35rpx 24rpx 35rpx 24rpx;
    box-sizing: border-box;
  }

  .account-label {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .account-value {
    overflow-wrap: break-word;
    color: rgba(102, 102, 102, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .amount-card {
    background-color: rgba(255, 255, 250, 1.0);
    border-radius: 30rpx;
    margin: 24rpx 38rpx 0 32rpx;
    padding: 32rpx 18rpx 28rpx 23rpx;
    box-sizing: border-box;
  }

  .amount-label {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .amount-row {
    margin-top: 24rpx;
  }

  .currency {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 58rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    line-height: 81rpx;
  }

  .amount-input {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 70rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 82rpx;
    height: 82rpx;
    margin-left: 32rpx;
    flex: 1;
    min-width: 0;
  }

  .amount-placeholder {
    color: rgba(157, 156, 150, 1);
    font-size: 70rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
  }

  .withdraw-all {
    overflow-wrap: break-word;
    color: rgba(181, 158, 109, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 45rpx;
    margin-left: 24rpx;
  }

  .divider-line {
    width: 639rpx;
    border: 1rpx solid rgba(151, 151, 151, 0.2);
    margin-top: 12rpx;
  }

  .balance-tip {
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
    margin-top: 21rpx;
  }

  .bottom-bar {
    box-shadow: 0rpx -6rpx 10rpx 0rpx rgba(0, 0, 0, 0.02);
    background-color: rgba(255, 255, 250, 1.0);
    padding: 24rpx 32rpx 24rpx 32rpx;
  }

  .apply-btn {
    background-color: rgba(30, 63, 28, 1.0);
    border-radius: 20rpx;
    border: 1rpx solid rgba(157, 156, 150, 1);
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .apply-btn-text {
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 45rpx;
  }
</style>
