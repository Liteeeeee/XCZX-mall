<!-- 收货地址的新增/编辑 -->
<template>
  <s-layout :bgStyle="{ color: '#F5F5F5' }" navbar="clear">
    <su-fixed alway :noNav="true" placeholder :bgStyles="{ background: '#F5F5F5' }" :index="100">
      <su-status-bar />
      <view class="custom-nav-bar" :style="{ height: (sheep.$platform.navbar - sheep.$platform.device.statusBarHeight) + 'px' }">
        <view class="nav-content ss-flex ss-col-center">
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <text class="nav-title">{{ state.model.id ? '编辑地址' : '新增地址' }}</text>
        </view>
      </view>
    </su-fixed>
    
    <uni-forms
      ref="addressFormRef"
      v-model="state.model"
      :rules="rules"
      validateTrigger="bind"
      labelWidth="160"
      labelAlign="left"
      border
      :labelStyle="{ fontWeight: 'bold' }"
    >
      <view class="bg-white form-box">
        <uni-forms-item name="name" label="收货人" class="form-item">
          <uni-easyinput
            v-model="state.model.name"
            placeholder="李小刚"
            :inputBorder="false"
            placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
          />
        </uni-forms-item>

        <uni-forms-item name="mobile" label="手机号" class="form-item">
          <view class="mobile-input-wrap ss-flex ss-col-center">
            <text class="prefix">+86</text>
            <text class="sicon-down"></text>
            <uni-easyinput
              v-model="state.model.mobile"
              type="number"
              placeholder="请输入您的手机号"
              :inputBorder="false"
              placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
              class="mobile-input"
            >
            </uni-easyinput>
          </view>
        </uni-forms-item>
        <uni-forms-item
          name="areaName"
          label="所在地区"
          @tap="state.showRegion = true"
          class="form-item"
        >
          <uni-easyinput
            v-model="state.model.areaName"
            disabled
            :inputBorder="false"
            :styles="{ disableColor: '#fff', color: '#333' }"
            placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
            placeholder="请选择省/市/区"
          >
            <template v-slot:right>
              <uni-icons type="right" />
            </template>
          </uni-easyinput>
        </uni-forms-item>
        <uni-forms-item
          name="detailAddress"
          label="详细地址"
          :formItemStyle="{ alignItems: 'flex-start' }"
          class="textarea-item"
        >
          <uni-easyinput
            :inputBorder="false"
            type="textarea"
            v-model="state.model.detailAddress"
            placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
            placeholder="请输入详细地址"
            clearable
          />
        </uni-forms-item>
      </view>
      <view class="default-box">
        <view class="default-box-inner ss-flex ss-col-center" @tap="state.model.defaultStatus = !state.model.defaultStatus">
          <view class="checkbox-icon" :class="{ 'is-checked': state.model.defaultStatus }">
            <text class="sicon-check" v-if="state.model.defaultStatus"></text>
          </view>
          <view class="default-box-title">设置为默认地址</view>
        </view>
      </view>
    </uni-forms>
    <su-fixed bottom :opacity="false" bg="#fff" placeholder :noFixed="false" :index="10">
      <view class="footer-box ss-flex ss-row-between ss-p-20">
        <button v-if="state.model.id" class="ss-reset-button cancel-btn" @tap="onDelete">
          删除
        </button>
        <button class="ss-reset-button save-btn" :class="{ 'full-width': !state.model.id }" @tap="onSave">确认</button>
      </view>
    </su-fixed>

    <!-- 省市区弹窗 -->
    <su-region-picker
      :show="state.showRegion"
      @cancel="state.showRegion = false"
      @confirm="onRegionConfirm"
    />
  </s-layout>
</template>

<script setup>
  import { ref, reactive, unref } from 'vue';
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { isEmpty } from 'lodash-es';
  import { mobile } from '@/sheep/validate/form';
  import AreaApi from '@/sheep/api/system/area';
  import AddressApi from '@/sheep/api/member/address';

  const addressFormRef = ref(null);
  const state = reactive({
    showRegion: false,
    model: {
      name: '',
      mobile: '',
      detailAddress: '',
      defaultStatus: false,
      areaName: '',
    },
    rules: {},
  });

  const rules = {
    name: {
      rules: [
        {
          required: true,
          errorMessage: '请输入收货人姓名',
        },
      ],
    },
    mobile,
    detailAddress: {
      rules: [
        {
          required: true,
          errorMessage: '请输入详细地址',
        },
      ],
    },
    areaName: {
      rules: [
        {
          required: true,
          errorMessage: '请选择您的位置',
        },
      ],
    },
  };

  // 确认选择地区
  const onRegionConfirm = (e) => {
    state.model.areaName = `${e.province_name} ${e.city_name} ${e.district_name}`;
    state.model.areaId = e.district_id;
    state.showRegion = false;
  };

  // 获得地区数据
  const getAreaData = () => {
    if (isEmpty(uni.getStorageSync('areaData'))) {
      AreaApi.getAreaTree().then((res) => {
        if (res.code === 0) {
          uni.setStorageSync('areaData', res.data);
        }
      });
    }
  };

  // 保存收货地址
  const onSave = async () => {
    // 参数校验
    const validate = await unref(addressFormRef)
      .validate()
      .catch((error) => {
        console.log('error: ', error);
      });
    if (!validate) {
      return;
    }

    // 提交请求
    const formData = {
      ...state.model,
    };
    const { code } =
      state.model.id > 0
        ? await AddressApi.updateAddress(formData)
        : await AddressApi.createAddress(formData);
    if (code === 0) {
      sheep.$router.back();
    }
  };

  // 删除收货地址
  const onDelete = () => {
    uni.showModal({
      title: '提示',
      content: '确认删除此收货地址吗？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const { code } = await AddressApi.deleteAddress(state.model.id);
        if (code === 0) {
          sheep.$router.back();
        }
      },
    });
  };

  onLoad(async (options) => {
    // 获得地区数据
    getAreaData();
    // 情况一：基于 id 获得收件地址
    if (options.id) {
      let { code, data } = await AddressApi.getAddress(options.id);
      if (code !== 0) {
        return;
      }
      state.model = data;
    }
    // 情况二：微信导入
    if (options.data) {
      let data = JSON.parse(options.data);
      const areaData = uni.getStorageSync('areaData');
      const findAreaByName = (areas, name) => areas.find((item) => item.name === name);

      let provinceObj = findAreaByName(areaData, data.province_name);
      let cityObj = provinceObj ? findAreaByName(provinceObj.children, data.city_name) : undefined;
      let districtObj = cityObj ? findAreaByName(cityObj.children, data.district_name) : undefined;
      let areaId = (districtObj || cityObj || provinceObj).id;

      state.model = {
        ...state.model,
        areaId,
        areaName: [data.province_name, data.city_name, data.district_name]
          .filter(Boolean)
          .join(' '),
        defaultStatus: false,
        detailAddress: data.address,
        mobile: data.mobile,
        name: data.consignee,
      };
    }
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

  .form-box {
    margin: 20rpx 30rpx;
    border-radius: 16rpx;
    padding: 0 30rpx;
  }

  .mobile-input-wrap {
    width: 100%;
    .prefix {
      font-size: 30rpx;
      color: #BBBBBB;
      margin-right: 10rpx;
    }
    .sicon-down {
      font-size: 24rpx;
      color: #BBBBBB;
      margin-right: 20rpx;
    }
    .mobile-input {
      flex: 1;
    }
  }

  :deep() {
    .uni-forms-item {
      padding: 30rpx 0;
      margin-bottom: 0 !important;
      border-bottom: 2rpx solid #F5F5F5;
      
      &:last-child {
        border-bottom: none;
      }
    }
    .uni-forms-item__label {
      padding: 0 20rpx 0 0;
    }
    .uni-forms-item__label .label-text {
      font-size: 30rpx !important;
      color: #333333 !important;
      line-height: normal !important;
      font-weight: normal !important;
    }

    .uni-easyinput__content-input {
      font-size: 30rpx !important;
      color: #333333 !important;
      line-height: normal !important;
      padding-left: 0 !important;
    }

    .uni-easyinput__content-textarea {
      font-size: 30rpx !important;
      color: #333333 !important;
      line-height: normal !important;
      margin-top: 0 !important;
      padding: 0 !important;
    }

    .uni-icons {
      font-size: 32rpx !important;
      color: #BBBBBB !important;
    }

    .is-textarea-icon {
      margin-top: 0;
    }

    .is-disabled {
      color: #333333;
    }
  }

  .default-box {
    width: 100%;
    padding: 0 30rpx;
    box-sizing: border-box;

    .default-box-inner {
      padding: 20rpx 0;
    }

    .checkbox-icon {
      width: 32rpx;
      height: 32rpx;
      border-radius: 50%;
      background-color: #E5E5E5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
      transition: all 0.3s;

      &.is-checked {
        background-color: #1E3F1C;
      }

      .sicon-check {
        color: #fff;
        font-size: 20rpx;
      }
    }

    .default-box-title {
      font-size: 28rpx;
      color: #333333;
      line-height: normal;
    }
  }

  .footer-box {
    background-color: #fff;
    padding: 20rpx 30rpx;
    box-sizing: border-box;

    .save-btn {
      flex: 1;
      height: 80rpx;
      border-radius: 16rpx;
      background: #1E3F1C;
      color: $white;
      font-size: 30rpx;
      font-weight: 500;
      line-height: 80rpx;
      text-align: center;
      
      &.full-width {
        width: 100%;
      }
    }

    .cancel-btn {
      flex: 1;
      height: 80rpx;
      line-height: 76rpx;
      border-radius: 16rpx;
      background: #fff;
      border: 2rpx solid #1E3F1C;
      color: #1E3F1C;
      font-size: 30rpx;
      font-weight: 500;
      margin-right: 20rpx;
      text-align: center;
      box-sizing: border-box;
    }
  }
</style>
