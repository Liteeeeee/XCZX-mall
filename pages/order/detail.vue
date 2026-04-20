<!-- 订单详情 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view
          class="nav-bar-inner ss-flex ss-col-center"
          :style="{ height: '100%', paddingLeft: '20rpx' }"
        >
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <text class="nav-title ss-m-l-10">订单详情</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <view class="state-box ss-flex ss-row-between ss-col-center">
      <view class="ss-flex ss-col-center">
        <image
          class="state-main-icon ss-m-r-20"
          :src="
            sheep.$url.static(
              state.orderInfo.status === 0
                ? '/static/dengdaizhifu.webp'
                : state.orderInfo.status === 10
                ? '/static/daifahuo.webp'
                : state.orderInfo.status === 20
                ? '/static/daishouhuo.webp'
                : state.orderInfo.status === 30
                ? '/static/yiwancheng.webp'
                : '/static/yiquxiao.webp',
            )
          "
          mode="heightFix"
        />
        <view class="state-text-box ss-flex-col">
          <view class="state-title">{{ formatOrderStatus(state.orderInfo) }}</view>
          <view class="state-desc ss-m-t-14" v-if="state.orderInfo.status === 0">
            {{ formatOrderStatusDescription(state.orderInfo) }}
            <text class="pay-timer ss-m-x-10">{{
              formatPayCountdown(state.orderInfo.createTime)
            }}</text>
            <text>内支付</text>
          </view>
          <view class="state-desc ss-m-t-14" v-else>
            {{ formatOrderStatusDescription(state.orderInfo) }}
          </view>
        </view>
      </view>
      <view class="state-icon-box">
        <image
          v-if="state.orderInfo.status === 0"
          class="state-img"
          :src="sheep.$url.static('/static/img/shop/order/order_state_icon.webp')"
        />
        <image
          v-else-if="state.orderInfo.status === 10"
          class="state-img"
          :src="sheep.$url.static('/static/img/shop/order/order_loading.webp')"
        />
        <image
          v-else-if="state.orderInfo.status === 20"
          class="state-img"
          :src="sheep.$url.static('/static/img/shop/order/order_express_icon.webp')"
        />
        <image
          v-else-if="state.orderInfo.status === 30"
          class="state-img"
          :src="sheep.$url.static('/static/img/shop/order/order_success_icon.webp')"
        />
        <image
          v-else-if="state.orderInfo.status === 40"
          class="state-img"
          :src="sheep.$url.static('/static/img/shop/order/order_close.webp')"
        />
      </view>
    </view>

    <!-- 收货地址 -->
    <view
      class="order-address-box ss-flex ss-col-center"
      v-if="state.orderInfo.receiverAreaId > 0"
      @tap="onSelectAddress"
    >
      <view class="address-icon-box ss-flex ss-col-center ss-row-center">
        <image class="address-icon" :src="sheep.$url.static('/static/address.webp')" />
      </view>
      <view class="address-info ss-m-l-20 ss-flex-1">
        <view class="address-detail ss-line-2">
          {{ state.orderInfo.receiverAreaName }} {{ state.orderInfo.receiverDetailAddress }}
        </view>
        <view class="ss-flex ss-col-center ss-m-t-10">
          <text class="address-username">{{ state.orderInfo.receiverName }}</text>
          <text class="address-phone ss-m-l-20">{{ state.orderInfo.receiverMobile }}</text>
        </view>
      </view>
    </view>

    <view
      class="detail-goods"
      :style="[{ marginTop: state.orderInfo.receiverAreaId > 0 ? '0' : '36rpx' }]"
    >
      <!-- 订单信 -->
      <view class="order-list" v-for="item in state.orderInfo.items" :key="item.goods_id">
        <view class="order-card">
          <s-goods-item
            @tap="onGoodsDetail(item.spuId)"
            :img="item.picUrl"
            :title="item.spuName"
            :skuText="
              item.properties
                ? '已选：' + item.properties.map((property) => property.valueName).join('，')
                : ''
            "
            :price="item.price"
            priceColor="#F53F3F"
          >
            <template #tool>
              <view class="goods-count-text">数量：{{ item.count }}</view>
            </template>
            <template #priceSuffix>
              <button class="ss-reset-button tag-btn" v-if="item.status_text">
                {{ item.status_text }}
              </button>
            </template>
          </s-goods-item>
        </view>
      </view>
    </view>

    <!--  自提核销  -->
    <PickUpVerify
      :order-info="state.orderInfo"
      :systemStore="systemStore"
      ref="pickUpVerifyRef"
    ></PickUpVerify>

    <!-- 订单信息 -->
    <view class="notice-box">
      <view class="notice-box__content">
        <view class="notice-item--center">
          <view class="ss-flex ss-flex-1">
            <text class="title">订单编号</text>
            <text class="detail ss-m-l-20">{{ state.orderInfo.no }}</text>
          </view>
          <button class="ss-reset-button copy-btn" @tap="onCopy">复制</button>
        </view>
        <view class="notice-item">
          <text class="title">下单时间</text>
          <text class="detail ss-m-l-20">
            {{ sheep.$helper.timeFormat(state.orderInfo.createTime, 'yyyy-mm-dd hh:MM:ss') }}
          </text>
        </view>
        <view class="notice-item" v-if="state.orderInfo.payTime">
          <text class="title">支付时间</text>
          <text class="detail ss-m-l-20">
            {{ sheep.$helper.timeFormat(state.orderInfo.payTime, 'yyyy-mm-dd hh:MM:ss') }}
          </text>
        </view>
        <view class="notice-item">
          <text class="title">支付方式</text>
          <text class="detail ss-m-l-20">{{ state.orderInfo.payChannelName || '-' }}</text>
        </view>
      </view>
    </view>

    <!-- 价格信息 -->
    <view class="order-price-box">
      <view class="notice-item ss-flex ss-row-between">
        <text class="title">商品总额</text>
        <view class="ss-flex">
          <text class="detail">￥{{ fen2yuan(state.orderInfo.totalPrice) }}</text>
        </view>
      </view>
      <view class="notice-item ss-flex ss-row-between">
        <text class="title">运费</text>
        <text class="detail">￥{{ fen2yuan(state.orderInfo.deliveryPrice) }}</text>
      </view>
      <view class="notice-item ss-flex ss-row-between" v-if="state.orderInfo.couponPrice > 0">
        <text class="title">优惠劵金额</text>
        <text class="detail">-¥{{ fen2yuan(state.orderInfo.couponPrice) }}</text>
      </view>
      <view class="notice-item ss-flex ss-row-between" v-if="state.orderInfo.pointPrice > 0">
        <text class="title">积分抵扣</text>
        <text class="detail">-¥{{ fen2yuan(state.orderInfo.pointPrice) }}</text>
      </view>
      <view class="notice-item ss-flex ss-row-between" v-if="state.orderInfo.discountPrice > 0">
        <text class="title">活动优惠</text>
        <text class="detail">-¥{{ fen2yuan(state.orderInfo.discountPrice) }}</text>
      </view>
      <view class="notice-item ss-flex ss-row-between" v-if="state.orderInfo.vipPrice > 0">
        <text class="title">会员优惠</text>
        <text class="detail">-¥{{ fen2yuan(state.orderInfo.vipPrice) }}</text>
      </view>

      <view class="price-divider"></view>

      <view class="notice-item all-rpice-item ss-flex">
        <text class="title">{{ state.orderInfo.payStatus ? '已付款' : '需付款' }}</text>
        <text class="detail all-price ss-m-l-10">￥{{ fen2yuan(state.orderInfo.payPrice) }}</text>
      </view>
      <view class="notice-item all-rpice-item ss-flex" v-if="state.orderInfo.refundPrice > 0">
        <text class="title">已退款</text>
        <text class="detail all-price ss-m-l-10"
          >￥{{ fen2yuan(state.orderInfo.refundPrice) }}</text
        >
      </view>
    </view>

    <!-- 底部按钮 -->
    <!-- TODO: 查看物流、等待成团、评价完后返回页面没刷新页面 -->
    <su-fixed
      bottom
      placeholder
      bg="bg-white"
      v-if="
        state.orderInfo.buttons?.length ||
        state.orderInfo.items?.some(
          (item) =>
            ([10, 20, 30].includes(state.orderInfo.status) && item.afterSaleStatus === 0) ||
            [10, 20].includes(item.afterSaleStatus),
        )
      "
    >
      <view class="footer-box ss-flex ss-col-center ss-row-right">
        <!-- 售后相关按钮（统一只显示一个） -->
        <template v-if="state.orderInfo.items">
          <!-- <button
            class="ss-reset-button apply-btn"
            v-if="
              state.orderInfo.items.find(
                (item) =>
                  [10, 20, 30].includes(state.orderInfo.status) && item.afterSaleStatus === 0,
              )
            "
            @tap.stop="onApplyAfterSale"
          >
            {{ state.orderInfo.status === 10 ? '申请退款' : '申请售后' }}
          </button> -->
          <button
            class="ss-reset-button apply-btn"
            v-if="state.orderInfo.items.find((item) => item.afterSaleStatus === 10)"
            @tap.stop="
              sheep.$router.go('/pages/order/aftersale/detail', {
                id: state.orderInfo.items.find((item) => item.afterSaleStatus === 10).afterSaleId,
              })
            "
          >
            退款中
          </button>
          <button
            class="ss-reset-button apply-btn"
            v-if="state.orderInfo.items.find((item) => item.afterSaleStatus === 20)"
            @tap.stop="
              sheep.$router.go('/pages/order/aftersale/detail', {
                id: state.orderInfo.items.find((item) => item.afterSaleStatus === 20).afterSaleId,
              })
            "
          >
            退款成功
          </button>
        </template>
        <button
          class="ss-reset-button cancel-btn"
          v-if="state.orderInfo.buttons?.includes('cancel')"
          @tap="onCancel(state.orderInfo.id)"
        >
          取消订单
        </button>
        <button
          class="ss-reset-button pay-btn"
          v-if="state.orderInfo.buttons?.includes('pay')"
          @tap="onPay(state.orderInfo.payOrderId)"
        >
          立即支付
        </button>
        <button
          class="ss-reset-button cancel-btn"
          v-if="state.orderInfo.buttons?.includes('combination')"
          @tap="
            sheep.$router.go('/pages/activity/groupon/detail', {
              id: state.orderInfo.combinationRecordId,
            })
          "
        >
          拼团详情
        </button>
        <button
          class="ss-reset-button cancel-btn"
          v-if="state.orderInfo.buttons?.includes('express')"
          @tap="onExpress(state.orderInfo.id)"
        >
          查看物流
        </button>
        <button
          class="ss-reset-button pay-btn"
          v-if="state.orderInfo.buttons?.includes('confirm')"
          @tap="onConfirm(state.orderInfo.id)"
        >
          确认收货
        </button>
        <button
          class="ss-reset-button pay-btn"
          v-if="state.orderInfo.buttons?.includes('comment')"
          @tap="onComment(state.orderInfo.id)"
        >
          评价
        </button>
        <button
          class="ss-reset-button cancel-btn"
          v-if="state.orderInfo.buttons?.includes('delete')"
          @tap="onDelete(state.orderInfo.id)"
        >
          删除订单
        </button>
      </view>
    </su-fixed>
    <!-- 订单选择商品售后抽屉 -->
    <su-popup
      :show="state.showSelectGoodsDrawer"
      type="bottom"
      round="20"
      :showClose="true"
      @close="state.showSelectGoodsDrawer = false"
    >
      <view class="select-goods-drawer flex-col">
        <view class="drawer-header flex-row align-center justify-center">
          <text class="drawer-title">请选择需要售后的商品</text>
        </view>

        <scroll-view class="drawer-content" scroll-y>
          <view
            v-for="item in state.orderInfo.items.filter(
              (i) => [10, 20, 30].includes(state.orderInfo.status) && i.afterSaleStatus === 0,
            )"
            :key="item.id"
            class="goods-item-card flex-row align-center justify-between"
            @tap="onSelectGoodsForAfterSale(item.id)"
          >
            <view class="flex-row align-center" style="flex: 1">
              <image class="goods-img" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFill" />
              <view class="goods-info flex-col justify-between">
                <text class="goods-name ss-line-2">{{ item.spuName }}</text>
                <text class="goods-sku" v-if="item.properties">{{
                  item.properties.map((p) => p.valueName).join(' ')
                }}</text>
                <view class="flex-row justify-between" style="width: 100%">
                  <text class="goods-price">￥{{ fen2yuan(item.price) }}</text>
                  <text class="goods-count">x{{ item.count }}</text>
                </view>
              </view>
            </view>
            <view class="action-btn">
              <button class="ss-reset-button apply-btn-small">申请</button>
            </view>
          </view>
        </scroll-view>
      </view>
    </su-popup>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import { reactive, ref, onUnmounted } from 'vue';
  import { isEmpty } from 'lodash-es';
  import dayjs from 'dayjs';
  import { fen2yuan, formatOrderStatus, handleOrderButtons } from '@/sheep/hooks/useGoods';
  import OrderApi from '@/sheep/api/trade/order';
  import DeliveryApi from '@/sheep/api/trade/delivery';
  import PayOrderApi from '@/sheep/api/pay/order';
  import PickUpVerify from '@/pages/order/pickUpVerify.vue';

  const statusBarHeight = sheep.$platform.device.statusBarHeight * 2;
  const headerBg = sheep.$url.css('/static/img/shop/order/order_bg.webp');

  const state = reactive({
    orderInfo: {},
    now: dayjs(), // 当前时间用于倒计时
    showSelectGoodsDrawer: false, // 是否显示多商品退款选择抽屉
  });

  let timer = null;

  // 格式化订单状态的描述
  function formatOrderStatusDescription(order) {
    if (order.status === 0) {
      return `请在`;
    }
    if (order.status === 10) {
      return '商家未发货，请耐心等待~';
    }
    if (order.status === 20) {
      return '您的快递正在路上，请耐心等待~';
    }
    if (order.status === 30) {
      return '购物愉快呦~';
    }
    if (order.status === 40) {
      return '订单已关闭';
    }
    return '';
  }

  // 格式化支付倒计时
  function formatPayCountdown(createTime) {
    if (!createTime) return '';
    const create = dayjs(createTime);
    const expire = create.add(24, 'hour');
    const diff = expire.diff(state.now, 'second');
    if (diff <= 0) return '已过期';
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    // 补齐两位数
    const padH = String(hours).padStart(2, '0');
    const padM = String(minutes).padStart(2, '0');
    const padS = String(seconds).padStart(2, '0');
    if (hours > 0) {
      return `${padH}:${padM}:${padS}`;
    }
    return `${padM}:${padS}`;
  }

  // ========== 门店自提（核销） ==========
  const systemStore = ref({}); // 门店信息

  // 复制
  const onCopy = () => {
    sheep.$helper.copyText(state.orderInfo.no);
  };

  // 去支付
  function onPay(payOrderId) {
    sheep.$router.go('/pages/pay/index', {
      id: payOrderId,
    });
  }

  // 查看商品
  function onGoodsDetail(id) {
    sheep.$router.go('/pages/goods/index', {
      id,
    });
  }

  // 删除订单
  async function onDelete(orderId) {
    uni.showModal({
      title: '提示',
      content: '确定要删除订单吗?',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const { code } = await OrderApi.deleteOrder(orderId);
        if (code === 0) {
          sheep.$router.back();
        }
      },
    });
  }

  // 取消订单
  async function onCancel(orderId) {
    uni.showModal({
      title: '提示',
      content: '确定要取消订单吗?',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const { code } = await OrderApi.cancelOrder(orderId);
        if (code === 0) {
          await getOrderDetail(orderId);
        }
      },
    });
  }

  // 查看物流
  async function onExpress(id) {
    sheep.$router.go('/pages/order/express/log', {
      id,
    });
  }

  function onSelectAddress() {
    if (![0, 10].includes(state.orderInfo.status)) {
      sheep.$helper.toast('当前订单状态不可修改收货地址');
      return;
    }
    uni.$once('SELECT_ADDRESS', async (e) => {
      if (![0, 10].includes(state.orderInfo.status)) {
        return;
      }
      const info = e?.addressInfo || {};
      if (!isEmpty(info)) {
        const { code } = await OrderApi.updateOrderAddress({
          id: state.orderInfo.id,
          receiverName: info.name,
          receiverMobile: info.mobile,
          receiverAreaId: info.areaId,
          receiverDetailAddress: info.detailAddress,
        });
        if (code === 0) {
          skipNextOnShowRefresh.value = true;
          await getOrderDetail(state.orderInfo.id);
        }
      }
    });
    sheep.$router.go('/pages/user/address/list?type=select');
  }

  // 确认收货
  async function onConfirm(orderId, ignore = false) {
    // 需开启确认收货组件
    // todo: 芋艿：【微信物流】待接入微信 https://gitee.com/sheepjs/shopro-uniapp/commit/a6bbba49b84dd418b84c5fefc8b7463df8f4901f
    // 1.怎么检测是否开启了发货组件功能？如果没有开启的话就不能在这里return出去
    // 2.如果开启了走mpConfirm方法,需要在App.vue的show方法中拿到确认收货结果
    let isOpenBusinessView = true;
    if (
      sheep.$platform.name === 'WechatMiniProgram' &&
      !isEmpty(state.orderInfo.wechat_extra_data) &&
      isOpenBusinessView &&
      !ignore
    ) {
      mpConfirm(orderId);
      return;
    }

    uni.showModal({
      title: '提示',
      content: '确认收货吗？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        // 正常的确认收货流程
        const { code } = await OrderApi.receiveOrder(orderId);
        if (code === 0) {
          await getOrderDetail(orderId);
        }
      },
    });
  }

  // #ifdef MP-WEIXIN
  // 小程序确认收货组件
  function mpConfirm(orderId) {
    if (!wx.openBusinessView) {
      sheep.$helper.toast(`请升级微信版本`);
      return;
    }
    wx.openBusinessView({
      businessType: 'weappOrderConfirm',
      extraData: {
        merchant_trade_no: state.orderInfo.wechat_extra_data.merchant_trade_no,
        transaction_id: state.orderInfo.wechat_extra_data.transaction_id,
      },
      success(response) {
        console.log('success:', response);
        if (response.errMsg === 'openBusinessView:ok') {
          if (response.extraData.status === 'success') {
            onConfirm(orderId, true);
          }
        }
      },
      fail(error) {
        console.log('error:', error);
      },
      complete(result) {
        console.log('result:', result);
      },
    });
  }

  // #endif

  // 评价
  function onComment(id) {
    sheep.$router.go('/pages/goods/comment/add', {
      id,
    });
  }

  const pickUpVerifyRef = ref();
  const skipNextOnShowRefresh = ref(false);

  // 点击申请退款/售后按钮
  function onApplyAfterSale() {
    const availableItems = state.orderInfo.items.filter(
      (item) => [10, 20, 30].includes(state.orderInfo.status) && item.afterSaleStatus === 0,
    );
    if (availableItems.length === 1) {
      // 只有一个商品可退，直接跳转
      sheep.$router.go('/pages/order/aftersale/apply', {
        orderId: state.orderInfo.id,
        itemId: availableItems[0].id,
      });
    } else if (availableItems.length > 1) {
      // 有多个商品可退，弹出抽屉让用户选择
      state.showSelectGoodsDrawer = true;
    }
  }

  // 选中某个商品进行退款
  function onSelectGoodsForAfterSale(itemId) {
    state.showSelectGoodsDrawer = false;
    sheep.$router.go('/pages/order/aftersale/apply', {
      orderId: state.orderInfo.id,
      itemId,
    });
  }

  async function getOrderDetail(id) {
    // 对详情数据进行适配
    let res;
    if (state.comeinType === 'wechat') {
      // TODO 芋艿：【微信物流】微信场景下
      res = await OrderApi.getOrderDetail(id, {
        merchant_trade_no: state.merchantTradeNo,
      });
    } else {
      res = await OrderApi.getOrderDetail(id);
    }
    if (res.code === 0) {
      state.orderInfo = res.data;
      handleOrderButtons(state.orderInfo);
      // 配送方式：门店自提
      if (res.data.pickUpStoreId) {
        const { data } = await DeliveryApi.getDeliveryPickUpStore(res.data.pickUpStoreId);
        systemStore.value = data || {};
      }
      if (state.orderInfo.deliveryType === 2 && state.orderInfo.payStatus) {
        pickUpVerifyRef.value && pickUpVerifyRef.value.markCode(res.data.pickUpVerifyCode);
      }
    } else {
      sheep.$router.back();
    }
  }

  onShow(async () => {
    // onShow 中获取订单列表,保证跳转后页面为最新状态
    // 有几率在 onLoad 完成 state.orderInfo.id 赋值前进入 onShow
    if (skipNextOnShowRefresh.value) {
      skipNextOnShowRefresh.value = false;
      return;
    }
    if (state.orderInfo.id) {
      await getOrderDetail(state.orderInfo.id);
    }
  });

  onLoad(async (options) => {
    let id = 0;
    if (options.id) {
      id = options.id;
    }
    // 场景：例如说“微信小程序购物订单”
    // https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/business-capabilities/order_center/order_center.html
    // （小程序商品订单详情 path）配置参考：pages/order/detail?payOrderNo=${商品订单号} 。其中：${商品订单号} out_trade_no 为 payOrderNo
    if (!id && options.payOrderNo) {
      // 查询支付订单：根据 payOrderNo 取 merchantOrderId ，merchantOrderId 即 tradeOrderId
      const payOrder = await PayOrderApi.getOrder(undefined, undefined, options.payOrderNo);
      if (payOrder.code === 0) {
        id = payOrder.data?.merchantOrderId;
      }
    }
    state.orderInfo.id = id;
    // 完成 state.orderInfo.id 赋值后加载一次detail，但有几率与 onShow 重复可能导致 detail 会加载两次。
    skipNextOnShowRefresh.value = true;
    await getOrderDetail(state.orderInfo.id);

    // 开启定时器，每秒更新一次当前时间以刷新倒计时
    timer = setInterval(() => {
      state.now = dayjs();
    }, 1000);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });
</script>

<style lang="scss" scoped>
  /* 导航栏 */
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    background: #f8f9f3;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* #ifdef H5 */
    max-width: 750rpx;
    left: 50%;
    transform: translateX(-50%);
    /* #endif */
  }
  .nav-bar-container {
    background: #f8f9f3;
    display: flex;
    align-items: center;
  }
  .back-btn {
    width: 60rpx;
    color: black;
    height: 60rpx;
    font-size: 40rpx;
  }
  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
  }

  .state-box {
    padding: 36rpx 32rpx 0 32rpx;
    background: #f8f9f3;

    .state-main-icon {
      height: 100rpx; // 默认给一个合适的高度，会自动撑开
    }

    .state-text-box {
      .state-title {
        color: #1d2129;
        font-size: 40rpx;
        font-weight: 600;
        line-height: 44rpx;
      }
      .state-desc {
        color: #86909c;
        font-size: 28rpx;
        line-height: 40rpx;
        display: flex;
        align-items: center;
      }
      .pay-timer {
        color: #ff0000;
        font-size: 28rpx;
        font-weight: 500;
      }
    }

    .state-icon-box {
      .state-img {
        width: 160rpx;
        height: 160rpx;
      }
    }
  }

  .order-address-box {
    background-color: #fff;
    border-radius: 10rpx;
    margin: 36rpx 32rpx 16rpx 32rpx;
    padding: 32rpx 35rpx 32rpx 24rpx;
    box-sizing: border-box;

    .address-icon-box {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;

      .address-icon {
        width: 48rpx;
        height: 48rpx;
      }
    }

    .address-info {
      .address-detail {
        font-size: 28rpx;
        font-weight: 500;
        color: #3d3d3c;
        line-height: 40rpx;
      }

      .address-username,
      .address-phone {
        font-size: 24rpx;
        color: #9d9c96;
        font-weight: normal;
        line-height: 33rpx;
      }
    }
  }

  .detail-goods {
    border-radius: 10rpx;
    margin: 0 32rpx 20rpx 32rpx;

    .order-list {
      margin-bottom: 20rpx;
      background-color: #fff;
      border-radius: 10rpx;

      .order-card {
        padding: 20rpx 0;

        .goods-count-text {
          color: #3d3d3c;
          font-size: 24rpx;
          margin-top: 10rpx;
          text-align: right;
        }

        :deep(.price-text) {
          color: #f53f3f !important;
          font-size: 40rpx;
          font-weight: 700;
        }

        .order-sku {
          font-size: 24rpx;

          font-weight: 400;
          color: rgba(153, 153, 153, 1);
          width: 450rpx;
          margin-bottom: 20rpx;

          .order-num {
            margin-right: 10rpx;
          }
        }

        .tag-btn {
          margin-left: 16rpx;
          font-size: 24rpx;
          height: 36rpx;
          color: var(--ui-BG-Main);
          border: 2rpx solid var(--ui-BG-Main);
          border-radius: 14rpx;
          padding: 0 4rpx;
        }
      }
    }
  }

  // 订单信息。
  .notice-box {
    background: #fff;
    border-radius: 10rpx;
    margin: 0 32rpx 20rpx 32rpx;

    .notice-box__head {
      font-size: 30rpx;

      font-weight: 500;
      color: rgba(51, 51, 51, 1);
      line-height: 80rpx;
      border-bottom: 1rpx solid #dfdfdf;
      padding: 0 25rpx;
    }

    .notice-box__content {
      padding: 32rpx 24rpx;

      .self-pickup-box {
        width: 100%;

        .self-pickup--img {
          width: 200rpx;
          height: 200rpx;
          margin: 40rpx 0;
        }
      }
    }

    .notice-item,
    .notice-item--center {
      display: flex;
      align-items: center;
      line-height: normal;
      margin-bottom: 30rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .title {
        font-size: 26rpx;
        color: #3d3d3c;
      }

      .detail {
        font-size: 26rpx;
        color: #3d3d3c;
        flex: 1;
        text-align: right;
      }
    }
  }

  .copy-btn {
    width: 80rpx;
    line-height: 40rpx;
    border-radius: 20rpx;
    padding: 0;
    background: transparent;
    font-size: 26rpx;
    font-weight: 400;
    color: #ff0000;
    margin-left: 20rpx;
  }

  // 订单价格信息
  .order-price-box {
    background-color: #fff;
    border-radius: 10rpx;
    padding: 32rpx 24rpx;
    margin: 0 32rpx 20rpx 32rpx;

    .notice-item {
      line-height: normal;
      margin-bottom: 30rpx;

      .title {
        font-size: 26rpx;
        color: #3d3d3c;
      }

      .detail {
        font-size: 26rpx;
        color: #3d3d3c;
        font-family: OPPOSANS;
      }
    }

    .price-divider {
      height: 1rpx;
      background-color: #eeeeee;
      margin: 30rpx 0;
    }

    .all-rpice-item {
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 0;

      .title {
        font-size: 28rpx;
        font-weight: 600;
        color: #000000;
        line-height: normal;
      }

      .all-price {
        font-size: 28rpx;
        font-weight: 600;
        font-family: OPPOSANS;
        line-height: normal;
        color: #ff0000;
      }
    }
  }

  // 底部
  .footer-box {
    height: 100rpx;
    width: 100%;
    box-sizing: border-box;
    border-radius: 10rpx;
    padding-right: 20rpx;

    .apply-btn {
      width: 160rpx;
      height: 60rpx;
      background: rgba(255, 255, 250, 1);
      border-radius: 30rpx;
      border: 2rpx solid rgba(30, 63, 28, 1);
      margin-right: 20rpx;
      font-size: 28rpx;
      font-weight: 500;
      color: rgba(30, 63, 28, 1);
      line-height: 56rpx;
    }

    .cancel-btn {
      width: 160rpx;
      height: 60rpx;
      background: #ffffff;
      border-radius: 30rpx;
      border: 2rpx solid red;
      margin-right: 20rpx;
      font-size: 28rpx;
      font-weight: 400;
      color: red;
      line-height: 56rpx;
    }

    .pay-btn {
      width: 160rpx;
      height: 60rpx;
      font-size: 28rpx;
      border-radius: 30rpx;
      font-weight: 500;
      color: #fff;
      background: #1e3f1c;
      line-height: 60rpx;
    }
    .apply-btn-small {
      width: 120rpx;
      height: 50rpx;
      background: rgba(255, 255, 250, 1);
      border-radius: 25rpx;
      border: 2rpx solid rgba(30, 63, 28, 1);
      font-size: 24rpx;
      font-weight: 500;
      color: rgba(30, 63, 28, 1);
      line-height: 46rpx;
    }

    // 抽屉样式
    .select-goods-drawer {
      width: 750rpx;
      background-color: #f8f9f3;
      border-radius: 20rpx 20rpx 0 0;
      padding-bottom: env(safe-area-inset-bottom);
    }

    .drawer-header {
      height: 100rpx;
      background-color: #fff;
      border-bottom: 1rpx solid #f5f5f5;
    }

    .drawer-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .drawer-content {
      max-height: 60vh;
      padding: 20rpx 30rpx;
      box-sizing: border-box;
    }

    .goods-item-card {
      background-color: #fff;
      border-radius: 10rpx;
      padding: 20rpx;
      margin-bottom: 20rpx;

      .goods-img {
        width: 140rpx;
        height: 140rpx;
        border-radius: 10rpx;
        margin-right: 20rpx;
        background-color: #f5f5f5;
      }

      .goods-info {
        flex: 1;
        height: 140rpx;
        padding-right: 20rpx;

        .goods-name {
          font-size: 26rpx;
          color: #333;
          line-height: 36rpx;
        }

        .goods-sku {
          font-size: 22rpx;
          color: #999;
        }

        .goods-price {
          font-size: 28rpx;
          color: #f53f3f;
          font-weight: bold;
        }

        .goods-count {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
</style>
