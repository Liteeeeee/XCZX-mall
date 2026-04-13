<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
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
            color="#000"
            @tap="sheep.$router.back()"
            class="ss-m-l-20"
          ></uni-icons>
          <text class="nav-title ss-m-l-10">订单</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

    <AddressSelection v-model="addressState" />

    <view class="page-body">
      <view class="card goods-card">
        <s-goods-item
          v-for="item in state.orderInfo.items"
          :key="item.skuId"
          :img="item.picUrl"
          :title="item.spuName"
          :skuText="item.properties.map((property) => property.valueName).join(' ')"
          :price="item.price"
          :num="item.count"
          marginBottom="10"
          priceColor="#F53F3F"
        />
        <!-- <view class="order-item ss-flex ss-col-center ss-row-between remark-row">
          <view class="item-title">订单备注</view>
          <view class="ss-flex ss-col-center">
            <uni-easyinput
              maxlength="20"
              placeholder="建议留言前先与商家沟通"
              v-model="state.orderPayload.remark"
              :inputBorder="false"
              :clearable="false"
            />
          </view>
        </view> -->
      </view>

      <view class="card price-card">
        <view class="total-box-content border-bottom">
          <view class="order-item ss-flex ss-col-center ss-row-between">
            <view class="item-title">商品金额</view>
            <view class="ss-flex ss-col-center">
              <text class="item-value ss-m-r-24">￥{{ fen2yuan(state.orderInfo.price.totalPrice) }}</text>
            </view>
          </view>
          <view
            v-if="state.orderPayload.pointActivityId"
            class="order-item ss-flex ss-col-center ss-row-between"
          >
            <view class="item-title">兑换积分</view>
            <view class="ss-flex ss-col-center">
              <image
                :src="sheep.$url.static('/static/img/shop/goods/score1.svg')"
                class="score-img"
              />
              <text class="item-value ss-m-r-24">{{ state.orderInfo.usePoint }}</text>
            </view>
          </view>
          <view class="order-item ss-flex ss-col-center ss-row-between">
            <view class="item-title">运费</view>
            <view class="ss-flex ss-col-center">
              <text class="item-value ss-m-r-24" v-if="state.orderInfo.price.deliveryPrice > 0">
                +￥{{ fen2yuan(state.orderInfo.price.deliveryPrice) }}
              </text>
              <view class="item-value ss-m-r-24" v-else>免运费</view>
            </view>
          </view>
          <view
            class="order-item ss-flex ss-col-center ss-row-between"
            v-if="state.orderInfo.type === 0"
          >
            <view class="item-title">优惠券</view>
            <view class="ss-flex ss-col-center" @tap="state.showCoupon = true">
              <text class="item-value text-red" v-if="state.orderPayload.couponId > 0">
                -￥{{ fen2yuan(state.orderInfo.price.couponPrice) }}
              </text>
              <text
                class="item-value"
                :class="
                  state.couponInfo.filter((coupon) => coupon.match).length > 0
                    ? 'text-red'
                    : 'text-disabled'
                "
                v-else
              >
                {{
                  state.couponInfo.filter((coupon) => coupon.match).length > 0
                    ? state.couponInfo.filter((coupon) => coupon.match).length + ' 张可用'
                    : '暂无可用优惠券'
                }}
              </text>
              <text class="_icon-forward item-icon" />
            </view>
          </view>
          <view
            class="order-item ss-flex ss-col-center ss-row-between"
            v-if="state.orderInfo.price.discountPrice > 0"
          >
            <view class="item-title">活动优惠</view>
            <view class="ss-flex ss-col-center" @tap="state.showDiscount = true">
              <text class="item-value text-red">-￥{{ fen2yuan(state.orderInfo.price.discountPrice) }}</text>
              <text class="_icon-forward item-icon" />
            </view>
          </view>
          <view
            class="order-item ss-flex ss-col-center ss-row-between"
            v-if="state.orderInfo.price.vipPrice > 0"
          >
            <view class="item-title">会员优惠</view>
            <view class="ss-flex ss-col-center">
              <text class="item-value text-red">-￥{{ fen2yuan(state.orderInfo.price.vipPrice) }}</text>
            </view>
          </view>
        </view>
        <view class="total-box-footer ss-font-28 ss-flex ss-row-right ss-col-center ss-m-r-28">
          <view class="total-num ss-m-r-20">
            共{{ state.orderInfo.items.reduce((acc, item) => acc + item.count, 0) }}件
          </view>
          <view>合计：</view>
          <view class="total-num text-red"> ￥{{ fen2yuan(state.orderInfo.price.payPrice) }}</view>
        </view>
      </view>
    </view>

    <s-coupon-select
      v-model="state.couponInfo"
      :show="state.showCoupon"
      @confirm="onSelectCoupon"
      @close="state.showCoupon = false"
    />

    <s-discount-list
      v-model="state.orderInfo"
      :show="state.showDiscount"
      @close="state.showDiscount = false"
    />

    <su-fixed
      bottom
      :opacity="false"
      placeholder
      :noFixed="false"
      :index="200"
      :bgStyles="{ background: 'rgba(255, 255, 250, 1)' }"
    >
      <view class="footer-box ss-flex ss-row-between ss-col-center">
        <view class="footer-total ss-flex ss-col-center">
          <text class="footer-label">合计：</text>
          <text class="footer-price">￥{{ fen2yuan(state.orderInfo.price.payPrice) }}</text>
        </view>
        <button class="submit-btn ss-reset-button" @tap="onConfirm">提交订单</button>
      </view>
    </su-fixed>
  </s-layout>
</template>

<script setup>
  import { reactive, ref, watch } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import AddressSelection from '@/pages/order/addressSelection.vue';
  import sheep from '@/sheep';
  import OrderApi from '@/sheep/api/trade/order';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const state = reactive({
    orderPayload: {},
    orderInfo: {
      items: [], // 商品项列表
      price: {}, // 价格信息
    },
    showCoupon: false, // 是否展示优惠劵
    couponInfo: [], // 优惠劵列表
    showDiscount: false, // 是否展示营销活动
  });

  const addressState = ref({
    addressInfo: {}, // 选择的收货地址
    deliveryType: 1, // 收货方式：1-快递配送
  });

  // 选择优惠券
  async function onSelectCoupon(couponId) {
    state.orderPayload.couponId = couponId;
    await getOrderInfo();
    state.showCoupon = false;
  }

  // 提交订单
  function onConfirm() {
    if (!addressState.value.addressInfo.id) {
      sheep.$helper.toast('请选择收货地址');
      return;
    }
    submitOrder();
  }

  // 创建订单&跳转
  async function submitOrder() {
    const { code, data } = await OrderApi.createOrder({
      items: state.orderPayload.items,
      couponId: state.orderPayload.couponId,
      remark: state.orderPayload.remark,
      deliveryType: 1,
      addressId: addressState.value.addressInfo.id, // 收件地址编号
      pointStatus: false,
      combinationActivityId: state.orderPayload.combinationActivityId,
      combinationHeadId: state.orderPayload.combinationHeadId,
      seckillActivityId: state.orderPayload.seckillActivityId,
      pointActivityId: state.orderPayload.pointActivityId,
    });
    if (code !== 0) {
      return;
    }
    // 更新购物车列表，如果来自购物车
    if (state.orderPayload.items[0].cartId > 0) {
      sheep.$store('cart').getList();
    }

    // 跳转到支付页面
    if (data.payOrderId && data.payOrderId > 0) {
      sheep.$router.redirect('/pages/pay/index', {
        id: data.payOrderId,
      });
    } else {
      sheep.$router.redirect('/pages/order/detail', {
        id: data.id,
      });
    }
  }

  // 检查库存 & 计算订单价格
  async function getOrderInfo() {
    // 计算价格
    const { data, code } = await OrderApi.settlementOrder({
      items: state.orderPayload.items,
      couponId: state.orderPayload.couponId,
      deliveryType: 1,
      addressId: addressState.value.addressInfo.id, // 收件地址编号
      pointStatus: false,
      combinationActivityId: state.orderPayload.combinationActivityId,
      combinationHeadId: state.orderPayload.combinationHeadId,
      seckillActivityId: state.orderPayload.seckillActivityId,
      pointActivityId: state.orderPayload.pointActivityId,
    });
    if (code !== 0) {
      return code;
    }
    state.orderInfo = data;
    state.couponInfo = data.coupons || [];
    // 设置收货地址
    if (state.orderInfo.address) {
      addressState.value.addressInfo = state.orderInfo.address;
    }
    return code;
  }

  onLoad(async (options) => {
    // 解析参数
    if (!options.data) {
      sheep.$helper.toast('参数不正确，请检查！');
      return;
    }
    state.orderPayload = JSON.parse(options.data);
    await getOrderInfo();
  });

  // 使用 watch 监听地址和配送方式的变化
  watch(
    () => addressState.value.addressInfo.id,
    async (newId, oldId) => {
      if (newId !== oldId) {
        await getOrderInfo();
      }
    },
  );
</script>

<style lang="scss" scoped>
  :deep() {
    .uni-input-wrapper {
      width: 320rpx;
    }

    .uni-easyinput__content-input {
      font-size: 28rpx;
      height: 72rpx;
      text-align: right !important;
      padding-right: 0 !important;

      .uni-input-input {
        font-weight: 500;
        color: #333333;
        font-size: 26rpx;
        height: 32rpx;
        margin-top: 4rpx;
      }
    }

    .uni-easyinput__content {
      display: flex !important;
      align-items: center !important;
      justify-content: right !important;
    }

    .goods-card {
      .ss-order-card-warp {
        background-color: rgba(255, 254, 250, 1) !important;
      }
    }
  }

  .score-img {
    width: 36rpx;
    height: 36rpx;
    margin: 0 4rpx;
  }

  .order-item {
    height: 80rpx;

    .item-title {
      font-size: 28rpx;
      font-weight: 400;
    }

    .item-value {
      font-size: 28rpx;
      font-weight: 500;
      font-family: OPPOSANS;
    }

    .text-disabled {
      color: #bbbbbb;
    }

    .item-icon {
      color: $dark-9;
    }

    .remark-input {
      text-align: right;
    }

    .item-placeholder {
      color: $dark-9;
      font-size: 26rpx;
      text-align: right;
    }
  }

  .total-box-footer {
    height: 90rpx;

    .total-num {
      color: #333333;
      font-family: OPPOSANS;
    }
  }

  .footer-box {
    height: 120rpx;
    padding: 14rpx 32rpx;
    box-sizing: border-box;
    box-shadow: 0px -12rpx 20rpx 0px rgba(0, 0, 0, 0.02);

    .submit-btn {
      background-color: rgba(30, 63, 28, 1);
      border-radius: 60rpx;
      padding: 10rpx 34rpx;
      color: rgba(255, 254, 250, 1);
      font-size: 28rpx;
      font-family: PingFangSC-Medium;
      font-weight: 500;
      line-height: 40rpx;
    }
  }

  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 1000;
    background-color: #f8f9f3;
  }

  .nav-title {
    font-size: 36rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    color: #000000;
  }

  .page-body {
    padding: 0 32rpx 20rpx 32rpx;
  }

  .card {
    width: 686rpx;
    background-color: rgba(255, 254, 250, 1);
    border-radius: 20rpx;
    padding: 34rpx 24rpx 34rpx 21rpx;
    box-sizing: border-box;
    margin-top: 24rpx;
  }

  .remark-row {
    padding: 0 20rpx;
    border-radius: 20rpx;
    background-color: rgba(255, 254, 250, 1);
  }

  .footer-total {
    height: 40rpx;
  }

  .footer-label {
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    line-height: 40rpx;
  }

  .footer-price {
    margin-left: 8rpx;
    color: rgba(255, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    line-height: 40rpx;
  }

  .cicon-checkbox {
    font-size: 36rpx;
    color: var(--ui-BG-Main);
  }

  .cicon-box {
    font-size: 36rpx;
    color: #999999;
  }
</style>
