<template>
  <!-- 拼团商品规格弹窗 -->
  <su-popup :show="show" round="10" @close="emits('close')">
    <!-- SKU 信息 -->
    <view class="ss-modal-box bg-white ss-flex-col">
      <view class="modal-header ss-flex ss-col-center">
        <view class="header-left ss-m-r-30">
          <image
            class="sku-image"
            :src="sheep.$url.cdn(state.selectedSku.picUrl || goodsInfo.picUrl)"
            mode="aspectFill"
          />
        </view>
        <view class="header-right ss-flex-col ss-row-between ss-flex-1">
          <view class="goods-title ss-line-2">
            <view class="tig ss-flex ss-col-center">
              <view class="tig-icon ss-flex ss-col-center ss-row-center">
                <view class="groupon-tag">
                  <image
                    :src="sheep.$url.static('/static/img/shop/goods/groupon-tag-white.webp')"
                  />
                </view>
              </view>
              <view class="tig-title">拼团价</view>
            </view>
            <view class="info-title">
              {{ goodsInfo.name }}
            </view>
          </view>
          <view class="header-right-bottom ss-flex ss-col-center ss-row-between">
            <view class="price-text">
              {{
                fen2yuan(
                  state.selectedSku.price || goodsInfo.price || state.selectedSku.marketPrice,
                )
              }}</view
            >

            <view class="stock-text ss-m-l-20">
              库存{{ state.selectedSku.stock || goodsInfo.stock }}件
            </view>
          </view>
        </view>
      </view>
      <view class="modal-content ss-flex-1">
        <scroll-view scroll-y="true" class="modal-content-scroll">
          <view class="sku-item ss-m-b-20" v-for="property in propertyList" :key="property.id">
            <view class="label-text ss-m-b-20">{{ property.name }}</view>
            <view class="ss-flex ss-col-center ss-flex-wrap">
              <button
                class="ss-reset-button spec-btn"
                v-for="value in property.values"
                :class="[
                  {
                    'checked-btn': state.currentPropertyArray[property.id] === value.id,
                  },
                  {
                    'disabled-btn': value.disabled === true,
                  },
                ]"
                :key="value.id"
                :disabled="value.disabled === true"
                @tap="onSelectSku(property.id, value.id)"
              >
                {{ value.name }}
              </button>
            </view>
          </view>
          <view class="buy-num-box ss-flex ss-col-center ss-row-between">
            <view class="label-text">购买数量</view>
            <su-number-box
              :min="1"
              :max="state.selectedSku.stock"
              :step="1"
              v-model="state.selectedSku.count"
              @change="onNumberChange($event)"
              activity="groupon"
            />
          </view>
        </scroll-view>
      </view>

      <!-- 操作区 -->
      <view class="modal-footer ss-p-y-20">
        <view class="buy-box ss-flex ss-col-center ss-flex ss-col-center ss-row-center">
          <view class="ss-flex">
            <button class="ss-reset-button origin-price-btn ss-flex-col">
              <view class="btn-title">{{ grouponNum + '人团' }}</view>
            </button>
            <button class="ss-reset-button btn-tox ss-flex-col" @tap="onBuy">
              <view class="btn-price">
                {{
                  fen2yuan(
                    state.selectedSku.price * state.selectedSku.count ||
                      goodsInfo.price * state.selectedSku.count ||
                      state.selectedSku.marketPrice * state.selectedSku.count ||
                      goodsInfo.price,
                  )
                }}
              </view>
              <view v-if="grouponAction === 'create'">立即开团</view>
              <view v-else-if="grouponAction === 'join'">参与拼团</view>
            </button>
          </view>
        </view>
      </view>
    </view>
  </su-popup>
</template>

<script setup>
  import { computed, reactive, watch } from 'vue';
  import sheep from '@/sheep';
  import { convertProductPropertyList, fen2yuan } from '@/sheep/hooks/useGoods';

  const headerBg = sheep.$url.css('/static/img/shop/goods/groupon-btn-long.webp');
  const emits = defineEmits(['change', 'addCart', 'buy', 'close', 'ladder']);
  const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
    goodsInfo: {
      type: Object,
      default() {},
    },
    grouponAction: {
      type: String,
      default: 'create',
    },
    grouponNum: {
      type: [Number, String],
      default: 0,
    },
  });
  const state = reactive({
    selectedSku: {}, // 选中的 SKU
    currentPropertyArray: {}, // 当前选中的属性，实际是个 Map。key 是 property 编号，value 是 value 编号
    grouponNum: props.grouponNum,
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
    if (state.selectedSku.count === e) return;
    state.selectedSku.count = e;
  }

  // 点击购买
  function onBuy() {
    if (!state.selectedSku.id || state.selectedSku.id <= 0) {
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
    sku.count = state.selectedSku.count || 1;
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
  .buy-btn {
    margin: 0 20rpx;
    width: 100%;
    height: 80rpx;
    border-radius: 40rpx;
    background: linear-gradient(90deg, #ff6000, #fe832a);
    color: #fff;
  }
  .btn-tox {
    width: 382rpx;
    height: 80rpx;
    font-size: 24rpx;
    font-weight: 600;
    margin-left: -50rpx;
    background-image: v-bind(headerBg);
    background-repeat: no-repeat;
    background-size: 100% 100%;
    color: #ffffff;
    line-height: normal;
    border-radius: 0px 40rpx 40rpx 0px;

    .btn-price {
      font-family: OPPOSANS;

      &::before {
        content: '￥';
      }
    }
  }
  .origin-price-btn {
    width: 370rpx;
    height: 80rpx;
    background: rgba(#ff5651, 0.1);
    color: #ff6000;
    border-radius: 40rpx 0px 0px 40rpx;
    line-height: normal;
    font-size: 24rpx;
    font-weight: 500;

    .btn-price {
      font-family: OPPOSANS;

      &::before {
        content: '￥';
      }
    }

    .btn-title {
      font-size: 28rpx;
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

      .close-icon {
        position: absolute;
        top: 10rpx;
        right: 20rpx;
        font-size: 46rpx;
        opacity: 0.2;
      }

      .goods-title {
        font-size: 28rpx;
        font-weight: 500;
        line-height: 42rpx;
        position: relative;
        .tig {
          border: 2rpx solid #ff6000;
          border-radius: 4rpx;
          width: 126rpx;
          height: 38rpx;
          position: absolute;
          left: 0;
          top: 0;

          .tig-icon {
            width: 40rpx;
            height: 40rpx;
            background: #ff6000;
            margin-left: -2rpx;
            border-radius: 4rpx 0 0 4rpx;

            .groupon-tag {
              width: 32rpx;
              height: 32rpx;
            }
          }

          .tig-title {
            font-size: 24rpx;
            font-weight: 500;
            line-height: normal;
            color: #ff6000;
            width: 86rpx;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .info-title {
          text-indent: 132rpx;
        }
      }

      .price-text {
        font-size: 50rpx;
        font-weight: 500;
        color: #f53f3f;
        font-family: DINAlternate-Bold;

        &::before {
          content: '￥';
          color: #f53f3f;
          font-size: 24rpx;
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
        }

        .spec-btn {
          height: 60rpx;
          min-width: 100rpx;
          padding: 0 30rpx;
          background: #f4f4f4;
          border-radius: 30rpx;
          color: #434343;
          font-size: 26rpx;
          margin-right: 10rpx;
          margin-bottom: 10rpx;
        }

        .checked-btn {
          background: linear-gradient(90deg, #ff6000, #fe832a);
          font-weight: 500;
          color: #ffffff;
        }

        .disabled-btn {
          font-weight: 400;
          color: #c6c6c6;
          background: #f8f8f8;
        }
      }
    }
  }

  image {
    width: 100%;
    height: 100%;
  }
</style>
