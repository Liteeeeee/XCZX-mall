<!-- 装修用户组件：用户订单 -->
<template>
  <view class="ss-order-menu-wrap ss-flex ss-col-center" :style="[style, { marginLeft: `${data.space}px` }]">
    <view
      class="menu-item ss-flex-1 ss-flex-col ss-row-center ss-col-center"
      v-for="item in displayedOrderMap"
      :key="item.title"
      @tap="onItemClick(item)"
    >
      <uni-badge
        class="uni-badge-left-margin"
        :text="item.count ? numData.orderCount[item.count] : 0"
        absolute="rightTop"
        size="small"
        :show-zero="false"
      >
        <view class="item-icon-box">
          <image v-if="!isEpIcon(item.icon)" class="item-icon" :src="sheep.$url.static(item.icon)" mode="aspectFit" />
          <uni-icons v-else :type="mapEpIcon(item.icon)" size="26" color="#333"></uni-icons>
        </view>
      </uni-badge>
      <view class="menu-title ss-m-t-28">{{ item.title || item.name }}</view>
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

  const isEpIcon = (icon) => icon && icon.startsWith('ep:');
  const mapEpIcon = (icon) => {
    const name = icon.replace('ep:', '');
    const dict = {
      'wallet': 'wallet',
      'box': 'box',
      'van': 'car',
      'circle-check': 'checkbox-filled',
    };
    return dict[name] || name;
  };

  const onItemClick = (item) => {
    if (item.path) {
      sheep.$router.go(item.path, { type: item.value });
    } else {
      console.log('点击了订单项：', item.name || item.title);
    }
  };

  const defaultOrderMap = [
    {
      title: '待付款',
      value: '1',
      icon: '/static/img/shop/order/no_pay.png',
      path: '/pages/order/list',
      type: 'unpaid',
      count: 'unpaidCount',
    },
    {
      title: '待收货',
      value: '3',
      icon: '/static/img/shop/order/no_take.png',
      path: '/pages/order/list',
      type: 'noget',
      count: 'deliveredCount',
    },
    {
      title: '待评价',
      value: '4',
      icon: '/static/img/shop/order/no_comment.png',
      path: '/pages/order/list',
      type: 'nocomment',
      count: 'uncommentedCount',
    },
    {
      title: '售后单',
      value: '0',
      icon: '/static/img/shop/order/change_order.png',
      path: '/pages/order/aftersale/list',
      type: 'aftersale',
      count: 'afterSaleCount',
    },
    {
      title: '全部订单',
      value: '0',
      icon: '/static/img/shop/order/all_order.png',
      path: '/pages/order/list',
    },
  ];

  const displayedOrderMap = computed(() => {
    if (props.data.items && props.data.items.length > 0) {
      return props.data.items.map(item => ({
        title: item.name,
        icon: item.icon,
        path: item.url,
        // 这里尝试映射一些标准值
        value: item.name === '待付款' ? '1' : item.name === '待收货' ? '3' : '0',
        count: item.name === '待付款' ? 'unpaidCount' : item.name === '待收货' ? 'deliveredCount' : '',
      }));
    }
    return defaultOrderMap;
  });

  // 设置角标
  const numData = computed(() => sheep.$store('user').numData);
  // 设置背景样式
  const style = computed(() => {
    const { bgType, bgImg, bgColor } = props.styles || {}; 
    return {
      background: bgType === 'img'
        ? `url(${bgImg}) no-repeat top center / 100% 100%`
        : bgColor
    };
  });
</script>

<style lang="scss" scoped>
  .ss-order-menu-wrap {
    padding: 20rpx 0;
    .menu-item {
      .item-icon-box {
        width: 44rpx;
        height: 44rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .item-icon {
        width: 44rpx;
        height: 44rpx;
      }
      .menu-title {
        font-size: 24rpx;
        color: #333;
      }
    }
  }
</style>
