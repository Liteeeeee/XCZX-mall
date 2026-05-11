<!-- 装修用户组件：用户订单 -->
<template>
  <view class="ss-order-card ss-r-20">
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
            <image class="item-icon" :src="sheep.$url.cdn(item.icon)" mode="aspectFit" />
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

  const defaultOrderList = [
    {
      title: '待付款',
      icon: '/mp/static/myPageIcon/待付款@2x.png',
      path: '/pages/order/list',
      type: 'unpaid',
      value: '1',
      count: 'unpaidCount',
    },
    {
      title: '待发货',
      icon: '/mp/static/myPageIcon/待发货@2x.png',
      path: '/pages/order/list',
      type: 'nosend',
      value: '2',
      count: 'undeliveredCount',
    },
    {
      title: '待收货',
      icon: '/mp/static/myPageIcon/待收货@2x.png',
      path: '/pages/order/list',
      type: 'noget',
      value: '3',
      count: 'deliveredCount',
    },
    {
      title: '已完成',
      icon: '/mp/static/myPageIcon/已完成@2x.png',
      path: '/pages/order/list',
      type: 'completed',
      value: '4',
      count: 'uncommentedCount',
    },
    {
      title: '售后/退款',
      icon: '/mp/static/myPageIcon/已完成@2x.png',
      path: '/pages/order/aftersale/list',
      type: 'aftersale',
      count: 'afterSaleCount',
    },
  ];

  const orderMenuConfigMap = [
    {
      names: ['待付款'],
      icon: '/mp/static/myPageIcon/待付款@2x.png',
      path: '/pages/order/list',
      value: '1',
      count: 'unpaidCount',
    },
    {
      names: ['待发货'],
      icon: '/mp/static/myPageIcon/待发货@2x.png',
      path: '/pages/order/list',
      value: '2',
      count: 'undeliveredCount',
    },
    {
      names: ['待收货'],
      icon: '/mp/static/myPageIcon/待收货@2x.png',
      path: '/pages/order/list',
      value: '3',
      count: 'deliveredCount',
    },
    {
      names: ['待评价'],
      icon: '/mp/static/myPageIcon/待评价@2x.png',
      path: '/pages/order/list',
      value: '4',
      count: 'uncommentedCount',
    },
    {
      names: ['已完成'],
      icon: '/mp/static/myPageIcon/已完成@2x.png',
      path: '/pages/order/list',
      value: '5',
    },
    {
      names: ['售后/退款', '退款/售后', '售后', '退款'],
      icon: '/static/user/ywc.webp',
      path: '/pages/order/aftersale/list',
      count: 'afterSaleCount',
    },
  ];

  const getOrderMenuConfig = (item, index) => {
    const itemName = item?.name || item?.title || '';
    return (
      orderMenuConfigMap.find((config) => config.names.includes(itemName)) ||
      defaultOrderList[index] ||
      {}
    );
  };

  const orderList = computed(() => {
    const sourceItems = props.data?.items?.length ? props.data.items : defaultOrderList;
    return sourceItems.map((item, index) => {
      const config = getOrderMenuConfig(item, index);
      return {
        ...config,
        ...item,
        title: item?.name || item?.title || config.title,
        icon: config.icon,
        path: item?.url || item?.path || config.path,
        value: item?.value ?? config.value,
        count: item?.count || config.count,
      };
    });
  });

  const onItemClick = (item) => {
    if (item.value !== undefined && item.path === '/pages/order/list') {
      sheep.$router.go(item.path, { type: item.value });
      return;
    }
    sheep.$router.go(item.path);
  };

  // 设置角标
  const numData = computed(() => sheep.$store('user').numData);
</script>

<style lang="scss" scoped>
  .ss-order-card {
    padding: 30rpx;
    background: #fffefa;
    border-radius: 20rpx;

    .order-header {
      margin-bottom: 40rpx;

      .header-left {
        font-size: 32rpx;
        font-weight: bold;
        color: #3d3d3c;
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
      justify-content: space-between;

      .order-item {
        flex: 1;
        min-width: 0;

        .item-icon-box {
          width: 56rpx;
          height: 56rpx;
          // border: 1rpx dashed #ccc;
          border-radius: 10rpx;
        }

        .item-icon {
          width: 56rpx;
          height: 56rpx;
        }

        .item-title {
          font-size: 24rpx;
          color: #333;
        }
      }
    }
  }
</style>
