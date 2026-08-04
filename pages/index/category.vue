<!-- 商品分类列表 -->
<template>
  <s-layout :bgStyle="{ color: '#fff' }" tabbar="/pages/index/category" navbar="clear">
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
          class="nav-bar-inner ss-flex ss-col-center"
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
            class="ss-m-l-20"
          ></uni-icons>
          <text class="nav-title ss-m-l-10">产品分类</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

    <view class="s-category">
      <view class="search-wrap" :style="{ top: sheep.$platform.navbar + 'px' }">
        <view class="search-inner ss-flex ss-col-center">
          <uni-icons
            type="search"
            size="16"
            color="rgba(157, 156, 150, 1)"
            class="search-icon"
            @tap="onSearch"
          />
          <input
            v-model="state.keyword"
            class="search-input"
            confirm-type="search"
            placeholder="搜索您想要的商品"
            placeholder-class="search-placeholder"
            @confirm="onSearch"
          />
        </view>
      </view>
      <view class="three-level-wrap ss-flex ss-col-top">
        <!-- 商品分类（左） -->
        <view class="side-menu-wrap">
          <scroll-view
            scroll-y
            scroll-with-animation
            :scroll-into-view="state.leftScrollIntoViewId"
            :style="[{ height: menuScrollHeight + 'px' }]"
          >
            <view
              class="menu-item ss-flex"
              v-for="(item, index) in state.categoryList"
              :key="item.id"
              :id="'menu-item-' + index"
              :class="[{ 'menu-item-active': index === state.activeMenu }]"
              @tap="onMenu(index)"
            >
              <view class="menu-icon-wrap">
                <image class="menu-icon" :src="sheep.$url.cdn(item.picUrl)" mode="aspectFit" />
              </view>
              <view class="menu-title ss-line-2">
                {{ item.name }}
              </view>
            </view>
          </scroll-view>
        </view>
        <!-- 商品分类（右） -->
        <view class="goods-list-box" v-if="state.categoryList?.length">
          <scroll-view
            scroll-y
            scroll-with-animation
            :scroll-into-view="state.rightScrollIntoViewId"
            :style="[{ height: menuScrollHeight + 'px' }]"
            :lower-threshold="50"
            @scroll="onRightScroll"
            @scrolltolower="loadMore"
          >
            <!-- 回到顶部锚点（配合 scroll-into-view 丝滑滚顶） -->
            <view id="right-scroll-top-anchor" style="width: 0; height: 0"></view>
            <image
              v-if="bannerPicUrl"
              class="banner-img"
              :src="bannerPicUrl"
              mode="widthFix"
              @tap="onPreviewBanner"
            />
            <view class="group_60 flex-row">
              <view class="section_26 flex-col"></view>
              <text class="text_27">{{
                state.categoryList[state.topDisplayedCategoryIdx]?.name ||
                state.categoryList[state.activeMenu]?.name ||
                ''
              }}</text>
              <view class="section_27 flex-col"></view>
            </view>
            <second-one
              v-if="state.style === 'first_one' || state.style === 'first_two'"
              :pagination="state.pagination"
            />
            <second-one
              v-if="state.style === 'second_one'"
              :data="state.categoryList"
              :activeMenu="state.activeMenu"
            />
            <!-- 最后一个分类的 noMore 状态（保留原组件） -->
            <uni-load-more
              v-if="
                (state.style === 'first_one' || state.style === 'first_two') &&
                state.pagination.total > 0 &&
                state.virtualActiveMenu >= state.categoryList.length - 1 &&
                state.loadStatus === 'noMore'
              "
              :status="state.loadStatus"
              :content-text="{
                contentdown: '上滑查看更多',
              }"
            />
          </scroll-view>
        </view>
      </view>
    </view>
    <su-popup
      :show="state.showBannerPreviewVideo"
      type="center"
      round="10"
      showClose
      backgroundColor="transparent"
      @close="closeBannerPreviewVideo"
    >
      <view class="banner-preview-video-wrap">
        <video
          class="banner-preview-video"
          :src="state.bannerPreviewVideoUrl"
          controls
          autoplay
          object-fit="contain"
        />
      </view>
    </su-popup>
  </s-layout>
</template>

<script setup>
  import secondOne from './components/second-one.vue';
  import sheep from '@/sheep';
  import CategoryApi from '@/sheep/api/product/category';
  import BannerApi from '@/sheep/api/promotion/banner';
  import SpuApi from '@/sheep/api/product/spu';
  import { onLoad, onReachBottom, onShow } from '@dcloudio/uni-app';
  import { computed, nextTick, reactive } from 'vue';
  import { concat } from 'lodash-es';
  import { handleTree } from '@/sheep/helper/utils';

  const PREFETCH_CACHE_MAX = 5;
  const SWITCH_UNLOCK_MS = 80;
  const MARKER_TYPE = '__CAT_DIVIDER__';
  const GOODS_TYPE = 'goods';

  const state = reactive({
    style: 'first_two',
    categoryList: [],
    activeMenu: 0,
    pendingCategoryId: null,

    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 6,
      perCat: new Map(),
    },
    loadStatus: '',
    keyword: '',
    bannerPicUrl: '',
    showBannerPreviewVideo: false,
    bannerPreviewVideoUrl: '',

    rightScrollIntoViewId: '',
    leftScrollIntoViewId: '',
    isSwitchingCategory: false,
    isPrefetchingNext: false,
    lastScrollTop: 0,
    prefetchCache: new Map(),
    virtualActiveMenu: 0,
    topDisplayedCategoryIdx: 0,
    categoryBreakPoints: [],
    enableSeamless: true,
  });

  function _clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
  }

  function _assertInvariant(tag) {
    const L = state.categoryList.length;
    if (!L) return;
    let a = state.activeMenu;
    let t = state.topDisplayedCategoryIdx;
    let v = state.virtualActiveMenu;
    const ok = 0 <= a && a <= t && t <= v && v < L;
    if (!ok) {
      // eslint-disable-next-line no-console
      console.warn('[CAT_INVARIANT_VIOLATION@' + tag + ']', { a, t, v, L });
      const maxV = L - 1;
      v = _clamp(v, 0, maxV);
      t = _clamp(t, Math.max(0, a), Math.min(maxV, v));
      a = _clamp(a, 0, Math.min(maxV, t));
      state.virtualActiveMenu = v;
      state.topDisplayedCategoryIdx = t;
      state.activeMenu = a;
    }
  }

  function _evictPrefetchCache() {
    try {
      if (state.prefetchCache.size <= PREFETCH_CACHE_MAX) return;
      const keys = Array.from(state.prefetchCache.keys());
      for (let i = 0; i < keys.length - PREFETCH_CACHE_MAX; i++) {
        state.prefetchCache.delete(keys[i]);
      }
    } catch (e) {
      /* noop */
    }
  }

  function _catByIdxOrFirst(idx) {
    return (
      state.categoryList[_clamp(idx, 0, Math.max(0, state.categoryList.length - 1))] || null
    );
  }

  const bannerPicUrl = computed(() => {
    const raw = state.bannerPicUrl;
    if (!raw) return '';
    return sheep.$url.cdn(raw);
  });

  const { safeArea } = sheep.$platform.device;
  const pageHeight = computed(() => safeArea.height - 50);
  const windowWidth =
    sheep.$platform.device.windowWidth || uni.getSystemInfoSync().windowWidth || 375;
  const searchBlockHeightPx = 0;
  const menuTop = computed(() => Number(sheep.$platform.navbar || 0) + searchBlockHeightPx + 'px');
  const menuScrollHeight = computed(() =>
    Math.max(0, pageHeight.value - Number(sheep.$platform.navbar || 0) - searchBlockHeightPx),
  );

  async function getList() {
    const { code, data } = await CategoryApi.getCategoryList();
    if (code !== 0) {
      return;
    }
    const tree = handleTree(data);
    const rootCategory = tree.find((item) => Number(item.id) === 84);
    const secondLevelList = Array.isArray(rootCategory?.children) ? rootCategory.children : [];
    state.categoryList = secondLevelList.length > 0 ? secondLevelList : tree;
  }

  function _resetSeamlessStateForClick(targetIdx) {
    state.activeMenu = targetIdx;
    state.virtualActiveMenu = targetIdx;
    state.topDisplayedCategoryIdx = targetIdx;
    state.pagination.list = [];
    state.pagination.pageNo = 1;
    state.pagination.total = 0;
    state.pagination.perCat.clear();
    state.categoryBreakPoints = [];
    state.prefetchCache.clear();
    state.rightScrollIntoViewId = '';
    nextTick(() => {
      state.rightScrollIntoViewId = 'right-scroll-top-anchor';
    });
    state.leftScrollIntoViewId = 'menu-item-' + targetIdx;
  }

  function _setActiveMenu(idx, source) {
    const L = state.categoryList.length;
    if (!L) return;
    const clamped = _clamp(idx, 0, L - 1);
    if (source === 'click') {
      _resetSeamlessStateForClick(clamped);
      getGoodsList(clamped);
      _assertInvariant('_setActiveMenu:click');
      return;
    }
    state.activeMenu = clamped;
    state.leftScrollIntoViewId = 'menu-item-' + clamped;
    if (state.virtualActiveMenu < clamped) state.virtualActiveMenu = clamped;
    if (state.topDisplayedCategoryIdx < clamped) state.topDisplayedCategoryIdx = clamped;
    if (state.topDisplayedCategoryIdx > state.virtualActiveMenu)
      state.topDisplayedCategoryIdx = state.virtualActiveMenu;
    _assertInvariant('_setActiveMenu:scroll');
  }

  const onMenu = (val, source = 'click') => {
    _setActiveMenu(val, source);
  };

  function _ensurePerCat(catIdx) {
    const i = _clamp(catIdx, 0, Math.max(0, state.categoryList.length - 1));
    if (!state.pagination.perCat.has(i)) {
      state.pagination.perCat.set(i, {
        pageNo: 1,
        pageSize: state.pagination.pageSize,
        total: 0,
        loadedCount: 0,
      });
    }
    return state.pagination.perCat.get(i);
  }

  async function _fetchCategoryPage(catIdx, pageNo, silent) {
    const cat = _catByIdxOrFirst(catIdx);
    if (!cat) return { list: [], total: 0 };
    const res = await SpuApi.getSpuPage({
      categoryId: cat.id,
      pageNo: pageNo,
      pageSize: state.pagination.pageSize,
      keyword: state.keyword,
    });
    if (!res || res.code !== 0) {
      if (!silent) state.isSwitchingCategory = false;
      return { list: [], total: 0 };
    }
    const list = Array.isArray(res.data?.list) ? res.data.list : [];
    const total = Number(res.data?.total || 0);
    return { list, total };
  }

  function _appendGoodsToStream(catIdx, goodsList) {
    const arr = Array.isArray(goodsList) ? goodsList : [];
    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      state.pagination.list.push({
        ...it,
        _type: GOODS_TYPE,
        _$catIdx: catIdx,
        __streamKey: 'g_' + catIdx + '_' + state.pagination.list.length + '_' + (it?.id || ''),
      });
    }
  }

  function _preloadImagesForGoods(goodsList) {
    try {
      const urls = (Array.isArray(goodsList) ? goodsList : [])
        .map((g) => g?.picUrl || g?.imageUrl || g?.imgUrl)
        .filter(Boolean)
        .slice(0, 3)
        .map((raw) => sheep.$url.cdn(raw));
      if (urls.length && uni.preloadImage) {
        uni.preloadImage({ urls });
      }
    } catch (e) {
      /* noop */
    }
  }

  async function prefetchNextCategoryFirstPage() {
    if (state.isPrefetchingNext) return;
    const nextIdx = state.virtualActiveMenu + 1;
    const L = state.categoryList.length;
    if (!L || nextIdx >= L) return;
    if (state.prefetchCache.has(nextIdx)) return;
    state.isPrefetchingNext = true;
    try {
      const page = await _fetchCategoryPage(nextIdx, 1, true);
      state.prefetchCache.set(nextIdx, {
        list: page.list,
        total: page.total,
        loadedAt: Date.now(),
      });
      _evictPrefetchCache();
      _preloadImagesForGoods(page.list);
    } finally {
      state.isPrefetchingNext = false;
    }
  }

  function _updateLoadStatusForVirtualTail() {
    const tail = _ensurePerCat(state.virtualActiveMenu);
    if (!tail || tail.total <= 0) {
      state.loadStatus = 'more';
      return;
    }
    state.loadStatus = tail.loadedCount < tail.total ? 'more' : 'noMore';
  }

  async function getGoodsList(catIdxOrUndefined) {
    state.loadStatus = 'loading';
    const catIdx =
      typeof catIdxOrUndefined === 'number' ? catIdxOrUndefined : state.virtualActiveMenu;
    const cat = _catByIdxOrFirst(catIdx);
    if (!cat) {
      state.isSwitchingCategory = false;
      return;
    }
    const per = _ensurePerCat(catIdx);
    const { list, total } = await _fetchCategoryPage(catIdx, per.pageNo, false);
    per.total = total;
    _appendGoodsToStream(catIdx, list);
    per.loadedCount = Number(per.loadedCount || 0) + list.length;
    state.pagination.total = Number(state.pagination.total || 0) + total;
    _updateLoadStatusForVirtualTail();
    if (per.loadedCount >= per.total - state.pagination.pageSize) {
      prefetchNextCategoryFirstPage();
    }
  }

  function _findDisplayedCatByBreakPoint(scrollTop, breakPoints, activeMenu) {
    if (!Array.isArray(breakPoints) || breakPoints.length === 0) return activeMenu;
    const anchorOffset = 0;
    const target = (scrollTop || 0) + anchorOffset;
    let lo = 0;
    let hi = breakPoints.length - 1;
    let ans = activeMenu;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const bp = breakPoints[mid];
      if ((bp?.approxScrollTop || 0) <= target) {
        ans = bp.catIdx;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }

  function onRightScroll(e) {
    state.lastScrollTop = e.detail.scrollTop || 0;
    if (!state.enableSeamless) return;
    const displayed = _findDisplayedCatByBreakPoint(
      state.lastScrollTop,
      state.categoryBreakPoints,
      state.activeMenu,
    );
    const safe = _clamp(
      displayed,
      Math.min(state.activeMenu, state.topDisplayedCategoryIdx),
      state.virtualActiveMenu,
    );
    if (safe !== state.topDisplayedCategoryIdx) {
      state.topDisplayedCategoryIdx = safe;
      if (safe !== state.activeMenu) _setActiveMenu(safe, 'scroll');
    }
  }

  function _pushCategoryDividerMarker(catIdx) {
    const cat = _catByIdxOrFirst(catIdx);
    const markerItemIdx = state.pagination.list.length;
    state.pagination.list.push({
      __streamKey: 'm_' + catIdx + '_' + markerItemIdx,
      id: '__divider_' + catIdx + '_' + markerItemIdx,
      _type: MARKER_TYPE,
      _$catIdx: catIdx,
      name: cat?.name || '',
      bannerPicUrl: state.bannerPicUrl || '',
    });
    // approximate 320rpx * windowWidth/750 ≈ 预估高度，scrollTop 匹配时不准也没关系，只是滚动驱动换标题会延迟/提前一点点
    const approxPx =
      (windowWidth || 375) *
      ((state.lastScrollTop > 0 && state.pagination.list.length > 8 ? 410 : 320) / 750);
    state.categoryBreakPoints.push({
      catIdx,
      itemIndex: markerItemIdx,
      approxScrollTop: state.lastScrollTop + Math.max(20, approxPx),
    });
  }

  async function switchToNextCategory() {
    if (!state.enableSeamless) return;
    if (state.isSwitchingCategory) return;
    const L = state.categoryList.length;
    if (!L) return;
    const nextIdx = state.virtualActiveMenu + 1;
    if (nextIdx >= L) return;
    if (nextIdx <= state.virtualActiveMenu) return;
    state.isSwitchingCategory = true;
    try {
      _pushCategoryDividerMarker(nextIdx);

      let firstPage = null;
      if (state.prefetchCache.has(nextIdx)) {
        firstPage = state.prefetchCache.get(nextIdx);
        state.prefetchCache.delete(nextIdx);
      } else {
        firstPage = await _fetchCategoryPage(nextIdx, 1, false);
      }
      const list = Array.isArray(firstPage?.list) ? firstPage.list : [];
      const total = Number(firstPage?.total || 0);
      _appendGoodsToStream(nextIdx, list);
      _preloadImagesForGoods(list);
      state.pagination.perCat.set(nextIdx, {
        pageNo: 1,
        pageSize: state.pagination.pageSize,
        total,
        loadedCount: list.length,
      });
      state.pagination.total = Number(state.pagination.total || 0) + total;
      state.virtualActiveMenu = nextIdx;
      if (state.topDisplayedCategoryIdx < state.activeMenu)
        state.topDisplayedCategoryIdx = state.activeMenu;
      if (state.topDisplayedCategoryIdx > state.virtualActiveMenu)
        state.topDisplayedCategoryIdx = state.virtualActiveMenu;
      _updateLoadStatusForVirtualTail();
      _assertInvariant('switchToNext');
    } finally {
      setTimeout(() => {
        state.isSwitchingCategory = false;
      }, SWITCH_UNLOCK_MS);
    }
  }

  function loadMore() {
    if (state.isSwitchingCategory) return;
    const cur = _ensurePerCat(state.virtualActiveMenu);
    if (state.loadStatus === 'noMore') {
      if (state.enableSeamless && state.virtualActiveMenu < state.categoryList.length - 1) {
        switchToNextCategory();
      }
      return;
    }
    if (cur.loadedCount >= cur.total) {
      if (state.enableSeamless && state.virtualActiveMenu < state.categoryList.length - 1) {
        switchToNextCategory();
      } else {
        state.loadStatus = 'noMore';
      }
      return;
    }
    cur.pageNo = Number(cur.pageNo || 0) + 1;
    getGoodsList(state.virtualActiveMenu);
  }

  onReachBottom(() => {
    if (state.style === 'first_one' || state.style === 'first_two') {
      loadMore();
    }
  });

  function pickRouteCategoryId(options = {}) {
    const raw =
      options.categoryId ??
      options.category_id ??
      options.cid ??
      options.id ??
      options.menuId ??
      options.menu_id ??
      '';
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  onLoad((options) => {
    const id = pickRouteCategoryId(options || {});
    if (id) {
      state.pendingCategoryId = id;
    }
  });

  function initMenuIndex() {
    const appStore = sheep.$store('app');
    const tabbarParams = appStore.paramsForTabbar || {};
    const tabbarId = tabbarParams.id;
    appStore.clearParamsForTabbar();
    const id = state.pendingCategoryId || (tabbarId ? Number(tabbarId) : null);
    state.pendingCategoryId = null;

    if (id) {
      const foundCategory = state.categoryList.find(
        (category) => Number(category.id) === Number(id),
      );
      if (foundCategory) {
        onMenu(state.categoryList.indexOf(foundCategory), 'click');
      } else {
        onMenu(0, 'click');
      }
    } else {
      if (state.categoryList.length > 0 && state.loadStatus === '') {
        onMenu(0, 'click');
      }
    }
  }

  onShow(async () => {
    if (state.categoryList.length === 0) {
      await getList();
    }
    initMenuIndex();
    if (!state.bannerPicUrl) {
      await loadBanner();
    }
  });

  function onSearch() {
    _resetSeamlessStateForClick(state.activeMenu);
    getGoodsList(state.activeMenu);
  }

  async function loadBanner() {
    const { code, data } = await BannerApi.getBannerList();
    if (code !== 0) return;
    const list = Array.isArray(data) ? data : data?.list || [];
    const banner = list.find((it) => Number(it?.position) === 6);
    state.bannerPicUrl =
      banner?.picUrl ||
      banner?.url ||
      banner?.imageUrl ||
      banner?.imgUrl ||
      banner?.bannerUrl ||
      '';
  }

  function isVideoUrl(url) {
    const raw = typeof url === 'string' ? url : '';
    if (!raw) return false;
    return /\.(mp4|mov|m4v|avi|m3u8|webm)(\?.*)?$/i.test(raw);
  }

  function closeBannerPreviewVideo() {
    state.showBannerPreviewVideo = false;
    state.bannerPreviewVideoUrl = '';
  }

  function onPreviewBanner() {
    return;
    const url = bannerPicUrl.value;
    if (!url) return;
    if (isVideoUrl(url)) {
      state.bannerPreviewVideoUrl = url;
      state.showBannerPreviewVideo = true;
      return;
    }
    uni.previewImage({
      urls: [url],
      current: url,
    });
  }
</script>

<style lang="scss" scoped>
  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 1000;
    background-color: #fff;
  }

  .nav-title {
    font-size: 36rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    color: #000000;
  }

  .s-category {
    .group_60 {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 20rpx 0;
    }

    .section_26 {
      width: 48rpx;
      height: 1rpx;
      border: 2rpx solid rgba(61, 61, 60, 1);
      margin: 22rpx 0;
      box-sizing: border-box;
    }

    .text_27 {
      overflow-wrap: break-word;
      color: rgba(61, 61, 60, 1);
      font-size: 32rpx;
      font-family: PingFangSC-Medium;
      font-weight: 500;
      text-align: left;
      white-space: nowrap;
      line-height: 45rpx;
      margin-left: 15rpx;
    }

    .section_27 {
      width: 48rpx;
      height: 1rpx;
      border: 2rpx solid rgba(61, 61, 60, 1);
      margin: 22rpx 0 22rpx 14rpx;
      box-sizing: border-box;
    }

    .search-wrap {
      position: sticky;
      z-index: 1001;
      top: 0;
      margin: 22rpx 32rpx 18rpx 32rpx;
      background: rgba(157, 156, 150, 0.1);
      border-radius: 20rpx;
      padding: 18rpx 28rpx 17rpx 28rpx;
      box-sizing: border-box;
    }

    .search-inner {
      height: 36rpx;
    }

    .search-icon {
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      margin-left: 14rpx;
      font-size: 24rpx;
      font-family: PingFangSC-Regular;
      line-height: 33rpx;
      color: rgba(61, 61, 60, 1);
      height: 36rpx;
      min-height: 36rpx;
    }

    :deep() {
      .search-placeholder {
        color: rgba(157, 156, 150, 1);
      }

      .side-menu-wrap {
        width: 166rpx;
        height: 100%;
        background-color: #f6f6f6;
        position: fixed;
        left: 0;

        .menu-item {
          // width: 100%;
          min-height: 180rpx;
          padding: 24rpx 10rpx 20rpx 10rpx;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all linear 0.2s;

          .menu-icon-wrap {
            width: 98rpx;
            height: 98rpx;
            position: relative;
            border-radius: 8rpx;
            overflow: hidden;
          }

          .menu-icon {
            width: 100%;
            height: 100%;
          }

          .menu-title {
            line-height: 42rpx;
            font-size: 30rpx;
            font-weight: 400;
            color: rgba(157, 156, 150, 1);
            text-align: center;
            margin-top: 24rpx;
            position: relative;
            z-index: 0;

            &::before {
              content: none;
            }
          }

          &.menu-item-active {
            background-color: rgba(255, 255, 250, 1);

            &::before {
              content: none;
            }

            &::after {
              content: none;
            }

            .menu-title {
              font-weight: 600;
              color: rgba(30, 63, 28, 1);

              &::before {
                content: none;
              }
            }
          }
        }
      }

      .goods-list-box {
        background-color: #fff;
        width: calc(100vw - 166rpx);
        padding: 10px;
        margin-left: 166rpx;
      }

      .banner-img {
        width: calc(100vw - 200rpx);
        border-radius: 5px;
      }
    }
  }

  // ── 下一个分类过渡提示条（毛玻璃 + 淡入上移动画）──
  .s-category .next-category-hint {
    margin: 24rpx 4rpx 40rpx 4rpx;
    padding: 22rpx 28rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    // 毛玻璃
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    background: rgba(255, 255, 255, 0.72);
    border: 1rpx solid rgba(30, 63, 28, 0.08);
    box-shadow: 0 8rpx 24rpx rgba(30, 63, 28, 0.08);
    animation: fadeSlideUp 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .s-category .next-hint-l {
    align-items: center;
    min-width: 0;
  }

  .s-category .next-hint-label {
    font-size: 22rpx;
    color: rgba(157, 156, 150, 1);
    letter-spacing: 1rpx;
    flex-shrink: 0;
  }

  .s-category .next-hint-name {
    margin-left: 16rpx;
    font-size: 30rpx;
    font-weight: 600;
    color: rgba(30, 63, 28, 1);
    font-family: PingFangSC-Medium;
    // 超长省略
    max-width: 300rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes fadeSlideUp {
    0% {
      opacity: 0;
      transform: translateY(20rpx);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .banner-preview-video-wrap {
    width: 650rpx;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 10rpx;
    overflow: hidden;
  }

  .banner-preview-video {
    width: 650rpx;
    height: 720rpx;
  }
</style>
