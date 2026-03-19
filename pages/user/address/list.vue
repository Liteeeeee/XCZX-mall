<!-- 收件地址列表 -->
<template>
  <s-layout :bgStyle="{ color: '#F5F5F5' }" navbar="clear">
    <su-fixed alway :noNav="true" placeholder :bgStyles="{ background: '#F5F5F5' }" :index="100">
      <su-status-bar />
      <view class="custom-nav-bar" :style="{ height: (sheep.$platform.navbar - sheep.$platform.device.statusBarHeight) + 'px' }">
        <view class="nav-content ss-flex ss-col-center">
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <text class="nav-title">{{ state.openType === 'select' ? '地址选择' : '收货地址' }}</text>
        </view>
      </view>
    </su-fixed>
    
    <view v-if="state.list.length">
      <s-address-item
        hasBorderBottom
        v-for="item in state.list"
        :key="item.id"
        :item="item"
        @tap="onSelect(item)"
      >
        <template #action>
          <view class="action-btn ss-flex ss-col-center">
            <view class="delete-btn ss-reset-button" @tap.stop="onDelete(item.id)">删除</view>
            <view class="edit-btn ss-reset-button" @tap.stop="onEdit(item.id)">修改</view>
          </view>
        </template>
      </s-address-item>
    </view>

    <su-fixed bottom placeholder>
      <view class="footer-box ss-flex ss-row-between ss-p-20">
        <!-- 微信小程序和微信H5 -->
        <button
          v-if="['WechatMiniProgram', 'WechatOfficialAccount'].includes(sheep.$platform.name)"
          @tap="importWechatAddress"
          class="wx-btn ss-reset-button ss-flex ss-row-center ss-col-center"
        >
          微信导入
        </button>
        <button
          class="add-btn ss-reset-button"
          @tap="sheep.$router.go('/pages/user/address/edit')"
        >
          新增收货地址
        </button>
      </view>
    </su-fixed>
    <s-empty
      v-if="state.list.length === 0 && !state.loading"
      text="无收货地址~"
      icon="/static/data-empty.webp"
    />
  </s-layout>
</template>

<script setup>
  import { onBeforeMount, reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { isEmpty } from 'lodash-es';
  import AreaApi from '@/sheep/api/system/area';
  import AddressApi from '@/sheep/api/member/address';

  const state = reactive({
    list: [], // 地址列表
    loading: true,
    openType: '', // 页面打开类型
  });

  // 选择收货地址
  const onSelect = (addressInfo) => {
    if (state.openType !== 'select'){ // 不作为选择组件时阻断操作
      return
    }
    uni.$emit('SELECT_ADDRESS', {
      addressInfo,
    });
    sheep.$router.back();
  };

  const onDelete = (id) => {
    uni.showModal({
      title: '提示',
      content: '确认删除此收货地址吗？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const { code } = await AddressApi.deleteAddress(id);
        if (code === 0) {
          state.list = (await AddressApi.getAddressList()).data;
        }
      },
    });
  };

  const onEdit = (id) => {
    sheep.$router.go('/pages/user/address/edit', {
      id,
    });
  };

  // 导入微信地址
  function importWechatAddress() {
    let wechatAddress = {};
    // #ifdef MP
    uni.chooseAddress({
      success: (res) => {
        wechatAddress = {
          consignee: res.userName,
          mobile: res.telNumber,
          province_name: res.provinceName,
          city_name: res.cityName,
          district_name: res.countyName,
          address: res.detailInfo,
          region: '',
          is_default: false,
        };
        if (!isEmpty(wechatAddress)) {
          sheep.$router.go('/pages/user/address/edit', {
            data: JSON.stringify(wechatAddress),
          });
        }
      },
      fail: (err) => {
        console.log('%cuni.chooseAddress,调用失败', 'color:green;background:yellow');
      },
    });
    // #endif
    // #ifdef H5
    sheep.$platform.useProvider('wechat').jssdk.openAddress({
      success: (res) => {
        wechatAddress = {
          consignee: res.userName,
          mobile: res.telNumber,
          province_name: res.provinceName,
          city_name: res.cityName,
          district_name: res.countryName,
          address: res.detailInfo,
          region: '',
          is_default: false,
        };
        if (!isEmpty(wechatAddress)) {
          sheep.$router.go('/pages/user/address/edit', {
            data: JSON.stringify(wechatAddress),
          });
        }
      },
    });
    // #endif
  }

  onLoad((option) => {
    if (option.type) {
      state.openType = option.type;
    }
  });

  onShow(async () => {
    state.list = (await AddressApi.getAddressList()).data;
    state.loading = false;
  });

  onBeforeMount(() => {
    if (!!uni.getStorageSync('areaData')) {
      return;
    }
    // 提前加载省市区数据
    AreaApi.getAreaTree().then((res) => {
      if (res.code === 0) {
        uni.setStorageSync('areaData', res.data);
      }
    });
  });
</script>

<style lang="scss" scoped>
  .custom-nav-bar {
    position: relative;
    width: 100%;

    .nav-content {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      left: 20rpx;
      height: 100%;
    }
    
    .back-btn {
      width: 60rpx;
      height: 60rpx;
      margin-right: 10rpx;
      .sicon-back {
        font-size: 36rpx;
        color: #1E3F1C;
        font-weight: bold;
      }
    }

    .nav-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #1E3F1C;
    }
  }

  .action-btn {
    .edit-btn,
    .delete-btn {
      width: 100rpx;
      height: 50rpx;
      background: #F5F5F5;
      border-radius: 6rpx;
      font-size: 24rpx;
      font-weight: 500;
      color: #333;
      text-align: center;
      line-height: 50rpx;
    }
    
    .delete-btn {
      margin-right: 20rpx;
    }
  }

  .footer-box {
    background-color: #fff;
    padding: 20rpx;
    box-sizing: border-box;

    .add-btn {
      flex: 1;
      height: 80rpx;
      background: #1E3F1C;
      border-radius: 16rpx;
      font-size: 30rpx;
      font-weight: 500;
      line-height: 80rpx;
      color: #fff;
      text-align: center;
    }

    .wx-btn {
      flex: 1;
      height: 80rpx;
      line-height: 76rpx;
      background: #fff;
      border: 2rpx solid #1E3F1C;
      border-radius: 16rpx;
      font-size: 30rpx;
      font-weight: 500;
      color: #1E3F1C;
      margin-right: 20rpx;
      text-align: center;
      box-sizing: border-box;
    }
  }
</style>
