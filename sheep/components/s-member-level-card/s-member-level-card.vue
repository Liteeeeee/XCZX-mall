<!-- 
  会员等级卡片组件
  包含：等级卡片、成长值进度、权益展示区域
-->
<template>
  <view class="s-member-level-card-wrapper">
    <!-- 等级卡片区域 -->
    <view class="box_5 flex-col" style="background: none !important;">
      <image
        :src="sheep.$url.static(level.cardBg, 'local')"
        mode="scaleToFill"
        style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 0"
      ></image>
      <view style="position: relative; z-index: 1">
        <view class="text-wrapper_1 flex-col" :style="{ background: level.badgeBg }">
          <text class="text_3" :style="{ color: level.badgeColor }">{{ isCurrent ? '当前等级' : '未解锁' }}</text>
        </view>
        <view class="text-group_1 flex-col">
          <view style="width: 20rpx;"></view>
          <text class="text_4" :style="{ color: level.mainColor }">{{ level.name }}</text>
          <view style="height: 14rpx;"></view>
          <text class="text_5" :style="{ color: level.mainColor }">健康省钱·专属服务一站式享</text>
        </view>
        <view style="margin-top: 40rpx !important;" class="group_5 flex-col" :style="{ background: level.decoGradient }"></view>
        <view class="group_6 flex-row">
          <text style="margin-left: 20rpx;" class="text_6" :style="{ color: level.mainColor }" v-if="isCurrent">已有{{ userInfo.experience || 0 }}成长值</text>
          <text style="margin-left: 20rpx;" class="text_6" :style="{ color: level.mainColor }" v-else>升级解锁更多权益</text>
          <text class="text_7" :style="{ color: level.mainColor }" @tap="sheep.$router.go('/pages/index/index')">
            {{ isCurrent ? '升级会员' : '立即开通' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 权益区域 -->
    <view class="block_14 flex-col">
      <text class="text_8">{{ isCurrent ? '已解锁' : '待解锁' }}{{ level.rights.length }}项权益</text>
      <view class="section_5 flex-row">
        <view class="rights-item flex-col align-center" v-for="(item, index) in level.rights" :key="index">
          <image class="rights-icon" :src="sheep.$url.static(item.icon, 'local')" mode="aspectFit"></image>
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
    return props.userInfo.levelName === props.level.name || (props.level.id === 'normal' && !props.userInfo.levelName);
  });
</script>

<style lang="scss" scoped>
  .s-member-level-card-wrapper {
    width: 100%;
  }

  /* 复用 member.vue 中的样式 */
  .box_5 {
    position: relative;
    width: 690rpx;
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
    color: #1E3F1C;
  }

  .text-group_1 {
    margin: 0 20rpx;
  }

  .text_4 {
    font-family: Kingsoft_Cloud_Font;
    font-size: 60rpx;
    color: #1E3F1C;
    line-height: 84rpx;
  }

  .text_5 {
    font-size: 24rpx;
    color: #1E3F1C;
    opacity: 0.8;
  }

  .group_5 {
    width: 590rpx;
    height: 8rpx;
    border-radius: 4rpx;
    background: linear-gradient(90deg, #1E3F1C 0%, rgba(30, 63, 28, 0.45) 17.81%, rgba(30, 63, 28, 0.1) 50.53%, rgba(163, 160, 191, 0) 100%);
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
    color: #1E3F1C;
  }

  .text_7 {
    font-size: 24rpx;
    color: #1E3F1C;
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
    background: radial-gradient(circle at 50% -4450rpx, transparent 4485rpx, rgba(248, 249, 243, 1) 400.5rpx);
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
