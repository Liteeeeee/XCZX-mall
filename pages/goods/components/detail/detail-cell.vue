<!-- 商品详情：cell 组件 -->
<template>
  <view class="detail-cell-wrap ss-flex ss-col-center ss-row-between" @tap="onClick">
    <view class="label-text">{{ label }}</view>
    <view class="cell-content ss-line-1 ss-flex-1">{{ value }}</view>
    <button class="ss-reset-button">
      <text class="_icon-forward right-forwrad-icon"></text>
    </button>
  </view>
</template>

<script setup>
  /**
   * 详情 cell
   *
   */
  const props = defineProps({
    label: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
  });

  const emits = defineEmits(['click']);

  // 点击
  const onClick = () => {
    emits('click');
  };
</script>

<style lang="scss" scoped>
  .detail-cell-wrap {
    padding: 10rpx 20rpx;
    // min-height: 60rpx;

    .label-text {
      font-size: 26rpx;
      color: #999;
      margin-right: 38rpx;
    }

    .cell-content {
      font-size: 26rpx;
      color: #333;
    }

    .right-forwrad-icon {
      font-size: 26rpx;
      color: #999;
    }
  }
</style>
