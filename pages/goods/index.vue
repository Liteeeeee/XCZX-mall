<template>
  <view>
    <s-layout :onShareAppMessage="shareInfo" navbar="goods">
      <!-- 标题栏 -->
      <detailNavbar />

      <!-- 骨架屏 -->
      <detailSkeleton v-if="state.skeletonLoading" />
      <!-- 下架/售罄提醒 -->
      <s-empty
        v-else-if="state.goodsInfo === null"
        text="商品不存在或已下架"
        :icon="sheep.$url.static('/static/soldout-empty.webp')"
        showAction
        actionText="再逛逛"
        actionUrl="/pages/goods/list"
      />
      <block :style="{ backgroundColor: '#F8F9F3' }" v-else>
        <view class="detail-swiper-selector">
          <!-- 商品轮播图  -->
          <su-swiper
            class="ss-m-b-0"
            isPreview
            :list="formatGoodsSwiper(state.goodsInfo.sliderPicUrls)"
            dotStyle="tag"
            imageMode="aspectFill"
            dotCur="bg-mask-40"
            :seizeHeight="750"
          />
          <!-- 价格与销量（浮在轮播底部） -->
          <view
            class="discount-banner"
            :style="{
              backgroundImage: 'url(' + sheep.$url.static('/static/goods/moneyBg.png') + ')',
            }"
          >
            <view class="banner-left ss-flex-col ss-row-between">
              <view class="ss-flex ss-col-bottom">
                <view class="price-unit">￥</view>
                <view class="price-value count-font">{{
                  fen2yuan(state.selectedSku.price || state.goodsInfo.price)
                }}</view>
                <!-- 会员价标签 -->
                <view class="group_51 ss-flex ss-row-between ss-col-center">
                  <text class="text_66"
                    >¥{{
                      fen2yuan((state.selectedSku.price || state.goodsInfo.price) * vipDiscount)
                    }}</text
                  >
                  <view class="text-wrapper_21 ss-flex-col ss-row-center ss-col-center">
                    <text class="text_67">会员价</text>
                  </view>
                </view>
              </view>
              <view class="sales-text">
                {{ formatSales('exact', state.goodsInfo.salesCount) }}
              </view>
            </view>
            <view class="banner-right ss-flex-col ss-col-end ss-row-between">
              <view class="brand-name">仙草甄选</view>
              <view class="brand-desc">药食同源·品质保障</view>
            </view>
          </view>
        </view>

        <!-- 价格+标题 -->
        <view class="title-card detail-card ss-p-y-30 ss-p-x-20">
          <view
            v-if="!isVipOpened"
            class="vip-card ss-flex ss-row-between ss-col-center ss-m-b-20 ss-p-x-20"
            :style="{
              backgroundImage: 'url(' + sheep.$url.static('/static/vipBg.png') + ')',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }"
            @tap="sheep.$router.go('/pages/index/member')"
          >
            <view class="vip-left ss-flex ss-col-center">
              <image
                class="vip-icon"
                :src="sheep.$url.static('/static/vipIcon.png')"
                mode="aspectFit"
              />
              <view class="vip-text"
                >开通黄金会员享折<text :style="{ color: 'red' }">9</text>优惠哦~</view
              >
            </view>
            <view class="vip-right ss-flex ss-col-center">
              <view class="vip-btn">立即开通</view>
            </view>
          </view>

          <view class="title-text ss-line-2 ss-m-b-16">{{ state.goodsInfo.name }}</view>
          <view class="subtitle-text ss-line-2">{{ state.goodsInfo.introduction }}</view>
        </view>

        <!-- VIP 卡片 -->

        <!-- 功能卡片 -->
        <view class="detail-card ss-flex-col">
          <!-- 积分 -->
          <view class="info-cell ss-flex ss-col-center ss-p-20">
            <view class="label">积分</view>
            <view class="value ss-flex-1 ss-flex ss-col-center">
              <text class="tag ss-m-r-10">赠送积分</text>
              <text>购买本商品最少可获得100积分</text>
            </view>
          </view>
          <!-- 服务 -->
          <view class="info-cell ss-flex ss-col-center ss-p-20">
            <view class="label">服务</view>
            <view class="value ss-flex-1 ss-flex ss-col-center">
              <view class="service-item ss-flex ss-col-center">极速配送</view>
              <view class="service-dot">·</view>
              <view class="service-item ss-flex ss-col-center">退换无忧</view>
              <view class="service-dot">·</view>
              <view class="service-item ss-flex ss-col-center">假一赔十</view>
            </view>
            <text class="cicon-forward"></text>
          </view>
        </view>

        <!-- 仙草检测 Banner -->
        <view :style="{ padding: '20rpx', background: '#FFFFFA' }">
          <view
            class="quality-check-banner"
            :style="{
              backgroundImage: 'url(' + sheep.$url.static('/static/goods/reportBg.webp') + ')',
            }"
          >
            <!-- 暂时使用一个占位图或者静态结构 -->
            <view class="check-box ss-flex ss-row-between ss-col-center ss-p-20">
              <view class="check-left">
                <view class="check-title ss-flex ss-col-center">
                  <text class="check-name">仙草检测</text>
                  <text class="check-tag">真实透明</text>
                </view>
                <view class="check-desc">
                  本地质检由第三方平台权威检测，检测报告与实物不符，承诺假一赔十，平台先行赔付。
                </view>
                <view class="check-result ss-flex ss-row-between ss-col-center">
                  <view class="check-result-left">
                    <view class="check-result-title">通过308项农残检测</view>
                    <view class="check-result-date">2026.03.12</view>
                  </view>
                  <view class="check-result-right">
                    <image
                      class="check-report-img"
                      :src="sheep.$url.static('/static/goods/report.webp')"
                      mode="heightFix"
                    />
                  </view>
                </view>
              </view> </view
          ></view>
        </view>

        <!-- 详情 -->
        <detail-content-card class="detail-content-selector" :content="parsedDescription" />

        <!-- 活动跳转：拼团/秒杀/砍价活动 -->
        <detail-activity-tip
          v-if="state.activityList.length > 0"
          :activity-list="state.activityList"
        />

        <!-- 详情 tabbar -->
        <detail-tabbar v-model="state.goodsInfo">
          <view class="buy-box ss-flex ss-col-center ss-p-r-20" v-if="state.goodsInfo.stock > 0">
            <button class="ss-reset-button add-btn" @tap="onAddCart"> 加入购物车 </button>
            <button class="ss-reset-button buy-btn" @tap="onBuy"> 立即购买 </button>
          </view>
          <view class="buy-box ss-flex ss-col-center ss-p-r-20" v-else>
            <button class="ss-reset-button disabled-btn" disabled> 已售罄 </button>
          </view>
        </detail-tabbar>

        <!-- 满减送/限时折扣活动弹窗 -->
        <s-activity-pop
          v-model="state"
          :show="state.showActivityModel"
          @close="state.showActivityModel = false"
          @get="onTakeCoupon"
        />
      </block>

      <!-- 返回顶部按钮 -->
      <view class="back-top-btn" v-if="state.showBackTop" @tap="onBackTop">
        <image :src="sheep.$url.static('/static/goods/top.webp')" mode="aspectFill" />
      </view>
    </s-layout>
  </view>
</template>

<script setup>
  import { reactive, computed } from 'vue';
  import { onLoad, onPageScroll } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import CouponApi from '@/sheep/api/promotion/coupon';
  import ActivityApi from '@/sheep/api/promotion/activity';
  import FavoriteApi from '@/sheep/api/product/favorite';
  import RewardActivityApi from '@/sheep/api/promotion/rewardActivity';
  import { formatSales, formatGoodsSwiper, fen2yuan } from '@/sheep/hooks/useGoods';
  import detailNavbar from './components/detail/detail-navbar.vue';
  import detailTabbar from './components/detail/detail-tabbar.vue';
  import detailSkeleton from './components/detail/detail-skeleton.vue';
  import detailContentCard from './components/detail/detail-content-card.vue';
  import detailActivityTip from './components/detail/detail-activity-tip.vue';
  import { isEmpty } from 'lodash-es';
  import SpuApi from '@/sheep/api/product/spu';

  onPageScroll((e) => {
    state.showBackTop = e.scrollTop > 200;
  });

  function onBackTop() {
    uni.pageScrollTo({
      scrollTop: 0,
      duration: 300,
    });
  }

  import OrderApi from '@/sheep/api/trade/order';
  import { SharePageEnum } from '@/sheep/helper/const';

  const isLogin = computed(() => sheep.$store('user').isLogin);
  const userInfo = computed(() => sheep.$store('user').userInfo);

  // 判断用户是否已开通会员
  const isVipOpened = computed(() => {
    const rawLevel = userInfo.value?.level;
    const levelValue =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      levelValue === null || levelValue === undefined || levelValue === ''
        ? null
        : Number(levelValue);

    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) return true;

    const rawLevelName = userInfo.value?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (
      levelName &&
      (levelName.includes('黄金') || levelName.includes('铂金') || levelName.includes('钻石'))
    ) {
      return true;
    }

    return false;
  });

  // 获取当前会员折扣（未开通或普通用户默认为 0.95，即展示给未开通用户的黄金会员价）
  const vipDiscount = computed(() => {
    const rawLevel = userInfo.value?.level;
    const levelValue =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      levelValue === null || levelValue === undefined || levelValue === ''
        ? null
        : Number(levelValue);

    // 如果开通了会员，根据会员等级名称或级别进行折扣判断
    const rawLevelName = userInfo.value?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';

    if (normalizedLevel === 3 || levelName.includes('钻石')) return 0.85;
    if (normalizedLevel === 2 || levelName.includes('铂金')) return 0.9;
    if (normalizedLevel === 1 || levelName.includes('黄金')) return 0.95;

    // 如果没有开通或者是普通用户，则依然显示最低门槛（黄金）的会员价（0.95），以吸引开通
    return 0.95;
  });

  let state = reactive({
    goodsId: 0,
    skeletonLoading: true, // SPU 加载中
    goodsInfo: {}, // SPU 信息
    selectedSku: {}, // 选中的 SKU
    settlementSku: {}, // 结算的 SKU：由于 selectedSku 不进行默认选中，所以初始使用结算价格最低的 SKU 作为基础展示
    showModel: false, // 是否展示 Coupon 优惠劵的弹窗
    couponInfo: [], // 可领取的 Coupon 优惠劵的列表
    showActivityModel: false, // 【满减送/限时折扣】是否展示 Activity 营销活动的弹窗
    rewardActivity: {}, // 【满减送】活动
    activityList: [], // 【秒杀/拼团/砍价】可参与的 Activity 营销活动的列表
    showBackTop: false,
  });

  // 处理富文本图片（对大图追加阿里云OSS的压缩/自适应参数，避免真机OOM）
  const parsedDescription = computed(() => {
    let html = state.goodsInfo.description || '';
    if (!html) return html;

    // 使用正则匹配出 img 的 src 并追加 OSS 参数，同时将 http 强制升级为 https
    html = html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
      let newSrc = src;
      // 1. 强制升级 http 为 https
      if (newSrc.startsWith('http://')) {
        newSrc = newSrc.replace('http://', 'https://');
      }

      // 2. 追加 OSS 参数
      if (newSrc.includes('aliyuncs.com') && newSrc.indexOf('x-oss-process') === -1) {
        const sep = newSrc.includes('?') ? '&' : '?';
        newSrc = `${newSrc}${sep}x-oss-process=image/resize,w_750,m_lfit/quality,q_90`;
      }

      if (newSrc !== src) {
        return match.replace(src, newSrc);
      }
      return match;
    });
    return html;
  });

  // 添加购物车
  function onAddCart() {
    const sku =
      state.goodsInfo?.skus?.find((item) => item.stock > 0) || state.goodsInfo?.skus?.[0] || {};
    if (!sku.id) {
      sheep.$helper.toast('商品暂不可购买');
      return;
    }
    sheep.$store('cart').add({
      id: sku.id,
      goods_num: 1,
    });
  }

  // 立即购买
  function onBuy() {
    const sku =
      state.goodsInfo?.skus?.find((item) => item.stock > 0) || state.goodsInfo?.skus?.[0] || {};
    if (!sku.id) {
      sheep.$helper.toast('商品暂不可购买');
      return;
    }
    sheep.$router.go('/pages/order/confirm', {
      data: JSON.stringify({
        items: [
          {
            skuId: sku.id,
            count: 1,
            categoryId: state.goodsInfo.categoryId,
          },
        ],
      }),
    });
  }

  // 立即领取优惠劵
  async function onTakeCoupon(id) {
    const { code } = await CouponApi.takeCoupon(id);
    if (code !== 0) {
      return;
    }
    uni.showToast({
      title: '领取成功',
    });
    setTimeout(() => {
      getCoupon();
    }, 1000);
  }

  const shareInfo = computed(() => {
    if (isEmpty(state.goodsInfo)) return {};
    return sheep.$platform.share.getShareInfo(
      {
        title: state.goodsInfo.name,
        image: sheep.$url.cdn(state.goodsInfo.picUrl),
        desc: state.goodsInfo.introduction,
        params: {
          page: SharePageEnum.GOODS.value,
          query: state.goodsInfo.id,
        },
      },
      {
        type: 'goods', // 商品海报
        title: state.goodsInfo.name, // 商品名称
        picUrl: sheep.$url.cdn(state.goodsInfo.picUrl), // 商品主图
        image: sheep.$url.cdn(state.goodsInfo.picUrl), // 商品主图
        price: fen2yuan(state.goodsInfo.price), // 商品价格
        original_price: fen2yuan(state.goodsInfo.marketPrice), // 商品原价
      },
    );
  });

  async function getCoupon() {
    const { code, data } = await CouponApi.getCouponTemplateList(state.goodsId, 2, 10);
    if (code === 0) {
      state.couponInfo = data;
    }
  }

  async function getSettlementByIds(ids) {
    let { data, code } = await OrderApi.getSettlementProduct(ids);
    if (code !== 0 || data.length !== 1) {
      return;
    }
    data = data[0];

    // 补充 SKU 的价格信息
    state.goodsInfo.skus.forEach((sku) => {
      data.skus.forEach((item) => {
        if (sku.id === item.id) {
          sku.promotionType = item.promotionType;
          sku.promotionPrice = item.promotionPrice;
          sku.promotionId = item.promotionId;
          sku.promotionEndTime = item.promotionEndTime;
        }
      });
    });

    // 选择有 promotionPrice 且最小的
    state.settlementSku = state.goodsInfo.skus
      .filter((sku) => sku.stock > 0 && sku.promotionPrice > 0)
      .reduce((prev, curr) => (prev.promotionPrice < curr.promotionPrice ? prev : curr), []);

    // 设置满减送活动
    if (data.rewardActivity) {
      state.rewardActivity = data.rewardActivity;
      //获取活动时间
      getActivityTime(state.rewardActivity.id);
    }
  }

  //获取活动时间
  async function getActivityTime(id) {
    const { code, data } = await RewardActivityApi.getRewardActivity(id);
    if (code === 0) {
      // console.log('获取到的活动 数据', data)
      state.rewardActivity.startTime = data.startTime;
      state.rewardActivity.endTime = data.endTime;
    }
  }

  onLoad((options) => {
    // 非法参数
    if (!options.id) {
      state.goodsInfo = null;
      state.skeletonLoading = false;
      return;
    }
    state.goodsId = options.id;
    // 1. 加载商品信息
    SpuApi.getSpuDetail(state.goodsId).then((res) => {
      if (res.code !== 0 || !res.data) {
        state.goodsInfo = null;
        state.skeletonLoading = false;
        return;
      }
      // 加载到商品
      state.skeletonLoading = false;
      state.goodsInfo = res.data;
      // 获取结算信息
      getSettlementByIds(state.goodsId);
      // 加载是否收藏
      if (isLogin.value) {
        FavoriteApi.isFavoriteExists(state.goodsId, 'goods').then((res) => {
          if (res.code !== 0) {
            return;
          }
          state.goodsInfo.favorite = res.data;
        });
      }
    });

    // 2. 加载优惠劵信息
    getCoupon();

    // 3. 加载营销活动信息
    ActivityApi.getActivityListBySpuId(state.goodsId).then((res) => {
      if (res.code !== 0) {
        return;
      }
      state.activityList = res.data;
    });
  });
</script>

<style lang="scss" scoped>
  .back-top-btn {
    position: fixed;
    right: 20rpx;
    bottom: 200rpx;
    z-index: 99;
    width: 72rpx;
    height: 72rpx;

    image {
      width: 100%;
      height: 100%;
    }
  }

  .detail-card {
    background-color: #fffffa;
    margin-bottom: 20rpx;
    overflow: hidden;
  }

  .detail-swiper-selector {
    position: relative;
  }

  // 轮播图指示器样式
  :deep(.ui-swiper-dot.tag) {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 20rpx;
    padding: 0;
    bottom: 20rpx;
    right: 30rpx;
    color: #fff;
    font-size: 24rpx;
  }

  // 折扣横幅
  .discount-banner {
    width: 100%;
    height: 152rpx;
    box-sizing: border-box;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    display: flex;
    justify-content: space-between;
    padding: 0 30rpx;
    color: #fff;

    .banner-left {
      justify-content: center;
      .price-unit {
        font-size: 32rpx;
        margin-bottom: 8rpx;
      }
      .price-value {
        font-size: 56rpx;
        font-weight: bold;
        font-family: OPPOSANS;
      }
      .group_51 {
        background-color: rgba(251, 233, 192, 1);
        border-radius: 8rpx;
        min-width: 148rpx;
        padding-left: 10rpx;
        margin-left: 14rpx;
        margin-bottom: 12rpx;
      }
      .text_66 {
        overflow-wrap: break-word;
        color: rgba(82, 67, 62, 1);
        font-size: 24rpx;
        font-family: DINAlternate-Bold;
        font-weight: 700;
        text-align: center;
        white-space: nowrap;
        margin-right: 8rpx;
        flex: 1;
      }
      .text-wrapper_21 {
        background-image: linear-gradient(
          90deg,
          rgba(174, 128, 106, 1) 0,
          rgba(48, 33, 28, 1) 100%
        );
        border-radius: 16rpx 8rpx 8rpx 0px;
        padding: 4rpx 10rpx;
      }
      .text_67 {
        overflow-wrap: break-word;
        color: rgba(255, 242, 217, 1);
        font-size: 20rpx;
        font-family: PingFangSC-Medium;
        font-weight: 500;
        text-align: left;
        white-space: nowrap;
        line-height: 28rpx;
      }
      .sales-text {
        font-size: 24rpx;
        margin-top: 4rpx;
      }
    }

    .banner-right {
      justify-content: space-between;
      padding: 21rpx;
      .brand-name {
        font-size: 40rpx;
        font-weight: bold;
        text-align: right;
      }
      .brand-desc {
        font-size: 24rpx;
        opacity: 0.8;
        text-align: right;
        margin-top: 4rpx;
      }
    }
  }

  // 会员卡片
  .vip-card {
    height: 80rpx;
    background-color: #f3f9f7;
    border-radius: 16rpx;
    color: #333;
    overflow: hidden;

    .vip-icon {
      width: 66rpx;
      height: 30rpx;
      margin-right: 16rpx;
    }
    .vip-text {
      font-size: 24rpx;
      color: #333;
    }
    .vip-btn {
      font-size: 24rpx;
      color: #fff;
      background-image: linear-gradient(270deg, rgba(17, 107, 106, 1) 0, rgba(48, 155, 75, 1) 100%);
      padding: 6rpx 20rpx;
      border-radius: 30rpx;
    }
  }

  // 价格标题卡片
  .title-card {
    .price-box {
      .price-text {
        font-size: 48rpx;
        font-weight: bold;
        color: #ff3000;
        font-family: OPPOSANS;

        &::before {
          content: '￥';
          font-size: 32rpx;
        }
      }

      .origin-price-text {
        font-size: 26rpx;
        text-decoration: line-through;
        color: #999;
        margin-left: 12rpx;
        font-family: OPPOSANS;

        &::before {
          content: '￥';
        }
      }
    }

    .sales-text {
      font-size: 24rpx;
      color: #999;
    }

    .title-text {
      font-size: 34rpx;
      font-weight: bold;
      line-height: 1.4;
      color: #333;
    }

    .subtitle-text {
      font-size: 26rpx;
      color: #87919d;
      line-height: 1.5;
    }
  }

  // 功能单元格
  .info-cell {
    border-bottom: 1rpx solid #f5f5f5;
    &:last-child {
      border-bottom: none;
    }
    .label {
      width: 100rpx;
      font-size: 26rpx;
      color: #999;
    }
    .value {
      font-size: 26rpx;
      color: #333;
      .tag {
        background: #e6f7f2;
        color: #28b389;
        padding: 2rpx 12rpx;
        border-radius: 4rpx;
        font-size: 22rpx;
      }
      .service-item {
        color: #333;
        font-size: 24rpx;
      }
      .service-dot {
        color: #999;
        font-size: 24rpx;
        margin: 0 10rpx;
      }
    }
    .spec-preview-item {
      .spec-val {
        font-size: 26rpx;
        font-weight: 400;
        color: #333;
      }
      .spec-label {
        font-size: 22rpx;
        color: #999;
        margin-top: 4rpx;
      }
    }
    .cicon-forward {
      color: #ccc;
      font-size: 24rpx;
    }
  }

  // 检测 Banner
  .quality-check-banner {
    // background: #f0f9f7;
    background-size: cover;
    background-repeat: no-repeat;
    border-radius: 20rpx;
    overflow: hidden;
    .check-title {
      margin-bottom: 12rpx;
      .check-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #fff;
      }
      .check-tag {
        background: linear-gradient(127deg, #f5ebd9 0%, #ffd6ad 100%);
        color: #855422;
        font-size: 20rpx;
        padding: 2rpx 10rpx;
        border-radius: 10rpx 10rpx 10rpx 0rpx;
        margin-left: 12rpx;
      }
    }
    .check-desc {
      font-size: 20rpx;
      color: #fff;
      line-height: 1.4;
      margin-bottom: 16rpx;
    }
    .check-result {
      background-color: #f8f9f3;
      border-radius: 10rpx;
      overflow: hidden;
      padding: 20rpx;
      .check-result-title {
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 8rpx;
      }
      .check-result-date {
        font-size: 24rpx;
        color: #1a9c75;
      }
      .check-report-img {
        width: 140rpx;
        height: 140rpx;
        margin-right: -20rpx;
        margin-bottom: -30rpx;
      }
    }
  }

  // 购买
  .buy-box {
    padding: 20rpx;
    flex: 1;
    justify-content: flex-end;
    .add-btn {
      width: 220rpx;
      height: 80rpx;
      font-weight: bold;
      font-size: 28rpx;
      border-radius: 10rpx 0 0 10rpx;
      background-color: #f8f9f3;
      color: #1e3f1c;
      border: 2rpx solid #1e3f1c;
    }

    .buy-btn {
      width: 220rpx;
      height: 80rpx;
      font-weight: bold;
      font-size: 28rpx;
      border-radius: 0rpx 10rpx 10rpx 0rpx;
      background: #1e3f1c;
      color: #fff;
    }

    .disabled-btn {
      flex: 1;
      height: 80rpx;
      border-radius: 40rpx;
      background: #999999;
      color: $white;
    }
  }

  .model-box {
    height: 60vh;

    .model-content {
      height: 56vh;
    }

    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333333;
    }

    .subtitle {
      font-size: 26rpx;
      font-weight: 500;
      color: #333333;
    }
  }

  // 限时折扣
  .discount {
    width: 750rpx;
    height: 100rpx;
    // background-color: red;
    overflow: hidden;
    position: relative;
  }

  .disImg {
    width: 750rpx;
    height: 100rpx;
    position: absolute;
    top: 0;
    z-index: -1;
  }

  .discountCont {
    width: 680rpx;
    height: 90rpx;
    margin: 10rpx auto 0 auto;
    // background-color: gold;
  }

  .disContT {
    width: 680rpx;
    height: 50rpx;
    display: flex;
    justify-content: space-between;
  }

  .disContT1 {
    width: 400rpx;
    height: 50rpx;
    // background-color: green;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .disContT2 {
    width: 200rpx;
    height: 50rpx;
    line-height: 50rpx;
    // background-color: gold;
    font-size: 30rpx;
    text-align: end;
    color: white;
    font-weight: bolder;
    font-style: oblique 20deg;
    letter-spacing: 0.1rem;
  }

  .disContT1P {
    color: white;
    font-weight: bold;
    font-size: 28rpx;
  }

  .disContT1End {
    // width: 180rpx;
    padding: 0 10rpx;
    height: 30rpx;
    line-height: 28rpx;
    text-align: center;
    font-weight: bold;
    background-color: white;
    color: #ff3000;
    font-size: 23rpx;
    border-radius: 20rpx;
    margin-left: 10rpx;
  }

  .disContB {
    width: 680rpx;
    height: 40rpx;
    display: flex;
    justify-content: space-between;
    font-size: 20rpx;
    color: white;
    align-items: center;
  }

  .disContB1 {
    width: 300rpx;
    height: 40rpx;
    line-height: 40rpx;
  }

  .disContB2 {
    width: 300rpx;
    height: 40rpx;
    line-height: 40rpx;
    display: flex;
    justify-content: flex-end;
  }
</style>
