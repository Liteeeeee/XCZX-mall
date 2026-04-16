<!-- 订单确认的优惠劵选择弹窗 -->
<template>
  <su-popup
    :show="show"
    type="bottom"
    round="20"
    @close="emits('close')"
    showClose
    backgroundColor="rgba(255, 255, 250, 1)"
  >
    <view class="model-box flex-col">
      <view class="title">选择优惠券</view>
      <scroll-view
        class="model-content"
        scroll-y
        :scroll-with-animation="false"
        :enable-back-to-top="true"
      >
        <!--可使用的优惠券区域-->
        <view class="subtitle" v-if="state.couponInfo.filter((coupon) => coupon.match).length > 0"
          >可使用优惠券</view
        >
        <view
          v-for="(item, index) in state.couponInfo.filter((coupon) => coupon.match)"
          :key="index"
          class="coupon-item"
          @tap="radioChange(item.id)"
        >
          <s-coupon-list :data="item" type="user" :disabled="false">
            <template #default>
              <view class="ss-flex ss-col-center">
                <view
                  class="coupon-check flex-col"
                  :class="state.couponId === item.id ? 'coupon-check-on' : ''"
                >
                  <view v-if="state.couponId === item.id" class="coupon-check-tick flex-col">
                    <image
                      class="check-icon"
                      src="https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/confirmSelected.png"
                      mode="aspectFit"
                    ></image>
                  </view>
                </view>
              </view>
            </template>
          </s-coupon-list>
        </view>
        <!--不可使用的优惠券区域-->
        <view
          class="subtitle mt-40"
          v-if="state.couponInfo.filter((coupon) => !coupon.match).length > 0"
          >不可使用优惠券</view
        >
        <view
          v-for="item in state.couponInfo.filter((coupon) => !coupon.match)"
          :key="item.id"
          class="coupon-item"
        >
          <s-coupon-list :data="item" type="user" :disabled="true">
            <template v-slot:reason>
              <view class="ss-flex ss-m-t-24">
                <view class="reason-title"> 不可用原因：</view>
                <view class="reason-desc">{{ item.mismatchReason || '未达到使用门槛' }}</view>
              </view>
            </template>
          </s-coupon-list>
        </view>
      </scroll-view>
    </view>
    <view class="modal-footer ss-flex">
      <button class="confirm-btn ss-reset-button" @tap="onConfirm">确认</button>
    </view>
  </su-popup>
</template>
<script setup>
  import { computed, reactive } from 'vue';
  import sheep from '@/sheep';

  const props = defineProps({
    modelValue: {
      // 优惠劵列表
      type: Object,
      default() {},
    },
    show: {
      type: Boolean,
      default: false,
    },
  });

  const emits = defineEmits(['confirm', 'close']);

  const state = reactive({
    couponInfo: computed(() => props.modelValue), // 优惠劵列表
    couponId: undefined, // 选中的优惠劵编号
  });

  // 选中优惠劵
  function radioChange(couponId) {
    if (state.couponId === couponId) {
      state.couponId = undefined;
    } else {
      state.couponId = couponId;
    }
  }

  // 确认优惠劵
  const onConfirm = () => {
    emits('confirm', state.couponId);
  };
</script>
<style lang="scss" scoped>
  :deep() {
    .uni-checkbox-input {
      background-color: var(--ui-BG-Main);
    }
  }

  .model-box {
    height: 60vh;
    display: flex;
    flex-direction: column;
  }

  .title {
    color: rgba(61, 61, 60, 1);
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    margin: 40rpx 32rpx 32rpx;
  }

  .subtitle {
    font-size: 28rpx;
    font-weight: 500;
    color: rgba(61, 61, 60, 1);
    margin: 0 32rpx 20rpx;
  }

  .mt-40 {
    margin-top: 40rpx;
  }

  .coupon-item {
    margin: 0 32rpx 24rpx;
  }

  .model-content {
    flex: 1;
    min-height: 0;
  }

  .modal-footer {
    width: 100%;
    padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    background-color: rgba(255, 255, 250, 1);
    box-shadow: 0rpx -6rpx 10rpx 0rpx rgba(0, 0, 0, 0.02);
  }

  .confirm-btn {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 46rpx;
    border: 1rpx solid rgba(157, 156, 150, 1);
    width: 686rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    margin: 0;
  }

  .coupon-check {
    width: 32rpx;
    height: 32rpx;
    border: 2rpx solid rgba(206, 199, 189, 1);
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 1);
    margin-right: 24rpx;
    overflow: hidden;
  }

  .coupon-check-on {
    border-color: transparent;
    background-color: transparent;
  }

  .coupon-check-tick {
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
  }

  .check-icon {
    width: 32rpx;
    height: 32rpx;
  }

  .reason-title {
    font-weight: 600;
    font-size: 20rpx;
    line-height: 26rpx;
    color: #ff0003;
  }

  .reason-desc {
    font-weight: 600;
    font-size: 20rpx;
    line-height: 26rpx;
    color: #434343;
  }
</style>
