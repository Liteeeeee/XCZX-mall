<!-- 秒杀商品详情 -->
<template>
  <s-layout :onShareAppMessage="shareInfo" navbar="goods">
    <!-- 标题栏 -->
    <detailNavbar />
    <!-- 骨架屏 -->
    <detailSkeleton v-if="state.skeletonLoading" />
    <!-- 下架/售罄提醒 -->
    <s-empty
      v-else-if="
        state.goodsInfo === null ||
        state.goodsInfo.activity_type !== PromotionActivityTypeEnum.POINT.type
      "
      text="活动不存在或已结束"
      :icon="sheep.$url.static('/static/soldout-empty.webp')"
      showAction
      actionText="再逛逛"
      actionUrl="/pages/index/category"
    />
    <block v-else>
      <view class="detail-swiper-selector">
        <!-- 商品图轮播 -->
        <su-swiper
          class="swiper"
          isPreview
          :list="state.goodsSwiper"
          dotStyle="tag"
          imageMode="widthFix"
          dotCur="bg-mask-40"
          :seizeHeight="750"
        />

        <view
          class="discount-banner"
          :style="{
            backgroundImage: 'url(' + sheep.$url.static('/static/goods/moneyBg.png') + ')',
          }"
        >
          <view class="banner-left ss-flex-col ss-row-between">
            <view class="ss-flex ss-col-bottom">
              <view class="price-value count-font">{{ getShowPrice.point }}</view>
              <view class="price-unit">积分</view>
              <view
                v-if="getShowPrice.price && getShowPrice.price !== '0'"
                class="cash-plus count-font"
                >+¥{{ getShowPrice.price }}</view
              >
            </view>
            <view class="sales-row ss-flex ss-col-center">
              <text v-if="state.goodsInfo.marketPrice" class="origin-price-text"
                >原价￥{{
                  fen2yuan(state.selectedSku.marketPrice || state.goodsInfo.marketPrice)
                }}</text
              >
              <view class="sales-text">
                <text v-if="state.goodsInfo.marketPrice">｜ </text>剩余{{ state.goodsInfo.stock }}
              </view>
            </view>
          </view>
          <view class="banner-right ss-flex-col ss-col-end ss-row-between">
            <view class="brand-name">仙草甄选</view>
            <view class="brand-desc">药食同源·品质保障</view>
          </view>
        </view>

        <!-- 标题 -->
        <view class="title-card detail-card ss-p-y-40 ss-p-x-20">
          <view class="title-text ss-line-2 ss-m-b-6">{{ state.goodsInfo.name || '' }}</view>
          <view class="subtitle-row">
            <view v-if="isMemberOnly" class="member-tag">会员专属</view>
            <view class="subtitle-text ss-line-1">{{ state.goodsInfo.introduction }}</view>
          </view>
        </view>

        <!-- 功能卡片 -->
        <view class="detail-cell-card detail-card ss-flex-col">
          <detail-cell-sku :sku="state.selectedSku" @tap="state.showSelectSku = true" />
        </view>
        <!-- 规格与数量弹框 -->
        <s-select-seckill-sku
          v-model="state.goodsInfo"
          :show="state.showSelectSku"
          :single-limit-count="activity.singleLimitCount"
          @buy="onBuy"
          @change="onSkuChange"
          @close="state.showSelectSku = false"
        />
      </view>

      <!-- 评价 -->
      <detail-comment-card class="detail-comment-selector" :goodsId="state.goodsInfo.id" />
      <!-- 详情 -->
      <detail-content-card class="detail-content-selector" :content="state.goodsInfo.description" />

      <view class="point-sticky">
        <view class="point-sticky-inner">
          <view v-if="needOpenMember" class="exchange-mask" @tap="onNeedMemberTap"></view>
          <button
            class="ss-reset-button exchange-btn"
            @tap="onExchangeTap"
            :disabled="state.goodsInfo.stock === 0 || needOpenMember || pointNotEnough"
          >
            <text v-if="state.goodsInfo.stock === 0">已售罄</text>
            <text v-else-if="needOpenMember">开通会员享受专属兑换</text>
            <text v-else-if="pointNotEnough">积分不足</text>
            <text v-else>立即兑换</text>
          </button>
        </view>
      </view>
    </block>
  </s-layout>
</template>

<script setup>
  import { computed, reactive, ref, unref } from 'vue';
  import { onLoad, onPageScroll } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { isEmpty } from 'lodash-es';
  import { showAuthModal } from '@/sheep/hooks/useModal';
  import { fen2yuan, formatGoodsSwiper } from '@/sheep/hooks/useGoods';
  import detailNavbar from './components/detail/detail-navbar.vue';
  import detailCellSku from './components/detail/detail-cell-sku.vue';
  import detailSkeleton from './components/detail/detail-skeleton.vue';
  import detailCommentCard from './components/detail/detail-comment-card.vue';
  import detailContentCard from './components/detail/detail-content-card.vue';
  import SpuApi from '@/sheep/api/product/spu';
  import { PromotionActivityTypeEnum, SharePageEnum } from '@/sheep/helper/const';
  import PointApi from '@/sheep/api/promotion/point';

  const userInfo = computed(() => sheep.$store('user').userInfo);
  const isLogin = computed(() => sheep.$store('user').isLogin);

  const seckillBg = sheep.$url.css('/static/img/shop/goods/seckill-tip-bg.webp');
  const grouponBg = sheep.$url.css('/static/img/shop/goods/groupon-tip-bg.webp');

  onPageScroll(() => {});
  const state = reactive({
    skeletonLoading: true,
    goodsInfo: {},
    showSelectSku: false,
    goodsSwiper: [],
    selectedSku: {},
    showModel: false,
    total: 0,
    price: '',
  });

  // 规格变更
  function onSkuChange(e) {
    state.selectedSku = e;
  }

  // 立即购买
  function onBuy(sku) {
    sheep.$router.go('/pages/order/confirm', {
      data: JSON.stringify({
        order_type: 'goods',
        buy_type: 'point',
        pointActivityId: activity.value.id,
        items: [
          {
            skuId: sku.id,
            count: sku.count,
          },
        ],
      }),
    });
  }

  // 分享信息
  const shareInfo = computed(() => {
    if (isEmpty(unref(activity))) return {};
    return sheep.$platform.share.getShareInfo(
      {
        title: activity.value.name,
        image: sheep.$url.cdn(state.goodsInfo.picUrl),
        params: {
          page: SharePageEnum.POINT.value,
          query: activity.value.id,
        },
      },
      {
        type: 'goods', // 商品海报
        title: activity.value.name, // 商品标题
        picUrl: sheep.$url.cdn(state.goodsInfo.picUrl), // 商品主图
        image: sheep.$url.cdn(state.goodsInfo.picUrl), // 商品主图
        price: (getShowPrice.value.price || 0) + ` + ${getShowPrice.value.point} 积分`, // 积分价格
        marketPrice: fen2yuan(state.goodsInfo.marketPrice), // 商品原价
      },
    );
  });

  const activity = ref();

  const isMemberOnly = computed(() => {
    const a = unref(activity);
    const v =
      a?.memberOnly ??
      a?.isMemberOnly ??
      a?.member_only ??
      a?.vipOnly ??
      a?.onlyMember ??
      a?.memberExclusive;
    return v === true || v === 1 || v === '1';
  });

  const isVipMember = computed(() => {
    if (!isLogin.value) return false;

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
      !levelName.includes('无会员') &&
      (levelName.includes('黄金') || levelName.includes('铂金') || levelName.includes('钻石'))
    ) {
      return true;
    }
    return false;
  });

  const needOpenMember = computed(() => isMemberOnly.value && !isVipMember.value);

  const userPoint = computed(() => {
    const p = userInfo.value?.point;
    const n = typeof p === 'string' ? Number(p) : typeof p === 'number' ? p : 0;
    return Number.isFinite(n) ? n : 0;
  });

  const needPoint = computed(() => {
    const n = Number(getShowPrice.value?.point || 0);
    return Number.isFinite(n) ? n : 0;
  });

  const pointNotEnough = computed(() => {
    if (!isLogin.value) return false;
    return needPoint.value > userPoint.value;
  });

  function onNeedMemberTap() {
    uni.showToast({ title: '开通会员享受专属兑换', icon: 'none' });
  }

  function onPointNotEnoughTap() {
    uni.showModal({
      title: '积分不足',
      content: '当前积分不足，需要原价购买',
      confirmText: '原价购买',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return;
        if (!state.goodsInfo?.id) return;
        sheep.$router.go('/pages/goods/index', { id: state.goodsInfo.id });
      },
    });
  }

  function onExchangeTap() {
    if (!isLogin.value) {
      showAuthModal();
      return;
    }
    if (needOpenMember.value) {
      onNeedMemberTap();
      return;
    }
    if (pointNotEnough.value) {
      onPointNotEnoughTap();
      return;
    }
    state.showSelectSku = true;
  }

  const getShowPrice = computed(() => {
    if (!isEmpty(state.selectedSku)) {
      const sku = state.selectedSku;
      return {
        point: sku.point,
        price: !sku.pointPrice ? '' : fen2yuan(sku.pointPrice),
      };
    }
    return {
      point: activity.value.point,
      price: !activity.value.price ? '' : fen2yuan(activity.value.price),
    };
  });

  // 查询活动
  const getActivity = async (id) => {
    const { data } = await PointApi.getPointActivity(id);
    if (!data) {
      state.goodsInfo = null;
      state.skeletonLoading = false;
      return;
    }
    activity.value = data;
    // 查询商品
    await getSpu(data.spuId);
  };

  // 查询商品
  const getSpu = async (id) => {
    const { data } = await SpuApi.getSpuDetail(id);
    if (!data) {
      state.goodsInfo = null;
      state.skeletonLoading = false;
      return;
    }
    data.activity_type = PromotionActivityTypeEnum.POINT.type;
    state.goodsInfo = data;
    state.goodsInfo.stock = Math.min(data.stock, activity.value.stock);
    // 处理轮播图
    state.goodsSwiper = formatGoodsSwiper(state.goodsInfo.sliderPicUrls);

    // 价格、库存使用活动的
    data.skus.forEach((sku) => {
      const product = activity.value.products.find((product) => product.skuId === sku.id);
      if (product) {
        sku.point = product.point;
        sku.pointPrice = product.price;
        sku.stock = Math.min(sku.stock, product.stock);
        // 设置限购数量
        sku.limitCount = product.count;
      } else {
        // 找不到可能是没配置
        sku.stock = 0;
      }
    });

    state.skeletonLoading = false;
  };

  onLoad((options) => {
    // 非法参数
    if (!options.id) {
      state.goodsInfo = null;
      state.skeletonLoading = false;
      return;
    }

    // 查询活动
    getActivity(options.id);
  });
</script>

<style lang="scss" scoped>
  .detail-card {
    background-color: $white;
    margin: 14rpx 20rpx;
    border-radius: 10rpx;
    overflow: hidden;
  }

  .swiper {
    margin-bottom: 0;
  }

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
    margin: 0 0 14rpx 0;

    .banner-left {
      justify-content: center;

      .price-unit {
        font-size: 28rpx;
        margin: 0 0 10rpx 8rpx;
        opacity: 0.9;
      }

      .price-value {
        font-size: 56rpx;
        font-weight: bold;
        font-family: OPPOSANS;
      }

      .cash-plus {
        font-size: 32rpx;
        font-weight: bold;
        font-family: OPPOSANS;
        margin: 0 0 10rpx 8rpx;
      }

      .sales-text {
        font-size: 24rpx;
      }

      .sales-row {
        margin-top: 4rpx;
        gap: 12rpx;
      }

      .origin-price-text {
        color: #ffffff;
        font-size: 24rpx;
        white-space: nowrap;
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

  // 价格标题卡片
  .title-card {
    width: 710rpx;
    box-sizing: border-box;
    border-radius: 10rpx;
    background: #ffffff;

    .price-box {
      .point-img {
        width: 36rpx;
        height: 36rpx;
        margin: 0 4rpx;
      }

      .point-text {
        font-size: 42rpx;
        font-weight: 500;
        color: #ff3000;
        line-height: 36rpx;
        font-family: OPPOSANS;
      }

      .price-text {
        font-size: 42rpx;
        font-weight: 500;
        color: #ff3000;
        line-height: 36rpx;
        font-family: OPPOSANS;
      }
    }

    .origin-price-text {
      font-size: 26rpx;
      font-weight: 400;
      text-decoration: line-through;
      color: $gray-c;
      font-family: OPPOSANS;
    }

    .sales-text {
      font-size: 26rpx;
      font-weight: 500;
      color: $gray-c;
    }

    .discounts-box {
      .discounts-tag {
        padding: 4rpx 10rpx;
        font-size: 24rpx;
        font-weight: 500;
        border-radius: 4rpx;
        color: #1e3f1c;
        // background: rgba(#2aae67, 0.05);
        background: var(--ui-BG-Main-tag);
      }

      .discounts-title {
        font-size: 24rpx;
        font-weight: 500;
        color: #1e3f1c;
        line-height: normal;
      }

      .cicon-forward {
        color: #1e3f1c;
        font-size: 24rpx;
        line-height: normal;
        margin-top: 4rpx;
      }
    }

    .title-text {
      font-size: 30rpx;
      font-weight: bold;
      line-height: 42rpx;
    }

    .subtitle-text {
      font-size: 26rpx;
      font-weight: 400;
      color: $dark-9;
      line-height: 42rpx;
      flex: 1;
      min-width: 0;
    }
  }

  .subtitle-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .member-tag {
    width: 109rpx;
    height: 30rpx;
    background: linear-gradient(90deg, #ae806a 0%, #31221d 100%);
    border-radius: 4rpx;
    color: #fff2d9;
    font-size: 22rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 30rpx;
  }

  .point-sticky {
    position: -webkit-sticky;
    position: sticky;
    bottom: 0;
    z-index: 10;
    width: 100%;
    padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0px -6px 10px 0px rgba(51, 51, 51, 0.08);
    box-sizing: border-box;
  }

  .point-sticky-inner {
    position: relative;
  }

  .exchange-mask {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 88rpx;
    z-index: 2;
  }

  .exchange-btn {
    width: 100%;
    height: 88rpx;
    border-radius: 44rpx;
    background: #1e3f1c;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .exchange-btn[disabled] {
    background: #cfd7cf;
    color: #ffffff;
  }

  //秒杀卡片
  .seckill-box {
    background: v-bind(seckillBg) no-repeat;
    background-size: 100% 100%;
  }

  .groupon-box {
    background: v-bind(grouponBg) no-repeat;
    background-size: 100% 100%;
  }

  //活动卡片
  .activity-box {
    width: 100%;
    height: 80rpx;
    box-sizing: border-box;
    margin-bottom: 10rpx;

    .activity-title {
      font-size: 26rpx;
      font-weight: 500;
      color: #ffffff;
      line-height: 42rpx;

      .activity-icon {
        width: 38rpx;
        height: 38rpx;
      }
    }

    .activity-go {
      width: 70rpx;
      height: 32rpx;
      background: #ffffff;
      border-radius: 16rpx;
      font-weight: 500;
      color: #ff6000;
      font-size: 24rpx;
      line-height: normal;
    }
  }

  .model-box {
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
</style>
