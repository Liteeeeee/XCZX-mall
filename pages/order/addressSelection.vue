<!-- 下单界面，收货地址 or 自提门店的选择组件 -->
<template>
  <view class="address-wrapper">
    <view class="address-card ss-flex ss-row-between" @tap="onSelectAddress">
      <view class="address-content" v-if="state.addressInfo.name">
        <view class="address-detail">
          {{ state.addressInfo.areaName }} {{ state.addressInfo.detailAddress }}
        </view>
        <view class="address-user ss-flex ss-row-between">
          <text class="address-name">{{ state.addressInfo.name }}</text>
          <text class="address-phone">{{ state.addressInfo.mobile }}</text>
        </view>
      </view>
      <view class="address-content" v-else>
        <view class="address-empty">设置收货地址</view>
      </view>
      <view class="address-arrow ss-flex ss-col-center">
        <text class="_icon-forward" />
      </view>
    </view>
    <view class="address-line">
      <image :src="sheep.$url.static('/static/img/shop/line.png')" />
    </view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import sheep from '@/sheep';
  import { isEmpty } from 'lodash-es';

  const props = defineProps({
    modelValue: {
      type: Object,
      default() {},
    },
  });
  const emits = defineEmits(['update:modelValue']);

  // computed 解决父子组件双向数据同步
  const state = computed({
    get() {
      return new Proxy(props.modelValue, {
        set(obj, name, val) {
          emits('update:modelValue', {
            ...obj,
            [name]: val,
          });
          return true;
        },
      });
    },
    set(val) {
      emits('update:modelValue', val);
    },
  });

  // 选择地址
  function onSelectAddress() {
    let emitName = 'SELECT_ADDRESS';
    let addressPage = '/pages/user/address/list?type=select';
    uni.$once(emitName, (e) => {
      changeConsignee(e.addressInfo);
    });
    sheep.$router.go(addressPage);
  }

  // 更改收货人地址&计算订单信息
  async function changeConsignee(addressInfo = {}) {
    if (!isEmpty(addressInfo)) {
      state.value.addressInfo = addressInfo;
    }
  }
</script>

<style scoped lang="scss">
  .address-wrapper {
    padding: 18rpx 32rpx 0 32rpx;
  }

  .address-card {
    width: 686rpx;
    background-color: rgba(255, 254, 250, 1);
    border-radius: 20rpx;
    padding: 34rpx 24rpx 34rpx 21rpx;
    box-sizing: border-box;
    align-items: flex-start;
  }

  .address-content {
    flex: 1;
    min-width: 0;
  }

  .address-detail {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 45rpx;
  }

  .address-user {
    margin-top: 14rpx;
    width: 287rpx;
  }

  .address-name,
  .address-phone {
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    line-height: 40rpx;
    white-space: nowrap;
  }

  .address-empty {
    color: rgba(61, 61, 60, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 45rpx;
  }

  .address-arrow {
    margin-left: 16rpx;
    color: rgba(61, 61, 60, 1);
  }

  .address-line {
    width: 686rpx;
    height: 6rpx;
    margin-top: -2rpx;
  }

  .address-line image {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
