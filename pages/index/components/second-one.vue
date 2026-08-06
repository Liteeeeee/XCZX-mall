<template>
  <scroll-view
    v-if="scrollable"
    class="goods-item-scroll"
    scroll-y
    :show-scrollbar="false"
    :scroll-with-animation="scrollWithAnimation"
    :scroll-into-view="scrollIntoView"
    :scroll-top="scrollTop"
    :style="scrollViewStyle"
    :lower-threshold="lowerThreshold"
    @scroll="emit('scroll', $event)"
    @scrolltolower="emit('scrolltolower')"
    @touchmove="emit('touchmove', $event)"
    @touchend="emit('touchend', $event)"
  >
    <view :style="{ paddingTop: topPadding + 'px' }">
      <view style="position: relative">
        <view :id="topAnchorId" class="scroll-top-anchor"></view>
        <!-- Prepend Container (Absolute, bottom aligned, grows upwards) -->
        <view
          class="prepend-container"
          v-if="prependList && prependList.length"
          style="
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          "
        >
          <view class="goods-item-box">
            <template
              v-for="(item, idx) in prependList"
              :key="item.__streamKey || item.id || 'p_item_' + idx"
            >
              <view
                v-if="item._type === '__CAT_DIVIDER__'"
                class="cat-divider-marker"
                :id="item.__streamKey || 'dm_' + (item.id || idx)"
                :data-stream-id="item.__streamKey || item.id"
                :data-cat-idx="String(item._$catIdx ?? '')"
                :data-category-id="String(item.categoryId ?? '')"
                data-item-kind="divider"
              >
                <view class="group_60 flex-row">
                  <view class="section_26 flex-col"></view>
                  <text class="text_27">{{ item.name || '' }}</text>
                  <view class="section_27 flex-col"></view>
                </view>
                <image
                  v-if="item.bannerPicUrl"
                  class="divider-banner-img"
                  :src="sheep.$url.cdn(item.bannerPicUrl)"
                  mode="widthFix"
                />
              </view>
              <view
                v-else
                class="group_49 flex-col"
                :id="item.__streamKey || 'gi_' + (item.id || idx)"
                @tap="onItemTap(item)"
                :data-cat-idx="String(item._$catIdx ?? '')"
                :data-category-id="String(item.categoryId ?? '')"
                data-item-kind="goods"
              >
                <image
                  class="box_51 flex-col"
                  :src="sheep.$url.cdn(item.picUrl)"
                  mode="aspectFill"
                />
                <text class="paragraph_1">{{ item.name }}</text>
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
            </template>
          </view>
        </view>

        <!-- Main Container (Normal flow, goes downwards) -->
        <view class="goods-item-box">
          <template
            v-for="(item, idx) in mainList"
            :key="item.__streamKey || item.id || 'm_item_' + idx"
          >
            <view
              v-if="item._type === '__CAT_DIVIDER__'"
              class="cat-divider-marker"
              :id="item.__streamKey || 'dm_' + (item.id || idx)"
              :data-stream-id="item.__streamKey || item.id"
              :data-cat-idx="String(item._$catIdx ?? '')"
              :data-category-id="String(item.categoryId ?? '')"
              data-item-kind="divider"
            >
              <view class="group_60 flex-row">
                <view class="section_26 flex-col"></view>
                <text class="text_27">{{ item.name || '' }}</text>
                <view class="section_27 flex-col"></view>
              </view>
              <image
                v-if="item.bannerPicUrl"
                class="divider-banner-img"
                :src="sheep.$url.cdn(item.bannerPicUrl)"
                mode="widthFix"
              />
            </view>
            <view
              v-else
              class="group_49 flex-col"
              :id="item.__streamKey || 'gi_' + (item.id || idx)"
              @tap="onItemTap(item)"
              :data-cat-idx="String(item._$catIdx ?? '')"
              :data-category-id="String(item.categoryId ?? '')"
              data-item-kind="goods"
            >
              <image class="box_51 flex-col" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFill" />
              <text class="paragraph_1">{{ item.name }}</text>
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
          </template>
        </view>
      </view>
    </view>
    <slot />
  </scroll-view>
  <view v-else class="goods-item-box">
    <template v-for="(item, idx) in list" :key="item.__streamKey || item.id || 'item_' + idx">
      <!-- Marker：分类分界（吸顶标题块，与原 category 顶部 group_60 样式对齐） -->
      <view
        v-if="item._type === '__CAT_DIVIDER__'"
        class="cat-divider-marker"
        :id="item.__streamKey || 'dm_' + (item.id || idx)"
        :data-stream-id="item.__streamKey || item.id"
        :data-cat-idx="String(item._$catIdx ?? '')"
        :data-category-id="String(item.categoryId ?? '')"
        data-item-kind="divider"
      >
        <view class="group_60 flex-row">
          <view class="section_26 flex-col"></view>
          <text class="text_27">{{ item.name || '' }}</text>
          <view class="section_27 flex-col"></view>
        </view>
        <image
          v-if="item.bannerPicUrl"
          class="divider-banner-img"
          :src="sheep.$url.cdn(item.bannerPicUrl)"
          mode="widthFix"
        />
      </view>
      <!-- 商品卡片 -->
      <view
        v-else
        class="group_49 flex-col"
        :id="item.__streamKey || 'gi_' + (item.id || idx)"
        @tap="onItemTap(item)"
        :data-cat-idx="String(item._$catIdx ?? '')"
        :data-category-id="String(item.categoryId ?? '')"
        data-item-kind="goods"
      >
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
    </template>
    <slot />
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, getCurrentInstance } from 'vue';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import SpuApi from '@/sheep/api/product/spu';

  const instance = getCurrentInstance();

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
    scrollable: {
      type: Boolean,
      default: false,
    },
    scrollHeight: {
      type: [Number, String],
      default: '',
    },
    scrollIntoView: {
      type: String,
      default: '',
    },
    scrollTop: {
      type: Number,
      default: undefined,
    },
    scrollWithAnimation: {
      type: Boolean,
      default: true,
    },
    lowerThreshold: {
      type: Number,
      default: 50,
    },
    topAnchorId: {
      type: String,
      default: 'right-scroll-top-anchor',
    },
    topPadding: {
      type: Number,
      default: 0,
    },
  });

  const emit = defineEmits(['scroll', 'scrolltolower', 'touchmove', 'touchend']);

  const prependList = computed(() => {
    if (Array.isArray(props.pagination?.prependList)) return props.pagination.prependList;
    return [];
  });

  const mainList = computed(() => {
    if (Array.isArray(props.pagination?.mainList)) return props.pagination.mainList;
    const active = Number(props.activeMenu || 0);
    const raw = props.data?.[active]?.children;
    return Array.isArray(raw) ? raw : [];
  });

  const scrollViewStyle = computed(() => {
    if (
      props.scrollHeight === '' ||
      props.scrollHeight === null ||
      props.scrollHeight === undefined
    ) {
      return undefined;
    }
    const height =
      typeof props.scrollHeight === 'number' ? `${props.scrollHeight}px` : props.scrollHeight;
    return { height };
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
    sheep.$router.go('/pages/index/category', { categoryId: item.id });
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

  const queryTopItem = () => {
    return new Promise((resolve) => {
      try {
        const q = uni.createSelectorQuery().in(instance);
        if (!q || typeof q.select !== 'function') return resolve(null);
        q.select('.goods-item-scroll').boundingClientRect();
        q.selectAll('.cat-divider-marker, .group_49').fields({ rect: true, dataset: true });
        q.exec((rets) => {
          try {
            if (!Array.isArray(rets) || rets.length < 2) return resolve(null);
            const box = rets[0] || {};
            const boxTop = Number(box.top || 0);
            const boxHeight = Number(box.height || 0);
            if (boxHeight <= 0) return resolve(null);
            const boxBottom = boxTop + boxHeight;
            const items = Array.isArray(rets[1]) ? rets[1] : [];
            const edgeTop = boxTop + 1;
            const visibleItems = [];
            for (const it of items) {
              const r = it.rect || it || {};
              const top = Number(r.top || 0);
              const bottom = top + Math.max(0, Number(r.height || 0));
              const ds = it.dataset || {};
              const rawCategoryId =
                typeof ds.categoryId !== 'undefined' ? ds.categoryId : ds['category-id'];
              const categoryId = Number(rawCategoryId);
              if (!Number.isFinite(categoryId) || categoryId <= 0) continue;
              if (bottom <= edgeTop || top >= boxBottom) continue;
              const rawCatIdx = typeof ds.catIdx !== 'undefined' ? ds.catIdx : ds['cat-idx'];
              const catIdx = Number(rawCatIdx);
              visibleItems.push({
                categoryId,
                catIdx: Number.isFinite(catIdx) ? catIdx : -1,
                top,
                bottom,
                itemKind: ds.itemKind || ds['item-kind'] || '',
              });
            }
            if (!visibleItems.length) return resolve(null);
            visibleItems.sort((a, b) => {
              if (a.top !== b.top) return a.top - b.top;
              return a.bottom - b.bottom;
            });
            const coveringTopItem = visibleItems.find(
              (item) => item.top <= edgeTop && item.bottom > edgeTop,
            );
            if (coveringTopItem)
              return resolve({
                item: coveringTopItem,
                boxTop,
                boxBottom,
                edgeTop,
                visibleCount: visibleItems.length,
              });
            const firstBelowTopItem = visibleItems.find((item) => item.top > edgeTop);
            resolve({
              item: firstBelowTopItem || visibleItems[0],
              boxTop,
              boxBottom,
              edgeTop,
              visibleCount: visibleItems.length,
            });
          } catch (e) {
            resolve(null);
          }
        });
      } catch (e) {
        resolve(null);
      }
    });
  };

  const queryItemOffsetTop = (domId) => {
    return new Promise((resolve) => {
      if (!domId) return resolve(0);
      try {
        const q = uni.createSelectorQuery().in(instance);
        q.select('.goods-item-scroll').boundingClientRect();
        const safeSel = '#' + String(domId).replace(/[^0-9a-zA-Z_-]/g, '_');
        q.select(safeSel).boundingClientRect();
        q.exec((rets) => {
          try {
            if (!Array.isArray(rets) || rets.length < 2) return resolve(0);
            const boxTop = Number(rets[0]?.top || 0);
            const itemTop = Number(rets[1]?.top || 0);
            resolve(itemTop - boxTop);
          } catch (e) {
            resolve(0);
          }
        });
      } catch (e) {
        resolve(0);
      }
    });
  };

  const queryMarkersOffsetTop = (domIds) => {
    return new Promise((resolve) => {
      if (!Array.isArray(domIds) || !domIds.length) return resolve([]);
      try {
        const q = uni.createSelectorQuery().in(instance);
        q.select('.goods-item-scroll').boundingClientRect();
        domIds.forEach((id) => {
          const safeSel = '#' + String(id).replace(/[^0-9a-zA-Z_-]/g, '_');
          q.select(safeSel).boundingClientRect();
        });
        q.exec((rets) => {
          try {
            if (!Array.isArray(rets) || rets.length < domIds.length + 1) return resolve([]);
            const boxTop = Number(rets[0]?.top || 0);
            const results = [];
            for (let i = 0; i < domIds.length; i++) {
              const itemTop = Number(rets[i + 1]?.top || 0);
              results.push(itemTop - boxTop);
            }
            resolve(results);
          } catch (e) {
            resolve([]);
          }
        });
      } catch (e) {
        resolve([]);
      }
    });
  };

  const measureContentHeight = () => {
    return new Promise((resolve) => {
      try {
        const q = uni.createSelectorQuery().in(instance);
        q.select('.goods-item-box').boundingClientRect();
        q.exec((rets) => {
          const h = Number(rets?.[0]?.height || 0);
          resolve(h);
        });
      } catch (e) {
        resolve(0);
      }
    });
  };

  const measurePrependHeight = () => {
    return new Promise((resolve) => {
      try {
        const q = uni.createSelectorQuery().in(instance);
        q.select('.prepend-container').boundingClientRect();
        q.exec((rets) => {
          const h = Number(rets?.[0]?.height || 0);
          resolve(h);
        });
      } catch (e) {
        resolve(0);
      }
    });
  };

  defineExpose({
    queryTopItem,
    queryItemOffsetTop,
    queryMarkersOffsetTop,
    measureContentHeight,
    measurePrependHeight,
  });
</script>

<style lang="scss" scoped>
  .goods-item-scroll {
    width: 100%;
    overflow-anchor: auto;
  }

  .scroll-top-anchor {
    width: 0;
    height: 0;
  }

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
    width: 236rpx;
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
    width: 46rpx;
    height: 22rpx;
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
    width: 236rpx;
    min-height: 66rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    line-height: 33rpx;
  }

  .cat-divider-marker {
    width: 100%;
    padding-top: 4rpx;
    padding-bottom: 16rpx;
    background-color: rgba(255, 255, 250, 1);
    flex-shrink: 0;
  }

  .cat-divider-marker .group_60 {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 16rpx 0 18rpx 0;
  }

  .cat-divider-marker .section_26 {
    width: 48rpx;
    height: 1rpx;
    border: 2rpx solid rgba(61, 61, 60, 1);
    margin: 22rpx 0;
    box-sizing: border-box;
  }

  .cat-divider-marker .section_27 {
    width: 48rpx;
    height: 1rpx;
    border: 2rpx solid rgba(61, 61, 60, 1);
    margin: 22rpx 0 22rpx 14rpx;
    box-sizing: border-box;
  }

  .cat-divider-marker .text_27 {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 45rpx;
    margin-left: 15rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 360rpx;
  }

  .divider-banner-img {
    width: calc(100vw - 200rpx);
    border-radius: 5px;
    display: block;
    margin: 0 auto;
  }
</style>
