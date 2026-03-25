<!-- 订单列表 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <view class="fixed-header">
      <su-status-bar />
      <view class="nav-bar-container" :style="{ position: 'relative', height: (sheep.$platform.navbar - sheep.$platform.device.statusBarHeight) + 'px' }">
        <view class="nav-bar-inner ss-flex ss-col-center" :style="{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', height: '100%', left: '0', width: '100%' }">
          <uni-icons type="left" size="22" color="#000" @tap="sheep.$router.back()" class="ss-m-l-20"></uni-icons>
          <text class="nav-title ss-m-l-10">订单</text>
        </view>
      </view>
      <su-tabs
        :list="tabMaps"
        :scrollable="false"
        @change="onTabsChange"
        :current="state.currentTab"
        :activeStyle="{ color: '#1E3F1C', fontSize: '32rpx', fontWeight: 600 }"
        :inactiveStyle="{ color: '#1D2129', fontSize: '32rpx', fontWeight: 'normal' }"
        lineColor="#1E3F1C"
        lineWidth="32"
        lineHeight="6"
      />
    </view>
    <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 44 + 'px' }"></view>

    <s-empty v-if="state.pagination.total === 0" icon="/static/order-empty.webp" text="暂无订单" />
    <view v-if="state.pagination.total > 0" class="page-list-container">
      <view
        class="bg-white order-list-card-box ss-r-10 ss-m-t-14 ss-m-x-20"
        v-for="order in state.pagination.list"
        :key="order.id"
        @tap="onOrderDetail(order.id)"
      >
        <view class="order-card-header ss-flex ss-col-center ss-row-between ss-p-x-20">
          <view class="order-no">{{ formatOrderTime(order.createTime) }}</view>
          <view class="order-state-box ss-flex ss-col-center">
            <template v-if="order.status === 0">
              <view class="pay-timer-box ss-flex ss-col-center">
                <view class="state-tag ss-flex ss-col-center ss-row-center">
                  <text class="state-text">{{ formatOrderStatus(order) }}</text>
                </view>
                <text class="timer-text">{{ formatPayCountdown(order.createTime) }}</text>
              </view>
            </template>
            <template v-else>
              <view class="order-state ss-font-26" :class="formatOrderColor(order)">
                {{ formatOrderStatus(order) }}
              </view>
            </template>
          </view>
        </view>
        <view v-for="item in order.items" :key="item.id">
          <s-goods-item
            :img="item.picUrl"
            :title="item.spuName"
            :skuText="item.properties ? '已选：' + item.properties.map((property) => property.valueName).join('，') : ''"
            :price="item.price"
            priceColor="#F53F3F"
          >
            <template #tool>
              <view class="goods-count-text">数量：{{ item.count }}</view>
            </template>
          </s-goods-item>
        </view>
        <view class="pay-box ss-m-t-30 ss-flex ss-row-right ss-p-r-20">
          <view class="ss-flex ss-col-center">
            <view class="discounts-title pay-color"
              >共{{ order.productCount }}件 支付总额 </view
            >
            <view class="discounts-money pay-color ss-m-l-10"> ￥{{ fen2yuan(order.payPrice) }} </view>
          </view>
        </view>
        <view
          class="order-card-footer ss-flex ss-col-center ss-p-x-20 ss-p-b-20"
          :class="order.buttons.length > 3 ? 'ss-row-between' : 'ss-row-right'"
        >
          <view class="ss-flex ss-col-center">
            <button
              v-if="order.buttons.includes('combination')"
              class="tool-btn ss-reset-button"
              @tap.stop="onOrderGroupon(order)"
            >
              拼团详情
            </button>
            <button
              v-if="order.buttons.length === 0"
              class="tool-btn ss-reset-button"
              @tap.stop="onOrderDetail(order.id)"
            >
              查看详情
            </button>
            <button
              v-if="order.buttons.includes('confirm')"
              class="tool-btn ss-reset-button"
              @tap.stop="onConfirm(order)"
            >
              确认收货
            </button>
            <button
              v-if="order.buttons.includes('express')"
              class="tool-btn ss-reset-button"
              @tap.stop="onExpress(order.id)"
            >
              查看物流
            </button>
            <button
              v-if="order.buttons.includes('cancel') && !isOrderExpired(order.createTime)"
              class="tool-btn ss-reset-button"
              @tap.stop="onCancel(order.id)"
            >
              取消订单
            </button>
            <button
              v-if="order.buttons.includes('comment')"
              class="tool-btn ss-reset-button"
              @tap.stop="onComment(order.id)"
            >
              评价
            </button>
            <button
              v-if="order.buttons.includes('delete')"
              class="tool-btn delete-btn ss-reset-button"
              @tap.stop="onDelete(order.id)"
            >
              删除订单
            </button>
            <button
              v-if="order.status === 0 && isOrderExpired(order.createTime)"
              class="pay-btn ss-reset-button"
              @tap.stop="onRepurchase(order)"
            >
              再次购买
            </button>
            <button
              v-if="order.buttons.includes('pay') && !isOrderExpired(order.createTime)"
              class="pay-btn ss-reset-button"
              @tap.stop="onPay(order.payOrderId)"
            >
              立即支付
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <uni-load-more
      v-if="state.pagination.total > 0"
      :status="state.loadStatus"
      :content-text="{
        contentdown: '上拉加载更多',
      }"
      @tap="loadMore"
    />
  </s-layout>
</template>

<script setup>
  import { reactive, onUnmounted } from 'vue';
  import { onLoad, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
  import dayjs from 'dayjs';
  import {
    fen2yuan,
    formatOrderColor,
    formatOrderStatus,
    handleOrderButtons,
  } from '@/sheep/hooks/useGoods';
  import sheep from '@/sheep';
  import { concat, isEmpty } from 'lodash-es';
  import OrderApi from '@/sheep/api/trade/order';
  import { resetPagination } from '@/sheep/helper/utils';

  // 数据
  const state = reactive({
    currentTab: 0, // 选中的 tabMaps 下标
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 5,
    },
    loadStatus: '',
    now: dayjs(), // 增加响应式当前时间
  });

  let timer = null;

  // 格式化订单时间
  function formatOrderTime(time) {
    return dayjs(time).format('YYYY.MM.DD HH:mm');
  }

  // 检查订单是否过期
  function isOrderExpired(createTime) {
    if (!createTime) return false;
    const create = dayjs(createTime);
    const expire = create.add(24, 'hour');
    const diff = expire.diff(state.now, 'second');
    return diff <= 0;
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
    return `${hours}小时${minutes}分`;
  }

  const tabMaps = [
    {
      name: '全部',
    },
    {
      name: '待付款',
      value: 0,
    },
    {
      name: '待发货',
      value: 10,
    },
    {
      name: '待收货',
      value: 20,
    },
    {
      name: '待评价',
      value: 30,
    },
  ];

  // 切换选项卡
  function onTabsChange(e) {
    if (state.currentTab === e.index) {
      return;
    }
    // 重头加载代码
    resetPagination(state.pagination);
    state.currentTab = e.index;
    getOrderList();
  }

  // 订单详情
  function onOrderDetail(id) {
    sheep.$router.go('/pages/order/detail', {
      id,
    });
  }

  // 跳转拼团记录的详情
  function onOrderGroupon(order) {
    sheep.$router.go('/pages/activity/groupon/detail', {
      id: order.combinationRecordId,
    });
  }

  // 继续支付
  function onPay(payOrderId) {
    sheep.$router.go('/pages/pay/index', {
      id: payOrderId,
    });
  }

  // 评价
  function onComment(id) {
    sheep.$router.go('/pages/goods/comment/add', {
      id,
    });
  }

  // 再次购买
  function onRepurchase(order) {
    // 假设再次购买就是跳转到商品详情页（这里可以根据实际需求改成跳转到确认订单页，或者将商品重新加入购物车等）
    if (order.items && order.items.length > 0) {
      sheep.$router.go('/pages/goods/index', {
        id: order.items[0].spuId,
      });
    } else {
      sheep.$helper.toast('商品信息不存在');
    }
  }

  // 确认收货
  async function onConfirm(order, ignore = false) {
    // 需开启确认收货组件
    // todo: 芋艿：【微信物流】需要后续接入微信收货组件 https://gitee.com/sheepjs/shopro-uniapp/commit/a6bbba49b84dd418b84c5fefc8b7463df8f4901f
    // 1.怎么检测是否开启了发货组件功能？如果没有开启的话就不能在这里return出去
    // 2.如果开启了走mpConfirm方法,需要在App.vue的show方法中拿到确认收货结果
    let isOpenBusinessView = true;
    if (
      sheep.$platform.name === 'WechatMiniProgram' &&
      !isEmpty(order.wechat_extra_data) &&
      isOpenBusinessView &&
      !ignore
    ) {
      mpConfirm(order);
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
        const { code } = await OrderApi.receiveOrder(order.id);
        if (code === 0) {
          resetPagination(state.pagination);
          await getOrderList();
        }
      },
    });
  }

  // #ifdef MP-WEIXIN
  // 小程序确认收货组件 TODO 芋艿：【微信物流】后续再接入
  function mpConfirm(order) {
    if (!wx.openBusinessView) {
      sheep.$helper.toast(`请升级微信版本`);
      return;
    }
    wx.openBusinessView({
      businessType: 'weappOrderConfirm',
      extraData: {
        merchant_id: '1481069012',
        merchant_trade_no: order.wechat_extra_data.merchant_trade_no,
        transaction_id: order.wechat_extra_data.transaction_id,
      },
      success(response) {
        console.log('success:', response);
        if (response.errMsg === 'openBusinessView:ok') {
          if (response.extraData.status === 'success') {
            onConfirm(order, true);
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

  // 查看物流
  async function onExpress(id) {
    sheep.$router.go('/pages/order/express/log', {
      id,
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
          // 修改数据的状态
          let index = state.pagination.list.findIndex((order) => order.id === orderId);
          const orderInfo = state.pagination.list[index];
          orderInfo.status = 40;
          handleOrderButtons(orderInfo);
        }
      },
    });
  }

  // 删除订单
  function onDelete(orderId) {
    uni.showModal({
      title: '提示',
      content: '确定要删除订单吗?',
      success: async function (res) {
        if (res.confirm) {
          const { code } = await OrderApi.deleteOrder(orderId);
          if (code === 0) {
            // 删除数据
            let index = state.pagination.list.findIndex((order) => order.id === orderId);
            state.pagination.list.splice(index, 1);
          }
        }
      },
    });
  }

  // 获取订单列表
  async function getOrderList() {
    state.loadStatus = 'loading';
    let { code, data } = await OrderApi.getOrderPage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
      status: tabMaps[state.currentTab].value,
      commentStatus: tabMaps[state.currentTab].value === 30 ? false : null,
    });
    if (code !== 0) {
      return;
    }
    data.list.forEach((order) => handleOrderButtons(order));
    state.pagination.list = concat(state.pagination.list, data.list);
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  onLoad(async (options) => {
    if (options.type) {
      state.currentTab = options.type;
    }
    await getOrderList();
    
    // 开启定时器，每分钟更新一次当前时间以刷新倒计时
    timer = setInterval(() => {
      state.now = dayjs();
    }, 60000);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });

  // 加载更多
  function loadMore() {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getOrderList();
  }

  // 上拉加载更多
  onReachBottom(() => {
    loadMore();
  });

  // 下拉刷新
  onPullDownRefresh(() => {
    resetPagination(state.pagination);
    getOrderList();
    setTimeout(function () {
      uni.stopPullDownRefresh();
    }, 800);
  });
</script>

<style lang="scss" scoped>
  .score-img {
    width: 36rpx;
    height: 36rpx;
    margin: 0 4rpx;
  }

  .apply-btn {
    width: 140rpx;
    height: 50rpx;
    border-radius: 25rpx;
    font-size: 24rpx;
    border: 2rpx solid #dcdcdc;
    line-height: normal;
    margin-left: 16rpx;
  }

  .swiper-box {
    flex: 1;

    .swiper-item {
      height: 100%;
      width: 100%;
    }
  }

  :deep(.uni-tooltip-popup) {
    background: var(--ui-BG);
  }

  .warning-color {
    color: #B59E6D;
  }

  .danger-color {
    color: #ff3000;
  }

  .success-color {
    color: #9D9C96;
  }

  .info-color {
    color: #F53F3F;
  }

  /* 页面背景 */
  .page-list-container {
    padding-bottom: 20rpx;
  }

  /* 导航栏 */
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
  }
  :deep(.u-tabs) {
    background: #F8F9F3 !important;
    border-bottom: none !important;
  }

  /* 订单列表卡片 */
  .order-list-card-box {
    border-radius: 10rpx;
    margin-top: 24rpx;
    
    .order-card-header {
      height: 88rpx;

      .order-no {
        font-size: 28rpx;
        color: #9D9C96;
      }

      .order-state {
        font-size: 28rpx;
        font-weight: 700;
      }
      
      .pay-timer-box {
        background-color: rgba(255, 228, 229, 1);
        border-radius: 93rpx;
        padding-right: 13rpx;
        margin: 2rpx 0;
      }

      .state-tag {
        background-color: rgba(251, 47, 33, 1);
        border-radius: 36rpx 0px 36rpx 36rpx;
        padding: 2rpx 25rpx;
        margin-right: 12rpx;
      }

      .state-text {
        color: rgba(255, 255, 255, 1);
        font-size: 24rpx;
        line-height: normal;
      }

      .timer-text {
        color: rgba(255, 0, 0, 1);
        font-size: 24rpx;
        font-weight: 500;
        line-height: normal;
        margin-top: 2rpx;
      }
    }

    .goods-count-text {
      color: #3D3D3C;
      font-size: 24rpx;
      margin-top: 10rpx;
      text-align: right;
    }

    :deep(.price-text) {
      color: #F53F3F !important;
      font-size: 40rpx;
      font-weight: 700;
    }

    .pay-box {
      .discounts-title {
        font-size: 28rpx;
        line-height: normal;
        color: #3D3D3C;
      }

      .discounts-money {
        font-size: 28rpx;
        line-height: normal;
        color: #3D3D3C;
        font-weight: 600;
      }

      .pay-color {
        color: #3D3D3C;
      }
    }

    .order-card-footer {
      height: 100rpx;

      .more-item-box {
        padding: 20rpx;

        .more-item {
          height: 60rpx;

          .title {
            font-size: 26rpx;
          }
        }
      }

      .more-btn {
        color: $dark-9;
        font-size: 24rpx;
      }

      .content {
        width: 154rpx;
        color: #333333;
        font-size: 26rpx;
        font-weight: 500;
      }
    }
  }

  .tool-btn {
    width: 160rpx;
    height: 60rpx;
    background: #FFFFFF;
    font-size: 28rpx;
    border-radius: 30rpx;
    border: 2rpx solid #1E3F1C;
    color: #1E3F1C;
    margin-right: 10rpx;
    line-height: 56rpx;

    &:last-of-type {
      margin-right: 0;
    }
  }

  .pay-btn {
    width: 160rpx;
    height: 60rpx;
    background: #1E3F1C;
    font-size: 28rpx;
    border-radius: 30rpx;
    color: #FFFFFF;
    line-height: 60rpx;
    margin-right: 10rpx;

    &:last-of-type {
      margin-right: 0;
    }
  }

  .delete-btn {
    color: #ff3000;
    border-color: #ff3000;
  }
</style>
