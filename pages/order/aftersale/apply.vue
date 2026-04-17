<!-- 售后申请 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view
          class="nav-bar-inner ss-flex ss-col-center"
          :style="{ height: '100%', paddingLeft: '20rpx' }"
        >
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <text class="nav-title ss-m-l-10">申请售后</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <!-- 售后商品 -->
    <view class="goods-box">
      <s-goods-item
        :img="state.item.picUrl"
        :title="state.item.spuName"
        :skuText="state.item.properties?.map((property) => property.valueName).join(' ')"
        :price="state.item.price"
        :num="state.item.count"
      />
    </view>

    <uni-forms ref="form" v-model="formData" :rules="rules" label-position="top">
      <!-- 售后类型 -->
      <view class="refund-item">
        <view class="item-title ss-m-b-20">售后类型</view>
        <view class="ss-flex-col">
          <radio-group @change="onRefundChange">
            <label
              class="ss-flex ss-col-center ss-p-y-10"
              v-for="(item, index) in state.wayList"
              :key="index"
            >
              <radio
                :checked="formData.way === item.value"
                color="#1e3f1c"
                style="transform: scale(0.8)"
                :value="item.value"
              />
              <view class="item-value ss-m-l-8">{{ item.text }}</view>
            </label>
          </radio-group>
        </view>
      </view>
      <!-- 退款金额 -->
      <view class="refund-item ss-flex ss-col-center ss-row-between" @tap="state.showModal = true">
        <text class="item-title">退款金额</text>
        <view class="ss-flex refund-cause ss-col-center">
          <text class="ss-m-r-20">￥{{ fen2yuan(state.item.payPrice) }}</text>
        </view>
      </view>
      <!-- 申请原因 -->
      <view class="refund-item ss-flex ss-col-center ss-row-between" @tap="state.showModal = true">
        <text class="item-title">申请原因</text>
        <view class="ss-flex refund-cause ss-col-center">
          <text class="ss-m-r-20" v-if="formData.applyReason">{{ formData.applyReason }}</text>
          <text class="ss-m-r-20" v-else>请选择申请原因~</text>
          <text class="cicon-forward" style="height: 28rpx"></text>
        </view>
      </view>

      <!-- 留言 -->
      <view class="refund-item">
        <view class="item-title ss-m-b-20">相关描述</view>
        <view class="describe-box">
          <uni-easyinput
            :inputBorder="false"
            class="describe-content"
            type="textarea"
            maxlength="120"
            autoHeight
            v-model="formData.applyDescription"
            placeholder="客官~请描述您遇到的问题，建议上传照片"
          />
          <view class="upload-img">
            <s-uploader
              v-model:url="formData.applyPicUrls"
              fileMediatype="image"
              limit="9"
              mode="grid"
              :imageStyles="{ width: '168rpx', height: '168rpx' }"
            />
          </view>
        </view>
      </view>
    </uni-forms>

    <!-- 底部按钮 -->
    <su-fixed bottom placeholder bg="bg-white">
      <view class="footer-box ss-flex ss-col-center ss-row-right">
        <button class="ss-reset-button cancel-btn" open-type="contact"> 联系客服 </button>
        <button class="ss-reset-button pay-btn" @tap="submit">提交</button>
      </view>
    </su-fixed>

    <!-- 申请原因弹窗 -->
    <su-popup :show="state.showModal" round="10" :showClose="true" @close="state.showModal = false">
      <view class="modal-box page_box">
        <view class="modal-head item-title head_box ss-flex ss-row-center ss-col-center">
          申请原因
        </view>
        <view class="modal-content content_box">
          <radio-group @change="onChange">
            <label class="radio ss-flex ss-col-center" v-for="item in state.reasonList" :key="item">
              <view class="ss-flex-1 ss-p-20">{{ item }}</view>
              <radio :value="item" color="#1e3f1c" :checked="item === state.currentValue" />
            </label>
          </radio-group>
        </view>
        <view class="modal-foot foot_box ss-flex ss-row-center ss-col-center">
          <button class="ss-reset-button close-btn" @tap="onReason"> 确定 </button>
        </view>
      </view>
    </su-popup>

    <!-- 退货物流填写抽屉 -->
    <su-popup
      :show="state.showDeliveryDrawer"
      type="bottom"
      round="20"
      :showClose="true"
      @close="state.showDeliveryDrawer = false"
    >
      <view class="delivery-drawer-box flex-col">
        <view class="drawer-header flex-row align-center justify-center">
          <text class="drawer-title">填写退货信息</text>
        </view>

        <view class="drawer-content flex-col">
          <view class="section-title">退货邮寄地址</view>

          <view class="address-card flex-row align-center justify-between">
            <view class="address-info flex-col">
              <text class="address-detail">{{
                state.config.afterSaleReturnAddress || '朝阳区东城路15号西城科学园'
              }}</text>
              <text class="address-contact">{{
                state.config.afterSaleReturnMobile || '苏小三 180****8888'
              }}</text>
            </view>
            <view class="copy-action" @tap="copyReturnAddress">
              <text class="copy-text">复制地址信息</text>
            </view>
          </view>

          <view class="form-row flex-row align-center">
            <text class="row-label">快递单号</text>
            <input
              class="row-input"
              v-model="deliveryData.logisticsNo"
              placeholder="请输入快递单号"
              placeholder-class="placeholder-text"
            />
          </view>

          <view class="divider"></view>

          <view class="form-row flex-row align-center">
            <text class="row-label">快递公司</text>
            <picker
              mode="selector"
              class="row-input"
              @change="onExpressChange"
              :value="deliveryData.expressIndex"
              :range="state.expresses"
              range-key="name"
            >
              <view class="picker-inner flex-row align-center justify-between">
                <text :class="deliveryData.expressIndex !== -1 ? 'value-text' : 'placeholder-text'">
                  {{
                    deliveryData.expressIndex !== -1
                      ? state.expresses[deliveryData.expressIndex].name
                      : '请选择快递公司'
                  }}
                </text>
                <uni-icons type="right" size="14" color="rgba(212, 212, 213, 1)"></uni-icons>
              </view>
            </picker>
          </view>

          <view class="divider"></view>
        </view>

        <view class="drawer-footer">
          <button class="ss-reset-button confirm-btn" @tap="submitDelivery">确定</button>
        </view>
      </view>
    </su-popup>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { reactive, ref } from 'vue';
  import OrderApi from '@/sheep/api/trade/order';
  import TradeConfigApi from '@/sheep/api/trade/config';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import AfterSaleApi from '@/sheep/api/trade/afterSale';
  import DeliveryApi from '@/sheep/api/trade/delivery';

  const form = ref(null);
  const state = reactive({
    orderId: 0, // 订单编号
    itemId: 0, // 订单项编号
    order: {}, // 订单
    item: {}, // 订单项
    config: {}, // 交易配置

    // 售后类型
    wayList: [
      {
        text: '仅退款',
        value: '10',
      },
      {
        text: '退货退款',
        value: '20',
      },
    ],
    reasonList: [], // 可选的申请原因数组
    showModal: false, // 是否显示申请原因弹窗
    currentValue: '', // 当前选择的售后原因
    showDeliveryDrawer: false, // 退货物流填写抽屉
    expresses: [], // 快递公司列表
    createdAfterSaleId: null, // 成功创建后的售后单号
  });
  let formData = reactive({
    way: '',
    applyReason: '',
    applyDescription: '',
    applyPicUrls: [],
  });
  let deliveryData = reactive({
    logisticsNo: '',
    expressIndex: -1,
  });
  const rules = reactive({});

  // 获得快递物流列表
  async function getExpressList() {
    const { code, data } = await DeliveryApi.getDeliveryExpressList();
    if (code !== 0) {
      return;
    }
    state.expresses = data;
  }

  // 复制退货地址
  function copyReturnAddress() {
    const address = `${state.config.afterSaleReturnAddress || '朝阳区东城路15号西城科学园'} ${
      state.config.afterSaleReturnMobile || '苏小三 180****8888'
    }`;
    sheep.$helper.copyText(address);
  }

  // 快递公司选择
  function onExpressChange(e) {
    deliveryData.expressIndex = e.detail.value;
  }

  // 提交售后退货物流信息
  async function submitDelivery() {
    if (!deliveryData.logisticsNo) {
      sheep.$helper.toast('请输入快递单号');
      return;
    }
    if (deliveryData.expressIndex === -1) {
      sheep.$helper.toast('请选择快递公司');
      return;
    }

    let data = {
      id: state.createdAfterSaleId,
      logisticsId: state.expresses[deliveryData.expressIndex].id,
      logisticsNo: deliveryData.logisticsNo,
    };

    uni.showLoading({ title: '提交中' });
    const { code } = await AfterSaleApi.deliveryAfterSale(data);
    uni.hideLoading();
    if (code === 0) {
      uni.showToast({
        title: '填写退货成功',
      });
      state.showDeliveryDrawer = false;
      sheep.$router.redirect('/pages/order/aftersale/list');
    }
  }

  // 提交表单
  async function submit() {
    let data = {
      orderItemId: state.itemId,
      refundPrice: state.item.payPrice,
      ...formData,
    };

    // 【测试环境特殊处理】绕过接口直接弹窗
    // state.createdAfterSaleId = 1;
    // state.showDeliveryDrawer = true;
    // return;

    /* 原有真实逻辑 */
    uni.showLoading({ title: '提交中' });
    const { code, data: afterSaleId } = await AfterSaleApi.createAfterSale(data);
    uni.hideLoading();
    if (code === 0) {
      if (formData.way === '20') {
        // 退货退款，成功后弹出填写物流抽屉
        state.createdAfterSaleId = afterSaleId;
        state.showDeliveryDrawer = true;
      } else {
        uni.showToast({
          title: '申请成功',
        });
        sheep.$router.redirect('/pages/order/aftersale/list');
      }
    }
  }

  // 选择售后类型
  function onRefundChange(e) {
    formData.way = e.detail.value;
    // 清理理由
    state.reasonList =
      formData.way === '10'
        ? state.config.afterSaleRefundReasons || []
        : state.config.afterSaleReturnReasons || [];
    formData.applyReason = '';
    state.currentValue = '';
  }

  // 选择申请原因
  function onChange(e) {
    state.currentValue = e.detail.value;
  }

  // 确定
  function onReason() {
    formData.applyReason = state.currentValue;
    state.showModal = false;
  }

  onLoad(async (options) => {
    // 获得快递物流列表
    getExpressList();

    // 解析参数
    if (!options.orderId || !options.itemId) {
      sheep.$helper.toast(`缺少订单信息，请检查`);
      return;
    }
    state.orderId = options.orderId;
    state.itemId = parseInt(options.itemId);

    // 读取订单信息
    const { code, data } = await OrderApi.getOrderDetail(state.orderId);
    if (code !== 0) {
      return;
    }
    state.order = data;
    state.item = data.items.find((item) => item.id === state.itemId) || {};

    // 设置选项
    if (state.order.status === 10) {
      state.wayList.splice(1, 1);
    }

    // 读取配置
    state.config = (await TradeConfigApi.getTradeConfig()).data;

    // 初始化默认选中
    if (state.wayList.length > 0) {
      formData.way = state.wayList[0].value;
      state.reasonList =
        formData.way === '10'
          ? state.config.afterSaleRefundReasons || []
          : state.config.afterSaleReturnReasons || [];
    }
  });
</script>

<style lang="scss" scoped>
  /* 导航栏 */
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    background: #f8f9f3;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* #ifdef H5 */
    max-width: 750rpx;
    left: 50%;
    transform: translateX(-50%);
    /* #endif */
  }
  .nav-bar-container {
    background: #f8f9f3;
    display: flex;
    align-items: center;
  }
  .back-btn {
    width: 60rpx;
    color: rgba(30, 63, 28, 0.9);
    height: 60rpx;
  }
  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
  }

  .item-title {
    font-size: 30rpx;
    font-weight: bold;
    color: rgba(51, 51, 51, 1);
    // margin-bottom: 20rpx;
  }

  // 售后项目
  .refund-item {
    background-color: #fff;
    border-bottom: 1rpx solid #f5f5f5;
    padding: 30rpx;

    &:last-child {
      border: none;
    }

    // 留言
    .describe-box {
      width: 690rpx;
      background: rgba(249, 250, 251, 1);
      padding: 30rpx;
      box-sizing: border-box;
      border-radius: 20rpx;

      .describe-content {
        height: 200rpx;
        font-size: 24rpx;
        font-weight: 400;
        color: #333;
      }
    }

    // 联系方式
    .input-box {
      height: 84rpx;
      background: rgba(249, 250, 251, 1);
      border-radius: 20rpx;
    }
  }

  .goods-box {
    background: #fff;
    padding: 20rpx;
    margin-bottom: 20rpx;
  }

  // 底部
  .footer-box {
    height: 100rpx;
    width: 100%;
    box-sizing: border-box;
    border-radius: 10rpx;
    padding-right: 20rpx;

    .cancel-btn {
      width: 160rpx;
      height: 60rpx;
      background: #ffffff;
      border-radius: 30rpx;
      border: 2rpx solid #9d9c96;
      margin-right: 20rpx;
      font-size: 28rpx;
      font-weight: 400;
      color: #9d9c96;
      line-height: 56rpx;
    }

    .pay-btn {
      width: 160rpx;
      height: 60rpx;
      font-size: 28rpx;
      border-radius: 30rpx;
      font-weight: 500;
      color: #fff;
      background: #1e3f1c;
      line-height: 60rpx;
    }
  }

  .modal-box {
    width: 750rpx;
    // height: 680rpx;
    border-radius: 30rpx 30rpx 0 0;
    background: #fff;

    .modal-head {
      height: 100rpx;
      font-size: 30rpx;
    }

    .modal-content {
      font-size: 28rpx;
    }

    .modal-foot {
      padding: 20rpx 0;
      .close-btn {
        width: 710rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        color: #fff;
        background: #1e3f1c;
        font-size: 28rpx;
        font-weight: 500;
      }
    }
  }

  .success-box {
    width: 600rpx;
    padding: 90rpx 0 64rpx 0;

    .cicon-check-round {
      font-size: 96rpx;
      color: #04b750;
    }

    .success-title {
      font-weight: 500;
      color: #333333;
      font-size: 32rpx;
    }

    .success-btn {
      width: 492rpx;
      height: 70rpx;
      background: linear-gradient(90deg, var(--ui-BG-Main-gradient), var(--ui-BG-Main));
      border-radius: 35rpx;
    }
  }

  // 抽屉样式
  .delivery-drawer-box {
    width: 750rpx;
    background-color: #fff;
    border-radius: 20rpx 20rpx 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .drawer-header {
    height: 100rpx;
    border-bottom: 1rpx solid #f5f5f5;
  }

  .drawer-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }

  .drawer-content {
    padding: 30rpx;
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
  }

  .address-card {
    background-color: #f9f9f9;
    border-radius: 10rpx;
    padding: 20rpx;
    margin-bottom: 30rpx;
  }

  .address-info {
    flex: 1;
  }

  .address-detail {
    font-size: 28rpx;
    color: #333;
    line-height: 40rpx;
    margin-bottom: 10rpx;
  }

  .address-contact {
    font-size: 26rpx;
    color: #666;
  }

  .copy-action {
    padding-left: 20rpx;
  }

  .copy-text {
    font-size: 26rpx;
    color: #1e3f1c;
  }

  .form-row {
    height: 90rpx;
  }

  .row-label {
    width: 160rpx;
    font-size: 28rpx;
    color: #333;
  }

  .row-input {
    flex: 1;
    font-size: 28rpx;
    color: #333;
  }

  .picker-inner {
    width: 100%;
    height: 90rpx;
  }

  .value-text {
    color: #333;
  }

  .placeholder-text {
    color: #999;
  }

  .divider {
    height: 1rpx;
    background-color: #f5f5f5;
  }

  .drawer-footer {
    padding: 20rpx 30rpx;
  }

  .confirm-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: rgba(30, 63, 28, 1);
    border-radius: 44rpx;
    color: #fff;
    font-size: 32rpx;
    text-align: center;
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

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }
</style>
