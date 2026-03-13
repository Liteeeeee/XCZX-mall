<!-- 装修用户组件：用户订单 -->
<template>
  <view class="ss-order-card ss-r-20 bg-white">
    <view class="order-header ss-flex ss-col-center ss-row-between">
      <view class="header-left">我的订单</view>
      <view class="header-right ss-flex ss-col-center" @tap="sheep.$router.go('/pages/order/list')">
        <text class="ss-m-r-8">查看全部</text>
        <text class="_icon-forward"></text>
      </view>
    </view>
    <view class="order-content ss-flex ss-col-center ss-row-around">
      <view
        v-for="item in orderList"
        :key="item.title"
        class="order-item ss-flex-col ss-col-center"
        @tap="onItemClick(item)"
      >
        <uni-badge
          class="uni-badge-left-margin"
          :text="item.count ? numData.orderCount[item.count] : 0"
          absolute="rightTop"
          size="small"
          :show-zero="false"
        >
          <view class="item-icon-box ss-flex ss-row-center ss-col-center">
            <image class="item-icon" :src="sheep.$url.static(item.icon)" mode="aspectFit" />
          </view>
        </uni-badge>
        <view class="item-title ss-m-t-20">{{ item.title }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
  /**
   * 装修组件 - 订单菜单组
   */
  import sheep from '@/sheep';
  import { computed } from 'vue';

  const props = defineProps({
    // 装修数据
    data: {
      type: Object,
      default: () => ({}),
    },
    // 装修样式
    styles: {
      type: Object,
      default: () => ({}),
    },
  });

  const orderList = [
    {
      title: '待付款',
      icon: '/static/user/dfk.png',
      path: '/pages/order/list',
      type: 'unpaid',
      value: '1',
      count: 'unpaidCount',
    },
    {
      title: '待发货',
      icon: '/static/user/dfh.png',
      path: '/pages/order/list',
      type: 'nosend',
      value: '2',
      count: 'undeliveredCount',
    },
    {
      title: '待收货',
      icon: '/static/user/dsh.png',
      path: '/pages/order/list',
      type: 'noget',
      value: '3',
      count: 'deliveredCount',
    },
    {
      title: '已完成',
      icon: '/static/user/ywc.png',
      path: '/pages/order/list',
      type: 'completed',
      value: '4',
      count: 'uncommentedCount',
    },
  ];

  const onItemClick = (item) => {
    sheep.$router.go(item.path, { type: item.value });
  };

  // 设置角标
  const numData = computed(() => sheep.$store('user').numData);
</script>

<style lang="scss" scoped>
  .ss-order-card {
    padding: 30rpx;
    background: #fff;
    border-radius: 20rpx;

    .order-header {
      margin-bottom: 40rpx;

      .header-left {
        font-size: 32rpx;
        font-weight: bold;
        color: #1e3f1c;
      }

      .header-right {
        font-size: 24rpx;
        color: #999;

        ._icon-forward {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    .order-content {
      .order-item {
        .item-icon-box {
          width: 80rpx;
          height: 80rpx;
          // border: 1rpx dashed #ccc;
          border-radius: 10rpx;
        }

        .item-icon {
          width: 80rpx;
          height: 80rpx;
        }

        .item-title {
          font-size: 24rpx;
          color: #333;
        }
      }
    }
  }
</style>
