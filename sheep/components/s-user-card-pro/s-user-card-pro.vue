<!-- 装修用户组件：用户卡片 Pro -->
<template>
  <view
    class="ss-user-card-pro"
    :style="[cardStyle, { minHeight: '500rpx', background: 'none !important', display: 'block' }]"
    :class="{ 'unlogin-card': !isLogin }"
    @tap="onCardClick"
  >
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
            :src="sheep.$url.avatar(isLogin ? userInfo.avatar : '')"
            mode="aspectFill"
            @tap="onUserClick"
          />
        </view>
        <!-- 昵称与登录引导 -->
        <view class="info-content" @tap="onUserClick">
          <view class="nickname ss-m-b-8" :class="{ 'unlogin-nickname': !isLogin }">
            {{ isLogin ? (userInfo.nickname || '未设置昵称') : '登录/注册' }}
          </view>
          <view v-if="!isLogin" class="unlogin-prompt" style="color: #666; font-size: 26rpx;">
            登录体验更多功能哦~
          </view>
          <view v-else-if="userInfo.mobile" class="mobile-text ss-flex ss-col-center">
            <text class="cicon-mobile-o ss-m-r-8"></text>
            {{ formatMobile(userInfo.mobile) }}
          </view>
          <view v-else class="mobile-text" @tap.stop="onBindMobile">
            点击绑定手机号
          </view>
        </view>
      </view>

      <!-- 登录按钮/会员等级图标 -->
      <view class="right-action">
        <view v-if="isLogin" class="member-icon-box" @tap="sheep.$router.go('/pages/index/member')">
          <image class="member-icon" :src="sheep.$url.static(memberIcon)" mode="aspectFit" />
        </view>
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
        <view class="stats-value" style="font-family: MicrosoftYaHei, MicrosoftYaHei;font-size:35rpx; font-weight: bold; color: rgba(30, 63, 28, 1);">{{ item.value }}</view>
        <view class="stats-label" style="font-size: 26rpx; color: rgba(51, 51, 51, 1);">{{ item.label }}</view>
      </view>
    </view>

    <!-- VIP 会员卡片 -->
    <view v-if="isLogin && showVipCard" class="ss-p-b-30 ">
      <s-vip-card />
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
  import { showAuthModal } from '@/sheep/hooks/useModal';

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
    coupon: 0,
    level: null
  });
  const userWallet = computed(() => sheep.$store('user').userWallet || { balance: 0 });
  const numData = computed(() => sheep.$store('user').numData || { coupon: 0, point: 0 });
  const isLogin = computed(() => sheep.$store('user').isLogin);
  const showVipCard = computed(() => {
    if (!isLogin.value) return false;
    const rawLevel = userInfo.value?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel
        ? rawLevel.level ?? rawLevel.id ?? null
        : rawLevel;
    const normalizedLevel = level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) return false;
    const rawLevelName = userInfo.value?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName.includes('黄金') || levelName.includes('铂金') || levelName.includes('钻石')) return false;
    return true;
  });

  // 会员等级图标
  const memberIcon = computed(() => {
    const iconsByLevel = {
      1: '/static/user/vipGolden.webp',
      2: '/static/user/vipBojin.webp',
      3: '/static/user/vipDimond.webp',
    };

    const rawLevel = userInfo.value?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel
        ? rawLevel.level ?? rawLevel.id ?? null
        : rawLevel;
    const normalizedLevel = level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) {
      return iconsByLevel[normalizedLevel] || '/static/user/normal.webp';
    }

    const rawLevelName = userInfo.value?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName.includes('钻石')) return iconsByLevel[3];
    if (levelName.includes('铂金')) return iconsByLevel[2];
    if (levelName.includes('黄金')) return iconsByLevel[1];
    return '/static/user/normal.webp';
  });

  // 统计数据列表
  const statsList = computed(() => {
    const list = [
      {
        label: '余额',
        value: isLogin.value ? fen2yuan(userWallet.value.balance) : '0.00',
        type: 'balance',
      },
      {
        label: '积分',
        value: isLogin.value ? userInfo.value.point : '0',
        type: 'point',
      },
      {
        label: '优惠券',
        value: isLogin.value ? numData.value.unusedCouponCount : '0',
        type: 'coupon',
      },
    ];
    return list;
  });

  // 手机号脱敏
  const formatMobile = (mobile) => {
    if (!mobile) return '';
    return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  // 点击卡片
  const onCardClick = () => {
    if (!isLogin.value) {
      showAuthModal();
    }
  };

  // 点击用户头像/昵称
  const onUserClick = () => {
    if (isLogin.value) {
      sheep.$router.go('/pages/user/info');
    }
  };

  // 点击统计项
  const onStatsClick = (type) => {
    if (!isLogin.value) return;
    const routes = {
      balance: '/pages/user/wallet/money',
      point: '/pages/user/wallet/score',
      coupon: '/pages/coupon/list',
    };
    if (routes[type]) {
      sheep.$router.go(routes[type]);
    }
  };

  // 绑定手机号
  const onBindMobile = () => {
    showAuthModal('changeMobile');
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
    padding: 0 !important;
    margin-top: 30rpx;
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
      .member-icon-box {
        width: 160rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        .member-icon {
          width: 100%;
          height: 100%;
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
      background: rgba(82, 196, 26, 0.05) !important;
    }
  }
</style>
