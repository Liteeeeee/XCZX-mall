<template>
  <s-layout class="wallet-recharge-wrap" navbar="clear" :bgStyle="{ color: 'transparent' }">
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
          }"
        >
          <uni-icons
            type="left"
            size="22"
            color="#000"
            @tap="sheep.$router.back()"
            class="ss-m-l-20"
          ></uni-icons>
          <text class="nav-title ss-m-l-10">会员充值</text>
        </view>
      </view>
    </view>
    <view
      class="wallet-recharge-page"
      :style="{
        backgroundImage: `url(${sheep.$url.cdn('/mp/static/vipNeo/chongzhiBg.webp')})`,
      }"
    >
      <view class="top-bg"></view>

      <view
        class="balance-card"
        :style="{
          backgroundImage: 'url(' + sheep.$url.static('/static/chongzhiBg.webp') + ')',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }"
      >
        <view class="balance-row">
          <text class="balance-label">账户余额（元）</text>
          <text class="balance-value count-font">{{
            state.showMoney ? fen2yuan(userWallet.balance) : '*****'
          }}</text>
        </view>
        <view class="balance-actions" @tap="sheep.$router.go('/pages/user/wallet/money')">
          <text class="detail-text">消费明细</text>
          <uni-icons type="right" size="14" color="#9D9C96" class="detail-arrow" />
        </view>
      </view>

      <view class="content-card">
        <view class="recharge-header">
          <view class="recharge-title">
            <view class="recharge-title-bar"></view>
            <text class="recharge-title-text">充值金额</text>
          </view>
          <view class="recharge-record" @tap="onGoRechargeLog">
            <text class="recharge-record-text">充值记录</text>
            <text class="recharge-record-arrow">›</text>
          </view>
        </view>

        <view class="package-grid">
          <view
            class="package-item"
            v-for="item in state.packageList"
            :key="item.id"
            :class="{ active: state.selectedPackageId === item.id }"
            @tap="onSelectPackage(item)"
          >
            <view class="package-text">
              <view class="package-amount">
                <text class="package-unit">¥</text>
                <text class="package-price count-font">{{ formatYuanInt(item.payPrice) }}</text>
              </view>
              <text class="package-desc">{{ getPackageDesc(item) }}</text>
            </view>
            <view class="package-corner" v-if="state.selectedPackageId === item.id">
              <image
                class="package-selected-icon"
                :src="sheep.$url.static('/static/selected.webp')"
                mode="aspectFit"
              />
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-bar">
        <button class="ss-reset-button confirm-btn" :disabled="state.submitting" @tap="onConfirm">
          立即充值
        </button>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import PayWalletApi from '@/sheep/api/pay/wallet';
  import CouponApi from '@/sheep/api/promotion/coupon';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const userWallet = computed(() => sheep.$store('user').userWallet);

  const state = reactive({
    showMoney: true,
    packageList: [],
    selectedPackageId: null,
    submitting: false,
    couponTemplateNameMap: {},
  });

  async function loadCouponTemplateNames(list) {
    if (!Array.isArray(list) || list.length === 0) return;
    const ids = Array.from(
      new Set(
        list
          .map((it) => Number(it?.couponTemplateId))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );
    const missing = ids.filter((id) => !state.couponTemplateNameMap[id]);
    if (missing.length === 0) return;
    await Promise.all(
      missing.map(async (id) => {
        const { code, data } = await CouponApi.getCouponTemplate(id);
        if (code !== 0) return;
        const name = data?.name;
        if (typeof name === 'string' && name) {
          state.couponTemplateNameMap[id] = name;
        }
      }),
    );
  }

  async function loadPackages() {
    const { code, data } = await PayWalletApi.getWalletRechargePackageList();
    if (code !== 0) return;
    state.packageList = Array.isArray(data) ? data : [];
    if (state.selectedPackageId === null && state.packageList.length) {
      state.selectedPackageId = state.packageList[0].id;
    }
    await loadCouponTemplateNames(state.packageList);
  }

  function onSelectPackage(item) {
    if (!item?.id) return;
    state.selectedPackageId = item.id;
  }

  function getPackageDesc(item) {
    const couponTemplateId = Number(item?.couponTemplateId);
    if (Number.isFinite(couponTemplateId) && couponTemplateId > 0) {
      const name = state.couponTemplateNameMap[couponTemplateId];
      if (typeof name === 'string' && name) return `赠送${name}`;
      return '';
    }
    const raw =
      item?.bonusContent ??
      item?.giftContent ??
      item?.description ??
      item?.desc ??
      item?.info ??
      '';
    if (typeof raw === 'string' && raw) return raw;
    const bonusPrice = Number(item?.bonusPrice);
    if (Number.isFinite(bonusPrice) && bonusPrice > 0) {
      return `赠送${fen2yuan(bonusPrice)}元无门槛券`;
    }
    return '';
  }

  function formatYuanInt(priceFen) {
    const s = String(fen2yuan(priceFen ?? 0));
    const i = s.indexOf('.');
    return i >= 0 ? s.slice(0, i) : s;
  }

  function onGoRechargeLog() {
    sheep.$router.go('/pages/pay/recharge-log');
  }

  async function onConfirm() {
    if (state.submitting) return;
    const pkg = state.packageList.find((it) => it.id === state.selectedPackageId);
    if (!pkg) {
      sheep.$helper.toast('请选择充值金额');
      return;
    }
    state.submitting = true;
    const { code, data } = await PayWalletApi.createWalletRecharge({
      packageId: pkg.id,
      payPrice: pkg.payPrice,
    });
    state.submitting = false;
    if (code !== 0) return;
    sheep.$router.go('/pages/pay/index', {
      id: data.payOrderId,
      orderType: 'recharge',
    });
  }

  onLoad(async () => {
    await loadCountFont();
    await loadPackages();
    sheep.$store('user').getWallet();
  });

  onShow(() => {
    sheep.$store('user').getWallet();
  });

  async function loadCountFont() {
    const url = sheep.$url.cdn('/mp/static/count_font.ttf');
    if (!url) return;
    const source = `url("${url}")`;

    // #ifdef MP-WEIXIN
    if (typeof wx !== 'undefined' && wx.loadFontFace) {
      await new Promise((resolve) => {
        wx.loadFontFace({
          family: 'CountFont',
          source,
          success: () => resolve(),
          fail: () => resolve(),
        });
      });
      return;
    }
    // #endif

    if (typeof uni !== 'undefined' && uni.loadFontFace) {
      await new Promise((resolve) => {
        uni.loadFontFace({
          family: 'CountFont',
          source,
          success: () => resolve(),
          fail: () => resolve(),
        });
      });
    }
  }
</script>

<style lang="scss" scoped>
  @font-face {
    font-family: 'CountFont';
    src: url('https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/count_font.ttf');
    font-weight: normal;
    font-style: normal;
  }

  .count-font {
    font-family: CountFont, DINAlternate-Bold, OPPOSANS, PingFangSC-Medium;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    background: transparent;
  }
  .nav-bar-container {
    background: transparent;
  }
  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
  }

  .wallet-recharge-page {
    background-color: rgba(248, 249, 243, 1);
    position: relative;
  }

  .top-bg {
    width: 750rpx;
    height: 450rpx;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
  }

  .content-card {
    background-color: rgba(255, 254, 250, 1);
    border-radius: 22rpx;
    width: 750rpx;
    height: 65vh;
    margin-top: 0;
    padding: 6rpx 32rpx 40rpx 32rpx;
    box-sizing: border-box;
  }

  .balance-card {
    border-radius: 22rpx 22rpx 0 0;
    height: 216rpx;
    padding: 46rpx 34rpx 21rpx 34rpx;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    width: 686rpx;
    margin: -243rpx auto 0 auto;
    z-index: 2;
  }

  .balance-row {
    display: flex;
    flex-direction: column;
  }

  .balance-label {
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    line-height: 40rpx;
  }

  .balance-value {
    color: rgba(30, 63, 28, 1);
    font-size: 84rpx;
    line-height: 98rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    margin-top: 8rpx;
  }

  .balance-actions {
    position: absolute;
    right: 34rpx;
    top: 46rpx;
    display: flex;
    align-items: center;
  }

  .detail-text {
    font-size: 24rpx;
    color: #9d9c96;
    line-height: 33rpx;
  }

  .detail-arrow {
    margin-left: 4rpx;
  }

  .recharge-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 30rpx;
  }

  .recharge-title {
    display: flex;
    align-items: center;
  }

  .recharge-title-bar {
    width: 8rpx;
    height: 32rpx;
    border-radius: 91rpx;
    background-color: rgba(30, 63, 28, 1);
    margin-right: 16rpx;
  }

  .recharge-title-text {
    color: rgba(0, 0, 0, 1);
    font-size: 32rpx;
    line-height: 45rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
  }

  .recharge-record {
    display: flex;
    align-items: center;
  }

  .recharge-record-text {
    color: rgba(157, 156, 150, 1);
    font-size: 28rpx;
    line-height: 40rpx;
  }

  .recharge-record-arrow {
    color: rgba(157, 156, 150, 1);
    font-size: 28rpx;
    line-height: 40rpx;
    margin-left: 6rpx;
  }

  .package-grid {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-top: 31rpx;
  }

  .package-item {
    width: 222rpx;
    height: 170rpx;
    background-color: rgba(255, 255, 250, 1);
    border-radius: 14rpx;
    border: 2rpx solid rgba(157, 156, 150, 0.5);
    box-sizing: border-box;
    position: relative;
    margin-bottom: 18rpx;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .package-item.active {
    background-color: rgba(248, 249, 243, 1);
    border: 2rpx solid rgba(30, 63, 28, 1);
  }

  .package-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .package-amount {
    display: flex;
    align-items: baseline;
    justify-content: center;
    font-family: DINAlternate-Bold;
    font-weight: 700;
  }

  .package-unit {
    color: #3d3d3c;
    font-size: 28rpx;
    line-height: 48rpx;
  }

  .package-price {
    color: #3d3d3c;
    font-size: 48rpx;
    line-height: 48rpx;
  }

  .package-desc {
    color: #9d9c96;
    font-size: 22rpx;
    line-height: 30rpx;
    margin-top: 6rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .package-corner {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 14rpx 0rpx 10rpx 0rpx;
    width: 37rpx;
    height: 37rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 0;
    bottom: 0;
  }

  .package-selected-icon {
    width: 24rpx;
    height: 24rpx;
  }

  .bottom-bar {
    box-shadow: 0 -6rpx 10rpx 0 rgba(0, 0, 0, 0.02);
    background-color: rgba(255, 255, 250, 1);
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 24rpx 32rpx;
    box-sizing: border-box;
  }

  .confirm-btn {
    width: 686rpx;
    height: 88rpx;
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    font-size: 32rpx;
    line-height: 45rpx;
    color: rgba(255, 254, 250, 1);
    margin-bottom: 36rpx;
  }

  .confirm-btn[disabled] {
    opacity: 0.6;
  }
</style>
