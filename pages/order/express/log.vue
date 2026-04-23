<!-- 物流追踪 -->
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
          <text class="nav-title ss-m-l-10">物流追踪</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <view class="log-wrap">
      <!-- 物流公司与单号信息 -->
      <view class="log-card ss-flex ss-m-20 ss-r-10 ss-col-center">
        <!-- 快递公司 Logo（水平居中） -->
        <view class="log-card-logo">
          <image
            class="express-logo"
            :src="sheep.$url.static('/static/express-logo.webp')"
            mode="aspectFit"
          />
        </view>

        <view class="log-card-msg">
          <!-- TODO 芋艿：【物流】优化点：展示状态 -->
          <!--          <view class="ss-flex ss-m-b-8">-->
          <!--            <view>物流状态：</view>-->
          <!--            <view class="warning-color">{{ state.info.status_text }}</view>-->
          <!--          </view>-->
          <view class="ss-m-b-8 ss-flex ss-col-center">
            <text>快递单号：{{ state.info.logisticsNo }}</text>
            <button
              class="ss-reset-button copy-btn ss-m-l-10"
              @tap="handleCopy(state.info.logisticsNo)"
            >
              复制
            </button>
          </view>
          <view>快递公司：{{ state.info.logisticsName }}</view>
        </view>
      </view>

      <!-- 物流轨迹 -->
      <view class="log-content ss-m-20 ss-r-10">
        <view class="log-content-box ss-flex" v-for="(item, index) in state.tracks" :key="index">
          <view class="log-icon ss-flex-col ss-col-center ss-m-r-20">
            <text class="cicon-title" :class="index === 0 ? 'activity-color' : 'info-color'" />
            <view v-if="state.tracks.length - 1 !== index" class="line" />
          </view>
          <view class="log-content-msg">
            <view class="log-msg-title ss-m-b-20" v-if="item.title">
              {{ item.title }}
            </view>
            <view class="log-msg-desc ss-m-b-16">
              <highlight-number :content="item.content" @phone-click="handlePhoneClick" />
            </view>
            <view class="log-msg-date ss-m-b-40">
              {{ sheep.$helper.timeFormat(item.time, 'yyyy-mm-dd hh:MM:ss') }}
            </view>
          </view>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import OrderApi from '@/sheep/api/trade/order';
  import HighlightNumber from '@/pages/components/HighlightNumberText.vue';

  const state = reactive({
    info: {},
    tracks: [],
  });

  const goodsImages = computed(() => {
    let array = [];
    if (state.info.items) {
      state.info.items.forEach((item) => {
        array.push({
          image: item.picUrl,
        });
      });
    }
    return array;
  });

  async function getExpressDetail(id) {
    const { data } = await OrderApi.getOrderExpressTrackList(id);
    state.tracks = data;
  }

  async function getOrderDetail(id) {
    const { data } = await OrderApi.getOrderDetail(id);
    state.info = data;
  }

  onLoad((options) => {
    getExpressDetail(options.id);
    getOrderDetail(options.id);
  });

  function handlePhoneClick(data) {
    handleClick(data);
  }

  function handleClick(data) {
    const phoneNumber = data.phoneNumber;

    if (!phoneNumber) return;

    // 获取当前平台
    const platform = uni.getSystemInfoSync().platform.toLowerCase();

    if (platform === 'devtools') {
      uni.showToast({ title: '真机才可拨打电话', icon: 'none' });
      handleCopy(phoneNumber);
      return;
    }

    if (platform === 'wechat') {
      uni.showToast({ title: '请手动拨打', icon: 'none' });
      handleCopy(phoneNumber);
      return;
    }

    uni.makePhoneCall({
      phoneNumber: phoneNumber,
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.error('拨打电话失败', err);
        uni.showToast({ title: '拨号失败，请手动拨打', icon: 'none' });
        handleCopy(phoneNumber);
      },
    });
  }
  function handleCopy(text) {
    uni.setClipboardData({
      data: text,
      success: () => {
        uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
      },
      fail: () => {
        uni.showToast({ title: '复制失败', icon: 'none' });
      },
    });
  }
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
    color: black;
    height: 60rpx;
    font-size: 40rpx;
  }
  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
  }

  .highlight {
    color: red; /* 高亮颜色 */
    font-weight: bold;
  }

  .swiper-box {
    width: 200rpx;
    height: 200rpx;
  }

  .log-wrap {
    /* 移除之前的默认 padding，交由底部占位或者具体元素控制 */
  }

  .log-card {
    border-top: 2rpx solid rgba(#dfdfdf, 0.5);
    padding: 20rpx;
    background: #fff;
    margin-bottom: 20rpx;

    .log-card-logo {
      width: 140rpx; // 外层容器宽度可适当保留以控制左侧空间
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 20rpx;

      .express-logo {
        width: 78rpx;
        height: 78rpx;
        border-radius: 50%; // 圆形效果，如果不需要可移除
      }
    }

    .log-card-msg {
      font-size: 28rpx;
      font-weight: 500;
      width: 490rpx;
      color: #333333;

      .warning-color {
        color: #999;
      }

      .copy-btn {
        width: 80rpx;
        height: 36rpx;
        line-height: 36rpx;
        border-radius: 18rpx;
        font-size: 20rpx;
        color: #333;
        background-color: #f5f5f5;
        text-align: center;
        display: inline-block;
      }
    }
  }

  .log-content {
    padding: 34rpx 20rpx 0rpx 20rpx;
    background: #fff;

    .log-content-box {
      align-items: stretch;
    }

    .log-icon {
      height: inherit;

      .cicon-title {
        color: #ccc;
        font-size: 40rpx;
      }

      .activity-color {
        color: #f0c785;
        font-size: 40rpx;
      }

      .info-color {
        color: #ccc;
        font-size: 40rpx;
      }

      .line {
        width: 1px;
        height: 100%;
        background: #d8d8d8;
      }
    }

    .log-content-msg {
      .log-msg-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333333;
      }

      .log-msg-desc {
        font-size: 24rpx;
        font-weight: 400;
        color: #333333;
        line-height: 36rpx;
      }

      .log-msg-date {
        font-size: 24rpx;
        font-weight: 500;
        color: #000000;
      }
    }
  }
</style>
