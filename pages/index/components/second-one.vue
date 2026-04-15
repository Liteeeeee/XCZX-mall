<template>
  <view class="goods-item-box">
    <view v-for="item in list" :key="item.id" class="group_49 flex-col" @tap="onItemTap(item)">
      <image class="box_51 flex-col" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFill" />
      <text class="paragraph_1">
        {{ item.name }}
      </text>
      <view class="section_30 flex-row justify-between">
        <view class="text-wrapper_8">
          <text class="text_28">¥</text>
          <text class="text_29">{{ priceText(item) }}</text>
        </view>
        <text class="text_30" v-if="soldText(item)">{{ soldText(item) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed } from 'vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

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

  const priceText = (item) => {
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
    width: 245rpx;
    margin-bottom: 24rpx;
  }

  .box_51 {
    border-radius: 10px 10px 0px 0px;
    width: 245rpx;
    height: 245rpx;
  }

  .paragraph_1 {
    width: 216rpx;
    height: 66rpx;
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 24rpx;
    font-weight: normal;
    text-align: left;
    line-height: 33rpx;
    margin: 11rpx 14rpx 0 15rpx;
  }

  .section_30 {
    width: 211rpx;
    margin: 24rpx 14rpx 0 20rpx;
  }

  .text-wrapper_8 {
    width: 78rpx;
    height: 32rpx;
    overflow-wrap: break-word;
    font-size: 0;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 32rpx;
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

  .text_30 {
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 22rpx;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 30rpx;
    margin-top: 2rpx;
  }
</style>
