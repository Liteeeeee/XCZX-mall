<template>
  <s-layout
    :bgStyle="{ color: '#f8f9f3' }"
    tabbar="/pages/index/cart"
    navbar="none"
    title="购物车"
    :navbarStyle="navbarStyle"
  >
    <s-empty
      v-if="state.list.length === 0"
      icon="/static/cart-empty.png"
      text="购物车空空如也,快去逛逛吧~"
    />

    <!-- 头部占位 -->
    <view
      v-if="state.list.length"
      class="cart-box ss-flex ss-flex-col"
      :style="[{ paddingTop: (sys_capsule.bottom || 80) + 20 + 'px',paddingLeft: '30rpx' ,paddingRight: '30rpx' }]"
    >
      <view class="cart-header ss-flex ss-col-center ss-row-between ss-p-x-30">
        <view class="header-left ss-flex ss-col-center ss-font-32">
          购物车
          <text class="goods-number ss-flex ss-m-l-10">({{ state.list.length }})</text>
        </view>
        <view class="header-right ss-flex ss-col-center">
          <button
            class="ss-reset-button"
            v-show="cart.editMode"
            @tap.stop="onChangeEditMode(false)"
          >
            完成
          </button>
          <button
            class="ss-reset-button"
            v-show="!cart.editMode"
            @tap.stop="onChangeEditMode(true)"
          >
            管理
          </button>
        </view>
      </view>

      <!-- 会员卡片 -->
      <view class="ss-m-20 ss-w-100">
        <s-vip-card />
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
                        ? '/static/cart/checked.png'
                        : '/static/cart/unCheck.png',
                    )
                  "
                  mode="aspectFit"
                />
              </view>
              <view v-if="item.spu?.status !== 1 && !state.editMode" class="down-box">
                该商品已下架
              </view>
              <view v-else-if="(item.sku?.stock <= 0 || item.spu?.stock <= 0) && !state.editMode" class="down-box">
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
      <!-- 底部 -->
      <su-fixed v-if="state.list.length > 0" :isInset="false" :val="50" bottom placeholder>
        <view class="cart-footer ss-flex ss-col-center ss-row-between ss-p-x-30 border-bottom">
          <view class="footer-left ss-flex ss-col-center">
            <view class="check-box ss-flex ss-col-center" @tap="onSelectAll">
              <image
                class="check-icon"
                :src="
                  sheep.$url.static(
                    state.isAllSelected ? '/static/cart/checked.png' : '/static/cart/unCheck.png',
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
            <view class="promo-pill ss-flex ss-col-center" v-if="state.totalPriceSelected > 0">
              <text class="promo-text">共减¥36.2</text>
              <text class="cicon-forward ss-m-l-4"></text>
            </view>
          </view>
          <view class="footer-right ss-flex ss-col-center">
            <button v-if="state.editMode" class="ss-reset-button pay-btn" @tap="onDelete">
              删除
            </button>
            <button v-else class="ss-reset-button pay-btn" @tap="onConfirm">
              去结算
              {{ state.selectedIds?.length ? `(${state.selectedIds.length})` : '' }}
            </button>
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
  import { computed, reactive } from 'vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import { isEmpty } from '@/sheep/helper/utils';

  // 隐藏原生tabBar
  uni.hideTabBar({
    fail: () => {},
  });

  const sys_navBar = sheep.$platform.navbar;
  const sys_capsule = sheep.$platform.capsule;
  const cart = sheep.$store('cart');

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

  const state = reactive({
    editMode: computed(() => cart.editMode),
    list: computed(() => cart.list),
    selectedList: [],
    selectedIds: computed(() => cart.selectedIds),
    isAllSelected: computed(() => cart.isAllSelected),
    totalPriceSelected: computed(() => cart.totalPriceSelected),
    activeId: 0,
    startX: 0,
  });

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
  });
</script>

<style lang="scss" scoped>
  :deep(.ui-fixed) {
    height: 120rpx;
  }

  .cart-box {
    width: calc(100% - 60rpx);

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
        color: rgba(30, 63, 28, 1);
        font-size: 36rpx;
        pointer-events: none;
      }
      .goods-number {
        color: rgba(30, 63, 28, 1);
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

    .cart-footer {
      height: 120rpx;
      background-color: #fff;
      border-top: 1rpx solid #eee;

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
          font-family: OPPOSANS;
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
          font-family: OPPOSANS;
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
</style>
