<!-- 地址卡片 -->
<template>
  <view
    class="address-item"
    :class="[{ 'border-bottom': props.hasBorderBottom }]"
  >
    <view v-if="!isEmpty(props.item)">
      <view class="person-text ss-flex ss-col-center">
        <text class="name">{{ props.item.name }}</text>
        <text class="mobile">{{ props.item.mobile }}</text>
      </view>
      <view class="area-text">
        {{ props.item.areaName }} {{ props.item.detailAddress }}
      </view>
      <view class="address-footer ss-flex ss-row-between ss-col-center">
         <view class="default-status ss-flex ss-col-center" v-if="props.item.defaultStatus">
         <view class="checkbox-icon is-checked ss-flex ss-row-center ss-col-center">
            <text class="cicon-check"></text>
         </view>
         <text class="default-text">设为默认</text>
      </view>
         <view class="default-status ss-flex ss-col-center" v-else>
            <view class="checkbox-icon ss-flex ss-row-center ss-col-center"></view>
            <text class="default-text" style="color: #999;">设为默认</text>
         </view>
         
         <view class="item-right">
            <slot name="action"></slot>
         </view>
      </view>
    </view>
    <view v-else>
      <view class="address-text ss-m-b-10">请选择收货地址</view>
    </view>
  </view>
</template>

<script setup>
  /**
   * 基础组件 - 地址卡片
   *
   * @param {String}  icon = _icon-edit    - icon
   *
   * @event {Function()} click			 - 点击
   * @event {Function()} actionClick		 - 点击工具栏
   *
   * @slot 								 - 默认插槽
   */
  import sheep from '@/sheep';
  import { isEmpty } from 'lodash-es';
  const props = defineProps({
    item: {
      type: Object,
      default() {},
    },
    hasBorderBottom: {
      type: Boolean,
      defult: true,
    },
  });

  const onEdit = () => {
    sheep.$router.go('/pages/user/address/edit', {
      id: props.item.id,
    });
  };
</script>

<style lang="scss" scoped>
  .address-item {
    padding: 30rpx;
    background: #fff;
    margin: 20rpx;
    border-radius: 16rpx;

    .person-text {
      margin-bottom: 16rpx;
      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-right: 20rpx;
      }
      .mobile {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }

    .area-text {
      font-size: 26rpx;
      color: #999;
      line-height: 1.4;
      margin-bottom: 0;
      padding-right: 20rpx;
    }

    .address-footer {
       margin-top: 20rpx;
    }

    .default-status {
      .checkbox-icon {
        width: 32rpx;
        height: 32rpx;
        border-radius: 4rpx;
        border: 2rpx solid #999;
        margin-right: 10rpx;
        box-sizing: border-box;

        &.is-checked {
          background-color: #202020;
          border-color: #202020;
          position: relative;
          
          .cicon-check {
            color: #fff !important;
            font-size: 24rpx;
            font-weight: bold;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
          }
        }
      }
      .default-text {
        font-size: 26rpx;
        color: #333;
      }
    }
    
    .item-right {
       display: flex;
       align-items: center;
    }
  }
</style>
