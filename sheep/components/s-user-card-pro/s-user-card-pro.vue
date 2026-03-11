<!-- 装修用户组件：用户卡片 Pro -->
<template>
  <view class="ss-user-card-pro" :style="[cardStyle, { minHeight: '500rpx', background: !isLogin ? '#e0fde0' : (cardStyle.background || '#fff'), display: 'block' }]" :class="{ 'unlogin-card': !isLogin }">
    <!-- 沉浸式占位 -->
    <view :style="{ height: statusBarHeight + 'px' }"></view>
    <view :style="{ height: navBarHeight + 'px' }"></view>

    <!-- 未登录时的背景装饰 -->

    <!-- 顶部用户信息区域 -->
    <view class="user-info-section ss-flex ss-col-center ss-row-between" :class="{ 'unlogin-section': !isLogin }" style="position: relative; z-index: 2;">
      <view class="ss-flex ss-col-center">
        <!-- 头像 -->
        <view class="avatar-box ss-m-r-30" :class="{ 'unlogin-avatar': !isLogin }">
          <image
            class="avatar-img"
            :src="isLogin && userInfo.avatar ? sheep.$url.cdn(userInfo.avatar) : '/static/data-empty.png'"
            mode="aspectFill"
            @tap="onUserClick"
          />
        </view>
        <!-- 昵称与登录引导 -->
        <view class="info-content" @tap="onUserClick">
          <view class="nickname ss-m-b-8" :class="{ 'unlogin-nickname': !isLogin }">
            {{ isLogin ? (userInfo.nickname || '未设置昵称') : '点击登录' }}
          </view>
          <view v-if="!isLogin" class="unlogin-prompt" style="color: #666; font-size: 26rpx;">
            登录账号 开启您的专属权益
          </view>
          <view v-else-if="userInfo.mobile" class="mobile-text ss-flex ss-col-center">
            <text class="cicon-mobile-o ss-m-r-8"></text>
            {{ userInfo.mobile }}
          </view>
          <view v-else class="mobile-text" @tap.stop="onBindMobile">
            点击绑定手机号
          </view>
        </view>
      </view>

      <!-- 登录按钮/分享二维码 -->
      <view class="right-action">
        <button v-if="!isLogin" class="ss-reset-button login-btn" style="background: #ff4d4f; color: #fff; padding: 10rpx 30rpx; border-radius: 30rpx; font-size: 24rpx;" @tap="onUserClick">去登录</button>
        <button v-else class="ss-reset-button qr-btn" @tap="showShareModal">
          <text class="sicon-qrcode"></text>
        </button>
      </view>
    </view>

    <!-- 底部统计数据区域 -->
    <view class="stats-section ss-flex ss-row-around ss-m-t-40" style="position: relative; z-index: 2;">
      <view
        v-for="(item, index) in statsList"
        :key="index"
        class="stats-item ss-flex-col ss-col-center"
        @tap="onStatsClick(item.type)"
      >
        <view class="stats-value" style="font-size: 32rpx; font-weight: bold; color: #333;">{{ item.value }}</view>
        <view class="stats-label" style="font-size: 24rpx; color: #999;">{{ item.label }}</view>
      </view>
    </view>

    <!-- 未登录时的占位插画 -->
    <view v-if="!isLogin" class="unlogin-illustration ss-flex ss-row-center ss-m-t-30" style="position: relative; z-index: 2;">
      <image class="illustration-img" src="/static/data-empty.png" mode="aspectFit" style="width: 200rpx; height: 200rpx;" />
    </view>
  </view>
</template>

<script setup>
  /**
   * 装修组件 - 用户卡片 Pro
   */
  import { computed } from 'vue';
  import sheep from '@/sheep';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const statusBarHeight = sheep.$platform.device.statusBarHeight;
  const navBarHeight = sheep.$platform.navbar - statusBarHeight;

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

  // 用户信息
  const userInfo = computed(() => sheep.$store('user').userInfo || {
    avatar: '',
    nickname: '',
    mobile: '',
    point: 0,
    balance: 0,
    coupon: 0
  });
  const userWallet = computed(() => sheep.$store('user').userWallet || { balance: 0 });
  const numData = computed(() => sheep.$store('user').numData || { coupon: 0, point: 0 });
  const isLogin = computed(() => sheep.$store('user').isLogin);

  // 统计数据列表
  const statsList = computed(() => {
    // 优先从 props.data 中获取 stats
    const statsFromData = props.data.stats || [];
    // 如果 props.data.stats 为空，则根据 isLogin 提供默认值
    const list = [
      {
        label: '余额',
        value: isLogin.value ? fen2yuan(userWallet.value.balance) : (findStatValue(statsFromData, '余额') || '0.00'),
        type: 'balance',
      },
      {
        label: '积分',
        value: isLogin.value ? userInfo.value.point : (findStatValue(statsFromData, '积分') || '0'),
        type: 'point',
      },
      {
        label: '优惠券',
        value: isLogin.value ? numData.value.unusedCouponCount : (findStatValue(statsFromData, '优惠券') || '0'),
        type: 'coupon',
      },
    ];
    return list;
  });

  const findStatValue = (stats, label) => {
    if (!stats || !Array.isArray(stats)) return null;
    const item = stats.find((s) => s.label === label);
    return item ? item.value : null;
  };

  // 手机号脱敏
  const formatMobile = (mobile) => {
    if (!mobile) return '';
    return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  // 点击用户头像/昵称
  const onUserClick = () => {
    if (isLogin.value) {
      sheep.$router.go('/pages/user/info');
    } else {
      sheep.$store('user').showAuthModal();
    }
  };

  // 点击统计项
  const onStatsClick = (type) => {
    if (!isLogin.value) {
      sheep.$store('user').showAuthModal();
      return;
    }
    const routes = {
      balance: '/pages/user/wallet/money',
      point: '/pages/user/wallet/score',
      coupon: '/pages/coupon/list',
    };
    if (routes[type]) {
      sheep.$router.go(routes[type]);
    }
  };

  // 样式处理
  const cardStyle = computed(() => {
    // 优先从 props.styles 获取样式
    const style = props.styles || {};
    return {
      background: style.bgType === 'color' ? style.bgColor : '#e0fde0',
      marginLeft: `${style.marginLeft || 0}px`,
      marginRight: `${style.marginRight || 0}px`,
      marginTop: `${style.marginTop || 0}px`,
      marginBottom: `${style.marginBottom || 0}px`,
      paddingTop: `${style.paddingTop || 0}px`,
      paddingRight: `${style.paddingRight || 0}px`,
      paddingBottom: `${style.paddingBottom || 0}px`,
      paddingLeft: `${style.paddingLeft || 0}px`,
      borderRadius: `${style.borderRadius || 0}px`,
      borderTopLeftRadius: `${style.borderTopLeftRadius || 0}px`,
      borderTopRightRadius: `${style.borderTopRightRadius || 0}px`,
      borderBottomRightRadius: `${style.borderBottomRightRadius || 0}px`,
      borderBottomLeftRadius: `${style.borderBottomLeftRadius || 0}px`,
    };
  });
</script>

<style lang="scss" scoped>
  .ss-user-card-pro {
    box-sizing: border-box;
    min-height: 460rpx;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;

    .unlogin-bg-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;

      .circle-1 {
        position: absolute;
        width: 300rpx;
        height: 300rpx;
        background: rgba(82, 196, 26, 0.1);
        border-radius: 50%;
        top: -100rpx;
        right: -100rpx;
      }

      .circle-2 {
        position: absolute;
        width: 200rpx;
        height: 200rpx;
        background: rgba(82, 196, 26, 0.05);
        border-radius: 50%;
        bottom: 50rpx;
        left: -50rpx;
      }
    }

    .user-info-section {
      padding: 20rpx 0;
      position: relative;
      z-index: 1;
      &.unlogin-section {
        padding: 60rpx 0 40rpx;
      }
    }

    .avatar-box {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      overflow: hidden;
      border: 4rpx solid #fff;
      transition: all 0.3s;
      background: #f5f5f5;

      &.unlogin-avatar {
        width: 140rpx;
        height: 140rpx;
        box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);
      }

      .avatar-img {
        width: 100%;
        height: 100%;
      }
    }

    .info-content {
      position: relative;
      z-index: 1;
      .nickname {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;

        &.unlogin-nickname {
          font-size: 42rpx;
          color: #111;
        }
      }
      .mobile {
        font-size: 28rpx;
        color: #666;
      }
      .login-prompt {
        .prompt-text {
          font-size: 26rpx;
          color: #999;
          margin-right: 8rpx;
        }
      }
    }

    .right-action {
      position: relative;
      z-index: 1;
      .login-btn {
        width: 140rpx;
        height: 60rpx;
        line-height: 60rpx;
        background: linear-gradient(90deg, #52c41a, #73d13d);
        color: #fff;
        font-size: 26rpx;
        border-radius: 30rpx;
        text-align: center;
        box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.2);
        font-weight: bold;
      }
      .qr-btn {
        .sicon-qrcode {
          font-size: 40rpx;
          color: #333;
        }
      }
    }

    .stats-section {
      margin-top: auto;
      padding-bottom: 30rpx;
      position: relative;
      z-index: 1;
      .stats-item {
        .stats-value {
          font-size: 38rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }
        .stats-label {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    .unlogin-illustration {
      opacity: 0.8;
      pointer-events: none;
      .illustration-img {
        width: 240rpx;
        height: 240rpx;
      }
    }

    .level-tag-box {
      .level-tag {
        background: #c3fba7;
        padding: 4rpx 16rpx;
        border-radius: 10rpx 30rpx 30rpx 10rpx;
        border: 1rpx solid #52c41a;
        .level-text {
          font-size: 24rpx;
          color: #52c41a;
          font-weight: bold;
        }
      }
    }
    &.unlogin-card {
      border: 4rpx dashed #52c41a;
      background: rgba(82, 196, 26, 0.05) !important;
    }
  }
</style>
