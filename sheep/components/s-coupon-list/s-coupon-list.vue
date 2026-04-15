<template>
  <view class="coupon-item-wrap">
    <view
      class="coupon-item ss-flex ss-row-between"
      :class="{ 'is-disabled': disabled || isDisable }"
    >
      <view class="item-left ss-flex ss-row-center ss-col-center">
        <view class="ss-flex-col ss-row-center ss-col-center">
          <view class="price-box ss-flex ss-col-bottom">
            <view class="price-unit" v-if="data.discountType === 1">￥</view>
            <view class="price-text">{{
              data.discountType === 1
                ? fen2yuan(data.discountPrice)
                : data.discountPercent / 10.0 || data.amount || 0
            }}</view>
            <view
              class="price-unit"
              v-if="data.discountType === 2"
              style="margin-left: 4rpx; font-size: 24rpx; margin-bottom: 12rpx"
              >折</view
            >
          </view>
          <view class="condition-text">
            {{
              data.discountType === 1
                ? '满' + fen2yuan(data.usePrice) + '元可用'
                : data.usePrice > 0
                ? '满' + (fen2yuan(data.usePrice) || data.usePrice || 0) + '元可用'
                : '无门槛'
            }}
          </view>
        </view>
      </view>

      <view class="item-right ss-flex-1 ss-flex-col ss-row-between">
        <view class="info-box ss-flex-col">
          <view class="title ss-line-1">{{ data.name || '优惠券' }}</view>
          <view class="time" v-if="data.validityType === 2">
            领取后
            {{
              Number(data.fixedStartTerm || 0) > 0
                ? Number(data.fixedStartTerm || 0) + '天生效'
                : '立即生效'
            }}
            |
            {{
              Number(data.fixedStartTerm || 0) > 0
                ? Number(data.fixedStartTerm || 0) +
                  '-' +
                  Number(data.fixedEndTerm || 0) +
                  '天内可用'
                : Number(data.fixedEndTerm || 0) + '天内可用'
            }}
            <text v-if="Number(data.takeLimitCount || 0) > 0">
              | 每人限领{{ Number(data.takeLimitCount || 0) }}张
            </text>
          </view>
          <view class="time" v-else>
            {{
              data.validStartTime ? sheep.$helper.timeFormat(data.validStartTime, 'yyyy-mm-dd') : ''
            }}
            至
            {{ data.validEndTime ? sheep.$helper.timeFormat(data.validEndTime, 'yyyy-mm-dd') : '' }}
            |
            {{
              data.productScope === 1
                ? '全场通用'
                : data.productScope === 2
                ? '指定商品'
                : '指定分类'
            }}
          </view>
        </view>

        <view class="split-line"></view>

        <view class="bottom-box ss-flex ss-row-between ss-col-center">
          <view class="rule ss-flex ss-col-center" @tap.stop="state.showRule = !state.showRule">
            使用规则
            <text class="cicon-drop-down ss-m-l-8" :class="state.showRule ? 'rotate' : ''"></text>
          </view>
          <view class="btn-box">
            <slot></slot>
          </view>
        </view>
      </view>

      <view class="tag-box" v-if="data.discountType === 1">满减券</view>
      <view class="tag-box" v-else-if="data.discountType === 2">折扣券</view>
      <view class="tag-box" v-else>优惠券</view>
      <view class="line-box">
        <view class="circle-top"></view>
        <view class="circle-bottom"></view>
        <view class="dash-line"></view>
      </view>
    </view>

    <!-- 优惠券规则 -->
    <view
      class="rule-box ss-p-x-30 ss-p-y-20"
      :class="{ 'is-disabled': disabled || isDisable }"
      v-show="state.showRule"
    >
      <view v-if="data.discountType === 1"
        >满{{ fen2yuan(data.usePrice) }}减{{ fen2yuan(data.discountPrice) }}元</view
      >
      <view v-if="data.discountType === 2 && data.discountLimitPrice > 0"
        >最多优惠{{ fen2yuan(data.discountLimitPrice) }}元</view
      >
      <view v-if="data.description">{{ data.description }}</view>
      <view
        v-if="
          !data.description &&
          data.discountType !== 1 &&
          !(data.discountType === 2 && data.discountLimitPrice > 0)
        "
        >暂无使用规则</view
      >
    </view>
  </view>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import sheep from '../../index';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const state = reactive({
    showRule: false,
  });

  // 接受参数
  const props = defineProps({
    data: {
      type: Object,
      default: () => ({}),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'coupon', // coupon 优惠劵模版；user 用户优惠劵
    },
  });

  const isDisable = computed(() => {
    if (props.type === 'coupon') {
      return !props.data.canTake;
    }
    return props.data.status !== 1;
  });
</script>

<style lang="scss" scoped>
  .coupon-item-wrap {
    margin-bottom: 24rpx;

    .rule-box {
      background: linear-gradient(90deg, #f9efde 0%, #ffdea8 100%);
      border-radius: 16rpx;
      font-size: 24rpx;
      color: rgba(134, 144, 156, 1);
      line-height: 36rpx;
      margin-top: -30rpx;
      padding-top: 40rpx !important;
      position: relative;
      z-index: 0;

      &.is-disabled {
        background-color: #f2f2f2;
        color: #999;
      }
    }
  }
  .coupon-item {
    position: relative;
    z-index: 1;
    background: linear-gradient(90deg, #f9efde 0%, #ffdea8 100%);
    border-radius: 16rpx;
    height: 220rpx;
    overflow: hidden;
    margin-bottom: 24rpx;

    .item-left {
      width: 210rpx;
      height: 100%;
      background-color: transparent;
      padding-top: 10rpx;

      .price-box {
        color: #8c3605;

        .price-unit {
          font-size: 28rpx;
          line-height: 32rpx;
          margin-bottom: 8rpx;
        }

        .price-text {
          font-size: 48rpx;
          font-family: PingFangSC-Semibold;
          font-weight: 600;
          line-height: 56rpx;
        }
      }

      .condition-text {
        font-size: 24rpx;
        color: #8c3605;
        margin-top: 12rpx;
      }
    }

    .item-right {
      height: 100%;
      background-color: transparent;
      padding: 30rpx 20rpx 20rpx 30rpx;
      box-sizing: border-box;

      .info-box {
        width: 100%;

        .title {
          font-size: 32rpx;
          font-family: PingFangSC-Semibold;
          font-weight: 600;
          color: rgba(29, 33, 41, 1);
          margin-bottom: 8rpx;
        }

        .time {
          font-size: 24rpx;
          color: rgba(134, 144, 156, 1);
        }
      }

      .split-line {
        width: 100%;
        border-top: 2rpx dashed rgba(255, 255, 255, 1);
        height: 2rpx;
      }

      .bottom-box {
        width: 100%;
        .rule {
          font-size: 24rpx;
          color: rgba(134, 144, 156, 1);

          .cicon-drop-down {
            font-size: 24rpx;
            transition: all 0.3s;
            &.rotate {
              transform: rotate(180deg);
            }
          }
        }

        .btn-box {
          // Adjust button position if needed
        }
      }
    }

    .tag-box {
      position: absolute;
      left: 0;
      top: 0;
      background-color: #ffdea8;
      border-radius: 16rpx 0 16rpx 0;
      padding: 6rpx 16rpx;
      font-size: 24rpx;
      color: #8c3605;
    }

    .line-box {
      position: absolute;
      left: 210rpx;
      top: 0;
      height: 100%;
      width: 16rpx;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .circle-top {
        position: absolute;
        top: -8rpx;
        width: 16rpx;
        height: 16rpx;
        background-color: #f8f9f3;
        border-radius: 50%;
      }

      .circle-bottom {
        position: absolute;
        bottom: -8rpx;
        width: 16rpx;
        height: 16rpx;
        background-color: #f8f9f3;
        border-radius: 50%;
      }

      .dash-line {
        height: 180rpx;
        border-left: 4rpx dotted rgba(210, 160, 130, 0.4);
      }
    }

    &.is-disabled {
      background-color: #f2f2f2;
      .item-left {
        .price-box,
        .condition-text {
          color: #999;
        }
      }
      .item-right .info-box .title {
        color: #999;
      }
      .tag-box {
        background-color: #e6e6e6;
        color: #999;
      }
      .line-box .dash-line {
        border-left-color: #ccc;
      }
    }
  }
</style>
