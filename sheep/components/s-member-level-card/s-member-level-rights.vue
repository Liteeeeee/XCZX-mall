<template>
  <view class="s-member-level-rights-wrapper">
    <!-- 权益区域 -->
    <view class="block_14 flex-col">
      <!-- 会员统计数据 -->
      <view class="member-stats-card flex-row align-center" v-if="isCurrent">
        <view class="stats-item flex-col align-center">
          <text class="stats-title">累计已省金额</text>
          <text class="stats-value">{{ userInfo.totalSavings || '1000.00' }}</text>
        </view>
        <view class="stats-line"></view>
        <view class="stats-item flex-col align-center">
          <text class="stats-title">累计获得积分</text>
          <text class="stats-value">{{ userInfo.totalPoints || '1000' }}</text>
        </view>
      </view>

      <text class="text_8">{{ isUnlocked ? '已解锁' : '待解锁' }}{{ level.rights.length }}项权益</text>
      <view class="section_5 flex-row" v-if="level.rights && level.rights.length > 0">
        <view class="rights-item" v-for="(item, index) in level.rights" :key="index">
          <image class="rights-icon" :src="sheep.$url.static(item.icon)" mode="aspectFit"></image>
          <text class="rights-title">{{ item.title }}</text>
          <text class="rights-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed } from 'vue';

  const props = defineProps({
    level: {
      type: Object,
      required: true,
      default: () => ({})
    },
    userInfo: {
      type: Object,
      default: () => ({})
    }
  });

  const isCurrent = computed(() => {
    const idByLevel = {
      1: 'golden',
      2: 'platinum',
      3: 'diamond',
    };

    const rawLevel = props.userInfo?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel
        ? rawLevel.level ?? rawLevel.id ?? null
        : rawLevel;
    const normalizedLevel = level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) {
      return idByLevel[normalizedLevel] === props.level.id;
    }
    if (normalizedLevel === 0 || normalizedLevel === null) {
      return props.level.id === 'normal';
    }

    const rawLevelName = props.userInfo?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (!levelName) return props.level.id === 'normal';
    return levelName === props.level.name;
  });

  const currentUserLevel = computed(() => {
    const rawLevel = props.userInfo?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel
        ? rawLevel.level ?? rawLevel.id ?? null
        : rawLevel;
    const normalizedLevel = level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) return normalizedLevel;
    if (normalizedLevel === 0 || normalizedLevel === null) return 0;
    const rawLevelName = props.userInfo?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName.includes('钻石')) return 3;
    if (levelName.includes('铂金')) return 2;
    if (levelName.includes('黄金')) return 1;
    return 0;
  });

  const currentCardLevel = computed(() => {
    const id = props.level?.id;
    if (id === 'diamond') return 3;
    if (id === 'platinum') return 2;
    if (id === 'golden') return 1;
    return 0;
  });

  const isUnlocked = computed(() => currentCardLevel.value <= currentUserLevel.value);
</script>

<style lang="scss" scoped>
  .s-member-level-rights-wrapper {
    width: 100%;
    margin-top: -155rpx; // 向上移动以覆盖在卡片下方
    position: relative;
    z-index: 1;
  }

  /* 权益区域样式 */
  .block_14 {
    width: 100%;
    padding: 80rpx 30rpx 20rpx; // 调整顶部内边距，并将下边距设为 20rpx
    box-sizing: border-box;
    background: radial-gradient(circle at 50% -4450rpx, transparent 4485rpx, rgba(248, 249, 243, 1) 400.5rpx);
  }

  /* 会员统计卡片 */
  .member-stats-card {
    width: 100%;
    height: 160rpx;
    background: #FFFFFF;
    border: 1rpx solid #F0F0F0;
    border-radius: 16rpx;
    margin-bottom: 40rpx;
    display: flex;
    flex-direction: row;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
  }

  .stats-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .stats-title {
    font-size: 24rpx;
    color: #999999;
    margin-bottom: 12rpx;
  }

  .stats-value {
    font-size: 36rpx;
    color: #333333;
    font-weight: bold;
    font-family: DIN; // 这种数字通常使用 DIN 字体
  }

  .stats-line {
    width: 1rpx;
    height: 60rpx;
    background: #EEEEEE;
  }

  .text_8 {
    font-size: 28rpx;
    color: rgba(29, 33, 41, 1);
    font-weight: bold;
    margin-bottom: 10rpx;
    padding-left: 10rpx;
  }

  .section_5 {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap; // 允许换行
    padding: 10rpx 0;
  }

  .rights-item {
    flex: none;
    width: 25%; // 一行四项
    margin-bottom: 30rpx; // 换行后的行间距
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
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
