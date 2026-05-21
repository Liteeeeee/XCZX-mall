<template>
  <view class="goods-item-box">
    <view v-for="item in list" :key="item.id" class="group_49 flex-col" @tap="onItemTap(item)">
      <image class="box_51 flex-col" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFill" />
      <text class="paragraph_1">
        {{ item.name }}
      </text>
      <text class="paragraph_2">{{ item.introduction }}</text>
      <view class="section_30 flex-row justify-between">
        <view class="price-sold flex-col">
          <view class="text-wrapper_8">
            <text class="text_28">¥</text>
            <text class="text_29">{{ priceText(item) }}</text>
            <image
              class="vip-price-icon"
              :src="sheep.$url.cdn('/mp/static/vipPrice.png')"
              mode="aspectFit"
            />
          </view>
          <view class="sold-row ss-flex">
            <text class="origin-price" v-if="originPriceText(item)"
              >¥{{ originPriceText(item) }}</text
            >
            <text class="text_30" v-if="soldText(item)">{{ soldText(item) }}</text>
          </view>
        </view>
        <view class="add-cart-btn ss-flex" @tap.stop="onAddCart(item)">
          <image
            class="add-cart-icon"
            :src="sheep.$url.cdn('/mp/static/add.webp')"
            mode="aspectFit"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed } from 'vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import SpuApi from '@/sheep/api/product/spu';

  const props = defineProps({
    data: {
      type: Object,
      default: () => ({}),
    },
    activeMenu: [Number, String],
    pagination: {
      type: Object,
      default: undefined,
    },
  });

  const list = computed(() => {
    if (Array.isArray(props.pagination?.list)) return props.pagination.list;
    const active = Number(props.activeMenu || 0);
    const raw = props.data?.[active]?.children;
    return Array.isArray(raw) ? raw : [];
  });

  const userInfo = computed(() => sheep.$store('user').userInfo);

  const vipDiscount = computed(() => {
    const rawLevel = userInfo.value?.level;
    const levelValue =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      levelValue === null || levelValue === undefined || levelValue === ''
        ? null
        : Number(levelValue);

    const rawLevelName = userInfo.value?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';

    if (normalizedLevel === 3 || levelName.includes('钻石')) return 0.85;
    if (normalizedLevel === 2 || levelName.includes('铂金')) return 0.9;
    if (normalizedLevel === 1 || levelName.includes('黄金')) return 0.95;

    return 0.95;
  });

  const priceText = (item) => {
    const raw = item?.price;
    if (raw === undefined || raw === null || raw === '') return '';
    const n = Number(raw);
    if (!Number.isFinite(n)) return '';
    const discountedFen = Math.floor(n * Number(vipDiscount.value || 1));
    const text = fen2yuan(discountedFen);
    const parts = String(text).split('.');
    if (parts.length !== 2) return text;
    if (parts[1] !== '00') return `${parts[0]}.99`;
    return text;
  };

  const originPriceText = (item) => {
    const raw = item?.price;
    if (raw === undefined || raw === null || raw === '') return '';
    return fen2yuan(raw);
  };

  const soldText = (item) => {
    const raw = item?.salesCount;
    const n = Number(raw);
    if (!Number.isFinite(n)) return '';
    return `已售${n}`;
  };

  const onItemTap = (item) => {
    if (item?.price !== undefined && item?.price !== null) {
      sheep.$router.go('/pages/goods/index', { id: item.id });
      return;
    }
    sheep.$router.go('/pages/goods/list', { categoryId: item.id });
  };

  async function onAddCart(item) {
    if (item?.price === undefined || item?.price === null) {
      return;
    }
    const { code, data } = await SpuApi.getSpuDetail(item.id);
    if (code !== 0) {
      return;
    }
    const skus = Array.isArray(data?.skus) ? data.skus : [];
    const sku = skus.find((it) => Number(it?.stock || 0) > 0) || skus[0] || {};
    if (!sku?.id) {
      sheep.$helper.toast('商品暂不可购买');
      return;
    }
    if (Number(sku.stock || 0) <= 0) {
      sheep.$helper.toast('库存不足');
      return;
    }
    sheep.$store('cart').add({
      id: sku.id,
      goods_num: 1,
    });
    sheep.$helper.toast('已加入购物车');
  }
</script>

<style lang="scss" scoped>
  .goods-item-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .group_49 {
    background-color: rgba(248, 249, 243, 1);
    border-radius: 10px;
    padding-bottom: 27rpx;
    width: 266rpx;
    margin-bottom: 24rpx;
  }

  .box_51 {
    border-radius: 10px 10px 0px 0px;
    width: 266rpx;
    height: 245rpx;
  }

  .paragraph_1 {
    width: 256rpx;
    min-height: 66rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    color: rgba(0, 0, 0, 1);
    font-size: 24rpx;
    font-weight: normal;
    text-align: left;
    line-height: 33rpx;
    margin: 11rpx 14rpx 0 15rpx;
  }

  .section_30 {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    flex-wrap: nowrap;
    width: 100%;
    margin: 4rpx 0 0;
    padding: 0 14rpx 0 20rpx;
    box-sizing: border-box;
    align-items: center;
  }

  .price-sold {
    flex: 1;
    min-width: 0;
  }

  .text-wrapper_8 {
    width: auto;
    height: 32rpx;
    overflow-wrap: break-word;
    font-size: 0;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 32rpx;
    min-width: 0;
  }

  .vip-price-icon {
    width: 56rpx;
    height: 30rpx;
    margin-left: 0rpx;
  }

  .text_28 {
    overflow-wrap: break-word;
    color: rgba(245, 63, 63, 1);
    font-size: 28rpx !important;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 32rpx;
  }

  .text_29 {
    overflow-wrap: break-word;
    color: rgba(245, 63, 63, 1);
    font-size: 40rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 32rpx;
  }

  .sold-row {
    align-items: center;
    min-height: 22rpx;
    margin-top: 12rpx;
  }

  .origin-price {
    flex-shrink: 0;
    color: rgba(157, 156, 150, 1);
    font-size: 22rpx;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 22rpx;
    text-decoration: line-through;
    text-decoration-color: rgba(157, 156, 150, 1);
    margin-right: 10rpx;
  }

  .text_30 {
    flex-shrink: 0;
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 22rpx;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 22rpx;
  }

  .add-cart-btn {
    flex-shrink: 0;
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    justify-content: center;
    align-items: center;
  }

  .add-cart-icon {
    width: 44rpx;
    height: 44rpx;
  }
  .paragraph_2 {
    font-size: 24rpx;
    color: #9d9c96;
    margin: 11rpx 14rpx 0 15rpx;
    width: 256rpx;
    min-height: 66rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    line-height: 33rpx;
  }
</style>
