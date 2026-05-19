<template>
  <!-- 规格弹窗 -->
  <su-popup :show="show" round="10" @close="emits('close')">
    <!-- SKU 信息 -->
    <view class="ss-modal-box bg-white ss-flex-col">
      <view class="modal-header ss-flex ss-col-center">
        <view class="header-left ss-m-r-30">
          <image
            class="sku-image"
            :src="state.selectedSku.picUrl || goodsInfo.picUrl"
            mode="aspectFill"
          />
        </view>
        <view class="header-right ss-flex-col ss-row-between ss-flex-1">
          <view class="goods-title ss-line-2">{{ goodsInfo.name }}</view>
          <view class="header-right-bottom ss-flex ss-col-center ss-row-between">
            <view class="ss-flex">
              <view class="price-text">
                {{
                  fen2yuan(
                    state.selectedSku.promotionPrice || state.selectedSku.price || goodsInfo.price,
                  )
                }}
                <text v-if="state.selectedSku.promotionType > 0">
                  <text class="iconBox" v-if="state.selectedSku.promotionType === 4">
                    限时优惠
                  </text>
                  <text class="iconBox" v-else-if="state.selectedSku.promotionType === 6">
                    会员价
                  </text>
                  <text class="origin-price-text">
                    {{ fen2yuan(state.selectedSku.price) }}
                  </text>
                </text>
              </view>
            </view>
            <!-- <view class="stock-text ss-m-l-20">
              {{ formatStock('exact', state.selectedSku.stock || goodsInfo.stock) }}
            </view> -->
          </view>
        </view>
        <image
          class="close-btn"
          src="https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/close.webp"
          mode="aspectFit"
          @tap.stop="emits('close')"
        />
      </view>

      <!-- 属性选择 -->
      <view class="modal-content ss-flex-1">
        <scroll-view scroll-y="true" class="modal-content-scroll" @touchmove.stop>
          <view class="sku-item ss-m-b-20" v-for="property in propertyList" :key="property.id">
            <view class="label-text ss-m-b-20">{{ property.name }}</view>
            <view class="ss-flex ss-col-center ss-flex-wrap">
              <view
                class="spec-btn ss-flex ss-row-center ss-col-center"
                v-for="value in property.values"
                :class="[
                  {
                    'spec-btn-selected': state.currentPropertyArray[property.id] === value.id,
                  },
                  {
                    'disabled-btn': value.disabled === true,
                  },
                ]"
                :key="value.id"
                @tap="value.disabled !== true && onSelectSku(property.id, value.id)"
              >
                <text class="spec-btn-text">{{ value.name }}</text>
              </view>
            </view>
          </view>
          <view class="buy-num-box ss-flex ss-col-center ss-row-between ss-m-b-40">
            <view class="label-text">购买数量</view>
            <su-number-box
              :min="1"
              :max="state.selectedSku.stock"
              :step="1"
              v-model="state.selectedSku.goods_num"
              @change="onNumberChange($event)"
            />
          </view>
        </scroll-view>
      </view>

      <!-- 操作区 -->
      <view class="modal-footer border-top">
        <view
          class="buy-box ss-flex ss-col-center ss-flex ss-col-center ss-row-center"
          :class="isSingleAction ? 'buy-box-single' : ''"
        >
          <button
            v-if="showAddButton"
            class="ss-reset-button"
            :class="showBuyButton ? 'add-btn' : 'add-btn-single'"
            @tap="onAddCart"
          >
            加入购物车
          </button>
          <button
            v-if="showBuyButton"
            class="ss-reset-button"
            :class="showAddButton ? 'buy-btn' : 'buy-btn-single'"
            @tap="onBuy"
          >
            立即购买
          </button>
        </view>
      </view>
    </view>
  </su-popup>
</template>

<script setup>
  import { computed, reactive, watch } from 'vue';
  import sheep from '@/sheep';
  import { formatStock, convertProductPropertyList, fen2yuan } from '@/sheep/hooks/useGoods';

  const emits = defineEmits(['change', 'addCart', 'buy', 'close']);
  const props = defineProps({
    goodsInfo: {
      type: Object,
      default() {},
    },
    show: {
      type: Boolean,
      default: false,
    },
    action: {
      type: String,
      default: 'both',
    },
  });

  const state = reactive({
    selectedSku: {}, // 选中的 SKU
    currentPropertyArray: {}, // 当前选中的属性，实际是个 Map。key 是 property 编号，value 是 value 编号
  });

  const propertyList = convertProductPropertyList(props.goodsInfo.skus);
  // SKU 列表
  const skuList = computed(() => {
    let skuPrices = props.goodsInfo.skus;
    for (let price of skuPrices) {
      price.value_id_array = price.properties.map((item) => item.valueId);
    }
    return skuPrices;
  });

  watch(
    () => state.selectedSku,
    (newVal) => {
      emits('change', newVal);
    },
    {
      immediate: true, // 立即执行
      deep: true, // 深度监听
    },
  );

  // 输入框改变数量
  function onNumberChange(e) {
    if (e === 0) return;
    if (state.selectedSku.goods_num === e) return;
    state.selectedSku.goods_num = e;
  }

  const showAddButton = computed(() => props.action !== 'buy');
  const showBuyButton = computed(() => props.action !== 'addCart');
  const isSingleAction = computed(() => showAddButton.value !== showBuyButton.value);

  // 加入购物车
  function onAddCart() {
    if (state.selectedSku.id <= 0) {
      sheep.$helper.toast('请选择规格');
      return;
    }
    if (state.selectedSku.stock <= 0) {
      sheep.$helper.toast('库存不足');
      return;
    }

    emits('addCart', state.selectedSku);
  }

  // 立即购买
  function onBuy() {
    if (state.selectedSku.id <= 0) {
      sheep.$helper.toast('请选择规格');
      return;
    }
    if (state.selectedSku.stock <= 0) {
      sheep.$helper.toast('库存不足');
      return;
    }
    emits('buy', state.selectedSku);
  }

  // 改变禁用状态：计算每个 property 属性值的按钮，是否禁用
  function refreshDisabled() {
    const propertyIds = propertyList.map((p) => p.id);
    propertyList.forEach((property) => {
      const otherSelectedValueIds = propertyIds
        .filter((pid) => pid !== property.id)
        .map((pid) => state.currentPropertyArray[pid])
        .filter((vid) => vid !== undefined && String(vid) !== '');
      (property.values || []).forEach((value) => {
        const requiredValueIds = [...otherSelectedValueIds, value.id];
        const ok = (skuList.value || []).some((sku) => {
          if (Number(sku?.stock || 0) <= 0) return false;
          const ids = sku.value_id_array || [];
          return requiredValueIds.every((id) => ids.indexOf(id) >= 0);
        });
        value.disabled = !ok;
      });
    });
  }

  function refreshSelectedSku() {
    const selectedValueIds = propertyList
      .map((p) => state.currentPropertyArray[p.id])
      .filter((vid) => vid !== undefined && String(vid) !== '');
    if (selectedValueIds.length !== propertyList.length) {
      state.selectedSku = {};
      return;
    }
    const sku = (skuList.value || []).find((it) => {
      if (Number(it?.stock || 0) <= 0) return false;
      const ids = it.value_id_array || [];
      return selectedValueIds.every((id) => ids.indexOf(id) >= 0);
    });
    if (!sku) {
      state.selectedSku = {};
      return;
    }
    sku.goods_num = state.selectedSku.goods_num || 1;
    state.selectedSku = sku;
  }

  // 选择规格
  function onSelectSku(propertyId, valueId) {
    if (
      state.currentPropertyArray[propertyId] !== undefined &&
      state.currentPropertyArray[propertyId] === valueId
    ) {
      return;
    }
    state.currentPropertyArray[propertyId] = valueId;
    refreshDisabled();
    refreshSelectedSku();
  }

  refreshDisabled();
  function autoSelectFirstInStockSku() {
    const firstSku = (skuList.value || []).find((sku) => Number(sku?.stock || 0) > 0);
    const properties = firstSku?.properties;
    if (!Array.isArray(properties) || properties.length === 0) return;
    properties.forEach((p) => {
      if (p?.propertyId && p?.valueId) {
        onSelectSku(p.propertyId, p.valueId);
      }
    });
  }
  autoSelectFirstInStockSku();
</script>

<style lang="scss" scoped>
  // 购买
  .buy-box {
    padding: 10rpx 0;

    &.buy-box-single {
      padding: 10rpx 20rpx;
    }

    .single-btn {
      width: 100%;
      border-radius: 10rpx;
    }

    .add-btn {
      width: 356rpx;
      height: 80rpx;
      border-radius: 40rpx 0 0 40rpx;
      background-color: #f8f9f3;
      color: #1e3f1c;
      border: 2rpx solid #1e3f1c;
    }
    .add-btn-single {
      width: 100%;
      height: 80rpx;
      border-radius: 40rpx;
      background-color: #f8f9f3;
      color: #1e3f1c;
      border: 2rpx solid #1e3f1c;
    }
    .buy-btn-single {
      width: 100%;
      height: 80rpx;
      border-radius: 40rpx;
      background: #1e3f1c;
      color: #fff;
    }
    .buy-btn {
      width: 356rpx;
      height: 80rpx;
      border-radius: 0 40rpx 40rpx 0;
      background: #1e3f1c;
      color: #fff;
    }

    .score-btn {
      width: 100%;
      margin: 0 20rpx;
      height: 80rpx;
      border-radius: 40rpx;
      background: linear-gradient(90deg, #1e3f1c, var(--ui-BG-Main-gradient));
      color: #fff;
    }
  }

  .ss-modal-box {
    border-radius: 30rpx 30rpx 0 0;
    max-height: 1000rpx;

    .modal-header {
      position: relative;
      padding: 80rpx 20rpx 40rpx;

      .sku-image {
        width: 160rpx;
        height: 160rpx;
        border-radius: 10rpx;
      }

      .header-right {
        height: 160rpx;
      }

      .close-btn {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        width: 40rpx;
        height: 40rpx;
      }

      .goods-title {
        font-size: 28rpx;
        font-weight: 500;
        line-height: 42rpx;
      }

      .score-img {
        width: 36rpx;
        height: 36rpx;
        margin: 0 4rpx;
      }

      .score-text {
        font-size: 30rpx;
        font-weight: 500;
        color: $red;
        font-family: OPPOSANS;
      }

      .price-text {
        font-size: 50rpx;
        font-weight: bold;
        color: #f53f3f;
        font-family: DINAlternate-Bold;

        &::before {
          content: '￥';
          font-size: 30rpx;
          font-weight: 500;
          color: #f53f3f;
        }
      }

      .stock-text {
        font-size: 26rpx;
        color: #999999;
      }
    }

    .modal-content {
      padding: 0 20rpx;

      .modal-content-scroll {
        max-height: 600rpx;

        .label-text {
          font-size: 26rpx;
          font-weight: 500;
        }

        .buy-num-box {
          height: 100rpx;
          padding-right: 40rpx;
          box-sizing: border-box;
        }

        .spec-btn {
          min-width: 100rpx;
          padding: 13rpx 34rpx 11rpx 34rpx;
          background: rgba(242, 242, 242, 1);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 250, 1);
          color: rgba(0, 0, 0, 1);
          margin-right: 20rpx;
          margin-bottom: 20rpx;

          .spec-btn-text {
            overflow-wrap: break-word;
            font-size: 30rpx;
            font-weight: normal;
            text-align: left;
            white-space: nowrap;
            line-height: 42rpx;
            color: inherit;
          }
        }

        .spec-btn-selected {
          background: rgba(8, 141, 62, 0.05) !important;
          border: 1px solid rgba(30, 63, 28, 1) !important;
          color: rgba(30, 63, 28, 1) !important;
        }

        .disabled-btn {
          font-weight: 400;
          color: #c6c6c6 !important;
          background: #f8f8f8 !important;
          border-color: #eeeeee !important;
          opacity: 0.5;
        }
      }
    }
  }

  .iconBox {
    width: fit-content;
    height: fit-content;
    padding: 2rpx 10rpx;
    background-color: rgb(255, 242, 241);
    color: #ff2621;
    font-size: 24rpx;
    margin-left: 5rpx;
  }

  .origin-price-text {
    font-size: 26rpx;
    font-weight: 400;
    text-decoration: line-through;
    color: $gray-c;
    font-family: OPPOSANS;

    &::before {
      content: '￥';
    }
  }
</style>
