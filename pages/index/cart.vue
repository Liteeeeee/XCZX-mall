<template>
  <s-layout
    :bgStyle="{ color: '#f8f9f3' }"
    tabbar="/pages/index/cart"
    navbar="none"
    title="购物车"
    :navbarStyle="navbarStyle"
  >
    <view class="cart-header ss-flex ss-col-center ss-row-between ss-p-x-30">
      <view class="header-left ss-flex ss-col-center ss-font-32">
        购物车
        <text v-if="state.list.length" class="goods-number ss-flex ss-m-l-10"
          >({{ state.list.length }})</text
        >
      </view>
      <view class="header-right ss-flex ss-col-center" v-if="state.list.length">
        <button class="ss-reset-button" v-show="cart.editMode" @tap.stop="onChangeEditMode(false)">
          完成
        </button>
        <button class="ss-reset-button" v-show="!cart.editMode" @tap.stop="onChangeEditMode(true)">
          管理
        </button>
      </view>
    </view>

    <scroll-view
      v-if="state.list.length === 0"
      scroll-y
      class="empty-scroll"
      :style="{
        paddingTop: (sys_capsule.bottom || 80) + 20 + 'px',
      }"
    >
      <s-empty
        :icon="sheep.$url.static('/static/cart-empty.webp')"
        text="购物车空空如也,快去逛逛吧~"
        paddingTop="160"
      />
      <view v-if="state.recommend.list.length" class="recommend-section">
        <view class="recommend-title-row">
          <view class="recommend-line"></view>
          <text class="recommend-title">为你推荐</text>
          <view class="recommend-line recommend-line-right"></view>
        </view>
        <view class="recommend-grid">
          <view
            v-for="item in state.recommend.list"
            :key="item.id"
            class="recommend-card"
            @tap="onTapRecommend(item)"
          >
            <image class="recommend-img" :src="getRecommendPicUrl(item)" mode="aspectFill" />
            <text class="recommend-name ss-line-1">{{ getRecommendName(item) }}</text>
            <view class="recommend-bottom ss-flex ss-row-between ss-col-center">
              <view class="recommend-price">
                <text class="recommend-price-unit">¥</text>
                <text class="recommend-price-value">{{
                  fen2yuan(getRecommendPriceFen(item))
                }}</text>
              </view>
              <text class="recommend-sold" v-if="getRecommendSalesCount(item) > 0"
                >已售{{ getRecommendSalesCount(item) }}</text
              >
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 头部占位 -->
    <view
      v-if="state.list.length"
      class="cart-box ss-flex ss-flex-col"
      :style="[
        {
          paddingTop: (sys_capsule.bottom || 80) + 20 + 'px',
          paddingLeft: '30rpx',
          paddingRight: '30rpx',
        },
      ]"
    >
      <!-- 会员卡片 -->
      <view v-if="showVipCard" class="ss-m-20 ss-w-100">
        <s-cart-vip-card />
      </view>

      <!-- 内容 -->
      <view class="cart-content ss-flex-1 ss-p-x-30 ss-m-b-40">
        <view v-for="item in state.list" :key="item.id" class="swipe-item-container ss-m-b-14">
          <view class="swipe-action">
            <view
              class="delete-btn ss-flex ss-row-center ss-col-center"
              @tap="onDeleteSingle(item.id)"
            >
              删除
            </view>
          </view>
          <view
            class="goods-box ss-r-10"
            :class="{ 'swipe-active': !state.editMode && state.activeId === item.id }"
            @touchstart="!state.editMode && onTouchStart($event, item.id)"
            @touchend="!state.editMode && onTouchEnd($event, item.id)"
          >
            <view class="ss-flex ss-col-center">
              <view
                class="check-box ss-flex ss-col-center ss-p-l-10"
                @tap="onSelectSingle(item.id)"
              >
                <image
                  class="check-icon"
                  :src="
                    sheep.$url.static(
                      state.selectedIds.includes(item.id)
                        ? '/static/cart/checked.webp'
                        : '/static/cart/unCheck.webp',
                    )
                  "
                  mode="aspectFit"
                />
              </view>
              <view v-if="item.spu?.status !== 1 && !state.editMode" class="down-box">
                该商品已下架
              </view>
              <view
                v-else-if="(item.sku?.stock <= 0 || item.spu?.stock <= 0) && !state.editMode"
                class="down-box"
              >
                该商品无库存
              </view>
              <s-goods-item
                :img="item.spu?.picUrl || item.goods?.image"
                :price="item.sku?.price || 0"
                :title="item.spu?.name"
                :skuText="
                  item.sku?.properties?.map((p) => p.valueName).join(' ') ||
                  item.properties?.map((p) => p.valueName).join(' ') ||
                  ''
                "
                :titleWidth="400"
                priceColor="#FF3000"
                @tapImg="onGoodsDetail(item)"
              >
                <template v-slot:priceSuffix>
                  <text class="price-unit">/盒</text>
                </template>
                <template v-if="!state.editMode" v-slot:tool>
                  <su-number-box
                    v-model="item.count"
                    :max="item.sku?.stock || 0"
                    :min="0"
                    :step="1"
                    @change="onNumberChange($event, item)"
                  />
                </template>
              </s-goods-item>
            </view>
          </view>
        </view>
      </view>

      <view v-if="showRecommend && state.recommend.list.length" class="recommend-section">
        <view class="recommend-title-row">
          <view class="recommend-line"></view>
          <text class="recommend-title">为你推荐</text>
          <view class="recommend-line recommend-line-right"></view>
        </view>
        <view class="recommend-grid">
          <view
            v-for="item in state.recommend.list"
            :key="item.id"
            class="recommend-card"
            @tap="onTapRecommend(item)"
          >
            <image class="recommend-img" :src="getRecommendPicUrl(item)" mode="aspectFill" />
            <text class="recommend-name ss-line-1">{{ getRecommendName(item) }}</text>
            <view class="recommend-bottom ss-flex ss-row-between ss-col-center">
              <view class="recommend-price">
                <text class="recommend-price-unit">¥</text>
                <text class="recommend-price-value">{{
                  fen2yuan(getRecommendPriceFen(item))
                }}</text>
              </view>
              <text class="recommend-sold" v-if="getRecommendSalesCount(item) > 0"
                >已售{{ getRecommendSalesCount(item) }}</text
              >
            </view>
          </view>
        </view>
      </view>
      <!-- 底部 -->
      <su-fixed v-if="state.list.length > 0" :isInset="false" :val="50" bottom placeholder>
        <view class="footer-wrapper">
          <!-- 金额明细弹窗 (相对底部定位) -->
          <view
            v-if="state.showDetailPopup"
            class="detail-popup-mask"
            @tap="state.showDetailPopup = false"
          ></view>
          <view class="detail-popup-container" :class="{ show: state.showDetailPopup }">
            <view class="detail-popup-box">
              <view class="popup-header ss-flex ss-row-center ss-col-center">
                <text class="popup-title">金额明细</text>
                <view
                  class="close-btn ss-flex ss-row-center ss-col-center"
                  @tap="state.showDetailPopup = false"
                >
                  <image
                    class="close-icon"
                    :src="sheep.$url.static('/static/close.webp')"
                    mode="aspectFit"
                  />
                </view>
              </view>
              <view class="popup-content">
                <view class="detail-item ss-flex ss-row-between" v-if="detailTotalPriceFen > 0">
                  <text class="item-label">商品总额</text>
                  <text class="item-value">￥{{ fen2yuan(detailTotalPriceFen) }}</text>
                </view>
                <view class="detail-item ss-flex ss-row-between" v-if="detailCouponPriceFen > 0">
                  <text class="item-label">优惠券</text>
                  <text class="item-value">-￥{{ fen2yuan(detailCouponPriceFen) }}</text>
                </view>
                <view class="detail-item ss-flex ss-row-between" v-if="detailVipPriceFen > 0">
                  <text class="item-label">会员优惠</text>
                  <text class="item-value">-￥{{ fen2yuan(detailVipPriceFen) }}</text>
                </view>
                <view class="detail-item ss-flex ss-row-between" v-if="detailDiscountPriceFen > 0">
                  <text class="item-label">活动优惠</text>
                  <text class="item-value">-￥{{ fen2yuan(detailDiscountPriceFen) }}</text>
                </view>
                <view class="detail-item ss-flex ss-row-between" v-if="detailPointPriceFen > 0">
                  <text class="item-label">积分抵扣</text>
                  <text class="item-value">-￥{{ fen2yuan(detailPointPriceFen) }}</text>
                </view>
                <view class="detail-item ss-flex ss-row-between" v-if="detailDeliveryPriceFen > 0">
                  <text class="item-label">运费</text>
                  <text class="item-value">￥{{ fen2yuan(detailDeliveryPriceFen) }}</text>
                </view>
                <view class="detail-item ss-flex ss-row-between" v-if="detailPayPriceFen > 0">
                  <text class="item-label">应付金额</text>
                  <text class="item-value">￥{{ fen2yuan(detailPayPriceFen) }}</text>
                </view>
                <!-- 底部留白 -->
                <view class="ss-p-b-20"></view>
              </view>
            </view>
          </view>

          <view class="cart-footer ss-flex ss-col-center ss-row-between ss-p-x-30 border-bottom">
            <view class="footer-left ss-flex ss-col-center">
              <view class="check-box ss-flex ss-col-center" @tap="onSelectAll">
                <image
                  class="check-icon"
                  :src="
                    sheep.$url.static(
                      state.isAllSelected
                        ? '/static/cart/checked.webp'
                        : '/static/cart/unCheck.webp',
                    )
                  "
                  mode="aspectFit"
                />
                <view class="ss-m-l-8 ss-font-26"> 全选</view>
              </view>
            </view>
            <view class="footer-center ss-flex-col ss-col-bottom ss-m-r-20" v-if="!state.editMode">
              <view class="ss-flex ss-col-bottom">
                <text class="total-label ss-m-r-10">合计:</text>
                <view class="text-price price-text">
                  {{ fen2yuan(state.totalPriceSelected) }}
                </view>
              </view>
              <view
                class="promo-pill ss-flex ss-col-center"
                v-if="state.totalPriceSelected > 0"
                @tap="openDetailPopup"
              >
                <text class="promo-text">{{ promoText }}</text>
                <text
                  class="cicon-forward ss-m-l-4"
                  style="transform: rotate(90deg); display: inline-block; font-size: 20rpx"
                ></text>
              </view>
            </view>
            <view class="footer-right ss-flex ss-col-center">
              <button
                v-if="state.editMode"
                class="ss-reset-button pay-btn"
                :disabled="state.selectedIds.length === 0"
                @tap="onDelete"
              >
                删除
              </button>
              <button
                v-else
                class="ss-reset-button pay-btn"
                :disabled="state.selectedIds.length === 0"
                @tap="onConfirm"
              >
                去结算
                {{ state.selectedIds?.length ? `(${state.selectedIds.length})` : '' }}
              </button>
            </view>
          </view>
        </view>
      </su-fixed>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onShow } from '@dcloudio/uni-app';
  import SpuApi from '@/sheep/api/product/spu';
  import AppProductApi from '@/sheep/api/app/product';
  import { computed, reactive, watch } from 'vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import { isEmpty } from '@/sheep/helper/utils';
  import OrderApi from '@/sheep/api/trade/order';

  // 隐藏原生tabBar
  uni.hideTabBar({
    fail: () => {},
  });

  const sys_navBar = sheep.$platform.navbar;
  const sys_capsule = sheep.$platform.capsule;
  const cart = sheep.$store('cart');
  const userStore = sheep.$store('user');

  const navbarStyle = computed(() => {
    const homeTemplate = sheep.$store('app').template?.home;
    return (
      homeTemplate?.navigationBar || {
        styleType: 'inner',
        bgColor: 'transparent',
        alwaysShow: true,
      }
    );
  });

  const showVipCard = computed(() => {
    if (!userStore.isLogin) return true;
    const rawLevel = userStore.userInfo?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) return false;
    const rawLevelName = userStore.userInfo?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName.includes('黄金') || levelName.includes('铂金') || levelName.includes('钻石'))
      return false;
    return true;
  });

  const showRecommend = computed(() => Number(state.list.length || 0) <= 2);

  async function loadRecommend() {
    if (state.recommend.loaded) return;
    const { code, data } = await AppProductApi.getRecommendPage({
      pageNo: state.recommend.pageNo,
      pageSize: state.recommend.pageSize,
    });
    if (code !== 0) return;
    const list = Array.isArray(data?.list)
      ? data.list
      : Array.isArray(data?.records)
      ? data.records
      : [];
    state.recommend.list = list;
    state.recommend.total = Number(data?.total ?? data?.totalCount ?? 0);
    state.recommend.loaded = true;
  }

  function getRecommendPicUrl(item) {
    const raw =
      item?.picUrl ||
      item?.skuPicUrl ||
      item?.spuPicUrl ||
      item?.imageUrl ||
      item?.imgUrl ||
      item?.cover ||
      '';
    return sheep.$url.cdn(raw);
  }

  function getRecommendName(item) {
    return item?.name || item?.spuName || item?.title || '';
  }

  function getRecommendPriceFen(item) {
    const raw = item?.price ?? item?.skuPrice ?? item?.spuPrice ?? item?.salePrice ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  function getRecommendSalesCount(item) {
    const raw = item?.salesCount ?? item?.soldCount ?? item?.sales ?? item?.sold ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  const state = reactive({
    editMode: computed(() => cart.editMode),
    list: computed(() => cart.list),
    selectedList: [],
    selectedIds: computed(() => cart.selectedIds),
    isAllSelected: computed(() => cart.isAllSelected),
    recommend: {
      pageNo: 1,
      pageSize: 4,
      list: [],
      total: 0,
      loaded: false,
    },
    totalPriceSelected: computed(() => cart.totalPriceSelected),
    activeId: 0,
    startX: 0,
    showDetailPopup: false,
    settleInfo: null,
    settleKey: '',
    settleLoading: false,
  });

  const selectedItemsKey = computed(() => {
    const ids = Array.isArray(state.selectedIds) ? state.selectedIds : [];
    if (ids.length === 0) return '';
    const selected = Array.isArray(state.list)
      ? state.list.filter((it) => ids.includes(it.id))
      : [];
    const parts = selected
      .map((it) => {
        const cartId = it?.id ?? '';
        const skuId = it?.sku?.id ?? '';
        const count = it?.count ?? '';
        return `${cartId}:${skuId}:${count}`;
      })
      .sort();
    return parts.join('|');
  });

  const settlePrice = computed(() => state.settleInfo?.price || {});
  const detailTotalPriceFen = computed(
    () => Number(settlePrice.value?.totalPrice) || state.totalPriceSelected || 0,
  );
  const detailCouponPriceFen = computed(() => Number(settlePrice.value?.couponPrice) || 0);
  const detailDiscountPriceFen = computed(() => Number(settlePrice.value?.discountPrice) || 0);
  const detailVipPriceFen = computed(() => Number(settlePrice.value?.vipPrice) || 0);
  const detailPointPriceFen = computed(() => Number(settlePrice.value?.pointPrice) || 0);
  const detailDeliveryPriceFen = computed(() => Number(settlePrice.value?.deliveryPrice) || 0);
  const detailPayPriceFen = computed(() => Number(settlePrice.value?.payPrice) || 0);

  const promoDiscountFen = computed(() => {
    return (
      detailCouponPriceFen.value +
      detailDiscountPriceFen.value +
      detailVipPriceFen.value +
      detailPointPriceFen.value
    );
  });

  const promoText = computed(() => {
    if (state.settleLoading) return '优惠计算中';
    if (promoDiscountFen.value > 0) return `共减￥${fen2yuan(promoDiscountFen.value)}`;
    return '暂无优惠';
  });

  function openDetailPopup() {
    state.showDetailPopup = true;
    scheduleSettle(true);
  }

  function buildSettleItems() {
    const ids = Array.isArray(state.selectedIds) ? state.selectedIds : [];
    const selected = Array.isArray(state.list)
      ? state.list.filter((it) => ids.includes(it.id))
      : [];
    return selected
      .map((item) => ({
        skuId: item.sku?.id,
        count: item.count,
        cartId: item.id,
      }))
      .filter((it) => !!it.skuId && Number(it.count) > 0);
  }

  async function refreshSettle() {
    if (!userStore.isLogin) {
      state.settleInfo = null;
      state.settleKey = '';
      state.settleLoading = false;
      return;
    }
    const key = selectedItemsKey.value;
    if (!key) {
      state.settleInfo = null;
      state.settleKey = '';
      state.settleLoading = false;
      return;
    }
    if (state.settleKey === key && state.settleInfo) return;
    const items = buildSettleItems();
    if (items.length === 0) {
      state.settleInfo = null;
      state.settleKey = '';
      state.settleLoading = false;
      return;
    }
    state.settleLoading = true;
    const { code, data } = await OrderApi.settlementOrder(
      {
        items,
        deliveryType: 1,
        pointStatus: false,
      },
      {
        showLoading: false,
        showError: false,
      },
    );
    if (code === 0) {
      state.settleInfo = data;
      state.settleKey = key;
    } else {
      state.settleInfo = null;
      state.settleKey = key;
    }
    state.settleLoading = false;
  }

  let settleTimer = null;
  function scheduleSettle(immediate = false) {
    if (settleTimer) clearTimeout(settleTimer);
    if (immediate) {
      refreshSettle();
      return;
    }
    settleTimer = setTimeout(() => {
      refreshSettle();
    }, 400);
  }

  watch(
    selectedItemsKey,
    () => {
      if (!state.showDetailPopup) {
        scheduleSettle(false);
        return;
      }
      scheduleSettle(false);
    },
    { immediate: true },
  );

  watch(
    () => state.showDetailPopup,
    (v) => {
      if (v) scheduleSettle(true);
    },
  );

  // 滑动开始
  function onTouchStart(e, id) {
    state.startX = e.touches[0].pageX;
  }

  // 滑动结束
  function onTouchEnd(e, id) {
    const endX = e.changedTouches[0].pageX;
    const deltaX = endX - state.startX;
    if (deltaX < -50) {
      state.activeId = id;
    }
    if (deltaX > 50) {
      state.activeId = 0;
    }
  }

  // 单个删除
  function onDeleteSingle(id) {
    uni.showModal({
      title: '提示',
      content: '确定要从购物车删除该商品吗？',
      success: async function (res) {
        if (res.confirm) {
          await cart.delete(id);
          state.activeId = 0;
        }
      },
    });
  }

  // 单选选中
  function onSelectSingle(id) {
    cart.selectSingle(id);
  }

  // 编辑、取消
  function onChangeEditMode(flag) {
    state.activeId = 0;
    cart.onChangeEditMode(flag);
    // #ifdef MP-WEIXIN
    uni.vibrateShort();
    // #endif
  }

  // 全选
  function onSelectAll() {
    cart.selectAll(!state.isAllSelected);
  }

  // 跳转商品详情
  function onGoodsDetail(item) {
    const goodsId = item.spu?.id || item.goods_id;
    if (goodsId) {
      sheep.$router.go('/pages/goods/index', {
        id: goodsId,
      });
    }
  }

  // 跳转推荐商品详情
  function onTapRecommend(item) {
    const goodsId = item.spuId || item.id || item.goods_id;
    if (goodsId) {
      sheep.$router.go('/pages/goods/index', {
        id: goodsId,
      });
    }
  }

  // 结算
  async function onConfirm() {
    const items = [];
    state.selectedList = state.list.filter((item) => state.selectedIds.includes(item.id));
    state.selectedList.map((item) => {
      // 此处前端做出修改
      items.push({
        skuId: item.sku?.id,
        count: item.count,
        cartId: item.id,
        categoryId: item.spu?.categoryId,
      });
    });
    if (isEmpty(items)) {
      sheep.$helper.toast('请先选择商品');
      return;
    }
    await validateDeliveryType(state.selectedList.map((item) => item.spu?.id).filter((id) => !!id));
    sheep.$router.go('/pages/order/confirm', {
      data: JSON.stringify({
        items,
      }),
    });
  }

  /**
   * 校验配送方式冲突
   *
   * @param {string[]} spuIds - 商品ID数组
   * @returns {Promise<void>}
   * @throws {Error} 当配送方式冲突或获取商品信息失败时抛出错误
   */
  async function validateDeliveryType(spuIds) {
    // 获取商品信息
    const { data: spuList } = await SpuApi.getSpuListByIds(spuIds.join(','));
    if (isEmpty(spuList)) {
      sheep.$helper.toast('未找到商品信息');
      throw new Error('未找到商品信息');
    }
    // 获取所有商品的配送方式列表
    const deliveryTypesList = spuList.map((item) => item.deliveryTypes);
    // 检查配送方式冲突
    const hasConflict = checkDeliveryConflicts(deliveryTypesList);
    if (hasConflict) {
      sheep.$helper.toast('选中商品支持的配送方式冲突，不允许提交');
      throw new Error('选中商品支持的配送方式冲突，不允许提交');
    }
  }

  /**
   * 检查配送方式列表中是否存在冲突
   * @description
   * 示例场景:
   * A 商品支持：[快递, 自提]
   * B 商品支持：[快递]
   * C 商品支持：[自提]
   *
   * 对比结果:
   * A 和 B：不冲突 (有交集：快递)
   * A 和 C：不冲突 (有交集：自提)
   * B 和 C：冲突 (无交集)
   * @param {Array<Array<number>>} deliveryTypesList - 配送方式列表的数组
   * @returns {boolean} 是否存在冲突
   */
  function checkDeliveryConflicts(deliveryTypesList) {
    for (let i = 0; i < deliveryTypesList.length - 1; i++) {
      const currentTypes = deliveryTypesList[i];
      for (let j = i + 1; j < deliveryTypesList.length; j++) {
        const nextTypes = deliveryTypesList[j];
        // 检查是否没有交集（即冲突）
        const hasNoIntersection = !currentTypes.some((type) => nextTypes.includes(type));
        if (hasNoIntersection) {
          return true;
        }
      }
    }
    return false;
  }

  function onNumberChange(e, cartItem) {
    if (e === 0) {
      cart.delete(cartItem.id);
      return;
    }
    if (cartItem.count === e) return;
    cartItem.count = e;
    cart.update({
      goods_id: cartItem.id,
      goods_num: e,
    });
  }

  async function onDelete() {
    cart.delete(state.selectedIds);
  }

  function getCartList() {
    cart.getList();
  }

  onShow(() => {
    getCartList();
    if (showRecommend.value) {
      loadRecommend();
    }
  });

  watch(
    () => state.list.length,
    (len) => {
      if (Number(len || 0) <= 2) {
        loadRecommend();
      }
    },
  );
</script>

<style lang="scss" scoped>
  :deep(.ui-fixed) {
    height: 120rpx;
  }

  .empty-scroll {
    height: 100vh;
  }

  .cart-header {
    height: v-bind('sys_capsule.height + "px"');
    width: 100%;
    position: fixed;
    left: 0;
    top: v-bind('sys_capsule.top + "px"');
    z-index: 10000;
    box-sizing: border-box;
    pointer-events: auto;
    padding-right: v-bind(
      'sys_capsule.width + (sheep.$platform.device.windowWidth - sys_capsule.right) + "px"'
    );

    .header-left {
      font-weight: bold;
      color: black;
      font-size: 36rpx;
      pointer-events: none;
    }
    .goods-number {
      color: black;
      font-size: 28rpx;
    }
    .header-right {
      height: 100%;
      display: flex;
      align-items: center;
      pointer-events: auto;

      .ss-reset-button {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28rpx;
        color: rgba(30, 63, 28, 1);
        padding: 0 40rpx;
      }
    }
  }

  .cart-box {
    width: calc(100% - 60rpx);

    .cart-footer {
      height: 120rpx;
      background-color: #fff;
      border-top: 1rpx solid #eee;
      position: relative;
      z-index: 12;

      .footer-left {
        flex-shrink: 0;
      }

      .footer-center {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;

        .total-label {
          font-size: 26rpx;
          color: #333;
          font-weight: 500;
        }

        .price-text {
          font-size: 36rpx;
          color: #ff3000;
          font-weight: bold;
          font-family: DINAlternate-Bold, OPPOSANS;
          line-height: 1;
        }

        .promo-pill {
          margin-top: 8rpx;
          height: 36rpx;
          padding: 0 12rpx;
          background: #fff0f0;
          border-radius: 18rpx;

          .promo-text {
            font-size: 20rpx;
            color: #ff3000;
          }

          .cicon-forward {
            font-size: 16rpx;
            color: #ff3000;
          }
        }
      }

      .footer-right {
        flex-shrink: 0;
        margin-left: 20rpx;
      }

      .check-icon {
        width: 40rpx;
        height: 40rpx;
      }

      .pay-btn {
        width: 196rpx;
        height: 80rpx;
        font-size: 28rpx;
        font-weight: 500;
        border-radius: 40rpx;
        background: rgba(30, 63, 28, 1);
        color: #fff;

        &[disabled] {
          background: #cccccc;
          color: #fff;
          opacity: 0.6;
        }
      }
    }

    .cart-content {
      margin-top: 20rpx;
      position: relative;
      z-index: 10;

      .check-icon {
        width: 40rpx;
        height: 40rpx;
      }

      .swipe-item-container {
        position: relative;
        overflow: hidden;
      }

      .swipe-action {
        position: absolute;
        right: 0;
        top: 0;
        width: 174rpx;
        height: 100%;
        z-index: 1;

        .delete-btn {
          width: 174rpx;
          height: 100%;
          background: rgba(30, 63, 28, 1);
          color: #fff;
          font-size: 28rpx;
          border-radius: 0 14rpx 14rpx 0;
        }
      }

      .goods-box {
        background-color: #fff;
        position: relative;
        z-index: 2;
        transition: transform 0.3s ease;
        padding: 30rpx 20rpx;
        border-radius: 13rpx;

        &.swipe-active {
          transform: translateX(-174rpx);
        }

        :deep(.ss-order-card-warp) {
          background-color: transparent !important;
          padding: 0 !important;
          margin-bottom: 0 !important;
          flex: 1;
        }

        .check-box {
          padding-right: 20rpx;
        }

        .check-icon {
          width: 40rpx;
          height: 40rpx;
        }

        .order-img {
          width: 180rpx;
          height: 180rpx;
          border-radius: 10rpx;
        }

        .title-text {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
        }

        .spec-btn {
          background: #f8f8f8;
          border-radius: 4rpx;
          padding: 0 12rpx;
          height: 40rpx;

          .spec-text {
            font-size: 22rpx;
            color: #999;
          }

          .cicon-unfold {
            font-size: 18rpx;
            color: #999;
          }
        }

        .price-text {
          font-size: 32rpx;
          font-weight: bold;
          font-family: DINAlternate-Bold, OPPOSANS;
        }

        .price-unit {
          font-size: 22rpx;
          color: #999;
          margin-left: 6rpx;
        }

        :deep(.uni-numbox) {
          .cicon-move-round,
          .cicon-add-round {
            font-size: 40rpx;
            color: #e0e0e0;
          }

          .uni-numbox__value {
            width: 70rpx;
            font-size: 26rpx;
            background-color: transparent !important;
          }
        }
      }
      // 下架商品
      .down-box {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(#fff, 0.8);
        z-index: 2;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #999;
        font-size: 32rpx;
      }
    }
  }

  .footer-wrapper {
    position: relative;
    width: 100%;
  }

  /* 明细弹窗样式 (附着在底部栏上方) */
  .detail-popup-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10;
  }

  .detail-popup-container {
    position: absolute;
    bottom: 100rpx; /* 位于 cart-footer 上方 */
    left: 0;
    right: 0;
    z-index: 11;
    transform: translateY(100%);
    opacity: 0;
    transition: all 0.3s ease-out;
    pointer-events: none;

    &.show {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
  }

  .detail-popup-box {
    background: #ffffff;
    border-radius: 20rpx 20rpx 0 0;
    padding: 0 30rpx 40rpx;
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);

    .popup-header {
      height: 100rpx;
      position: relative;

      .popup-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }

      .close-btn {
        position: absolute;
        right: 0;
        width: 40rpx;
        height: 40rpx;
        background: #f5f5f5;
        border-radius: 50%;
        .close-icon {
          width: 40rpx;
          height: 40rpx;
        }
      }
    }

    .popup-content {
      padding-top: 20rpx;

      .detail-item {
        margin-bottom: 30rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .item-label {
          font-size: 28rpx;
          color: #333333;
        }

        .item-value {
          font-size: 28rpx;
          color: #333333;
          font-weight: 500;
          font-family: DINAlternate-Bold, OPPOSANS;
        }
      }
    }
  }

  .recommend-section {
    align-self: center;
    margin-top: 42rpx;
    padding-bottom: 30rpx;
    padding-right: 30rpx;
    padding-left: 30rpx;
  }

  .recommend-title-row {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20rpx 0;
  }

  .recommend-line {
    width: 48rpx;
    height: 1rpx;
    border: 2rpx solid rgba(61, 61, 60, 1);
    box-sizing: border-box;
  }

  .recommend-line-right {
    margin-left: 14rpx;
  }

  .recommend-title {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 45rpx;
    margin-left: 15rpx;
    margin-right: 0;
  }

  .recommend-grid {
    width: 686rpx;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .recommend-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 10rpx;
    padding-bottom: 19rpx;
    width: 331rpx;
    margin-bottom: 20rpx;
  }

  .recommend-img {
    border-radius: 10rpx 10rpx 0 0;
    width: 331rpx;
    height: 331rpx;
  }

  .recommend-name {
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
    margin: 19rpx 27rpx 0 24rpx;
  }

  .recommend-bottom {
    width: 284rpx;
    margin: 22rpx 23rpx 0 24rpx;
  }

  .recommend-price {
    height: 32rpx;
    line-height: 32rpx;
    display: flex;
    align-items: flex-end;
  }

  .recommend-price-unit {
    color: rgba(245, 63, 63, 1);
    font-size: 28rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    line-height: 32rpx;
  }

  .recommend-price-value {
    color: rgba(245, 63, 63, 1);
    font-size: 40rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    line-height: 32rpx;
  }

  .recommend-sold {
    color: rgba(157, 156, 150, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
  }
</style>
