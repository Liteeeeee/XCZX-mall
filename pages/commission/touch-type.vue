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
            <text class="nav-title">触达类型</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view class="option-card">
          <view class="option-row" @tap="goCategorySelect">
            <view class="option-left">
              <view class="option-icon option-icon-green">
                <image class="option-image" :src="touchIcon" mode="aspectFit" />
              </view>
              <view class="option-body">
                <text class="option-title">选择触达类型</text>
                <text v-if="!state.category?.name" class="option-desc">选择想要触达的类型</text>
                <view v-else class="selected-tag">
                  <text class="selected-tag-text">{{ state.category.name }}</text>
                </view>
              </view>
            </view>
            <uni-icons type="right" size="18" color="#9A9A9A" />
          </view>
        </view>

        <view class="option-card">
          <view class="option-row" @tap="goWordingSelect">
            <view class="option-left">
              <view class="option-icon option-icon-cyan">
                <image class="option-image" :src="wordingIcon" mode="aspectFit" />
              </view>
              <view class="option-body">
                <text class="option-title">选择话术</text>
                <text class="option-desc">{{
                  state.wordingPreview ? state.wordingPreview : '一键选择关怀话术'
                }}</text>
              </view>
            </view>
            <uni-icons type="right" size="18" color="#9A9A9A" />
          </view>
        </view>

        <view class="preview-section">
          <text class="preview-title">发送内容预览</text>
          <view class="preview-card">
            <text class="preview-content">{{
              state.wordingContent ? state.wordingContent : '请选择话术后预览发送内容'
            }}</text>
          </view>
          <view class="preview-tip">
            <uni-icons type="info" size="14" color="#9FA79E" />
            <text class="preview-tip-text">内容已通过平台合规检测，可放心发送</text>
          </view>
        </view>

        <view v-if="requireCoupon" class="selection-section" @tap="goCouponSelect">
          <view class="selection-header">
            <text class="selection-title">选择优惠券</text>
            <uni-icons type="right" size="18" color="#9A9A9A" />
          </view>
          <view v-if="state.coupon" class="coupon-card-wrap">
            <s-coupon-list :data="state.coupon" type="coupon">
              <template #default>
                <view class="selected-check">
                  <uni-icons type="checkmarkempty" size="18" color="#1E3F1C" />
                </view>
              </template>
            </s-coupon-list>
          </view>
          <view v-else class="selection-placeholder">
            <text class="selection-placeholder-text">请选择优惠券</text>
          </view>
        </view>

        <view v-if="requireProduct" class="selection-section" @tap="goProductSelect">
          <view class="selection-header">
            <text class="selection-title">选择商品</text>
            <uni-icons type="right" size="18" color="#9A9A9A" />
          </view>
          <view v-if="state.product" class="product-card">
            <image
              class="product-image"
              :src="sheep.$url.cdn(state.product.picUrl)"
              mode="aspectFill"
            />
            <view class="product-main">
              <text class="product-title">{{ state.product.name }}</text>
              <text v-if="state.product.skuText" class="product-sku"
                >已选：{{ state.product.skuText }}</text
              >
              <view class="product-price">
                <text class="product-price-unit">￥</text>
                <text class="product-price-value">{{ fen2yuan(state.product.price || 0) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="selection-placeholder">
            <text class="selection-placeholder-text">请选择商品</text>
          </view>
        </view>
      </view>

      <view class="footer-placeholder"></view>
      <view class="footer">
        <view class="footer-btn" :class="{ disabled: !canSubmit }" @tap="handleSubmit">
          <text class="footer-btn-text">确定发送</text>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import WordingApi from '@/sheep/api/member/wording';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const STORAGE_CUSTOMERS = 'commission_touch_selected_customers';
  const STORAGE_CATEGORY = 'commission_touch_selected_category';
  const STORAGE_WORDING = 'commission_touch_selected_wording';
  const STORAGE_COUPON = 'commission_touch_selected_coupon';
  const STORAGE_PRODUCT = 'commission_touch_selected_product';
  const touchIcon = sheep.$url.cdn('/mp/static/智能客户管家/触达选择/触达@2x.webp');
  const wordingIcon = sheep.$url.cdn('/mp/static/智能客户管家/触达选择/话术@2x.webp');

  const state = reactive({
    customers: [],
    category: null,
    wording: null,
    coupon: null,
    product: null,
    wordingContent: '',
    wordingPreview: '',
    submitting: false,
  });

  const requireCoupon = computed(() => resolveBooleanField('requireCoupon'));
  const requireProduct = computed(() => resolveBooleanField('requireProduct'));

  const canSubmit = computed(() => {
    return Boolean(
      !state.submitting &&
        state.customers.length &&
        state.category?.code &&
        state.wordingContent &&
        (!requireCoupon.value || state.coupon?.id) &&
        (!requireProduct.value || state.product?.skuId),
    );
  });

  function resolveBooleanValue(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') {
      const text = value.trim().toLowerCase();
      return text === 'true' || text === '1' || text === 'yes';
    }
    return false;
  }

  function resolveBooleanField(key) {
    return resolveBooleanValue(
      state.wording?.[key] ??
        state.wording?.smsTemplate?.[key] ??
        state.wording?.templateConfig?.[key] ??
        state.wording?.templateExt?.[key],
    );
  }

  function loadSelections() {
    const customers = uni.getStorageSync(STORAGE_CUSTOMERS);
    state.customers = Array.isArray(customers) ? customers : [];

    const category = uni.getStorageSync(STORAGE_CATEGORY);
    state.category = category && typeof category === 'object' ? category : null;

    const wording = uni.getStorageSync(STORAGE_WORDING);
    state.wording = wording && typeof wording === 'object' ? wording : null;

    const coupon = uni.getStorageSync(STORAGE_COUPON);
    state.coupon = coupon && typeof coupon === 'object' ? coupon : null;

    const product = uni.getStorageSync(STORAGE_PRODUCT);
    state.product = product && typeof product === 'object' ? product : null;

    const content = state.wording?.smsTemplate?.content || state.wording?.content || '';
    state.wordingContent = String(content || '').trim();
    state.wordingPreview = state.wordingContent
      ? state.wordingContent.replace(/\s+/g, ' ').slice(0, 18) + '...'
      : '';

    if (!requireCoupon.value) {
      state.coupon = null;
      uni.removeStorageSync(STORAGE_COUPON);
    }
    if (!requireProduct.value) {
      state.product = null;
      uni.removeStorageSync(STORAGE_PRODUCT);
    }
  }

  function goCategorySelect() {
    sheep.$router.go('/pages/commission/touch-category-select');
  }

  function goWordingSelect() {
    if (!state.category?.code) {
      uni.showToast({
        title: '请先选择触达类型',
        icon: 'none',
      });
      return;
    }
    sheep.$router.go('/pages/commission/touch-wording-select');
  }

  function goCouponSelect() {
    if (!state.wording) {
      uni.showToast({
        title: '请先选择话术',
        icon: 'none',
      });
      return;
    }
    sheep.$router.go('/pages/commission/touch-coupon-select');
  }

  function goProductSelect() {
    if (!state.wording) {
      uni.showToast({
        title: '请先选择话术',
        icon: 'none',
      });
      return;
    }
    sheep.$router.go('/pages/commission/touch-product-select');
  }

  async function handleSubmit() {
    if (state.submitting) return;
    if (!state.customers.length) {
      uni.showToast({
        title: '请先选择客户',
        icon: 'none',
      });
      return;
    }
    if (!state.category?.code) {
      uni.showToast({
        title: '请先选择触达类型',
        icon: 'none',
      });
      return;
    }
    if (!state.wordingContent) {
      uni.showToast({
        title: '请先选择话术',
        icon: 'none',
      });
      return;
    }
    const wordingCode = String(state.wording?.code || state.wording?.wordingCode || '').trim();
    const memberIds = state.customers
      .map((item) => Number(item?.memberId || 0))
      .filter((item) => item > 0);
    if (!wordingCode) {
      uni.showToast({
        title: '话术编码缺失',
        icon: 'none',
      });
      return;
    }
    if (!memberIds.length) {
      uni.showToast({
        title: '客户信息缺失',
        icon: 'none',
      });
      return;
    }
    if (requireCoupon.value && !state.coupon?.id) {
      uni.showToast({
        title: '请选择优惠券',
        icon: 'none',
      });
      return;
    }
    if (requireProduct.value && !state.product?.skuId) {
      uni.showToast({
        title: '请选择商品',
        icon: 'none',
      });
      return;
    }
    const paramInputs = {};
    if (state.coupon?.id) {
      paramInputs.COUPON_TEMPLATE_ID = Number(state.coupon.id);
    }
    if (state.product?.skuId) {
      paramInputs.SKU_ID = Number(state.product.skuId);
    }
    state.submitting = true;
    const res = await WordingApi.sendBatchWording(
      {
        wordingCode,
        memberIds,
        paramInputs,
      },
      {
        showLoading: true,
        showSuccess: true,
        successMsg: '发送成功',
      },
    );
    state.submitting = false;
    if (res?.code !== 0) return;
    uni.removeStorageSync(STORAGE_CATEGORY);
    uni.removeStorageSync(STORAGE_WORDING);
    uni.removeStorageSync(STORAGE_CUSTOMERS);
    uni.removeStorageSync(STORAGE_COUPON);
    uni.removeStorageSync(STORAGE_PRODUCT);
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/commission/index',
      });
    }, 300);
  }

  onLoad(() => {
    loadSelections();
  });

  onShow(() => {
    loadSelections();
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
    padding: 22rpx 24rpx 0;
  }

  .option-card {
    border-radius: 24rpx;
    background: #fffffa;
    box-shadow: 0 10rpx 30rpx rgba(34, 41, 26, 0.04);
    padding: 0 22rpx;
    margin-bottom: 18rpx;
  }

  .option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 0;
  }

  .option-left {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
  }

  .option-icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .option-image {
    width: 64rpx;
    height: 64rpx;
  }

  .option-body {
    margin-left: 18rpx;
    min-width: 0;
  }

  .option-title {
    display: block;
    color: #242424;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
    margin-bottom: 6rpx;
  }

  .option-desc {
    display: block;
    color: #9a9a9a;
    font-size: 26rpx;
    line-height: 36rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 520rpx;
  }

  .selected-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 4rpx;
    padding: 6rpx 18rpx;
    border-radius: 10rpx;
    background: rgba(54, 198, 149, 0.14);
    max-width: 320rpx;
  }

  .selected-tag-text {
    color: #36c695;
    font-size: 24rpx;
    font-weight: 500;
    line-height: 34rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview-section {
    padding: 24rpx;
    margin-top: 26rpx;
    border-radius: 20rpx;
    background-color: #fffffa;
  }

  .preview-title {
    display: block;
    margin-bottom: 14rpx;
    color: #242424;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
  }

  .preview-card {
    border-radius: 18rpx;
    background: #f6f6f6;
    padding: 28rpx 26rpx;
  }

  .preview-content {
    color: #4a4a4a;
    font-size: 28rpx;
    line-height: 44rpx;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .preview-tip {
    margin-top: 14rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .preview-tip-text {
    color: #9fa79e;
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .selection-section {
    margin-top: 20rpx;
    padding: 24rpx;
    border-radius: 20rpx;
    background-color: #fffffa;
  }

  .selection-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
  }

  .selection-title {
    color: #242424;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
  }

  .selection-placeholder {
    height: 132rpx;
    border-radius: 18rpx;
    background: #f6f6f6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .selection-placeholder-text {
    color: #9a9a9a;
    font-size: 28rpx;
    line-height: 40rpx;
  }

  .coupon-card-wrap {
    margin-bottom: -24rpx;
  }

  .selected-check {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(30, 63, 28, 0.16);
    background: rgba(30, 63, 28, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-card {
    display: flex;
    align-items: center;
    gap: 22rpx;
    padding: 10rpx 0;
  }

  .product-image {
    width: 196rpx;
    height: 196rpx;
    border-radius: 14rpx;
    flex-shrink: 0;
    background: #f2f2f2;
  }

  .product-main {
    min-width: 0;
    flex: 1;
  }

  .product-title {
    display: block;
    color: #2d2d2d;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 42rpx;
  }

  .product-sku {
    display: block;
    margin-top: 16rpx;
    color: #8d8d8d;
    font-size: 26rpx;
    line-height: 36rpx;
  }

  .product-price {
    margin-top: 18rpx;
    color: #f53f3f;
    display: flex;
    align-items: baseline;
  }

  .product-price-unit {
    font-size: 28rpx;
    line-height: 36rpx;
  }

  .product-price-value {
    font-size: 54rpx;
    font-weight: 700;
    line-height: 56rpx;
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

  .footer-btn.disabled {
    background: rgba(30, 63, 28, 0.35);
  }

  .footer-btn-text {
    color: #ffffff;
    font-size: 34rpx;
    font-weight: 600;
    line-height: 48rpx;
  }
</style>
