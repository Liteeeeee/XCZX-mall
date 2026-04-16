<!-- 
  会员等级卡片组件
  包含：等级卡片、成长值进度、权益展示区域
-->
<template>
  <view class="s-member-level-card-wrapper">
    <!-- 等级卡片区域 -->
    <view class="box_5 flex-col" style="background: none !important">
      <image
        :src="sheep.$url.static(level.cardBg)"
        mode="scaleToFill"
        style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 0"
      ></image>
      <view style="position: relative; z-index: 1">
        <view class="text-wrapper_1 flex-col" :style="{ background: level.badgeBg }">
          <text class="text_3" :style="{ color: level.badgeColor }">{{ badgeText }}</text>
        </view>
        <!-- 进度条已接管这部分展示 -->
        <view
          style="margin-top: 40rpx !important"
          class="group_5 flex-col"
          :style="{ background: level.decoGradient }"
        ></view>
        <view class="group_6 flex-row">
          <text
            class="text_6"
            :style="{ color: level.mainColor }"
            v-if="isCurrent && isVipUser && currentUserLevel < 3"
            >{{ currentGrowthText }}</text
          >
          <!-- <text class="text_6" :style="{ color: level.mainColor }" v-else-if="isCurrent && isVipUser"
            >已解锁该等级权益</text
          > -->
          <text class="text_6" :style="{ color: level.mainColor }" v-else-if="isCurrent"
            >已有{{ userInfo.experience || 0 }}成长值</text
          >
          <text
            class="text_6"
            :style="{ color: level.mainColor }"
            v-else-if="currentUserLevel > currentCardLevel"
            >已解锁该等级权益</text
          >
          <text class="text_6" :style="{ color: level.mainColor }" v-else>升级解锁更多权益</text>
          <text v-if="!isVipUser" class="text_7" @tap="onOpenVip">
            {{ '立即开通>' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 权益区域 -->
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, ref, watch } from 'vue';
  import TradeSummaryApi from '@/sheep/api/trade/summary';
  import MemberLevelApi from '@/sheep/api/member/level';

  const props = defineProps({
    level: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    userInfo: {
      type: Object,
      default: () => ({}),
    },
  });

  const isCurrent = computed(() => {
    const idByLevel = {
      1: 'golden',
      2: 'platinum',
      3: 'diamond',
    };

    const rawLevel = props.userInfo?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) {
      return idByLevel[normalizedLevel] === props.level.id;
    }

    const rawLevelName = props.userInfo?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName.includes('钻石')) return props.level.id === 'diamond';
    if (levelName.includes('铂金')) return props.level.id === 'platinum';
    if (levelName.includes('黄金')) return props.level.id === 'golden';

    return props.level.id === 'golden'; // Default fallback
  });

  const isVipUser = computed(() => {
    const rawLevel = props.userInfo?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) return true;

    const rawLevelName = props.userInfo?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    return levelName.includes('黄金') || levelName.includes('铂金') || levelName.includes('钻石');
  });

  async function onOpenVip() {
    const priceYuan = Number(props.level?.price || 0);
    if (!priceYuan || Number.isNaN(priceYuan)) {
      sheep.$helper.toast('套餐价格异常');
      return;
    }
    const { code, data } = await MemberLevelApi.activateCreate({
      payPrice: priceYuan * 100,
      validPayPriceAndPackageId: true,
    });
    if (code === 0 && data?.payOrderId) {
      sheep.$router.redirect('/pages/pay/index', {
        id: data.payOrderId,
        orderType: 'vip_upgrade',
      });
      return;
    }
    sheep.$helper.toast(data?.msg || '创建支付订单失败');
  }

  const currentUserLevel = computed(() => {
    const rawLevel = props.userInfo?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3)
      return normalizedLevel;

    const rawLevelName = props.userInfo?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName.includes('钻石')) return 3;
    if (levelName.includes('铂金')) return 2;
    if (levelName.includes('黄金')) return 1;
    return 1; // Default fallback
  });

  const currentCardLevel = computed(() => {
    const id = props.level?.id;
    if (id === 'diamond') return 3;
    if (id === 'platinum') return 2;
    if (id === 'golden') return 1;
    return 1;
  });

  const currentGrowthText = computed(() => {
    const exp = Number(props.userInfo?.experience || 0);
    if (currentUserLevel.value === 2) return `${exp}/15000`;
    return `${exp}/5000`;
  });

  const badgeText = computed(() => {
    if (!isVipUser.value) return '未开通';
    if (isCurrent.value) return '当前等级';
    return currentCardLevel.value <= currentUserLevel.value ? '已解锁' : '未解锁';
  });

  const showSavedMoney = computed(() => isVipUser.value && isCurrent.value);
  const totalSavedMoney = ref(undefined);
  const totalSavedMoneyText = computed(() => {
    const v = totalSavedMoney.value;
    if (v === undefined) return '--';
    if (v === null || v === undefined || v === '') return '0.00';
    const n = Number(v);
    if (Number.isFinite(n)) return n.toFixed(2);
    return String(v);
  });

  const loadTradeSummary = async () => {
    const { code, data } = await TradeSummaryApi.getSummary();
    if (code === 0 && data) {
      totalSavedMoney.value = data.totalSavedMoney ?? 0;
    }
  };

  watch(
    showSavedMoney,
    (val) => {
      if (!val) return;
      if (totalSavedMoney.value !== undefined) return;
      loadTradeSummary();
    },
    { immediate: true },
  );
</script>

<style lang="scss" scoped>
  .s-member-level-card-wrapper {
    width: 100%;
  }

  /* 复用 member.vue 中的样式 */
  .box_5 {
    position: relative;
    width: 656rpx;
    height: 396rpx;
    margin: 0 auto;
    padding-top: 55rpx;
    box-sizing: border-box;
    border-radius: 20rpx;
    overflow: hidden;
  }

  .text-wrapper_1 {
    width: 98rpx;
    height: 30rpx;
    background: rgba(30, 63, 28, 0.2);
    border-radius: 15rpx 0 15rpx 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;
  }

  .text_3 {
    font-size: 20rpx;
    color: #1e3f1c;
  }

  .text-group_1 {
    margin: 0 20rpx;
  }

  .text_4 {
    font-family: Kingsoft_Cloud_Font;
    font-size: 60rpx;
    color: #1e3f1c;
    line-height: 84rpx;
  }

  .text_5 {
    font-size: 24rpx;
    color: #1e3f1c;
    opacity: 0.8;
  }

  .saved-money-tip {
    display: inline-flex;
    align-items: center;
    border-radius: 19rpx;
    padding: 4rpx 12rpx;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    width: 266rpx;
    opacity: 0.8;
  }

  .saved-money-text {
    font-size: 24rpx;
    line-height: 34rpx;
    white-space: nowrap;
  }

  .group_5 {
    width: 590rpx;
    height: 8rpx;
    border-radius: 4rpx;
    background: linear-gradient(
      90deg,
      #1e3f1c 0%,
      rgba(30, 63, 28, 0.45) 17.81%,
      rgba(30, 63, 28, 0.1) 50.53%,
      rgba(163, 160, 191, 0) 100%
    );
    margin: 20rpx 0 0 20rpx;
  }

  .group_6 {
    margin: 20rpx 20rpx 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .text_6 {
    font-size: 24rpx;
    color: #1e3f1c;
  }

  .text_7 {
    font-size: 24rpx;
    color: #fff;
    display: flex;
    align-items: center;
  }

  .icon-right {
    margin-left: 4rpx;
    font-size: 20rpx;
  }

  /* 权益区域样式 */
  .block_14 {
    width: 100%;
    padding: 80rpx 30rpx 40rpx;
    box-sizing: border-box;
    margin-top: -73rpx;
    background: radial-gradient(
      circle at 50% -4450rpx,
      transparent 4485rpx,
      rgba(248, 249, 243, 1) 400.5rpx
    );
    position: relative;
    z-index: 1;
  }

  .text_8 {
    font-size: 28rpx;
    color: #333;
    font-weight: bold;
    margin-bottom: 30rpx;
    padding-left: 10rpx;
  }

  .section_5 {
    width: 100%;
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    padding: 10rpx 0;

    /* 隐藏滚动条 */
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .rights-item {
    flex: none;
    width: 140rpx;
    margin-right: 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    &:last-child {
      margin-right: 0;
    }
  }

  .rights-icon {
    width: 80rpx;
    height: 80rpx;
    margin-bottom: 16rpx;
  }

  .rights-title {
    font-size: 24rpx;
    color: #333;
    font-weight: 600;
    margin-bottom: 8rpx;
    white-space: nowrap;
  }

  .rights-desc {
    font-size: 20rpx;
    color: #999;
    text-align: center;
    white-space: nowrap;
  }

  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .align-center {
    align-items: center;
  }
</style>
