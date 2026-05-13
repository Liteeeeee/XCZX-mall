<!-- 售后详情 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view class="nav-bar-inner">
          <view class="nav-left ss-flex ss-col-center">
            <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="onBack">
              <text class="sicon-back"></text>
            </view>
            <text class="nav-title ss-m-l-10">售后详情</text>
          </view>
          <view v-if="isMiniProgram" class="nav-right">
            <view class="capsule-placeholder" :style="capsuleStyle"></view>
          </view>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>
    <view class="content_box" v-if="!isEmpty(state.info) && state.loading">
      <!-- 步骤条 -->
      <!-- <view class="steps-box ss-flex">
        <view class="ss-flex">
          <view class="steps-item" v-for="(item, index) in state.list" :key="index">
            <view class="ss-flex">
              <text
                class="sicon-circleclose"
                v-if="state.list.length - 1 === index && [61, 62, 63].includes(state.info.status)"
              />
              <text
                class="sicon-circlecheck"
                v-else
                :class="state.active >= index ? 'activity-color' : 'info-color'"
              />

              <view
                v-if="state.list.length - 1 !== index"
                class="line"
                :class="state.active >= index ? 'activity-bg' : 'info-bg'"
              />
            </view>
            <view
              class="steps-item-title"
              :class="state.active >= index ? 'activity-color' : 'info-color'"
            >
              {{ item.title }}
            </view>
          </view>
        </view>
      </view> -->
      <view class="text-group_7 flex-col" v-if="afterSaleStageTitle">
        <text class="text_3">{{ afterSaleStageTitle }}</text>
        <text class="text_4" v-if="afterSaleStageDesc">{{ afterSaleStageDesc }}</text>
      </view>
      <!-- 服务状态 -->
      <view
        class="status-box ss-flex ss-col-center ss-row-between ss-m-x-20"
        @tap="sheep.$router.go('/pages/order/aftersale/log', { id: state.id })"
      >
        <view class="">
          <view class="status-text">
            {{ formatAfterSaleStatusDescription(state.info) }}
          </view>
          <view class="status-time">
            {{ sheep.$helper.timeFormat(state.info.updateTime, 'yyyy-mm-dd hh:MM:ss') }}
          </view>
        </view>
        <text class="ss-iconfont _icon-forward" style="color: #666" />
      </view>
      <!-- 服务商品 -->
      <view class="order-shop">
        <view class="reason-title">售后商品</view>
        <s-goods-item
          :img="state.info.picUrl"
          :title="state.info.spuName"
          :titleWidth="480"
          :skuText="state.info.properties.map((property) => property.valueName).join(' ')"
          :num="state.info.count"
        />
      </view>
      <!-- 退款金额 -->
      <view class="aftersale-money ss-flex ss-col-center ss-row-between">
        <view class="aftersale-money--title">退款总额</view>
        <view class="aftersale-money--num">￥{{ fen2yuan(state.info.refundPrice) }}</view>
      </view>

      <!-- 服务内容 -->
      <view class="aftersale-content">
        <view class="reason-title">售后信息</view>
        <view class="aftersale-item ss-flex ss-col-center">
          <view class="item-title">服务单号：</view>
          <view class="item-content ss-m-r-16">{{ state.info.no }}</view>
          <button class="ss-reset-button copy-btn" @tap="onCopy">复制</button>
        </view>
        <view class="aftersale-item ss-flex ss-col-center">
          <view class="item-title">申请时间：</view>
          <view class="item-content">
            {{ sheep.$helper.timeFormat(state.info.createTime, 'yyyy-mm-dd hh:MM:ss') }}
          </view>
        </view>
        <view class="aftersale-item ss-flex ss-col-center">
          <view class="item-title">售后类型：</view>
          <view class="item-content">{{ state.info.way === 10 ? '仅退款' : '退款退货' }}</view>
        </view>
        <view class="aftersale-item ss-flex ss-col-center">
          <view class="item-title">申请原因：</view>
          <view class="item-content">{{ state.info.applyReason }}</view>
        </view>
        <view class="aftersale-item aftersale-item--top ss-flex">
          <view class="item-title">相关描述：</view>
          <view class="item-content">
            <view class="desc-text" v-if="state.info.applyDescription">
              {{ state.info.applyDescription }}
            </view>
            <view v-if="applyPicUrls.length" class="desc-images">
              <image
                v-for="(url, idx) in applyPicUrls"
                :key="url + '_' + idx"
                class="desc-image"
                :src="url"
                mode="aspectFill"
                @tap="previewApplyPics(idx)"
              />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作区 -->
    <s-empty
      v-if="isEmpty(state.info) && state.loading"
      :icon="sheep.$url.static('/static/order-empty.webp')"
      text="暂无该订单售后详情"
    />
    <su-fixed bottom placeholder bg="bg-white" v-if="!isEmpty(state.info)">
      <view class="foot_box">
        <button
          class="ss-reset-button btn"
          v-if="state.info.buttons?.includes('cancel')"
          @tap="onApply(state.info.id)"
        >
          取消申请
        </button>
        <button
          class="ss-reset-button btn"
          v-if="state.info.buttons?.includes('delivery')"
          @tap="openDeliveryDrawer"
        >
          填写退货
        </button>
        <button class="ss-reset-button contcat-btn btn" open-type="contact"> 联系客服 </button>
      </view>
    </su-fixed>

    <su-popup
      :show="state.showDeliveryDrawer"
      type="bottom"
      round="20"
      :showClose="false"
      @close="state.showDeliveryDrawer = false"
    >
      <view class="delivery-popup-box">
        <view class="delivery-popup-title ss-flex ss-row-center ss-col-center">
          填写退货信息
          <view
            class="delivery-close-btn ss-flex ss-row-center ss-col-center"
            @tap.stop="state.showDeliveryDrawer = false"
          >
            <image
              class="delivery-close-icon"
              src="https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/close.webp"
              mode="aspectFit"
            />
          </view>
        </view>

        <scroll-view class="delivery-popup-content" scroll-y>
          <view class="delivery-section-title">退货邮寄地址</view>
          <view class="delivery-address-card">
            <view class="delivery-address-main">
              <view class="delivery-address-text">{{
                state.config.afterSaleReturnAddress || '朝阳区东城路15号西城科学园'
              }}</view>
              <view class="delivery-address-contact">{{
                state.config.afterSaleReturnMobile || '苏小三 180****8888'
              }}</view>
            </view>
            <view class="delivery-copy-btn" @tap="copyReturnAddress">复制地址信息</view>
          </view>

          <view class="delivery-form-box">
            <view class="delivery-form-row">
              <text class="delivery-row-label">快递单号</text>
              <input
                class="delivery-row-input"
                v-model="deliveryData.logisticsNo"
                placeholder="请输入快递单号"
                placeholder-class="delivery-placeholder"
              />
            </view>

            <view class="delivery-row-divider"></view>

            <view class="delivery-form-row">
              <text class="delivery-row-label">快递公司</text>
              <picker
                mode="selector"
                class="delivery-row-picker"
                @change="onExpressChange"
                :value="deliveryData.expressIndex"
                :range="state.expresses"
                range-key="name"
              >
                <view class="delivery-picker-inner">
                  <text
                    :class="
                      deliveryData.expressIndex !== -1
                        ? 'delivery-picker-value'
                        : 'delivery-placeholder'
                    "
                  >
                    {{
                      deliveryData.expressIndex !== -1
                        ? state.expresses[deliveryData.expressIndex].name
                        : '请选择快递公司'
                    }}
                  </text>
                  <text class="sicon-forward delivery-picker-arrow"></text>
                </view>
              </picker>
            </view>
          </view>

          <view class="delivery-popup-footer">
            <button class="ss-reset-button delivery-confirm-btn" @tap="submitDelivery">确定</button>
          </view>
        </scroll-view>
      </view>
    </su-popup>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import { isEmpty } from 'lodash-es';
  import {
    fen2yuan,
    formatAfterSaleStatusDescription,
    getAfterSaleStageText,
    handleAfterSaleButtons,
  } from '@/sheep/hooks/useGoods';
  import AfterSaleApi from '@/sheep/api/trade/afterSale';
  import DeliveryApi from '@/sheep/api/trade/delivery';
  import TradeConfigApi from '@/sheep/api/trade/config';

  const isMiniProgram = sheep.$platform.platform === 'miniProgram';
  const capsuleStyle = computed(() => {
    if (!isMiniProgram) {
      return {};
    }
    const rightMargin = sheep.$platform.device.windowWidth - sheep.$platform.capsule.right;
    return {
      width: sheep.$platform.capsule.width + rightMargin + 'px',
      height: sheep.$platform.capsule.height + 'px',
    };
  });

  const state = reactive({
    id: 0, // 售后编号
    info: {}, // 收货信息
    config: {},
    loading: false,
    showDeliveryDrawer: false,
    expresses: [],
    active: 0, // 在 list 的激活位置
    list: [
      {
        title: '提交申请',
      },
      {
        title: '处理中',
      },
      {
        title: '完成',
      },
    ], // 时间轴
  });
  const deliveryData = reactive({
    logisticsNo: '',
    expressIndex: -1,
  });

  const applyPicUrls = computed(() => {
    const list = state.info?.applyPicUrls;
    if (!Array.isArray(list)) {
      return [];
    }
    return list.filter(Boolean).map((u) => sheep.$url.cdn(u));
  });

  const afterSaleStageTitle = computed(() => getAfterSaleStageText(state.info || {}).title);
  const afterSaleStageDesc = computed(() => getAfterSaleStageText(state.info || {}).desc);

  function previewApplyPics(index) {
    const urls = applyPicUrls.value || [];
    if (!urls.length) {
      return;
    }
    uni.previewImage({
      current: urls[index] || urls[0],
      urls,
    });
  }

  function onBack() {
    if (sheep.$router.hasHistory()) {
      sheep.$router.back();
      return;
    }
    sheep.$router.go('/pages/index/index', {}, { redirect: true });
  }

  function onApply(id) {
    uni.showModal({
      title: '提示',
      content: '确定要取消此申请吗？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const { code } = await AfterSaleApi.cancelAfterSale(id);
        if (code === 0) {
          await getDetail(id);
        }
      },
    });
  }

  // 复制
  const onCopy = () => {
    sheep.$helper.copyText(state.info.no);
  };

  async function getTradeConfig() {
    const { code, data } = await TradeConfigApi.getTradeConfig();
    if (code === 0) {
      state.config = data || {};
    }
  }

  async function getExpressList() {
    if (state.expresses.length > 0) {
      return;
    }
    const { code, data } = await DeliveryApi.getDeliveryExpressList();
    if (code === 0) {
      state.expresses = data || [];
    }
  }

  function copyReturnAddress() {
    const address = `${state.config.afterSaleReturnAddress || '朝阳区东城路15号西城科学园'} ${
      state.config.afterSaleReturnMobile || '苏小三 180****8888'
    }`;
    sheep.$helper.copyText(address);
  }

  function onExpressChange(e) {
    deliveryData.expressIndex = Number(e.detail.value);
  }

  async function openDeliveryDrawer() {
    await Promise.all([getTradeConfig(), getExpressList()]);
    state.showDeliveryDrawer = true;
  }

  async function submitDelivery() {
    if (!deliveryData.logisticsNo) {
      sheep.$helper.toast('请输入快递单号');
      return;
    }
    if (deliveryData.expressIndex === -1 || !state.expresses[deliveryData.expressIndex]) {
      sheep.$helper.toast('请选择快递公司');
      return;
    }

    uni.showLoading({ title: '提交中' });
    const { code } = await AfterSaleApi.deliveryAfterSale({
      id: state.info.id,
      logisticsId: state.expresses[deliveryData.expressIndex].id,
      logisticsNo: deliveryData.logisticsNo,
    });
    uni.hideLoading();
    if (code !== 0) {
      return;
    }

    uni.showToast({
      title: '填写退货成功',
    });
    state.showDeliveryDrawer = false;
    deliveryData.logisticsNo = '';
    deliveryData.expressIndex = -1;
    await getDetail(state.info.id);
  }

  async function getDetail(id) {
    state.loading = true;
    const { code, data } = await AfterSaleApi.getAfterSale(id);
    if (code !== 0) {
      state.info = null;
      return;
    }
    state.info = data;
    handleAfterSaleButtons(state.info);

    // 处理时间轴
    if ([10].includes(state.info.status)) {
      state.active = 0;
    } else if ([20, 30].includes(state.info.status)) {
      state.active = 1;
    } else if ([40, 50].includes(state.info.status)) {
      state.active = 2;
    } else if ([61, 62, 63].includes(state.info.status)) {
      state.active = 2;
    }
  }

  onLoad((options) => {
    if (!options.id) {
      sheep.$helper.toast(`缺少订单信息，请检查`);
      return;
    }
    state.id = options.id;
    getDetail(options.id);
    getTradeConfig();
  });
</script>

<style lang="scss" scoped>
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
  .nav-bar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 20rpx;
    width: 100%;
    box-sizing: border-box;
  }
  .nav-left,
  .nav-right {
    display: flex;
    align-items: center;
  }

  // 步骤条
  .steps-box {
    width: 100%;
    height: 190rpx;
    background: #f8f9f3;
    padding-left: 72rpx;

    .steps-item {
      .sicon-circleclose {
        font-size: 24rpx;
        color: rgba(30, 63, 28, 0.9);
      }

      .sicon-circlecheck {
        font-size: 24rpx;
      }

      .steps-item-title {
        font-size: 24rpx;
        font-weight: 400;
        margin-top: 16rpx;
        margin-left: -36rpx;
        width: 100rpx;
        text-align: center;
      }
    }
  }

  .activity-color {
    color: rgba(30, 63, 28, 0.9);
  }

  .info-color {
    color: #9d9c96;
  }

  .activity-bg {
    background: rgba(30, 63, 28, 0.9);
  }

  .info-bg {
    background: rgba(157, 156, 150, 0.6);
  }

  .line {
    width: 270rpx;
    height: 4rpx;
  }

  // 服务状态
  .status-box {
    position: relative;
    z-index: 3;
    background-color: #fff;
    border-radius: 10rpx;
    padding: 20rpx;
    margin-top: 20rpx;

    .status-text {
      font-size: 28rpx;

      font-weight: 500;
      color: rgba(51, 51, 51, 1);
      margin-bottom: 20rpx;
    }

    .status-time {
      font-size: 24rpx;

      font-weight: 400;
      color: rgba(153, 153, 153, 1);
    }
  }

  // 退款金额
  .aftersale-money {
    background-color: #fff;
    height: 98rpx;
    padding: 0 20rpx;
    margin: 20rpx;

    .aftersale-money--title {
      font-size: 28rpx;

      font-weight: 500;
      color: rgba(51, 51, 51, 1);
    }

    .aftersale-money--num {
      font-size: 32rpx;
      font-family: PingFangSC;
      font-weight: 500;
      color: #000;
    }
  }

  // order-shop
  .order-shop {
    padding: 20rpx;
    background-color: #fff;
    margin: 20rpx 20rpx 20rpx 20rpx;
  }

  // 服务内容
  .aftersale-content {
    background-color: #fff;
    padding: 20rpx;
    margin: 0 20rpx;

    .aftersale-item {
      min-height: 60rpx;
      padding: 12rpx 0;

      .copy-btn {
        background: #eeeeee;
        color: #333;
        border-radius: 20rpx;
        width: 75rpx;
        height: 40rpx;
        font-size: 22rpx;
      }

      .item-title {
        color: #999;
        font-size: 28rpx;
        flex-shrink: 0;
      }

      .item-content {
        color: #333;
        font-size: 28rpx;
        flex: 1;
        min-width: 0;
        line-height: 40rpx;
        word-break: break-all;
      }
    }

    .aftersale-item--top {
      align-items: flex-start;

      .item-title {
        line-height: 40rpx;
      }

      .desc-text {
        line-height: 40rpx;
        word-break: break-all;
      }

      .desc-images {
        margin-top: 20rpx;
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
      }

      .desc-image {
        width: 180rpx;
        height: 180rpx;
        border-radius: 10rpx;
        background: #f5f5f5;
      }
    }
  }

  // 底部功能
  .foot_box {
    height: 100rpx;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: flex-end;

    .btn {
      width: 160rpx;
      line-height: 60rpx;
      background: rgba(238, 238, 238, 1);
      border-radius: 30rpx;
      padding: 0;
      margin-right: 20rpx;
      font-size: 26rpx;

      font-weight: 400;
      color: rgba(51, 51, 51, 1);
    }
  }

  .delivery-popup-box {
    background: #fffefa;
    border-radius: 24rpx 24rpx 0 0;
    padding: 0 32rpx calc(36rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  .delivery-popup-title {
    position: relative;
    height: 108rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: #222222;
  }

  .delivery-close-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #eeeeee;
    color: #666666;
    font-size: 20rpx;
  }

  .delivery-close-icon {
    width: 40rpx;
    height: 40rpx;
  }

  .delivery-popup-content {
    max-height: 62vh;
  }

  .delivery-section-title {
    font-size: 30rpx;
    font-weight: 500;
    color: #222222;
    line-height: 42rpx;
    margin-bottom: 20rpx;
  }

  .delivery-address-card {
    background: #f5f5f3;
    border-radius: 18rpx;
    padding: 22rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: 20rpx;
  }

  .delivery-address-main {
    flex: 1;
    min-width: 0;
  }

  .delivery-address-text,
  .delivery-address-contact {
    font-size: 28rpx;
    color: #666666;
    line-height: 40rpx;
    word-break: break-all;
  }

  .delivery-address-contact {
    margin-top: 4rpx;
  }

  .delivery-copy-btn {
    flex-shrink: 0;
    font-size: 28rpx;
    color: #4a63ff;
    line-height: 40rpx;
  }

  .delivery-form-box {
    margin-top: 34rpx;
    background: transparent;
  }

  .delivery-form-row {
    min-height: 88rpx;
    display: flex;
    align-items: center;
  }

  .delivery-row-label {
    width: 152rpx;
    flex-shrink: 0;
    font-size: 30rpx;
    color: #222222;
    line-height: 42rpx;
  }

  .delivery-row-input,
  .delivery-row-picker {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    color: #222222;
  }

  .delivery-row-divider {
    height: 1rpx;
    background: #eceae4;
  }

  .delivery-picker-inner {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .delivery-picker-value {
    color: #222222;
    font-size: 28rpx;
  }

  .delivery-placeholder {
    color: #b7b2aa;
    font-size: 28rpx;
  }

  .delivery-picker-arrow {
    color: #b7b2aa;
    font-size: 24rpx;
  }

  .delivery-popup-footer {
    padding-top: 44rpx;
  }

  .delivery-confirm-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    background: #1e4a1d;
    color: #ffffff;
    font-size: 34rpx;
    font-weight: 500;
    text-align: center;
  }
  .reason-title {
    color: #000000;
    font-size: 32rpx;
    font-weight: 500;
    line-height: 50rpx;
  }

  .text-group_7 {
    margin: 36rpx 125rpx 0 32rpx;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .text_3 {
    height: 44rpx;
    overflow-wrap: break-word;
    color: rgba(29, 33, 41, 1);
    font-size: 40rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
    margin-right: 113rpx;
  }
  .text_4 {
    overflow-wrap: break-word;
    color: rgba(134, 144, 156, 1);
    font-size: 28rpx;
    font-weight: normal;
    text-align: left;
    white-space: normal;
    line-height: 40rpx;
    margin-top: 14rpx;
  }
</style>
