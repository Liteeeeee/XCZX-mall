<!-- 商品详情的底部导航 -->
<template>
  <su-fixed bottom placeholder bg="bg-white">
    <view class="ui-tabbar-box">
      <view class="ui-tabbar ss-flex ss-col-center ss-row-between">
        <view
          v-if="collectIcon"
          class="detail-tabbar-item ss-flex ss-flex-col ss-row-center ss-col-center"
          @tap="onFavorite"
        >
          <block v-if="modelValue.favorite">
            <uni-icons type="star-filled" size="22" color="#ff4d4f"></uni-icons>
            <view class="item-title">已收藏</view>
          </block>
          <block v-else>
            <uni-icons type="star" size="22" color="#666"></uni-icons>
            <view class="item-title">收藏</view>
          </block>
        </view>
        <view
          class="detail-tabbar-item ss-flex ss-flex-col ss-row-center ss-col-center"
          @tap="onCart"
        >
          <view class="icon-box">
             <uni-icons type="cart" size="22" color="#666"></uni-icons>
             <view class="badge" v-if="cartCount > 0">{{ cartCount }}</view>
          </view>
          <view class="item-title">购物车</view>
        </view>
        <button
          v-if="serviceIcon"
          class="ss-reset-button detail-tabbar-item ss-flex ss-flex-col ss-row-center ss-col-center"
          open-type="contact"
        >
          <uni-icons type="headphones" size="22" color="#666"></uni-icons>
          <view class="item-title">客服</view>
        </button>
        <slot></slot>
      </view>
    </view>
  </su-fixed>
</template>

<script setup>
  /**
   *
   * 底部导航
   *
   * @property {String} bg 			 			- 背景颜色Class
   * @property {String} ui 			 			- 自定义样式Class
   * @property {Boolean} noFixed 		 			- 是否定位
   * @property {Boolean} topRadius 		 		- 上圆角
   */
  import { reactive, computed } from 'vue';
  import sheep from '@/sheep';
  import { showShareModal } from '@/sheep/hooks/useModal';
  import FavoriteApi from '@/sheep/api/product/favorite';

  // 数据
  const state = reactive({});

  // 接收参数
  const props = defineProps({
    modelValue: {
      type: Object,
      default() {},
    },
    bg: {
      type: String,
      default: 'bg-white',
    },
    bgStyles: {
      type: Object,
      default() {},
    },
    ui: {
      type: String,
      default: '',
    },

    noFixed: {
      type: Boolean,
      default: false,
    },
    topRadius: {
      type: Number,
      default: 0,
    },
    collectIcon: {
      type: Boolean,
      default: false,
    },
    serviceIcon: {
      type: Boolean,
      default: true,
    },
    shareIcon: {
      type: Boolean,
      default: false,
    },
  });

  const cartCount = computed(() => sheep.$store('cart').list.length);

  async function onFavorite() {
    // 情况一：取消收藏
    if (props.modelValue.favorite) {
      const { code } = await FavoriteApi.deleteFavorite(props.modelValue.id);
      if (code !== 0) {
        return
      }
      sheep.$helper.toast('取消收藏');
      props.modelValue.favorite = false;
    // 情况二：添加收藏
    } else {
      const { code } = await FavoriteApi.createFavorite(props.modelValue.id);
      if (code !== 0) {
        return
      }
      sheep.$helper.toast('收藏成功');
      props.modelValue.favorite = true;
    }
  }

  const onChat = () => {
    sheep.$router.go('/pages/chat/index', {
      id: props.modelValue.id,
    });
  };

  const onCart = () => {
    sheep.$router.go('/pages/index/cart');
  };
</script>

<style lang="scss" scoped>
  .ui-tabbar-box {
    box-shadow: 0px -6px 10px 0px rgba(51, 51, 51, 0.2);
  }
  .ui-tabbar {
    display: flex;
    height: 100rpx;
    background: #fff;

    .detail-tabbar-item {
      width: 120rpx;
      height: 100%;
      position: relative;
      background: transparent;
      padding: 0;
      margin: 0;
      border: none;
      border-radius: 0;
      line-height: normal;

      &::after {
        border: none;
      }

      .icon-box {
        position: relative;
        width: 44rpx;
        height: 44rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .badge {
          position: absolute;
          top: -6rpx;
          right: -10rpx;
          min-width: 30rpx;
          height: 30rpx;
          line-height: 30rpx;
          text-align: center;
          background: #ff4d4f;
          color: #fff;
          font-size: 20rpx;
          border-radius: 15rpx;
          padding: 0 6rpx;
          border: 2rpx solid #fff;
        }
      }

      .item-title {
        font-size: 20rpx;
        font-weight: 500;
        line-height: 1;
        margin-top: 6rpx;
        color: #666;
      }
    }
  }
</style>
