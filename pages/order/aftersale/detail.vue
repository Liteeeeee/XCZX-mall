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
      <view class="steps-box ss-flex">
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

      <!-- 退款金额 -->
      <view class="aftersale-money ss-flex ss-col-center ss-row-between">
        <view class="aftersale-money--title">退款总额</view>
        <view class="aftersale-money--num">￥{{ fen2yuan(state.info.refundPrice) }}</view>
      </view>
      <!-- 服务商品 -->
      <view class="order-shop">
        <s-goods-item
          :img="state.info.picUrl"
          :title="state.info.spuName"
          :titleWidth="480"
          :skuText="state.info.properties.map((property) => property.valueName).join(' ')"
          :num="state.info.count"
        />
      </view>

      <!-- 服务内容 -->
      <view class="aftersale-content">
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
        <view class="aftersale-item ss-flex ss-col-center">
          <view class="item-title">相关描述：</view>
          <view class="item-content">{{ state.info.applyDescription }}</view>
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
          @tap="sheep.$router.go('/pages/order/aftersale/return-delivery', { id: state.info.id })"
        >
          填写退货
        </button>
        <button
          class="ss-reset-button contcat-btn btn"
          @tap="sheep.$router.go('/pages/chat/index')"
        >
          联系客服
        </button>
      </view>
    </su-fixed>
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
    handleAfterSaleButtons,
  } from '@/sheep/hooks/useGoods';
  import AfterSaleApi from '@/sheep/api/trade/afterSale';

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
    loading: false,
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
    color: rgba(30, 63, 28, 0.9);
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
      font-size: 28rpx;
      font-family: OPPOSANS;
      font-weight: 500;
      color: #f53f3f;
    }
  }

  // order-shop
  .order-shop {
    padding: 20rpx;
    background-color: #fff;
    margin: 0 20rpx 20rpx 20rpx;
  }

  // 服务内容
  .aftersale-content {
    background-color: #fff;
    padding: 20rpx;
    margin: 0 20rpx;

    .aftersale-item {
      height: 60rpx;

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
      }

      .item-content {
        color: #333;
        font-size: 28rpx;
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
</style>
