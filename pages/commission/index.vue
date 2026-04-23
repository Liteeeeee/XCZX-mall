<template>
  <s-layout
    navbar="clear"
    :bgStyle="{ color: 'rgba(248, 249, 243, 1.0)' }"
    :onShareAppMessage="state.shareInfo"
  >
    <view class="page flex-col">
      <view class="fixed-header">
        <su-status-bar />
        <view
          class="nav-bar-container"
          :style="{
            position: 'relative',
            height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px',
          }"
        >
          <view
            class="nav-bar-inner flex-row align-center"
            :style="{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '100%',
              left: '0',
              width: '100%',
            }"
          >
            <uni-icons
              type="left"
              size="22"
              color="#000"
              @tap="sheep.$router.back()"
              class="nav-back"
            />
            <text class="nav-title">推广分销</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="box_13 flex-col">
        <view class="box_28 flex-row">
          <image class="group_5 flex-col" :src="avatarUrl" mode="aspectFill" />
          <view class="text-group_2 flex-col">
            <text class="text_2">{{ userInfo?.nickname || '' }}</text>
            <text class="text_3">{{ maskedMobile }}</text>
          </view>
          <view class="text-wrapper_1 flex-col" @tap="onInviteMember">
            <text class="text_4">邀请会员</text>
          </view>
        </view>

        <view class="box_15 flex-col">
          <view class="stats-row flex-row justify-around">
            <view
              class="stat-col flex-col"
              @tap="sheep.$router.go('/pages/commission/index.lanhu.backup')"
            >
              <view class="stat-value-row flex-row align-center justify-center">
                <text class="text_5 count-font">{{ totalBrokerageYuan }}</text>
                <text
                  v-if="Number(todayBrokerageYuan) > 0"
                  :style="{ right: '-54rpx' }"
                  class="text_6 count-font stat-plus stat-plus-income"
                  >+{{ todayBrokerageYuan }}</text
                >
              </view>
              <text class="text_11">推广收益</text>
            </view>
            <view
              class="stat-col flex-col"
              @tap="sheep.$router.go('/pages/commission/fans', { todayFirstFansCount })"
            >
              <view class="stat-value-row flex-row align-center justify-center">
                <text class="text_7 count-font">{{ fansCount }}</text>
                <text v-if="todayFirstFansCount > 0" class="text_8 count-font stat-plus"
                  >+{{ todayFirstFansCount }}</text
                >
              </view>
              <text class="text_12">粉丝</text>
            </view>
            <view class="stat-col flex-col" @tap="sheep.$router.go('/pages/commission/order')">
              <view class="stat-value-row flex-row align-center justify-center">
                <text class="text_9 count-font">{{ orderCount }}</text>
                <text v-if="todayOrderCount > 0" class="text_10 count-font stat-plus"
                  >+{{ todayOrderCount }}</text
                >
              </view>
              <text class="text_13">推广订单</text>
            </view>
          </view>
        </view>
      </view>

      <view class="block_13 flex-col">
        <view class="list_2 flex-col">
          <view
            class="list-items_1 flex-row justify-between"
            v-for="item in state.pagination.list"
            :key="item.id"
          >
            <image
              class="box_17 flex-col"
              :src="sheep.$url.cdn(item.spuPicUrl)"
              mode="aspectFill"
              @tap="onGoGoods(item)"
            />
            <view class="section_13 flex-col">
              <text class="text_14">{{ item.spuName }}</text>
              <view class="text-wrapper_7 justify-between">
                <text class="text_15">{{ item.name }}</text>
                <view :style="{ marginRight: '40rpx' }"
                  ><text class="text_16">¥</text>
                  <text class="text_17 count-font">{{ fen2yuan(item.price) }}</text>
                </view>
              </view>
              <view class="group_6 flex-row justify-between">
                <view class="profit-tag flex-row align-center">
                  <text class="text_18">{{ formatBrokerage(item) }}</text>
                </view>
                <button
                  class="ss-reset-button block_5 flex-row justify-between"
                  @tap.stop="onShareGoods(item)"
                >
                  <text class="text_19">立即推广</text>
                  <view class="box_19 flex-col">
                    <image
                      class="box_20"
                      :src="sheep.$url.cdn('/mp/static/arrow.webp')"
                      mode="aspectFit"
                    />
                  </view>
                </button>
              </view>
            </view>
          </view>
        </view>

        <s-empty
          v-if="state.pagination.total === 0 && state.loadStatus !== 'loading'"
          :icon="sheep.$url.static('/static/goods-empty.webp')"
          text="暂无推广商品"
        />
        <uni-load-more
          v-if="state.pagination.total > 0"
          :status="state.loadStatus"
          :content-text="{ contentdown: '上拉加载更多' }"
          @tap="loadMore"
        />
      </view>

      <commission-auth />
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import $share from '@/sheep/platform/share';
  import { computed, reactive } from 'vue';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { concat } from 'lodash-es';
  import { showShareModal } from '@/sheep/hooks/useModal';
  import SpuApi from '@/sheep/api/product/spu';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import commissionAuth from './components/commission-auth.vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import { SharePageEnum } from '@/sheep/helper/const';

  const userInfo = computed(() => sheep.$store('user').userInfo);
  const avatarUrl = computed(() => sheep.$url.avatar(userInfo.value?.avatar));

  const state = reactive({
    summary: {},
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 8,
    },
    loadStatus: '',
    shareInfo: {},
  });

  const maskedMobile = computed(() => {
    const mobile = userInfo.value?.mobile || userInfo.value?.phone || '';
    if (!mobile) {
      return '';
    }
    return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  });

  const fansCount = computed(() => {
    return Number(state.summary?.totalFirstFansCount || 0);
  });

  const todayFirstFansCount = computed(() => {
    return Number(state.summary?.todayFirstFansCount || 0);
  });

  const orderCount = computed(() => {
    return Number(state.summary?.totalOrderCount || state.summary?.orderCount || 0);
  });

  const todayOrderCount = computed(() => {
    return Number(state.summary?.todayOrderCount || 0);
  });

  const fen2yuanFixed = (fen) => {
    const n = Number(fen || 0);
    if (!Number.isFinite(n)) {
      return '0.00';
    }
    return (n / 100).toFixed(2);
  };

  const totalBrokerageYuan = computed(() => {
    const totalBrokerageFen = Number(
      state.summary?.totalBrokeragePrice || state.summary?.brokeragePrice || 0,
    );
    return fen2yuanFixed(totalBrokerageFen);
  });

  const todayBrokerageYuan = computed(() => {
    return fen2yuanFixed(Number(state.summary?.todayBrokeragePrice || 0));
  });

  function onInviteMember() {
    state.shareInfo = sheep.$platform.share.getShareInfo(
      {
        title: `${sheep.$store('app').info.name || '仙草甄选'}邀请你成为会员`,
        image: 'http://xiancao.oss-cn-beijing.aliyuncs.com/20260407/编组@2x_1775541461773.png',
        desc: '注册即可享受会员权益与优惠活动',
        params: {
          page: SharePageEnum.HOME.value,
        },
      },
      {
        type: 'user',
      },
    );
    showShareModal();
  }

  function onGoGoods(item) {
    sheep.$router.go('/pages/goods/index', { id: item.spuId });
  }

  function formatBrokerage(item) {
    const toYuanInt = (fen) => {
      const n = Number(fen || 0);
      if (!Number.isFinite(n)) {
        return '0.00';
      }
      return (n / 100).toFixed(2);
    };

    if (item.brokeragePercent !== undefined && item.brokeragePercent > 0) {
      const commissionPrice = (item.price * item.brokeragePercent) / 100;
      return `预估可赚${toYuanInt(commissionPrice)}元`;
    }

    if (item?.brokerageMinPrice === undefined) {
      return '可赚计算中';
    }

    if (item.brokerageMinPrice === item.brokerageMaxPrice) {
      return `预估可赚${toYuanInt(item.brokerageMinPrice)}元`;
    }
    return `预估可赚${toYuanInt(item.brokerageMinPrice)}~${toYuanInt(item.brokerageMaxPrice)}元`;
  }

  function onShareGoods(goodsInfo) {
    console.log(goodsInfo);
    state.shareInfo = $share.getShareInfo(
      {
        title: goodsInfo.spuName,
        image: sheep.$url.cdn(goodsInfo.spuPicUrl),
        desc: goodsInfo.name,
        params: {
          page: SharePageEnum.GOODS.value,
          query: goodsInfo.spuId,
        },
      },
      {
        type: 'goods',
        title: goodsInfo.spuName,
        picUrl: sheep.$url.cdn(goodsInfo.spuPicUrl),
        image: sheep.$url.cdn(goodsInfo.spuPicUrl),
        price: fen2yuan(goodsInfo.price),
        original_price: fen2yuan(goodsInfo.marketPrice),
      },
    );
    showShareModal();
  }

  async function getSummary() {
    let res = null;
    try {
      res = await BrokerageApi.getBrokerageRecordTodayStatistics();
    } catch (e) {
      res = null;
    }

    if (!res || typeof res !== 'object') {
      return;
    }

    const { code, data } = res;
    if (code !== 0) {
      return;
    }
    state.summary = data || {};
  }

  async function getGoodsList() {
    state.loadStatus = 'loading';
    const res = await SpuApi.getSkuPage({
      pageSize: state.pagination.pageSize,
      pageNo: state.pagination.pageNo,
      brokerageEnabled: true,
    });
    if (!res || typeof res !== 'object') {
      state.loadStatus = 'error';
      return;
    }
    const { code, data } = res;
    if (code !== 0) {
      state.loadStatus = 'error';
      return;
    }

    await Promise.all(
      (data.list || []).map(async (item) => {
        try {
          const res = await BrokerageApi.getProductBrokeragePrice(item.spuId);
          item.brokerageMinPrice = res.data.brokerageMinPrice;
          item.brokerageMaxPrice = res.data.brokerageMaxPrice;
        } catch (e) {}
      }),
    );

    state.pagination.list = concat(state.pagination.list, data.list || []);
    state.pagination.total = data.total || 0;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  function loadMore() {
    if (state.loadStatus === 'noMore' || state.loadStatus === 'loading') {
      return;
    }
    state.pagination.pageNo++;
    getGoodsList();
  }

  onLoad(() => {
    state.shareInfo = sheep.$platform.share.getShareInfo();
    getSummary();
    getGoodsList();
  });

  onReachBottom(() => {
    loadMore();
  });
</script>

<style lang="scss" scoped>
  .page {
    background-color: rgba(248, 249, 243, 1);
    width: 100%;
    min-height: 100vh;
  }

  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 10;
    background-color: rgba(248, 249, 243, 1);
  }

  .header-placeholder {
    width: 100%;
  }

  .nav-back {
    margin-left: 34rpx;
  }

  .nav-title {
    overflow-wrap: break-word;
    color: #000000;
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 50rpx;
    margin-left: 14rpx;
  }

  .block_9 {
    background-color: rgba(255, 255, 255, 0.594);
    border-radius: 50rpx;
    width: 174rpx;
    border: 1rpx solid rgba(151, 151, 151, 0.198);
    padding: 12rpx 26rpx 13rpx 26rpx;
    margin-left: auto;
    margin-right: 16rpx;
  }

  .section_10 {
    background-color: rgba(0, 0, 0, 1);
    width: 37rpx;
    margin: 13rpx 0 11rpx 0;
  }

  .block_10 {
    width: 8rpx;
    height: 8rpx;
    margin: 3rpx 0 2rpx 0;
  }

  .block_11 {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    width: 13rpx;
    height: 13rpx;
  }

  .block_12 {
    width: 8rpx;
    height: 8rpx;
    margin: 3rpx 0 2rpx 0;
  }

  .section_11 {
    background-color: rgba(0, 0, 0, 0.2);
    width: 1rpx;
    height: 37rpx;
    margin-left: 23rpx;
  }

  .section_12 {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    margin: 2rpx 0 1rpx 25rpx;
    padding: 4rpx 4rpx 4rpx 4rpx;
  }

  .box_26 {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    padding: 7rpx 7rpx 7rpx 7rpx;
  }

  .box_27 {
    width: 12rpx;
    height: 12rpx;
  }

  .box_13 {
    background-color: rgba(248, 249, 243, 1);
    padding: 30rpx 32rpx 40rpx 32rpx;
    margin-top: -1rpx;
  }

  .group_5 {
    width: 128rpx;
    height: 128rpx;
    border: 4rpx solid rgba(255, 255, 255, 1);
    border-radius: 50%;
  }

  .text-group_2 {
    margin: 18rpx 0 18rpx 32rpx;
  }

  .text_2 {
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 36rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    text-align: left;
    white-space: nowrap;
    line-height: 48rpx;
  }

  .text_3 {
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 0.8);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 28rpx;
    margin: 16rpx 21rpx 0 0;
  }

  .text-wrapper_1 {
    background-color: rgba(248, 249, 243, 1);
    border-radius: 34rpx;
    border: 1rpx solid rgba(30, 63, 28, 1);
    margin: 35rpx 0 35rpx auto;
    padding: 4rpx 28rpx 4rpx 28rpx;
  }

  .text_4 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 54rpx;
  }

  .box_15 {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    padding: 14rpx 38rpx 25rpx 41rpx;
    margin: 38rpx 0 0 0;
  }

  .stats-row {
    width: 100%;
  }

  .stat-col {
    flex: 1;
    align-items: center;
  }

  .stat-value-row {
    display: inline-flex;
    position: relative;
    align-items: baseline;
  }

  .stat-plus {
    position: absolute;
    right: -24rpx;
    top: 0;
  }

  .stat-plus-income {
    right: -32rpx;
  }

  .text-wrapper_5 {
    margin: 0 0 0 7rpx;
  }

  .text_5 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 46rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
    line-height: 53rpx;
    margin: 1rpx 0 0 0;
  }

  .text_6 {
    overflow-wrap: break-word;
    color: rgba(245, 63, 63, 1);
    font-size: 22rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 26rpx;
    margin: 0 0 0 -1rpx;
  }

  .text_7 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 46rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
    line-height: 53rpx;
    margin: 1rpx 0 0 0;
  }

  .text_8 {
    overflow-wrap: break-word;
    color: rgba(245, 63, 63, 1);
    font-size: 22rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 26rpx;
    margin: 0 0 0 0;
  }

  .text_9 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 46rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
    line-height: 53rpx;
    margin: 1rpx 0 0 0;
  }

  .text_10 {
    overflow-wrap: break-word;
    color: rgba(245, 63, 63, 1);
    font-size: 22rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 26rpx;
    margin: 0 0 0 0;
  }

  .text-wrapper_6 {
    width: 604rpx;
    margin: 10rpx 3rpx 0 0;
  }

  .text_11,
  .text_12,
  .text_13 {
    overflow-wrap: break-word;
    color: rgba(51, 51, 51, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 37rpx;
  }

  .block_13 {
    padding: 0rpx 32rpx 226rpx 32rpx;
  }

  .list-items_1 {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx;
    width: 100%;
    padding: 24rpx 24rpx 24rpx 24rpx;
    margin: 0 0 24rpx 0;
    box-sizing: border-box;
  }

  .box_17 {
    border-radius: 20rpx;
    width: 210rpx;
    height: 210rpx;
  }

  .section_13 {
    flex: 1;
    min-width: 0;
    margin-left: 24rpx;
  }

  .text_14 {
    height: 80rpx;
    overflow-wrap: break-word;
    color: rgba(29, 33, 41, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    line-height: 40rpx;
  }

  .text-wrapper_7 {
    margin: 10rpx 0 0 0;
  }

  .text_15 {
    overflow-wrap: break-word;
    color: rgba(135, 145, 157, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
    margin: 10rpx 0 0 0;
    max-width: 250rpx;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .text_16 {
    height: 30rpx;
    overflow-wrap: break-word;
    color: rgba(245, 63, 63, 1);
    font-size: 28rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
    line-height: 28rpx;
    margin: 13rpx 0 0 119rpx;
  }

  .text_17 {
    overflow-wrap: break-word;
    color: rgba(245, 63, 63, 1);
    font-size: 38rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 48rpx;
  }

  .group_6 {
    margin: 18rpx 0 0 0;
  }

  .profit-tag {
    background-color: rgba(255, 247, 245, 1);
    border-radius: 10rpx;
    border: 1rpx solid rgba(252, 231, 224, 1);
    padding-left: 25rpx;
    padding-right: 25rpx;
  }

  .text_18 {
    overflow-wrap: break-word;
    color: rgba(248, 99, 6, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
    margin: 11rpx 0 11rpx 0;
  }

  .block_5 {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 10rpx;
    width: 210rpx;
    padding: 9rpx 36rpx 8rpx 36rpx;
  }

  .text_19 {
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 37rpx;
  }

  .box_19 {
    background-color: transparent;
    border-radius: 9rpx;
    align-items: center;
    justify-content: center;
  }

  .box_20 {
    width: 28rpx;
    height: 19rpx;
  }

  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .justify-between {
    display: flex;
    justify-content: space-between;
  }

  .align-center {
    display: flex;
    align-items: center;
  }
</style>
