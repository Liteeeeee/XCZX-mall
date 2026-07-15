<!-- 装修用户组件：用户服务宫格 -->
<template>
  <view class="ss-user-info-list" :style="[cardStyle]">
    <view v-if="data.title" class="list-title ss-p-x-30 ss-p-y-20">{{ data.title }}</view>
    <view class="service-grid">
      <template v-for="(item, index) in filteredItems" :key="'service-' + index">
        <button
          v-if="item.name === '在线客服'"
          class="ss-reset-button service-item"
          open-type="contact"
        >
          <view class="service-icon-box ss-flex ss-row-center ss-col-center">
            <image v-if="getIcon(item)" class="item-icon" :src="getIcon(item)" mode="aspectFit" />
            <text v-else-if="item.iconName" :class="[item.iconName, 'item-icon-name']"></text>
          </view>
          <view class="item-title">{{ item.name }}</view>
        </button>

        <button
          v-else-if="item.name === SERVICE_HOTLINE_NAME"
          class="ss-reset-button service-item"
          @tap="onCallHotline"
        >
          <view class="service-icon-box ss-flex ss-row-center ss-col-center">
            <view class="hotline-phone-icon"></view>
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

  const SERVICE_HOTLINE_NAME = '客服热线';
  const SERVICE_HOTLINE_PHONE = '4008518802';

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

  const filteredItems = computed(() => {
    const items = Array.isArray(props.data.items) ? props.data.items : [];
    if (items.some((it) => it?.name === SERVICE_HOTLINE_NAME)) return items;
    return items.concat([{ name: SERVICE_HOTLINE_NAME }]);
  });

  const getIcon = (item) => {
    const iconMap = {
      退款售后: '/mp/static/myPageIcon/退款售后@2x.png',
      地址管理: '/mp/static/myPageIcon/地址管理@2x.png',
      在线客服: '/mp/static/myPageIcon/客服@2x.png',
      平台合伙人: '/mp/static/myPageIcon/平台合伙人@2x.png',
      申请合伙人: '/mp/static/myPageIcon/平台合伙人@2x.png',
      我的设置: '/mp/static/myPageIcon/我的设置@2x.png',
      积分商城: '/mp/static/积分商城@2x.png',
    };
    if (iconMap[item.name]) {
      return sheep.$url.cdn(iconMap[item.name]);
    }
    return item.icon ? sheep.$url.cdn(item.icon) : '';
  };

  const onCallHotline = () => {
    uni.makePhoneCall({
      phoneNumber: SERVICE_HOTLINE_PHONE,
    });
  };

  const onItemClick = async (item) => {
    if (item.name === '积分商城') {
      sheep.$router.go('/pages/activity/point/list');
      return;
    }
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
    if (item.name === SERVICE_HOTLINE_NAME) {
      onCallHotline();
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

      .hotline-phone-icon {
        width: 48rpx;
        height: 48rpx;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92Z' stroke='%23868686' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
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
