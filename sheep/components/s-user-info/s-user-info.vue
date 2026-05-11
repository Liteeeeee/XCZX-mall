<!-- 装修用户组件：用户服务宫格 -->
<template>
  <view class="ss-user-info-list" :style="[cardStyle]">
    <view v-if="data.title" class="list-title ss-p-x-30 ss-p-y-20">{{ data.title }}</view>
    <view class="service-grid">
      <template v-for="(item, index) in filteredItems" :key="'service-' + index">
        <button
          v-if="item.name === '客服热线'"
          class="ss-reset-button service-item"
          open-type="contact"
        >
          <view class="service-icon-box ss-flex ss-row-center ss-col-center">
            <image v-if="getIcon(item)" class="item-icon" :src="getIcon(item)" mode="aspectFit" />
            <text v-else-if="item.iconName" :class="[item.iconName, 'item-icon-name']"></text>
          </view>
          <view class="item-title">{{ item.name }}</view>
        </button>
        <view v-else class="service-item" @tap="onItemClick(item)">
          <view class="service-icon-box ss-flex ss-row-center ss-col-center">
            <image v-if="getIcon(item)" class="item-icon" :src="getIcon(item)" mode="aspectFit" />
            <text v-else-if="item.iconName" :class="[item.iconName, 'item-icon-name']"></text>
          </view>
          <view class="item-title">{{ item.name }}</view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
  /**
   * 用户服务宫格
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

  const filteredItems = computed(() => props.data.items || []);

  const getIcon = (item) => {
    const iconMap = {
      退款售后: '/mp/static/myPageIcon/退款售后@2x.png',
      地址管理: '/mp/static/myPageIcon/地址管理@2x.png',
      客服热线: '/mp/static/myPageIcon/客服@2x.png',
      平台合伙人: '/mp/static/myPageIcon/平台合伙人@2x.png',
      申请合伙人: '/mp/static/myPageIcon/平台合伙人@2x.png',
      我的设置: '/mp/static/myPageIcon/我的设置@2x.png',
    };
    if (iconMap[item.name]) {
      return sheep.$url.cdn(iconMap[item.name]);
    }
    return item.icon ? sheep.$url.cdn(item.icon) : '';
  };

  const onItemClick = async (item) => {
    if (item.name === '我的设置') {
      sheep.$router.go('/pages/user/info');
      return;
    }
    if (item.name === '地址管理') {
      sheep.$router.go('/pages/user/address/list');
      return;
    }
    if (item.name === '退款售后') {
      sheep.$router.go('/pages/order/aftersale/list');
      return;
    }
    if (item.name === '平台合伙人') {
      sheep.$router.go('/pages/commission/apply');
      return;
    }
    if (item.name === '申请合伙人') {
      sheep.$router.go('/pages/commission/apply');
      return;
    }
    if (item.url) {
      sheep.$router.go(item.url);
    }
  };
</script>

<style lang="scss" scoped>
  .ss-user-info-list {
    background: #fffffa;
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
      color: #3c3c3c;
    }

    .service-grid {
      display: flex;
      flex-wrap: wrap;
      padding: 10rpx 6rpx 0;
    }

    .service-item {
      width: 25%;
      padding: 20rpx 0 24rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      transition: all 0.3s;

      &:active {
        opacity: 0.85;
      }

      .service-icon-box {
        width: 56rpx;
        height: 56rpx;
      }

      .item-icon {
        width: 56rpx;
        height: 56rpx;
      }

      .item-icon-name {
        font-size: 40rpx;
        color: #333;
      }

      .item-title {
        font-size: 24rpx;
        color: #333333;
        line-height: 34rpx;
        margin-top: 20rpx;
        text-align: center;
      }
    }
  }
</style>
