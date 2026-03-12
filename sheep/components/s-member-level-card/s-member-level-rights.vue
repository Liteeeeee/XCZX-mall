<template>
  <view class="s-member-level-rights-wrapper">
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
  .s-member-level-rights-wrapper {
    width: 100%;
    margin-top: -155rpx; // 向上移动以覆盖在卡片下方
    position: relative;
    z-index: 1;
  }

  /* 权益区域样式 */
  .block_14 {
    width: 100%;
    padding: 80rpx 30rpx 40rpx;
    box-sizing: border-box;
    background: radial-gradient(circle at 50% -4450rpx, transparent 4485rpx, rgba(248, 249, 243, 1) 400.5rpx);
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
