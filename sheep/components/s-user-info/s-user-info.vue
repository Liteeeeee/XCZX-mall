<!-- 装修用户组件：用户信息（列表式菜单） -->
<template>
  <view class="ss-user-info-list" :style="[cardStyle]">
    <view v-if="data.title" class="list-title ss-p-x-30 ss-p-y-20">{{ data.title }}</view>
    <view
      v-for="(item, index) in data.items"
      :key="index"
      class="list-item ss-flex ss-col-center ss-row-between ss-p-x-30 ss-p-y-30"
      @tap="onItemClick(item)"
    >
      <view class="ss-flex ss-col-center">
        <!-- 优先显示装修配置的图片图标 -->
        <image v-if="getIcon(item)" class="item-icon ss-m-r-20" :src="getIcon(item)" mode="aspectFit" />
        <!-- 兼容 element-plus 等图标名 (ep:setting) -->
        <text v-else-if="item.iconName" :class="[item.iconName, 'item-icon-name', 'ss-m-r-20']"></text>
        <text class="item-title">{{ item.name }}</text>
      </view>
      <view class="ss-flex ss-col-center">
        <text v-if="item.value" class="item-value ss-m-r-10">{{ item.value }}</text>
        <text class="_icon-forward"></text>
      </view>
    </view>
  </view>
</template>

<script setup>
  /**
   * 用户信息 (列表式菜单)
   */
  import { computed } from 'vue';
  import sheep from '@/sheep';

  const props = defineProps({
    data: {
      type: Object,
      default: () => ({
        title: '',
        items: [],
      }),
    },
    styles: {
      type: Object,
      default: () => ({}),
    },
  });

  const cardStyle = computed(() => {
    const style = props.styles || {};
    return {
      background: style.bgType === 'color' ? style.bgColor : '#fff',
      marginLeft: `${style.marginLeft || 0}px`,
      marginRight: `${style.marginRight || 0}px`,
      marginTop: `${style.marginTop || 0}px`,
      marginBottom: `${style.marginBottom || 0}px`,
      borderRadius: `${style.borderRadius || 0}px`,
      overflow: 'hidden',
    };
  });

  const getIcon = (item) => {
    const iconMap = {
      '我的设置': '/static/user/setting.webp',
      '地址管理': '/static/user/address.webp',
      '平台合伙人': '/static/user/friend.webp',
    };
    if (iconMap[item.name]) {
      return sheep.$url.static(iconMap[item.name]);
    }
    return item.icon ? sheep.$url.cdn(item.icon) : '';
  };

  const onItemClick = (item) => {
    if (item.name === '我的设置') {
      sheep.$router.go('/pages/user/info');
      return;
    }
    if (item.name === '地址管理') {
      sheep.$router.go('/pages/user/address/list');
      return;
    }
    if (item.name === '平台合伙人') {
      sheep.$router.go('/pages/commission/index');
      return;
    }
    if (item.url) {
      sheep.$router.go(item.url);
    }
  };
</script>

<style lang="scss" scoped>
  .ss-user-info-list {
    margin-top: 40rpx !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    border-radius: 22rpx !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 40rpx !important;
    .list-title {
      font-size: 30rpx;
      font-weight: bold;
      color: rgba(30, 63, 28, 1);
    }

    .list-item {
      background: #fff;
      transition: all 0.3s;

      &:active {
        background: #f9f9f9;
      }

  
      .item-icon {
        width: 44rpx;
        height: 44rpx;
      }

      .item-icon-name {
        font-size: 40rpx;
        color: #333;
      }

      .item-title {
        font-size: 28rpx;
        color: #333;
      }

      .item-value {
        font-size: 24rpx;
        color: #999;
      }

      ._icon-forward {
        font-size: 28rpx;
        color: #ccc;
      }
    }
  }
</style>
