<!-- 收银台 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ backgroundColor: 'rgba(248, 249, 243, 1.0)' }">
    <view class="fixed-header">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{
          position: 'relative',
          height: (sheep.$platform.navbar - sheep.$platform.device.statusBarHeight) + 'px',
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
            color="rgba(30, 63, 28, 0.9)"
            @tap="onBack"
            class="ss-m-l-20"
          ></uni-icons>
          <text class="nav-title ss-m-l-10">收银台</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

    <view class="page-body">
      <view class="pay-info ss-flex-col ss-col-center">
        <text class="pay-label">实付金额</text>
        <view class="pay-amount ss-flex ss-col-center">
          <text class="amount-currency">¥</text>
          <text class="amount-int">{{ amountInt }}</text>
          <text class="amount-dec">.{{ amountDec }}</text>
        </view>
        <view class="countdown-row ss-flex ss-col-center" v-if="state.payStatus === 1">
          <text class="countdown-text">请在</text>
          <text class="countdown-time">{{ remainTimeText }}</text>
          <text class="countdown-text">内支付</text>
        </view>
        <view class="countdown-row ss-flex ss-col-center" v-else-if="payDescText">
          <text class="countdown-text">{{ payDescText }}</text>
        </view>
      </view>

      <view class="section-title">选择支付方式</view>

      <radio-group @change="onTapPay" class="pay-methods">
        <label
          class="pay-method-card ss-flex ss-col-center ss-row-between"
          v-for="item in state.payMethods"
          :key="item.title"
          :class="[{ disabled: item.disabled }, { wallet: item.value === 'wallet' }]"
        >
          <view class="ss-flex ss-col-center">
            <image
              class="pay-method-icon"
              v-if="item.disabled"
              :src="sheep.$url.static('/static/img/shop/pay/cod_disabled.webp')"
              mode="aspectFit"
            />
            <image
              class="pay-method-icon"
              v-else
              :src="sheep.$url.static(item.icon)"
              mode="aspectFit"
            />
            <view class="pay-method-text ss-flex-col">
              <text class="pay-method-title">{{ item.title }}</text>
              <text v-if="item.value === 'wallet'" class="pay-method-sub"
                >可用余额¥{{ fen2yuan(userWallet.balance) }}</text
              >
            </view>
          </view>

          <view class="pay-method-right ss-flex ss-col-center">
            <radio
              class="pay-method-radio"
              :value="item.value"
              :disabled="item.disabled"
              :checked="state.payment === item.value"
            />
            <view class="select-circle" :class="{ checked: state.payment === item.value }">
              <view class="select-dot" v-if="state.payment === item.value"></view>
            </view>
          </view>
        </label>
      </radio-group>
    </view>

    <view class="page-footer">
      <button v-if="state.payStatus === 0" class="ss-reset-button pay-btn disabled-state">
        检测支付环境中
      </button>
      <button
        v-else-if="state.payStatus === -1"
        class="ss-reset-button pay-btn disabled-state"
        disabled
      >
        支付已过期
      </button>
      <button
        v-else
        class="ss-reset-button pay-btn"
        @tap="onPay"
        :disabled="state.payStatus !== 1"
        :class="{ 'disabled-state': state.payStatus !== 1 }"
      >
        立即支付
      </button>
      <view class="safe-box" />
    </view>
  </s-layout>
</template>
<script setup>
  import { computed, reactive, ref } from 'vue';
  import { onLoad, onUnload } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import PayOrderApi from '@/sheep/api/pay/order';
  import PayChannelApi from '@/sheep/api/pay/channel';
  import { getPayMethods, goPayResult } from '@/sheep/platform/pay';

  const userWallet = computed(() => sheep.$store('user').userWallet);
  const allowPayMethodValues = computed(() =>
    state.orderType === 'vip_upgrade' ? ['wechat'] : ['wechat', 'wallet'],
  );

  // 检测支付环境
  const state = reactive({
    orderType: 'goods', // 订单类型; goods - 商品订单, recharge - 充值订单
    orderInfo: {}, // 支付单信息
    payStatus: 0, // 0=检测支付环境, -2=未查询到支付单信息， -1=支付已过期， 1=待支付，2=订单已支付
    payMethods: [], // 可选的支付方式
    payment: '', // 选中的支付方式
  });

  const remainTimeText = ref('');
  const timer = ref(null);

  const amountYuan = computed(() => fen2yuan(state.orderInfo.price || 0));
  const amountInt = computed(() => (amountYuan.value || '0.00').split('.')[0] || '0');
  const amountDec = computed(() => (amountYuan.value || '0.00').split('.')[1] || '00');

  const onPay = () => {
    if (state.payment === '') {
      sheep.$helper.toast('请选择支付方式');
      return;
    }
    if (state.payment === 'wallet') {
      uni.showModal({
        title: '提示',
        content: '确定要支付吗?',
        success: function (res) {
          if (res.confirm) {
            sheep.$platform.pay(state.payment, state.orderType, state.orderInfo.id);
          }
        },
      });
    } else {
      sheep.$platform.pay(state.payment, state.orderType, state.orderInfo.id);
    }
  };

  // 支付文案提示
  const payDescText = computed(() => {
    if (state.payStatus === 2) {
      return '该订单已支付';
    }
    if (state.payStatus === -2) {
      return '未查询到支付单信息';
    }
    return '';
  });

  // 状态转换：payOrder.status => payStatus
  function checkPayStatus() {
    if (state.orderInfo.status === 10 || state.orderInfo.status === 20) {
      // 支付成功
      state.payStatus = 2;
      // 跳转回支付成功页
      uni.showModal({
        title: '提示',
        content: '订单已支付',
        showCancel: false,
        success: function () {
          goPayResult(state.orderInfo.id, state.orderType);
        },
      });
      return;
    }
    if (state.orderInfo.status === 30) {
      // 支付关闭
      state.payStatus = -1;
      return;
    }
    state.payStatus = 1; // 待支付
  }

  // 切换支付方式
  function onTapPay(e) {
    state.payment = e.detail.value;
  }

  // 设置支付订单信息
  async function setOrder(id) {
    
    // 获得支付订单信息
    const { data, code } = await PayOrderApi.getOrder(id, true);
    if (code !== 0 || !data) {
      state.payStatus = -2;
      return;
    }
    state.orderInfo = data;
    // 设置支付状态
    checkPayStatus();
    startCountdown();
    // 获得支付方式
    await setPayMethods();
  }

  function parseTimeMs(time) {
    const str = time?.toString?.() ?? '';
    if (!str) return 0;
    if (str.indexOf('-') > 0) {
      const ms = Date.parse(str.replace(/-/g, '/'));
      return Number.isNaN(ms) ? 0 : ms;
    }
    if (/^\d+$/.test(str)) {
      const n = parseInt(str, 10);
      if (str.length === 10) return n * 1000;
      if (str.length > 10) return n;
    }
    const ms = Date.parse(str);
    return Number.isNaN(ms) ? 0 : ms;
  }

  function startCountdown() {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
    if (state.payStatus !== 1) {
      remainTimeText.value = '';
      return;
    }

    let expireMs = 0;
    if (state.orderInfo?.expireTime) {
      expireMs = parseTimeMs(state.orderInfo.expireTime);
    }
    
    // 如果没有获取到合法的过期时间（后端未返回或解析失败），且是 VIP 升级订单，给个默认的兜底时间（如创建时间 + 30 分钟）
    if (expireMs <= 0 && state.orderType === 'vip_upgrade') {
      const createMs = parseTimeMs(state.orderInfo?.createTime) || Date.now();
      expireMs = createMs + 30 * 60 * 1000; 
    }

    if (expireMs <= 0) {
      remainTimeText.value = '';
      return;
    }

    const tick = () => {
      const ms = expireMs - Date.now();
      if (ms <= 0) {
        remainTimeText.value = '';
        state.payStatus = -1;
        if (timer.value) {
          clearInterval(timer.value);
          timer.value = null;
        }
        return;
      }
      const totalSeconds = Math.floor(ms / 1000);
      const h = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
      const m = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const s = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, '0');
      remainTimeText.value = `${h}:${m}:${s}`;
    };
    tick();
    timer.value = setInterval(tick, 1000);
  }

  // 获得支付方式
  async function setPayMethods() {
    const { data, code } = await PayChannelApi.getEnableChannelCodeList(state.orderInfo.appId);
    if (code !== 0) {
      return;
    }
    let channels = data || [];
    // 兼容会员升级等可能没有返回正确 appId 导致渠道为空的情况
    if (channels.length === 0 && state.orderType === 'vip_upgrade') {
      channels = ['wx_lite', 'wx_pub', 'wx_app', 'alipay_wap', 'alipay_app'];
    }
    state.payMethods = getPayMethods(channels).filter((item) =>
      allowPayMethodValues.value.includes(item.value),
    );
    state.payMethods.find((item) => {
      if (item.value && !item.disabled) {
        state.payment = item.value;
        return true;
      }
    });
  }

  function onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      sheep.$router.back();
    } else {
      if (state.orderType === 'vip_upgrade') {
        sheep.$router.go('/pages/index/member');
      } else {
        sheep.$router.go('/pages/index/index');
      }
    }
  }

  onLoad((options) => {
    if (
      sheep.$platform.name === 'WechatOfficialAccount' &&
      sheep.$platform.os === 'ios' &&
      !sheep.$platform.landingPage.includes('pages/pay/index')
    ) {
      location.reload();
      return;
    }
    // 获得支付订单信息
    let id = options.id;
    if (options.orderType) {
      state.orderType = options.orderType;
    }
    state.payMethods = getPayMethods([]).filter((item) => allowPayMethodValues.value.includes(item.value));
    setOrder(id);
    // 刷新钱包的缓存
    sheep.$store('user').getWallet();
  });

  onUnload(() => {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  });
</script>

<style lang="scss" scoped>
  @font-face {
    font-family: 'CountFont';
    src: url('https://xiancao.oss-cn-beijing.aliyuncs.com/static/count_font.ttf') format('truetype');
  }

  .fixed-header {
    width: 100%;
    background-color: transparent;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    background-color: rgba(248, 249, 243, 1);
  }

  .nav-title {
    overflow-wrap: break-word;
    color: #000000;
    font-size: 36rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    text-align: left;
    white-space: nowrap;
    line-height: 50rpx;
  }

  .page-body {
    padding: 0 32rpx;
    padding-bottom: calc(210rpx + env(safe-area-inset-bottom));
  }

  .pay-info {
    padding-top: 38rpx;
  }

  .pay-label {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
    margin-top: 38rpx;
  }

  .pay-amount {
    margin-top: 10rpx;
    font-family: 'CountFont', sans-serif;
  }

  .amount-currency {
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 52rpx;
    text-align: left;
    white-space: nowrap;
    line-height: 73rpx;
    margin-top: 10rpx;
  }

  .amount-int {
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 80rpx;
    text-align: left;
    white-space: nowrap;
    line-height: 112rpx;
    margin-left: 12rpx;
  }

  .amount-dec {
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 52rpx;
    text-align: left;
    white-space: nowrap;
    line-height: 73rpx;
    margin-top: 30rpx;
    margin-left: 3rpx;
  }

  .countdown-row {
    margin-top: 10rpx;
  }

  .countdown-text {
    height: 40rpx;
    overflow-wrap: break-word;
    color: rgba(134, 144, 156, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    text-align: left;
    white-space: nowrap;
    line-height: 28rpx;
  }

  .countdown-time {
    height: 40rpx;
    overflow-wrap: break-word;
    color: rgba(255, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 28rpx;
    margin: 0 12rpx;
  }

  .section-title {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    text-align: left;
    white-space: nowrap;
    line-height: 37rpx;
    margin: 82rpx 0 0 8rpx;
  }

  .pay-methods {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-top: 40rpx;
  }

  .pay-method-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    width: 100%;
    max-width: 686rpx;
    height: 110rpx;
    padding: 34rpx 28rpx 34rpx 30rpx;
    margin: 0 0 24rpx 0;
    box-sizing: border-box;
  }

  .pay-method-card.wallet {
    height: 110rpx;
    padding: 34rpx 28rpx 34rpx 30rpx;
  }

  .pay-method-card.disabled {
    opacity: 0.6;
  }

  .pay-method-icon {
    width: 37rpx;
    height: 37rpx;
  }

  .pay-method-text {
    margin-left: 22rpx;
  }

  .pay-method-title {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 30rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 42rpx;
  }

  .pay-method-sub {
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 22rpx;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    text-align: left;
    white-space: nowrap;
    line-height: 30rpx;
    margin-top: 5rpx;
  }

  .pay-method-right {
    position: relative;
  }

  .pay-method-radio {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }

  .select-circle {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 50%;
    width: 34rpx;
    height: 34rpx;
    border: 2rpx solid rgba(194, 194, 204, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .select-circle.checked {
    border-color: rgba(30, 63, 28, 1);
  }

  .select-dot {
    width: 18rpx;
    height: 18rpx;
    border-radius: 50%;
    background-color: rgba(30, 63, 28, 1);
  }

  .page-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: 0px -6rpx 10rpx 0px rgba(0, 0, 0, 0.02);
    background-color: rgba(255, 255, 250, 1);
    padding: 24rpx 32rpx 0 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pay-btn {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    width: 686rpx;
    height: 88rpx;
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    color: rgba(255, 254, 250, 1);
    line-height: 45rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .disabled-state {
    opacity: 0.6;
  }

  .safe-box {
    height: calc(constant(safe-area-inset-bottom) / 5 * 3);
    height: calc(env(safe-area-inset-bottom) / 5 * 3);
  }
</style>
