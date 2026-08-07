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
        <view class="search-inner ss-flex ss-col-center" @tap="onOpenSearchPage">
          <uni-icons type="search" size="16" color="rgba(157, 156, 150, 1)" class="search-icon" />
          <view class="search-input search-placeholder">搜索您想要的商品</view>
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
        <view class="goods-list-box" :style="{ height: menuScrollHeight + 'px' }">
          <!-- <image
            v-if="!state.enableStream && bannerPicUrl"
            class="banner-img"
            :src="bannerPicUrl"
            mode="widthFix"
            @tap="onPreviewBanner"
          /> -->
          <view class="group_60 flex-row" v-if="!state.enableStream">
            <view class="section_26 flex-col"></view>
            <text class="text_27">{{
              state.categoryList[state.topDisplayedCategoryIdx]?.name ||
              state.categoryList[state.activeMenu]?.name ||
              ''
            }}</text>
            <view class="section_27 flex-col"></view>
          </view>
          <second-one
            ref="secondOneRef"
            v-if="state.style === 'first_one' || state.style === 'first_two'"
            :pagination="state.pagination"
            :scrollable="true"
            :scroll-height="menuScrollHeight"
            :scroll-with-animation="false"
            :scroll-into-view="state.rightScrollIntoViewId"
            :scroll-top="
              state.stream._isUserTouching || state.stream.forceNextScrollTop <= 0
                ? undefined
                : state.stream.forceNextScrollTop
            "
            :top-padding="state.stream.dynamicTopPadding"
            :min-content-height="state.stream.globalReservedMinHeight"
            :upper-threshold="150"
            :lower-threshold="50"
            @scroll="onRightScroll"
            @scrolltolower="loadMore"
            @touchmove="onRightScrollTouchMove"
            @touchend="onRightScrollTouchEnd"
          >
            <uni-load-more
              v-if="
                state.pagination.total > 0 &&
                state.virtualActiveMenu >= state.categoryList.length - 1 &&
                state.loadStatus === 'noMore'
              "
              :status="state.loadStatus"
              :content-text="{
                contentdown: '上滑查看更多',
              }"
            />
          </second-one>
          <second-one
            v-if="state.style === 'second_one'"
            :data="state.categoryList"
            :activeMenu="state.activeMenu"
          />
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
  import { computed, nextTick, reactive, ref } from 'vue';
  import { concat } from 'lodash-es';
  import { handleTree } from '@/sheep/helper/utils';

  const secondOneRef = ref(null);

  const PREFETCH_CACHE_MAX = 5;
  const SWITCH_UNLOCK_MS = 80;
  const MARKER_TYPE = '__CAT_DIVIDER__';
  const GOODS_TYPE = 'goods';
  // #region debug-point shared:category-stream-highlight
  const __DBG_URL__ = 'http://127.0.0.1:7777/event';
  const __DBG_SESSION_ID__ = 'category-stream-highlight';
  const __DBG_RUN_ID__ = 'fix-loading-jump';
  const __dbgState = {
    scrollAt: 0,
    sampleAt: 0,
    highlightAt: 0,
  };
  const __dbgEmit = (hypothesisId, location, msg, data = {}) => {
    // 同时也输出到控制台，用醒目的样式方便用户看到
    console.log(
      `%c[${hypothesisId}] ${location}: ${msg}`,
      'color: #007aff; font-weight: bold; font-size: 12px;',
      data,
    );
    const payload = {
      sessionId: __DBG_SESSION_ID__,
      runId: __DBG_RUN_ID__,
      hypothesisId,
      location,
      msg,
      data,
      ts: Date.now(),
    };
    try {
      if (typeof uni !== 'undefined' && typeof uni.request === 'function') {
        uni.request({
          url: __DBG_URL__,
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: payload,
        });
        return;
      }
    } catch (_) {}
  };
  // #endregion
  // Stream 模式配置
  const STREAM = {
    ENABLE: true,
    ANCHOR_HEAD_N: 1,
    ANCHOR_MID_N: 3,
    ANCHOR_TAIL_N: 1,
    // ★★★ 关键：加大 pageSize，一次拉更多数据，减少触发 prepend 的次数 → 消除多次"数据弹出"导致的跳跃
    PAGE_N: 30,
    PAGE_N_MAX: 200, // 上限
    EST_DIVIDER_HEIGHT: 255, // 1 banner + divider 毛玻璃 ≈ 250-260px
    EST_GOODS_HEIGHT: 260, // 安全上限：确保预留空间足够大，不撞 scrollTop=0
    LOAD_TRIGGER_VIEWPORT_RATIO: 1.0,
    IGNORE_N_SCROLL_AFTER_ANCHOR_MS: 700,
    MIN_HEAD_DECREASE_PX: 8,
    HEAD_DIR_WINDOW_MS: 700,
    MIN_TAIL_INCREASE_PX: 8,
    TAIL_DIR_WINDOW_MS: 700,
    AUTO_TRIGGER_IF_SHORT_CONTENT: true,
    HIGHLIGHT_LEADING_OFFSET_PX: 220,
    TOP_PADDING: 50000,
  };
  // 实际用的 nearHead / nearTail px 阈值（按当前 viewport 实时算）
  const _streamTriggerPx = () =>
    Math.max(60, Number(menuScrollHeight.value || 0) * STREAM.LOAD_TRIGGER_VIEWPORT_RATIO);

  // ════════════════════════════════════════════════
  // ★★★ 新架构：真实测量高度同步（从 second-one 拉取真实测量值，更新 state
  //   失败则 fallback 到原估算值（保证不会归零）
  // ════════════════════════════════════════════════
  function _streamUpdateUnitMetricsFromChild(syncNow) {
    try {
      if (secondOneRef.value && typeof secondOneRef.value.getUnitMetrics === 'function') {
        const m = secondOneRef.value.getUnitMetrics() || {};
        const gH = Number(m.goodsHeight || 0);
        const dH = Number(m.dividerHeight || 0);
        if (gH > 80) state.streamUnitGoodsHeight = gH;
        if (dH > 50) state.streamUnitDividerHeight = dH;
        if (m.ready) state.streamUnitMetricsReady = true;
        if (syncNow) _streamRebuildGlobalBreakPointsIfReady();
      } else if (
        secondOneRef.value &&
        typeof secondOneRef.value.measureUnitMetrics === 'function'
      ) {
        // 还没 ready，触发一次立刻测量
        secondOneRef.value
          .measureUnitMetrics()
          .then((m) => {
            const gH = Number(m?.goodsHeight || 0);
            const dH = Number(m?.dividerHeight || 0);
            if (gH > 80) state.streamUnitGoodsHeight = gH;
            if (dH > 50) state.streamUnitDividerHeight = dH;
            if (m?.ready) state.streamUnitMetricsReady = true;
            if (syncNow) _streamRebuildGlobalBreakPointsIfReady();
          })
          .catch(() => {});
      }
    } catch (_) {}
  }

  // ════════════════════════════════════════════════
  // ★★★ 新架构：基于 categoryGroups × 真实测量高 → 一次性算出全局精确断点（bp_exact）
  //   streamCatBreakPointsExact[catIdx] = { startOffset, endOffset, goodsCount }
  //   streamGlobalTotalHeight = sum
  //   只有当 categoryGroups 存在时才计算；否则不报错（兼容后端还没返回 groups 的老版本
  // ════════════════════════════════════════════════
  function _streamRebuildGlobalBreakPointsIfReady() {
    const L = state.categoryList.length;
    if (!L) return;
    const gH = Math.max(80, Number(state.streamUnitGoodsHeight || STREAM.EST_GOODS_HEIGHT));
    const dH = Math.max(50, Number(state.streamUnitDividerHeight || STREAM.EST_DIVIDER_HEIGHT));
    let totalH = 0;
    const exactBp = [];
    const map = new Map();
    for (let i = 0; i < L; i++) {
      const cat = state.categoryList[i];
      let count = 0;
      if (Array.isArray(state.streamCategoryGroups) && state.streamCategoryGroups.length) {
        const rawG = state.streamCategoryGroups.find(
          (g) => Number(g.categoryId) === Number(cat?.id),
        );
        if (rawG) count = Number(rawG.count || 0);
      }
      if (!count && state.pagination.perCat && state.pagination.perCat.has(i)) {
        const per = state.pagination.perCat.get(i);
        if (per && Number(per.total || 0) > 0) count = Number(per.total);
      }
      if (!count) count = 5;
      const startOffset = totalH;
      const catH = dH + count * gH;
      const endOffset = startOffset + catH;
      exactBp.push({ catIdx: i, startOffset, goodsCount: count, endOffset });
      map.set(i, { categoryId: Number(cat?.id || 0), count, startOffset, endOffset });
      totalH = endOffset;
    }
    state.streamCatBreakPointsExact = exactBp;
    state.streamCategoryGroupMap = map;
    state.streamGlobalTotalHeight = Math.max(0, totalH);
    // ★★★ 直接元凶：不再把 globalReservedMinHeight 设置为「全局几万 px 总高」
    // 用户明确表示"不期望每个类目都预留全部高度"（会导致尾部大面积空白，而且 min-height 写进 DOM 后小程序不会回缩）
    // 这里永远归零；真正的上方占位由 dynamicTopPadding 精确控制（只占位还没加载的上方分类高
    state.stream.globalReservedMinHeight = 0;
    __dbgEmit('GOD', '_streamRebuildGlobalBreakPointsIfReady', 'God-view model rebuilt', {
      globalH: totalH,
      gH,
      dH,
      cats: exactBp.length,
      groups: state.streamCategoryGroups.length,
    });
  }

  // ════════════════════════════════════════════════
  // ★★★ 新架构：将「全量缓存」streamAllGoodsByCat → 重建 mainList（按分类顺序平铺）
  //   并重建 categoryBreakPoints 用于高亮 fallback
  // ════════════════════════════════════════════════
  function _streamFlushAllCachedGoodsIntoMainList(opts = {}) {
    const mustIncludeCatIdx = Number.isFinite(opts?.mustIncludeCatIdx)
      ? Number(opts.mustIncludeCatIdx)
      : -1;
    const L = state.categoryList.length;
    if (!L) return;
    const gH = Math.max(80, Number(state.streamUnitGoodsHeight || STREAM.EST_GOODS_HEIGHT));
    const dH = Math.max(50, Number(state.streamUnitDividerHeight || STREAM.EST_DIVIDER_HEIGHT));

    // ① 先扫一遍：已加载分类的范围 [minLoadedCatIdx..maxLoadedCatIdx]
    let minLoadedCatIdx = L;
    let maxLoadedCatIdx = -1;
    for (let i = 0; i < L; i++) {
      const catMap = state.streamAllGoodsByCat.get(i);
      const loaded = state.streamCatLoaded.get(i);
      const hasGoods = catMap && catMap.size > 0;
      if (hasGoods || loaded) {
        if (i < minLoadedCatIdx) minLoadedCatIdx = i;
        if (i > maxLoadedCatIdx) maxLoadedCatIdx = i;
      }
    }
    // ★ FIX R2：mustIncludeCatIdx 强制 expand 区间边界（保证 targetIdx 的 marker 一定进 mainList
    if (mustIncludeCatIdx >= 0 && mustIncludeCatIdx < L) {
      if (minLoadedCatIdx > mustIncludeCatIdx) minLoadedCatIdx = mustIncludeCatIdx;
      if (maxLoadedCatIdx < mustIncludeCatIdx) maxLoadedCatIdx = mustIncludeCatIdx;
    }
    if (minLoadedCatIdx > maxLoadedCatIdx) {
      minLoadedCatIdx = state.activeMenu;
      maxLoadedCatIdx = state.activeMenu;
    }

    // ② 只在 paddingTop 中预留「[0..minLoadedCatIdx-1]」未加载分类的虚拟高
    //    - 没加载到第 0 类时：paddingTop = Σ 0..(min-1) 的 (dH + count*gH) → 让你能向上滑，不撞 scrollTop=0 墙
    //    - 已加载到第 0 类时：minLoadedCatIdx=0 → paddingTop=0 → 不留任何顶部空白
    let virtualTopPadH = 0;
    if (
      state.streamCatBreakPointsExact &&
      state.streamCatBreakPointsExact.length === L &&
      minLoadedCatIdx > 0
    ) {
      const bpAtMin = state.streamCatBreakPointsExact[minLoadedCatIdx];
      virtualTopPadH = Math.max(0, Number(bpAtMin?.startOffset || 0));
    } else if (minLoadedCatIdx > 0) {
      for (let i = 0; i < minLoadedCatIdx; i++) {
        const cat = state.categoryList[i];
        let count = 5;
        const group = Array.isArray(state.streamCategoryGroups)
          ? state.streamCategoryGroups.find((g) => Number(g.categoryId) === Number(cat?.id))
          : null;
        if (group) count = Number(group.count || count);
        virtualTopPadH += dH + count * gH;
      }
    }
    state.stream.dynamicTopPadding = virtualTopPadH;
    // 用户明确说"不预留每个类目全部高度" → 彻底取消全局 minHeight
    state.stream.globalReservedMinHeight = 0;

    // ③ 仅平铺 [minLoadedCatIdx..maxLoadedCatIdx] 范围（marker+goods 连续，不乱加空 marker 给还没加载的分类
    const newList = [];
    const newBp = [];
    let runningOffset = virtualTopPadH;
    for (let i = minLoadedCatIdx; i <= maxLoadedCatIdx; i++) {
      const cat = state.categoryList[i];
      if (!cat) continue;
      const catMap = state.streamAllGoodsByCat.get(i);
      const hasGoods = catMap && catMap.size > 0;
      const markerIdx = newList.length;
      const markerId = '__divider_' + i + '_stable';
      newList.push({
        __streamKey: markerId,
        id: markerId,
        _type: MARKER_TYPE,
        _$catIdx: i,
        categoryId: Number(cat.id || 0),
        name: cat.name || '',
        bannerPicUrl: state.bannerPicUrl || '',
      });
      newBp.push({
        catIdx: i,
        itemIndex: markerIdx,
        approxScrollTop: runningOffset,
      });
      runningOffset += dH;
      if (hasGoods) {
        const arr = Array.from(catMap.values()).sort(
          (a, b) => Number(a?.id || 0) - Number(b?.id || 0),
        );
        for (let gi = 0; gi < arr.length; gi++) {
          const g = arr[gi];
          newList.push({
            ...g,
            _type: GOODS_TYPE,
            _$catIdx: i,
            __streamKey: 'g_' + i + '_' + (g?.id || gi),
          });
          runningOffset += gH;
        }
      }
    }
    state.pagination.prependList = [];
    state.pagination.mainList = newList;
    state.pagination.list = newList;
    state.categoryBreakPoints = newBp.sort(
      (a, b) => Number(a.approxScrollTop || 0) - Number(b.approxScrollTop || 0),
    );
    state.topDisplayedCategoryIdx = _clamp(
      state.topDisplayedCategoryIdx,
      minLoadedCatIdx,
      maxLoadedCatIdx,
    );
    if (state.virtualActiveMenu < maxLoadedCatIdx) state.virtualActiveMenu = maxLoadedCatIdx;
    if (state.activeMenu < minLoadedCatIdx) state.activeMenu = minLoadedCatIdx;
    if (state.activeMenu > maxLoadedCatIdx) state.activeMenu = maxLoadedCatIdx;
    state.pagination.total = newList.length;

    // hasMoreHead/Tail 重算（更精确：比 min 还小的分类有没有未完全加载
    state.stream.hasMoreHead = false;
    for (let i = 0; i < minLoadedCatIdx; i++) {
      const catMap = state.streamAllGoodsByCat.get(i);
      const fullLoaded = state.streamCatLoaded.get(i);
      const count = catMap?.size || 0;
      if (!count || !fullLoaded) {
        state.stream.hasMoreHead = true;
        break;
      }
    }
    state.stream.hasMoreTail = false;
    for (let i = maxLoadedCatIdx; i < L; i++) {
      const catMap = state.streamAllGoodsByCat.get(i);
      const fullLoaded = state.streamCatLoaded.get(i);
      const count = catMap?.size || 0;
      if (!count || !fullLoaded) {
        state.stream.hasMoreTail = true;
        break;
      }
    }
    // ★★★ 最终兜底（防止尾部大面积空白）：
    // 已经加载到最后一个分类（maxLoadedCatIdx == L-1）且 hasMoreTail=false →
    //  1) 再强制清零 globalReservedMinHeight（避免双线程竞态遗留 min-height）
    //  2) 把 dynamicTopPadding 再约束为「仅 0..minLoadedCatIdx-1 精准累加」
    //  3) 若 minLoadedCatIdx=0 已加载第 0 类 → 动态顶部必须为 0，顶部/底部都不留白
    if (maxLoadedCatIdx === L - 1 && !state.stream.hasMoreTail) {
      state.stream.globalReservedMinHeight = 0;
      if (minLoadedCatIdx <= 0) {
        state.stream.dynamicTopPadding = 0;
      }
    }
    if (minLoadedCatIdx <= 0) {
      state.stream.dynamicTopPadding = 0;
    }
    __dbgEmit('FLUSH', '_streamFlushAllCachedGoodsIntoMainList', 'Rebuilt mainList from cache', {
      listLen: newList.length,
      minCat: minLoadedCatIdx,
      maxCat: maxLoadedCatIdx,
      padTop: virtualTopPadH,
      hasMoreHead: state.stream.hasMoreHead,
      hasMoreTail: state.stream.hasMoreTail,
    });
  }

  // ★ 存入缓存（去重）且刷新 mainList（非破坏性追加）
  function _streamCacheGoodsForCat(catIdx, goodsArr) {
    if (!Array.isArray(goodsArr) || !goodsArr.length) return 0;
    if (!state.streamAllGoodsByCat.has(catIdx)) state.streamAllGoodsByCat.set(catIdx, new Map());
    const m = state.streamAllGoodsByCat.get(catIdx);
    let added = 0;
    for (const g of goodsArr) {
      const id = Number(g?.id || 0);
      if (!id || m.has(id)) continue;
      m.set(id, g);
      added++;
    }
    return added;
  }

  // ════════════════════════════════════════════════
  // ════════════════════════════════════════════════
  // ★★★ 公共跳转：切类 / CACHE HIT / CACHE MISS → 统一走这里双保险
  //   主方案：nextTick 写 rightScrollIntoViewId = '__divider_${catIdx}_stable'（小程序原生，抗竞态）
  //   次方案：150ms 后"先清空再写入同样的 id"（双脉冲触发，消动态 marker 首次不生效机问题）
  //   ⚠️ 彻底移除「forceNextScrollTop + 220ms 归零」兜底——是导致"先正确再顶飞"的直接元凶
  // ════════════════════════════════════════════════
  function _streamJumpToCatIdx(catIdx, _opts = {}) {
    const L = state.categoryList.length;
    if (!L || catIdx < 0 || catIdx >= L) return;
    const markerId = '__divider_' + catIdx + '_stable';
    // 先清 + forceNextScrollTop=0 双保险（不留下任何会把你滚到 0 的变量残余）
    state.rightScrollIntoViewId = '';
    state.stream.forceNextScrollTop = 0;
    // 第一脉冲：nextTick 写 → 对应"第一时间准确滚动到该区域"的肉眼第一帧
    nextTick(() => {
      state.rightScrollIntoViewId = markerId;
    });
    // 第二脉冲：150ms 后再次"空→值"触发，完全不涉及 scroll-top prop，不会顶飞
    setTimeout(() => {
      state.rightScrollIntoViewId = '';
      nextTick(() => {
        state.rightScrollIntoViewId = markerId;
      });
    }, 150);
  }

  const state = reactive({
    style: 'first_two',
    categoryList: [],
    activeMenu: 0,
    pendingCategoryId: null,

    pagination: {
      prependList: [],
      mainList: [],
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 5,
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
    _hlLastDomScheduledAt: 0,
    _hlLastDomAppliedAt: 0,
    categoryBreakPoints: [],
    enableSeamless: true,
    enableStream: STREAM.ENABLE,
    // ════════════════════════════════════════════════
    // ★★★ 新增：上帝视角（God-View）全局建模 + 全量缓存
    // ════════════════════════════════════════════════
    // categoryGroups 原始值（首次 anchor 接口返回）
    streamCategoryGroups: [], // [{ categoryId, count, total }] 原始后端数组
    streamCategoryGroupMap: new Map(), // catIdx => { categoryId, count, total }
    streamUnitMetricsReady: false, // 真实单元高度是否已拿到（子组件 mounted 后返回）
    streamUnitGoodsHeight: 260, // 真实测量 = 单卡片高（从子组件 getUnitMetrics 拿
    streamUnitDividerHeight: 255, // 真实测量 = 分类分界线（含 banner
    // ★★ 全局精确断点（由 groups × 真实单元高 计算，首次计算后永不更改（只要 groups 不换
    //   -> 这是「精确预留空间」与「0 跳动」的基石
    streamCatBreakPointsExact: [], // [{ catIdx, startOffset, goodsCount, endOffset }]
    streamGlobalTotalHeight: 0, // 全部分类累加后的总高 = minContentHeight
    // ★★ 全量缓存（永不清空！用户从第 3 类滑回第 1 类再切回第 3 类 → 全内存复用）
    //    key = catIdx, value = Map<goodsId, goodsRaw>
    streamAllGoodsByCat: new Map(),
    // 标记该分类是否已完全加载（用于避免重复请求
    streamCatLoaded: new Map(), // catIdx => bool
    // 记录每个 cat 的 cursorId（方便后续 cursor 定位加载
    streamCatFirstCursor: new Map(), // catIdx => 最顶商品 id (用于补上方
    streamCatLastCursor: new Map(), // catIdx => 最底商品 id (用于补下方
    stream: {
      dynamicTopPadding: 0,
      globalReservedMinHeight: 0, // 一次性写死的 minHeight（=streamGlobalTotalHeight
      prependHeight: 0,
      headCursorId: null, // 当前已加载窗口在全流中的最 HEAD 商品 id（下一次 direction=up 就传这个）
      tailCursorId: null, // 当前已加载窗口在全流中的最 TAIL 商品 id（下一次 direction=down 就传这个）
      hasMoreHead: true, // HEAD 方向还有更多（逆向方向）
      hasMoreTail: true, // TAIL 方向还有更多（正向方向）
      isLoadingHead: false, // 正在 direction=up prepend 加载
      isLoadingTail: false, // 正在 direction=down append 加载
      isLoadingAnchor: false,
      // prepend scrollTop 补偿用的双向绑定值（因为 uni.pageScrollTo 对 scroll-view 内部无效，改通过 :scroll-top prop 精准设置）
      scrollTopPinch: 0,
      forceNextScrollTop: 0, // 0=忽略，>0=下一帧立刻 scroll-view 滚到这个值
      // ★★★ 防抖动：标记用户是否正在拖动 scroll-view
      // 拖动期间 forceNextScrollTop 临时不生效（避免 prop 抖动）
      _isUserTouching: false,
      // ════════════════════════════════════════════════
      // 防误触发三剑客（nearHead/nearTail 乱撞）
      // ════════════════════════════════════════════════
      // anchor / scroll-into-view 结束时刻，后面 N ms 内 @scroll 事件全部忽略
      lastAnchorSettledAt: 0,
      // 上一次 @scroll 的 scrollTop（+ 方向）用于算 scrollTop 连续增减方向
      prevScrollTop: 0,
      prevScrollDir: '', // 'headward'(往列表顶走/手指向下滑) | 'tailward'(往列表底走/手指向上滑) | ''
      prevScrollChangedAt: 0,
      // 短内容自动补页只在用户真实触碰过右侧列表后才允许触发；
      // 避免点击切类后的静止态被 anchor 渲染误判为“需要立刻自动补页”。
      allowShortContentAutoLoad: false,
      // perCat 粒度元信息（Workaround R4：补 isTailComplete/isHeadComplete）
      perCatStreamMeta: new Map(), // catIdx => { loadedHeadCount, loadedTailCount, headComplete, tailComplete, firstSeenId, lastSeenId }
      // 累计 headward/tailward 位移（≥ MIN_XXX 才算真实滑动）
      _headCumulativeDelta: 0,
      _tailCumulativeDelta: 0,
      // bp 重采样 debounce（滑动过程中 120ms 重采样一次 exact 值，避免拍脑袋 250/180 估算导致高亮永远不准）
      _lastResampleAt: 0,
    },
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
    // Stream 双向模式：t 可以比 a 小（逆向滑到上一个分类），也可以比 v 大（head 方向 prepend 了更前的分类）
    let ok;
    if (state.enableStream) {
      ok = 0 <= a && a < L && 0 <= t && t < L && 0 <= v && v < L;
    } else {
      ok = 0 <= a && a <= t && t <= v && v < L;
    }
    if (!ok) {
      // eslint-disable-next-line no-console
      console.warn('[CAT_INVARIANT_VIOLATION@' + tag + ']', {
        a,
        t,
        v,
        L,
        stream: state.enableStream,
      });
      const maxV = L - 1;
      a = _clamp(a, 0, maxV);
      t = _clamp(t, 0, maxV);
      v = _clamp(v, 0, maxV);
      if (!state.enableStream) {
        t = _clamp(t, Math.max(0, a), Math.min(maxV, v));
        a = _clamp(a, 0, Math.min(maxV, t));
      }
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
    return state.categoryList[_clamp(idx, 0, Math.max(0, state.categoryList.length - 1))] || null;
  }

  // ────────────────── Stream Workaround Helper 3 件套 ──────────────────

  // Workaround R4：扫一遍 flat list，按相邻 categoryId 切 bucket
  // 切出分段，返回 [{ categoryId, range:[s,e], count, headComplete?, tailComplete? }]
  function _streamSliceBucketsFromFlatList(list) {
    const buckets = [];
    if (!Array.isArray(list) || list.length === 0) return buckets;
    let cur = list[0]?.categoryId;
    let s = 0;
    for (let i = 1; i < list.length; i++) {
      const c = list[i]?.categoryId;
      if (c !== cur) {
        buckets.push({
          categoryId: cur,
          range: [s, i - 1],
          count: i - s,
        });
        cur = c;
        s = i;
      }
    }
    buckets.push({
      categoryId: cur,
      range: [s, list.length - 1],
      count: list.length - s,
    });
    return buckets;
  }

  // Workaround R1：按「钉死的方向语义」用本次响应更新双端 cursor + hasMore
  // 场景标签 scene ∈ 'anchor' | 'down_append_tail' | 'up_prepend_head'
  //   anchor:        首屏冷启动（后端无 direction，list 天然 HEAD→TAIL）
  //   down_append_tail: scrolltolower，用户想"向下滚加载更多（TAIL 方向）" → 传 direction=down
  //   up_prepend_head:  撞顶，用户想"向上滑加载上一分类/上一页（HEAD 方向）" → 传 direction=up
  function _streamUpdateCursorsAfterResp(list, scene, hasMore, hasMoreOpposite) {
    if (!Array.isArray(list) || list.length === 0) {
      if (scene === 'down_append_tail') state.stream.hasMoreTail = false;
      if (scene === 'up_prepend_head') state.stream.hasMoreHead = false;
      return;
    }
    const firstId = list[0]?.id; // = 本批返回在全流中的最 HEAD 商品
    const lastId = list[list.length - 1]?.id; // = 本批返回在全流中的最 TAIL 商品
    // ── anchor ──
    if (scene === 'anchor') {
      // 后端无 direction 语义：返回 HEAD→TAIL（和自然浏览顺序一致）
      // → hasMore = TAIL 端（下）；hasMoreOpposite = HEAD 端（上）= 正好和语义表一致！
      if (firstId != null) state.stream.headCursorId = firstId;
      if (lastId != null) state.stream.tailCursorId = lastId;
      state.stream.hasMoreTail = !!hasMore;
      state.stream.hasMoreHead =
        hasMoreOpposite !== undefined && hasMoreOpposite !== null ? !!hasMoreOpposite : true;
      return;
    }
    // ── down_append_tail：传后端 direction=down，加载「更靠 TAIL 端的记录」──
    //   hasMore = 当前端（TAIL）还有；hasMoreOpposite = 反方向（HEAD）还有
    if (scene === 'down_append_tail') {
      if (lastId != null) state.stream.tailCursorId = lastId;
      state.stream.hasMoreTail = !!hasMore;
      if (hasMoreOpposite !== undefined && hasMoreOpposite !== null) {
        state.stream.hasMoreHead = !!hasMoreOpposite;
      }
      return;
    }
    // ── up_prepend_head：传后端 direction=up，加载「更靠 HEAD 端的记录」──
    //   hasMore = 当前端（HEAD）还有；hasMoreOpposite = 反方向（TAIL）还有
    if (scene === 'up_prepend_head') {
      if (firstId != null) state.stream.headCursorId = firstId;
      state.stream.hasMoreHead = !!hasMore;
      if (hasMoreOpposite !== undefined && hasMoreOpposite !== null) {
        state.stream.hasMoreTail = !!hasMoreOpposite;
      }
    }
  }

  // perCat stream 粒度元信息（Workaround R4：补 isHeadComplete / isTailComplete）
  function _streamEnsureMetaForCat(catIdx) {
    const i = _clamp(catIdx, 0, Math.max(0, state.categoryList.length - 1));
    if (!state.stream.perCatStreamMeta.has(i)) {
      state.stream.perCatStreamMeta.set(i, {
        loadedHeadCount: 0, // 已从头部逆向加载的商品数（不含首屏 mid）
        loadedTailCount: 0, // 已从尾部正向加载的商品数（不含首屏 mid）
        headComplete: false, // 该分类头部是否已完整（空了）
        tailComplete: false, // 该分类尾部是否已完整
        firstSeenId: null, // 首屏里该分类第一条商品 id（用于 head 方向 cursor 回传兜底）
        lastSeenId: null, // 首屏里该分类最后一条商品 id
      });
    }
    return state.stream.perCatStreamMeta.get(i);
  }

  // Workaround R5：找定位分类首条在 list 中的 index
  // 兜底逻辑：找不到 → 0；有 categoryId 相同的多条不连续 → 只取第一段
  function _streamFindAnchorFirstIndex(list, targetCategoryId) {
    if (!Array.isArray(list) || list.length === 0) return 0;
    const id = Number(targetCategoryId);
    // 找到第一段 categoryId === id 的起始 index
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i]?.categoryId) === id) return i;
    }
    // 完全找不到（R2 交织风险：categoryId 不在返回结果 → fallback 0
    // eslint-disable-next-line no-console
    console.warn(
      '[STREAM_WARN] anchor categoryId=',
      targetCategoryId,
      '不在 stream 返回结果中，fallback 到 index=0',
    );
    return 0;
  }

  // 构造 categoryIds：传入整个左侧分类的 id 数组（按左栏顺序，保证 FIELD 排序优先级正确）
  function _streamAllCategoryIds() {
    return state.categoryList.map((c) => Number(c.id)).filter((id) => Number.isFinite(id));
  }

  // DOM helper：给 item 算它在模板里实际渲染的 DOM id（和 second-one.vue 的 :id 严格对齐）
  //   - 如果有 __streamKey → 就是 DOM id（divider marker 永远走这条）
  //   - 否则 goods：item.id 拼 `gi_${id}`（和 second-one.vue :id="...||('gi_'+(item.id||idx))" 一致）
  function _streamDomIdForItem(item, fallbackIdx) {
    if (!item) return '';
    if (item.__streamKey) return item.__streamKey;
    if (item._type === MARKER_TYPE) return 'dm_' + (item.id || fallbackIdx || 0);
    return 'gi_' + (item.id || fallbackIdx || 0);
  }

  // DOM helper：量取「指定 DOM id 的 item」相对于 scroll-view 容器（.goods-list-box 内部）的 content offsetTop
  async function _streamQueryItemOffsetTopByDomId(domId) {
    if (
      !domId ||
      !secondOneRef.value ||
      typeof secondOneRef.value.queryItemOffsetTop !== 'function'
    )
      return 0;
    try {
      const offsetTop = await secondOneRef.value.queryItemOffsetTop(domId);
      return Math.max(0, Number(offsetTop) + Number(state.lastScrollTop || 0));
    } catch (e) {
      return 0;
    }
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
    state.pagination.mainList = [];
    state.pagination.prependList = [];
    state.pagination.pageNo = 1;
    state.categoryBreakPoints = [];
    state.rightScrollIntoViewId = '';
    // ★ FIX R1：彻底移除"根据 bp[targetIdx].startOffset 预设 paddingTop"的单帧假值
    // dynamicTopPadding 完全交给 flush 去根据 minLoadedCatIdx 精确重算，不打架
    state.stream.dynamicTopPadding = 0;
    state.stream.prependHeight = 0;

    // 重置 cursors & flags
    state.stream.headCursorId = null;
    state.stream.tailCursorId = null;
    state.stream.hasMoreHead = targetIdx > 0;
    state.stream.hasMoreTail = targetIdx < state.categoryList.length - 1;
    state.stream.isLoadingHead = false;
    state.stream.isLoadingTail = false;
    state.stream.prependHeight = 0;

    state.leftScrollIntoViewId = 'menu-item-' + targetIdx;
    // ★ FIX R2：flush 时强制 expand 区间"至少包含 targetIdx"，保证其 marker 进 mainList
    _streamFlushAllCachedGoodsIntoMainList({ mustIncludeCatIdx: targetIdx });
    // Stream 状态同步重置
    state.stream.headCursorId = null;
    state.stream.tailCursorId = null;
    state.stream.isLoadingHead = false;
    state.stream.isLoadingTail = false;
    state.stream.isLoadingAnchor = false;
    state.stream.scrollTopPinch = 0;
    state.stream.forceNextScrollTop = 0;
    // 防误触发：anchor 开始，把「方向记忆 + 上次 settledAt」归零
    state.stream.lastAnchorSettledAt = 0;
    state.stream.prevScrollTop = 0;
    state.stream.prevScrollDir = '';
    state.stream.prevScrollChangedAt = 0;
    state.stream.allowShortContentAutoLoad = false;
    state._hlLastDomScheduledAt = 0;
    state._hlLastDomAppliedAt = 0;
  }

  function _setActiveMenu(idx, source) {
    const L = state.categoryList.length;
    if (!L) return;
    const clamped = _clamp(idx, 0, L - 1);
    if (source === 'click') {
      _resetSeamlessStateForClick(clamped);
      if (state.enableStream) {
        _streamStartAnchorHydration(clamped);
      } else {
        getGoodsList(clamped);
      }
      _assertInvariant('_setActiveMenu:click');
      return;
    }
    state.activeMenu = clamped;
    state.leftScrollIntoViewId = 'menu-item-' + clamped;
    if (state.topDisplayedCategoryIdx !== clamped) state.topDisplayedCategoryIdx = clamped;
    if (state.virtualActiveMenu < clamped) state.virtualActiveMenu = clamped;
    // #region debug-point C:active-menu-switch
    __dbgEmit('C', 'pages/index/category.vue:_setActiveMenu', '[DEBUG] active menu switch', {
      source: source || '',
      clamped,
      activeMenu: state.activeMenu,
      topDisplayedCategoryIdx: state.topDisplayedCategoryIdx,
      virtualActiveMenu: state.virtualActiveMenu,
    });
    // #endregion
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
      state.pagination.mainList.push({
        ...it,
        _type: GOODS_TYPE,
        _$catIdx: catIdx,
        __streamKey: 'g_' + catIdx + '_' + state.pagination.mainList.length + '_' + (it?.id || ''),
      });
    }
    state.pagination.list = [...state.pagination.prependList, ...state.pagination.mainList];
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
    // ══════════════════════════════════════════════════════════════
    // 高亮核心语义（对应你的截图 case）：
    //   不直接用 scrollTop，而是 scrollTop + HL_OFFSET(220px = 一个完整 banner+divider 高度)
    //   高亮「最后一条 approxScrollTop ≤ target」的分类
    //
    // → 效果：分类 banner 没有「完整过顶 220px」，左栏高亮绝不切下一个分类
    //   解决你截图的现象：右栏顶部明明还显示着「药食同源 86 banner」，
    //   左栏高亮却已经跳到下一个分类「仙草文创 87」
    // ══════════════════════════════════════════════════════════════
    const HL_OFFSET = Number(STREAM?.HIGHLIGHT_LEADING_OFFSET_PX || 220);
    // 任何调用方传的 bp 数组顺序可能乱，先内部 sort 升序 approx，保证二分安全
    const sorted = [...breakPoints].sort(
      (a, b) => Number(a?.approxScrollTop || 0) - Number(b?.approxScrollTop || 0),
    );
    const target = (scrollTop || 0) + HL_OFFSET;
    let lo = 0;
    let hi = sorted.length - 1;
    let ans = activeMenu;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const bp = sorted[mid];
      if (Number(bp?.approxScrollTop || 0) <= target) {
        ans = bp.catIdx;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    // ── 诊断日志（新增 HL_OFFSET/target 字段，一眼能定位是不是偏移量写大/写小了）
    // eslint-disable-next-line no-console
    console.debug(
      '[BP_SYNC] scrollTop=' +
        (scrollTop || 0).toFixed(1) +
        ' HL_OFFSET=' +
        HL_OFFSET +
        ' target=' +
        target.toFixed(1) +
        ' activeMenu=' +
        activeMenu +
        ' → selected=' +
        ans +
        ' bp=[' +
        sorted
          .map((bp) => 'c' + bp.catIdx + '@' + (Number(bp.approxScrollTop) || 0).toFixed(0))
          .join(', ') +
        ']',
    );
    return ans;
  }

  function onRightScroll(e) {
    const now = Date.now();
    state.lastScrollTop = e.detail.scrollTop || 0;
    // ── bp 精确采样 debounce（= 高亮死卡第 2 类的根因克星）
    //    滑动过程中每 120ms 重采样一次 exactScrollTop，彻底替换拍脑袋 250/180
    //    没有 await（@scroll 是同步事件，我们 fire-and-forget，采样完下一帧生效）
    if (state.enableStream) {
      const lastRs = Number(state.stream._lastResampleAt || 0);
      if (now - lastRs > 120) {
        state.stream._lastResampleAt = now;
        _streamResampleBreakPointsExact()
          .then(() => {
            // 精确采样完下一帧再重算一次高亮（避免采样完但 lastScrollTop 没更新导致高亮算的是 old bp）
            nextTick(() => _syncTopDisplayedAndActiveMenuFromScroll());
          })
          .catch(() => {});
      }
    }
    // ── Stream 模式：双向临近检测 ──
    if (state.enableStream) {
      const viewportH = Number(menuScrollHeight.value || 0);
      const contentH = state._lastMeasureContentH || 0;
      const prependH = state.stream.prependHeight || 0;
      const topPadding = Number(state.stream.dynamicTopPadding || 0);
      const th = _streamTriggerPx();

      // ── v2 坐标系（用户要求版）：nearHead 判定
      // contentStart = topPadding = 还没加载到第 0 类时，为"比 minLoadedCatIdx 更小的未加载分类"的虚拟占位高
      // （prepend 加载到更小分类后，minLoaded 变小 → topPadding 自动缩减 → nearHead 触发线自动贴合真实内容起点
      const contentStart = Math.max(0, topPadding);
      const nearHead = viewportH > 0 && state.lastScrollTop <= contentStart + th + 200;

      const insideAnchorWindow =
        state.stream.lastAnchorSettledAt > 0 &&
        now - state.stream.lastAnchorSettledAt < STREAM.IGNORE_N_SCROLL_AFTER_ANCHOR_MS;

      // nearTail：scrollTop + viewport >= (topPadding + 已渲染内容真实高) - 阈值
      // ⚠️ 此处 contentH 来自 second-one.measureContentHeight，返回的是 .goods-item-box 整体高度（不含 paddingTop）
      //    所以从 scroll-view 的 0 坐标看，内容尾部 = topPadding + contentH
      let nearTail = false;
      if (viewportH > 0) {
        if (contentH > 0) {
          nearTail = state.lastScrollTop + viewportH >= Math.max(0, topPadding) + contentH - th;
        } else {
          nearTail =
            state.pagination.list.length > 0 &&
            state.lastScrollTop + viewportH >=
              Math.max(0, topPadding) +
                state.pagination.list.length *
                  Number(state.streamUnitGoodsHeight || STREAM.EST_GOODS_HEIGHT) -
                th;
        }
      }

      // ── 安全回弹锁 (Safety Buffer Clamp) ──
      // 彻底移除：这是导致滑动冲突和跳动的元凶
      /*
      const isSettled =
        !state.stream.isLoadingHead && !state.stream.isLoadingAnchor && !insideAnchorWindow;
      if (isSettled && state.lastScrollTop < contentStart - 100) {
        state.stream.forceNextScrollTop = contentStart;
        setTimeout(() => {
          state.stream.forceNextScrollTop = 0;
        }, 100);
      }
      */

      // ── 防误触发(A)：定位窗口内（anchor 结束后 <700ms）仍然允许触发加载，但过滤「定位伪 scrollTop=0」事件
      //    如果 prevScrollTop 很大突然变 0，且距 anchor < 700ms → 判为定位伪事件 skip
      const isAnchorPseudoZero =
        insideAnchorWindow && state.stream.prevScrollTop > th * 2 && state.lastScrollTop < 2;
      // ── 防误触发(B/C)：更新 scrollTop 增减方向 + 累计位移（累计 ≥ MIN_XXX 才算真实滑动）
      const delta = state.lastScrollTop - state.stream.prevScrollTop;
      if (!isAnchorPseudoZero && Math.abs(delta) >= 2) {
        state.stream.prevScrollTop = state.lastScrollTop;
        if (delta < 0) {
          // headward（往列表顶部方向 / 手指向下滑）
          if (state.stream.prevScrollDir !== 'headward') state.stream._headCumulativeDelta = 0;
          state.stream._headCumulativeDelta =
            Number(state.stream._headCumulativeDelta || 0) + Math.abs(delta);
          state.stream._tailCumulativeDelta = 0;
          state.stream.prevScrollDir = 'headward';
        } else {
          // tailward（往列表尾部方向 / 手指向上滑）
          if (state.stream.prevScrollDir !== 'tailward') state.stream._tailCumulativeDelta = 0;
          state.stream._tailCumulativeDelta =
            Number(state.stream._tailCumulativeDelta || 0) + Math.abs(delta);
          state.stream._headCumulativeDelta = 0;
          state.stream.prevScrollDir = 'tailward';
        }
        state.stream.prevScrollChangedAt = now;
      }
      const dirAge = now - state.stream.prevScrollChangedAt;
      const headwardEnough =
        !isAnchorPseudoZero &&
        state.stream.prevScrollDir === 'headward' &&
        Number(state.stream._headCumulativeDelta || 0) >= STREAM.MIN_HEAD_DECREASE_PX &&
        state.stream.prevScrollChangedAt > 0 &&
        dirAge < STREAM.HEAD_DIR_WINDOW_MS;
      const tailwardEnough =
        !isAnchorPseudoZero &&
        state.stream.prevScrollDir === 'tailward' &&
        Number(state.stream._tailCumulativeDelta || 0) >= STREAM.MIN_TAIL_INCREASE_PX &&
        state.stream.prevScrollChangedAt > 0 &&
        dirAge < STREAM.TAIL_DIR_WINDOW_MS;
      const canLoad =
        !state.stream.isLoadingHead && !state.stream.isLoadingAnchor && !state.stream.isLoadingTail;
      // #region debug-point A:scroll-metrics
      if (now - Number(__dbgState.scrollAt || 0) > 90) {
        __dbgState.scrollAt = now;
        __dbgEmit('A', 'pages/index/category.vue:onRightScroll', '[DEBUG] stream scroll metrics', {
          scrollTop: Number(state.lastScrollTop || 0),
          viewportH,
          contentH,
          triggerPx: th,
          nearHead,
          nearTail,
          prevScrollDir: state.stream.prevScrollDir || '',
          headwardEnough,
          tailwardEnough,
          isAnchorPseudoZero,
          activeMenu: state.activeMenu,
          topDisplayedCategoryIdx: state.topDisplayedCategoryIdx,
        });
      }
      // #endregion
      // ── 触发断言（+ 插入位置锁）：
      //    nearHead → 只能 prepend（加载更下面分类 = 列表 HEAD 端 = 插入到最前面）
      //    nearTail → 只能 append（加载更上面分类 = 列表 TAIL 端 = 插入到最后面）
      //    如果 nearHead 却走到 append（说明上面映射写错了）立刻 console.error 中断，防止方向混写
      if (nearHead && canLoad && headwardEnough) {
        if (state.stream.hasMoreHead) {
          __dbgEmit('STRM', 'onRightScroll', 'Triggering PrependHeadPage', {
            scrollTop: state.lastScrollTop,
            contentStart,
            prependH,
          });
          _streamPrependHeadPage();
        } else {
          // 触顶但无更多
          if (now - (state._lastHeadRefuseAt || 0) > 3000) {
            state._lastHeadRefuseAt = now;
            __dbgEmit('STRM', 'onRightScroll', 'Refused Prepend: hasMoreHead is FALSE', {
              scrollTop: state.lastScrollTop,
              contentStart,
            });
          }
        }
      } else if (
        nearTail &&
        state.stream.hasMoreTail &&
        canLoad &&
        (tailwardEnough || contentH <= viewportH + 16)
      ) {
        // eslint-disable-next-line no-console
        const list = state.pagination.list || [];
        const head2 = list
          .slice(0, 2)
          .map((it) =>
            it?._type === MARKER_TYPE
              ? 'M' + it._$catIdx
              : 'c' + (it.categoryId || '?') + '#' + it.id,
          )
          .join(',');
        const tail2 = list
          .slice(Math.max(0, list.length - 2))
          .map((it) =>
            it?._type === MARKER_TYPE
              ? 'M' + it._$catIdx
              : 'c' + (it.categoryId || '?') + '#' + it.id,
          )
          .join(',');
        console.debug(
          '[STREAM_ASSERT_INSERT] nearTail(TAIL端 append) head=[' +
            head2 +
            '] tail=[' +
            tail2 +
            '] st=' +
            state.lastScrollTop.toFixed(1),
        );
        _streamAppendTailPage();
      }
    }
    // 高亮同步：每次 @scroll 都根据 scrollTop 重算高亮（bp 会在 debounce 采样 exact 后再重算一次）
    _syncTopDisplayedAndActiveMenuFromScroll();
  }

  // ── 新高亮：直接取 second-one 视口顶部第一个可见条目的 categoryId ──
  //    左侧高亮不再看取样区域占比，而是严格跟随顶部真实条目所属分类。
  async function _streamSampleHighlightByViewportDom() {
    if (!secondOneRef.value || typeof secondOneRef.value.queryTopItem !== 'function') return null;
    try {
      const res = await secondOneRef.value.queryTopItem();
      if (!res) return null;
      const { item: r, boxTop, boxBottom, edgeTop, visibleCount } = res;
      // #region debug-point B:top-item-sample
      if (Date.now() - Number(__dbgState.sampleAt || 0) > 90) {
        __dbgState.sampleAt = Date.now();
        __dbgEmit(
          'B',
          'pages/index/category.vue:_streamSampleHighlightByViewportDom',
          '[DEBUG] top item sampled',
          {
            boxTop,
            boxBottom,
            edgeTop,
            visibleCount,
            sampledCategoryId: Number(r?.categoryId || 0),
            sampledCatIdx: Number(r?.catIdx ?? -1),
            sampledTop: Number(r?.top || 0),
            sampledBottom: Number(r?.bottom || 0),
            sampledKind: r?.itemKind || '',
          },
        );
      }
      // #endregion
      return r;
    } catch (e) {
      return null;
    }
  }

  // 高亮刷新：压到接近逐帧的频率，保证左侧紧跟 second-one 顶部条目切换
  let _hlTimer = null;
  function _streamScheduleHighlight() {
    if (!state.enableSeamless) return;
    if (_hlTimer) return;
    state._hlLastDomScheduledAt = Date.now();
    _hlTimer = setTimeout(async () => {
      _hlTimer = null;
      const r = await _streamSampleHighlightByViewportDom();
      if (!r) return;
      state._hlLastDomAppliedAt = Date.now();
      let safeCatIdx = state.categoryList.findIndex(
        (cat) => Number(cat?.id) === Number(r.categoryId),
      );
      if (safeCatIdx < 0 && Number.isFinite(r.catIdx) && r.catIdx >= 0) {
        safeCatIdx = r.catIdx;
      }
      safeCatIdx = _clamp(safeCatIdx, 0, Math.max(0, state.categoryList.length - 1));
      // #region debug-point C:highlight-apply
      if (Date.now() - Number(__dbgState.highlightAt || 0) > 60) {
        __dbgState.highlightAt = Date.now();
        __dbgEmit(
          'C',
          'pages/index/category.vue:_streamScheduleHighlight',
          '[DEBUG] highlight apply',
          {
            categoryId: Number(r.categoryId || 0),
            safeCatIdx,
            itemKind: r.itemKind || '',
            itemTop: Number(r.top || 0),
            itemBottom: Number(r.bottom || 0),
            activeMenu: state.activeMenu,
            topDisplayedCategoryIdx: state.topDisplayedCategoryIdx,
          },
        );
      }
      // #endregion
      // eslint-disable-next-line no-console
      console.debug(
        '[HL_TOP_ITEM] categoryId=' +
          Number(r.categoryId) +
          ' catIdx=' +
          safeCatIdx +
          ' itemKind=' +
          (r.itemKind || '') +
          ' activeMenu=' +
          state.activeMenu +
          ' top=' +
          r.top.toFixed(1) +
          ' bottom=' +
          r.bottom.toFixed(1),
      );
      if (safeCatIdx !== state.topDisplayedCategoryIdx) {
        state.topDisplayedCategoryIdx = safeCatIdx;
        if (safeCatIdx !== state.activeMenu) _setActiveMenu(safeCatIdx, 'scroll');
      }
    }, 32);
  }

  // ── 高亮重算入口：如果 DOM 取样启用（默认启用）就 schedule；否则 fallback 走旧 bp 逻辑（兜底）
  function _syncTopDisplayedAndActiveMenuFromScroll(scrollTopOverride) {
    if (!state.enableSeamless) return;
    // 主流：走 DOM 取样（最准，和你看到的内容完全一致）
    _streamScheduleHighlight();
    // 兜底（万一 DOM 取样拿不到（如 H5 SSR 或 createSelectorQuery 异常），走旧 bp 逻辑）
    if (scrollTopOverride != null || state.categoryBreakPoints.length) {
      const st = Number(scrollTopOverride ?? state.lastScrollTop ?? 0);
      const displayed = _findDisplayedCatByBreakPoint(
        st,
        state.categoryBreakPoints,
        state.activeMenu,
      );
      const upperBound = state.enableStream
        ? state.categoryList.length - 1
        : state.virtualActiveMenu;
      const safe = _clamp(displayed, 0, upperBound);
      const domPending = !!_hlTimer || Date.now() - Number(state._hlLastDomScheduledAt || 0) < 300;
      const domApplied = Number(state._hlLastDomAppliedAt || 0) > 0;
      if (!domPending && !domApplied) {
        // 只有 DOM 取样尚未成功接管时，才允许 bp fallback 改高亮
        if (safe !== state.topDisplayedCategoryIdx) {
          state.topDisplayedCategoryIdx = safe;
          if (safe !== state.activeMenu) _setActiveMenu(safe, 'scroll');
        }
      }
    }
  }

  // 便捷函数：同时更新「lastScrollTop + forceNextScrollTop（短暂持有 1 帧供 :scroll-top prop 使用）+ 触发高亮重算」
  function _streamSetEffectiveScrollTop(effectiveScrollTop, opts) {
    const holdForce = opts?.holdForceNextFrame !== false;
    state.lastScrollTop = effectiveScrollTop;
    if (holdForce) state.stream.forceNextScrollTop = effectiveScrollTop;
    // 补偿那一刻立刻重跑高亮（不要等 debounce 110ms）
    _streamScheduleHighlight();
    // 同时立刻走 bp fallback（给 DOM 取样兜底）
    _syncTopDisplayedAndActiveMenuFromScroll(effectiveScrollTop);
  }

  function _pushCategoryDividerMarker(catIdx) {
    const cat = _catByIdxOrFirst(catIdx);
    const markerItemIdx = state.pagination.list.length;
    state.pagination.list.push({
      __streamKey: 'm_' + catIdx + '_' + markerItemIdx,
      id: '__divider_' + catIdx + '_' + markerItemIdx,
      _type: MARKER_TYPE,
      _$catIdx: catIdx,
      categoryId: Number(cat?.id || 0),
      name: cat?.name || '',
      bannerPicUrl: state.bannerPicUrl || '',
    });
    const viewportH = Number(menuScrollHeight.value || 0);
    const lowerThreshold = 50;
    const approxScrollTop = state.lastScrollTop + viewportH - lowerThreshold;
    state.categoryBreakPoints.push({
      catIdx,
      itemIndex: markerItemIdx,
      approxScrollTop: Math.max(0, approxScrollTop),
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
    // Stream 模式：正向 append 下一页（tail direction=down）
    if (state.enableStream) {
      _streamAppendTailPage();
      return;
    }
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

  function onOpenSearchPage() {
    sheep.$router.go('/pages/index/search');
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

  // ────────────────── Stream 三条主路径 ──────────────────

  // 路径 1：点击 tab 冷启动 anchor（三明治上下文）
  //   ★ 新架构：
  //     ① 先拿 groups → 建全局断点（God-view 建模，一次性留坑）
  //     ② 从 cache 中 flush 出已有的商品（避免白屏闪烁）
  //     ③ 只对「target 分类附近」未缓存的分类发 stream 请求拉数据
  //     ④ 新数据写入 cache → flush 回 mainList
  //     ⑤ 此时 paddingTop + scrollTop 的坐标系是 God-view 的绝对坐标，天然 0 跳动
  async function _streamStartAnchorHydration(targetIdx) {
    if (state.stream.isLoadingAnchor) return;
    const L = state.categoryList.length;
    if (!L) return;
    const targetCat = state.categoryList[targetIdx];
    if (!targetCat) return;

    _streamUpdateUnitMetricsFromChild(false);

    // ═══★ 新核心：CACHE HIT SHORTCUT（命中缓存直接跳断点，不发 HTTP）
    const targetCatMap = state.streamAllGoodsByCat.get(targetIdx);
    const hasCachedGoods = targetCatMap && targetCatMap.size > 0;
    const isCatFullyLoaded = !!state.streamCatLoaded.get(targetIdx);
    if (hasCachedGoods || isCatFullyLoaded) {
      __dbgEmit('HIT', '_streamStartAnchorHydration', 'CACHE HIT: skip HTTP anchor', {
        catIdx: targetIdx,
        loadedCount: targetCatMap?.size || 0,
        isFull: isCatFullyLoaded,
      });
      state.loadStatus = 'loading';
      // 再次 flush 必须 expand 至少包含 targetIdx marker（保证 DOM id 存在，scroll-into-view 才能命中
      _streamFlushAllCachedGoodsIntoMainList({ mustIncludeCatIdx: targetIdx });
      if (
        !state.streamCatBreakPointsExact ||
        state.streamCatBreakPointsExact.length !== state.categoryList.length
      ) {
        _streamRebuildGlobalBreakPointsIfReady();
      }
      // ═══★ FIX：双保险跳（scroll-into-view 主 + forceNextScrollTop nextTick 80ms 次
      _streamJumpToCatIdx(targetIdx);
      state.pagination.total = state.pagination.list.length;
      state.loadStatus = state.stream.hasMoreTail ? 'more' : 'noMore';
      state.virtualActiveMenu = Math.max(state.virtualActiveMenu, targetIdx);
      state.topDisplayedCategoryIdx = targetIdx;
      state.activeMenu = targetIdx;
      _syncTopDisplayedAndActiveMenuFromScroll(state.lastScrollTop);
      setTimeout(() => {
        let needPreHead = false;
        for (let i = 0; i < targetIdx; i++) {
          if (!state.streamCatLoaded.get(i)) {
            needPreHead = true;
            break;
          }
        }
        if (needPreHead && state.stream.hasMoreHead && !state.stream.isLoadingHead) {
          _streamPrependHeadPage({ isAutoPreload: true });
        }
        state.stream.lastAnchorSettledAt = Date.now();
        _streamResampleBreakPointsExact();
      }, 220);
      return;
    }

    // ═══★ CACHE MISS → 真发 anchor HTTP
    const categoryIds = _streamAllCategoryIds();
    state.stream.isLoadingAnchor = true;
    state.loadStatus = 'loading';
    try {
      const viewportH = Number(menuScrollHeight.value || 800);
      const perItemAvg =
        Number(state.streamUnitDividerHeight || STREAM.EST_DIVIDER_HEIGHT) +
        Number(state.streamUnitGoodsHeight || STREAM.EST_GOODS_HEIGHT);
      const itemsForTwoScreens = Math.ceil((viewportH * 2) / perItemAvg);
      const pageSize = Math.max(50, Math.min(STREAM.PAGE_N_MAX, itemsForTwoScreens * 3));
      const res = await SpuApi.getSpuStream({
        categoryId: Number(targetCat.id),
        categoryIds,
        keyword: state.keyword || undefined,
        pageSize,
      });
      if (!res || res.code !== 0) {
        state.stream.isLoadingAnchor = false;
        state.loadStatus = 'more';
        getGoodsList(targetIdx);
        return;
      }
      const list = Array.isArray(res.data?.list) ? res.data.list : [];
      const hasMore = !!res.data?.hasMore;
      const hasMoreOpposite = res.data?.hasMoreOpposite;

      if (Array.isArray(res.data?.categoryGroups) && res.data.categoryGroups.length) {
        state.streamCategoryGroups = res.data.categoryGroups;
        _streamRebuildGlobalBreakPointsIfReady();
      }
      _streamUpdateUnitMetricsFromChild(true);

      if (list.length) {
        const buckets = _streamSliceBucketsFromFlatList(list);
        for (const b of buckets) {
          const catIdx = state.categoryList.findIndex((c) => Number(c.id) === Number(b.categoryId));
          if (catIdx === -1) continue;
          const goodsSlice = list.slice(b.range[0], b.range[1] + 1);
          _streamCacheGoodsForCat(catIdx, goodsSlice);
          const group = Array.isArray(state.streamCategoryGroups)
            ? state.streamCategoryGroups.find((g) => Number(g.categoryId) === Number(b.categoryId))
            : null;
          const declared = group ? Number(group.count || 0) : 0;
          const per = _ensurePerCat(catIdx);
          if (!per.total && declared > 0) per.total = declared;
          per.loadedCount = Math.max(Number(per.loadedCount), goodsSlice.length);
          const fullLoaded =
            declared > 0 ? goodsSlice.length >= declared : goodsSlice.length < pageSize;
          if (fullLoaded) state.streamCatLoaded.set(catIdx, true);
          if (goodsSlice.length) {
            state.streamCatFirstCursor.set(
              catIdx,
              Number(goodsSlice[0]?.id ?? state.streamCatFirstCursor.get(catIdx) ?? 0),
            );
            state.streamCatLastCursor.set(
              catIdx,
              Number(
                goodsSlice[goodsSlice.length - 1]?.id ?? state.streamCatLastCursor.get(catIdx) ?? 0,
              ),
            );
          }
          const meta = _streamEnsureMetaForCat(catIdx);
          meta.loadedTailCount = Number(meta.loadedTailCount || 0) + goodsSlice.length;
          if (goodsSlice.length) {
            meta.firstSeenId = Number(goodsSlice[0]?.id) ?? meta.firstSeenId;
            meta.lastSeenId = Number(goodsSlice[goodsSlice.length - 1]?.id) ?? meta.lastSeenId;
          }
        }
        _streamUpdateCursorsAfterResp(list, 'anchor', hasMore, hasMoreOpposite);
      } else if (list.length === 0) {
        state.loadStatus = 'noMore';
        _streamUpdateCursorsAfterResp([], 'anchor', false, hasMoreOpposite);
      }

      // ═══★ flush + 强制 expand targetIdx marker，双保险跳
      _streamFlushAllCachedGoodsIntoMainList({ mustIncludeCatIdx: targetIdx });
      _streamJumpToCatIdx(targetIdx);

      state.pagination.total = state.pagination.list.length;
      state.loadStatus = state.stream.hasMoreTail ? 'more' : 'noMore';
      state.virtualActiveMenu = Math.max(
        state.virtualActiveMenu,
        Math.max(targetIdx, state.topDisplayedCategoryIdx),
      );
      state.topDisplayedCategoryIdx = targetIdx;
      state.activeMenu = targetIdx;
      _syncTopDisplayedAndActiveMenuFromScroll(state.lastScrollTop);

      nextTick(() => {
        setTimeout(() => {
          if (secondOneRef.value) {
            secondOneRef.value
              .measureUnitMetrics()
              .then(() => {
                _streamUpdateUnitMetricsFromChild(true);
              })
              .catch(() => {});
          }
          _streamResampleBreakPointsExact();
          _streamMeasureAllHeights();
          if (STREAM.AUTO_TRIGGER_IF_SHORT_CONTENT) {
            _streamAutoTriggerIfShortContent();
          }
          if (targetIdx > 0 && !state.stream.isLoadingHead) {
            let needPreload = false;
            for (let i = 0; i < targetIdx; i++) {
              if (!state.streamCatLoaded.get(i)) {
                needPreload = true;
                break;
              }
            }
            if (needPreload && state.stream.hasMoreHead) {
              _streamPrependHeadPage({ isAutoPreload: true });
            }
          }
          if (state.stream.hasMoreTail) {
            let needPreTail = false;
            for (let i = targetIdx; i < state.categoryList.length; i++) {
              if (!state.streamCatLoaded.get(i)) {
                needPreTail = true;
                break;
              }
            }
            if (needPreTail && !state.stream.isLoadingTail) {
              _streamAppendTailPage({ isAutoPreload: true });
            }
          }
          state.stream.lastAnchorSettledAt = Date.now();
          state.rightScrollIntoViewId = '';
        }, 280);
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[STREAM_ERR] anchor failed', e);
      state.loadStatus = 'more';
    } finally {
      state.stream.isLoadingAnchor = false;
    }
  }

  // 不满一屏兜底：内容高度 ≤ 视口高度 + BUFFER → 主动加载「缺少的那端」
  // （不满一屏时 scrollTop 永远 = 0 且用户手指继续向上滑不会触发 @scroll（橡皮筋/回弹），必须兜底）
  // BUFFER=40：兼容「2 banner + 2 条商品 ≈ 860px」 vs 视口 800px，860≤840=false 的边缘 case
  const SHORT_CONTENT_BUFFER_PX = 40;
  async function _streamAutoTriggerIfShortContent(forceLogTag) {
    if (!state.enableStream) return;
    if (state.stream.isLoadingHead || state.stream.isLoadingAnchor || state.stream.isLoadingTail)
      return;
    const userInitiated =
      forceLogTag === 'touchend' || forceLogTag === 'scroll' || forceLogTag === 'gesture';
    if (userInitiated) {
      state.stream.allowShortContentAutoLoad = true;
    } else if (!state.stream.allowShortContentAutoLoad) {
      return;
    }
    try {
      const viewportH = Number(menuScrollHeight.value || 0);
      const contentH = await _streamMeasureRightListContentHeight();
      if (!viewportH || !contentH) return;
      if (contentH > viewportH + SHORT_CONTENT_BUFFER_PX) return;
      // eslint-disable-next-line no-console
      console.debug(
        '[STREAM_AUTO_SHORT] contentH=' +
          contentH.toFixed(1) +
          ' viewportH=' +
          viewportH.toFixed(1) +
          ' hasMoreTail=' +
          state.stream.hasMoreTail +
          ' hasMoreHead=' +
          state.stream.hasMoreHead +
          ' tag=' +
          (forceLogTag || ''),
      );
      // 不满一屏：优先补 TAIL 端（= 上方分类 / 手指向上滑想看的）
      if (state.stream.hasMoreTail) {
        _streamAppendTailPage();
      } else if (state.stream.hasMoreHead) {
        _streamPrependHeadPage();
      }
    } catch (_) {
      /* ignore */
    }
  }

  // 不满一屏的橡皮筋兜底：用户手指碰了 scroll-view 上下滑橡皮筋（不触发 @scroll，只触发 touchEnd）→ 兜底触发出对应端
  function onRightScrollTouchMove() {
    if (!state.enableStream) return;
    state.stream._isUserTouching = true;
    _streamAutoTriggerIfShortContent('gesture');
  }

  function onRightScrollTouchEnd() {
    if (!state.enableStream) return;
    state.stream._isUserTouching = false;
    _streamAutoTriggerIfShortContent('touchend');
  }

  // 路径 2：正向 append（TAIL 方向，传后端 direction=down）
  //  新架构：请求到数据 → 写 cache → flush 重建 mainList；paddingTop/minHeight 不动
  async function _streamAppendTailPage(opts = {}) {
    if (state.stream.isLoadingTail || state.stream.isLoadingAnchor || state.stream.isLoadingHead)
      return;
    if (!state.stream.hasMoreTail) {
      state.loadStatus = 'noMore';
      return;
    }
    state.stream.isLoadingTail = true;
    __dbgEmit('D', 'pages/index/category.vue:_streamAppendTailPage', '[DEBUG] append start', {
      tailCursorId: Number(state.stream.tailCursorId || 0),
      hasMoreTail: !!state.stream.hasMoreTail,
      listLength: Array.isArray(state.pagination.list) ? state.pagination.list.length : 0,
      scrollTop: Number(state.lastScrollTop || 0),
    });
    try {
      const cursorId = state.stream.tailCursorId ?? undefined;
      const viewportH = Number(menuScrollHeight.value || 800);
      const perItemAvg = Number(state.streamUnitGoodsHeight || STREAM.EST_GOODS_HEIGHT);
      const itemsForTwoScreens = Math.ceil((viewportH * 2) / perItemAvg);
      const appendPageSize = Math.max(30, Math.min(STREAM.PAGE_N_MAX, itemsForTwoScreens * 2));
      const res = await SpuApi.getSpuStream({
        cursorId,
        direction: 'down',
        keyword: state.keyword || undefined,
        pageSize: appendPageSize,
        categoryIds: _streamAllCategoryIds(),
      });
      if (!res || res.code !== 0) {
        state.stream.isLoadingTail = false;
        return;
      }
      const list = Array.isArray(res.data?.list) ? res.data.list : [];
      const hasMore = !!res.data?.hasMore;
      const hasMoreOpposite = res.data?.hasMoreOpposite;
      if (list.length === 0) {
        state.stream.hasMoreTail = false;
        state.loadStatus = 'noMore';
        state.stream.isLoadingTail = false;
        return;
      }
      // 写 cache + 更新 perCat + loaded flag
      const buckets = _streamSliceBucketsFromFlatList(list);
      for (const b of buckets) {
        const catIdx = state.categoryList.findIndex((c) => Number(c.id) === Number(b.categoryId));
        if (catIdx === -1) continue;
        const goodsSlice = list.slice(b.range[0], b.range[1] + 1);
        _streamCacheGoodsForCat(catIdx, goodsSlice);
        const group = Array.isArray(state.streamCategoryGroups)
          ? state.streamCategoryGroups.find((g) => Number(g.categoryId) === Number(b.categoryId))
          : null;
        const declared = group ? Number(group.count || 0) : 0;
        const per = _ensurePerCat(catIdx);
        if (!per.total && declared > 0) per.total = declared;
        per.loadedCount = Math.max(Number(per.loadedCount || 0), goodsSlice.length);
        const fullLoaded =
          declared > 0 ? goodsSlice.length >= declared : goodsSlice.length < appendPageSize;
        if (fullLoaded) state.streamCatLoaded.set(catIdx, true);
        if (goodsSlice.length) {
          state.streamCatFirstCursor.set(
            catIdx,
            Number(goodsSlice[0]?.id ?? state.streamCatFirstCursor.get(catIdx) ?? 0),
          );
          state.streamCatLastCursor.set(
            catIdx,
            Number(
              goodsSlice[goodsSlice.length - 1]?.id ?? state.streamCatLastCursor.get(catIdx) ?? 0,
            ),
          );
        }
        const meta = _streamEnsureMetaForCat(catIdx);
        meta.loadedTailCount = Number(meta.loadedTailCount || 0) + goodsSlice.length;
        if (goodsSlice.length) {
          meta.lastSeenId = Number(goodsSlice[goodsSlice.length - 1]?.id) ?? meta.lastSeenId;
        }
        if (goodsSlice.length < appendPageSize) meta.tailComplete = true;
        if (state.virtualActiveMenu < catIdx) state.virtualActiveMenu = catIdx;
      }
      _streamUpdateCursorsAfterResp(list, 'down_append_tail', hasMore, hasMoreOpposite);

      // ★ 重建 mainList（永远是 [0..L] 全平铺，坐标系不变
      _streamFlushAllCachedGoodsIntoMainList();

      state.loadStatus = state.stream.hasMoreTail ? 'more' : 'noMore';
      __dbgEmit('D', 'pages/index/category.vue:_streamAppendTailPage', '[DEBUG] append finish', {
        appendedCount: list.length,
        hasMoreTail: !!state.stream.hasMoreTail,
        tailCursorId: Number(state.stream.tailCursorId || 0),
        listLength: Array.isArray(state.pagination.list) ? state.pagination.list.length : 0,
      });
      setTimeout(() => {
        _streamResampleBreakPointsExact();
        if (STREAM.AUTO_TRIGGER_IF_SHORT_CONTENT) _streamAutoTriggerIfShortContent();
      }, 200);
    } catch (e) {
      console.error('[STREAM_ERR] append tail failed', e);
    } finally {
      state.stream.isLoadingTail = false;
    }
  }

  async function _streamMeasureAllHeights() {
    if (secondOneRef.value) {
      const prependH = await secondOneRef.value.measurePrependHeight();
      const mainH = await secondOneRef.value.measureContentHeight();
      state.stream.prependHeight = prependH;
      state._lastMeasureContentH = mainH;
    }
  }

  // 路径 3：逆向 prepend（HEAD 方向，传后端 direction=up）
  //   新架构：请求到数据 → 写 cache → flush；paddingTop 不动；坐标系天然稳定 = 0 jump
  async function _streamPrependHeadPage(opts = {}) {
    const isAutoPreload = opts.isAutoPreload;
    if (state.stream.isLoadingHead || state.stream.isLoadingAnchor || state.stream.isLoadingTail)
      return;
    if (!state.stream.hasMoreHead) return;
    state.stream.isLoadingHead = true;
    const scrollTopBefore = Number(state.lastScrollTop || 0);
    __dbgEmit('D', 'pages/index/category.vue:_streamPrependHeadPage', '[DEBUG] prepend start', {
      headCursorId: Number(state.stream.headCursorId || 0),
      hasMoreHead: !!state.stream.hasMoreHead,
      scrollTopBefore,
      listLength: Array.isArray(state.pagination.list) ? state.pagination.list.length : 0,
      topDisplayedCategoryIdx: state.topDisplayedCategoryIdx,
    });

    try {
      const cursorId = state.stream.headCursorId ?? undefined;
      const viewportH = Number(menuScrollHeight.value || 800);
      const perItemAvg = Number(state.streamUnitGoodsHeight || STREAM.EST_GOODS_HEIGHT);
      const itemsForTwoScreens = Math.ceil((viewportH * 2) / perItemAvg);
      const prependPageSize = Math.max(30, Math.min(STREAM.PAGE_N_MAX, itemsForTwoScreens * 2));
      const res = await SpuApi.getSpuStream({
        cursorId,
        direction: 'up',
        keyword: state.keyword || undefined,
        pageSize: prependPageSize,
        categoryIds: _streamAllCategoryIds(),
      });
      if (!res || res.code !== 0) {
        state.stream.isLoadingHead = false;
        return;
      }
      let list = Array.isArray(res.data?.list) ? res.data.list : [];
      const hasMore = !!res.data?.hasMore;
      const hasMoreOpposite = res.data?.hasMoreOpposite;
      if (list.length === 0) {
        state.stream.hasMoreHead = false;
        state.stream.isLoadingHead = false;
        return;
      }
      // direction=up 后端可能返回反序；和老方案一样用自然顺序纠正
      if (list.length > 1) {
        const firstCatIdx = state.categoryList.findIndex(
          (c) => Number(c.id) === Number(list[0].categoryId),
        );
        const lastCatIdx = state.categoryList.findIndex(
          (c) => Number(c.id) === Number(list[list.length - 1].categoryId),
        );
        let needsReverse = false;
        if (firstCatIdx !== -1 && lastCatIdx !== -1 && firstCatIdx > lastCatIdx)
          needsReverse = true;
        else if (firstCatIdx === lastCatIdx) {
          const firstId = Number(list[0].id);
          const lastId = Number(list[list.length - 1].id);
          if (!isNaN(firstId) && !isNaN(lastId) && firstId > lastId) needsReverse = true;
        }
        if (needsReverse) list.reverse();
      }

      const buckets = _streamSliceBucketsFromFlatList(list);
      for (const b of buckets) {
        const catIdx = state.categoryList.findIndex((c) => Number(c.id) === Number(b.categoryId));
        if (catIdx === -1) continue;
        const goodsSlice = list.slice(b.range[0], b.range[1] + 1);
        _streamCacheGoodsForCat(catIdx, goodsSlice);
        const group = Array.isArray(state.streamCategoryGroups)
          ? state.streamCategoryGroups.find((g) => Number(g.categoryId) === Number(b.categoryId))
          : null;
        const declared = group ? Number(group.count || 0) : 0;
        const per = _ensurePerCat(catIdx);
        if (!per.total && declared > 0) per.total = declared;
        per.loadedCount = Math.max(Number(per.loadedCount || 0), goodsSlice.length);
        const fullLoaded =
          declared > 0 ? goodsSlice.length >= declared : goodsSlice.length < prependPageSize;
        if (fullLoaded) state.streamCatLoaded.set(catIdx, true);
        if (goodsSlice.length) {
          state.streamCatFirstCursor.set(
            catIdx,
            Number(goodsSlice[0]?.id ?? state.streamCatFirstCursor.get(catIdx) ?? 0),
          );
          state.streamCatLastCursor.set(
            catIdx,
            Number(
              goodsSlice[goodsSlice.length - 1]?.id ?? state.streamCatLastCursor.get(catIdx) ?? 0,
            ),
          );
        }
        const meta = _streamEnsureMetaForCat(catIdx);
        meta.loadedHeadCount = Number(meta.loadedHeadCount || 0) + goodsSlice.length;
        if (goodsSlice.length) {
          meta.firstSeenId = Number(goodsSlice[0]?.id) ?? meta.firstSeenId;
        }
        if (goodsSlice.length < prependPageSize) meta.headComplete = true;
      }
      _streamUpdateCursorsAfterResp(list, 'up_prepend_head', hasMore, hasMoreOpposite);

      // ════════════════════════════════════════════════
      // ★★★ KEY：重建 mainList，坐标系完全不动！（因为 paddingTop/minHeight 是一次性写死的全局坐标）
      // 之前：unshift 进 list → scrollHeight 暴涨 → JS 补 scrollTop 才压住跳动；
      // 现在：新数据在 paddingTop 预留的"物理空间"里渲染出来，scroll-height 增量为 0（精确建模的情况下）→ 视觉 0 跳
      // ════════════════════════════════════════════════
      _streamFlushAllCachedGoodsIntoMainList();

      __dbgEmit('STRM', '_streamPrependHeadPage', 'SUCCESS (cache-flush model)', {
        newHeadId: state.stream.headCursorId,
        hasMoreHead: state.stream.hasMoreHead,
        dynamicTopPadding: state.stream.dynamicTopPadding,
        listLength: state.pagination.list.length,
      });
    } catch (e) {
      console.error('[STREAM_ERR] prepend head failed', e);
    } finally {
      state.stream.isLoadingHead = false;
    }
  }

  // ── Stream DOM 工具：量取右栏 scroll-view contentHeight ──
  async function _streamMeasureRightListContentHeight() {
    if (!secondOneRef.value || typeof secondOneRef.value.measureContentHeight !== 'function')
      return 0;
    try {
      const h = await secondOneRef.value.measureContentHeight();
      if (h > 0) state._lastMeasureContentH = h;
      return h;
    } catch (e) {
      return 0;
    }
  }

  // ── Stream DOM 工具：对所有 divider marker 采样 exactScrollTop 写回 bp，返回 Promise（异步完成）
  async function _streamResampleBreakPointsExact() {
    if (!secondOneRef.value || typeof secondOneRef.value.queryMarkersOffsetTop !== 'function')
      return;
    try {
      const markerItems = state.pagination.list.filter((it) => it && it._type === MARKER_TYPE);
      if (!markerItems.length) return;
      const domIds = markerItems.map((m, i) => _streamDomIdForItem(m, i)).filter(Boolean);
      if (!domIds.length) return;

      const results = await secondOneRef.value.queryMarkersOffsetTop(domIds);
      if (!results || results.length !== domIds.length) return;

      for (let i = 0; i < domIds.length; i++) {
        const offsetTopInContainer = results[i];
        if (!Number.isFinite(offsetTopInContainer)) continue;
        const markerItem = markerItems[i];
        const bp = state.categoryBreakPoints.find(
          (b) =>
            state.pagination.list[Number(b.itemIndex || 0)]?.id === markerItem.id ||
            state.pagination.list[Number(b.itemIndex || 0)]?.__streamKey === markerItem.__streamKey,
        );
        if (bp)
          bp.approxScrollTop = Math.max(0, offsetTopInContainer + Number(state.lastScrollTop || 0));
      }

      // 按 approxScrollTop 重新排序 bp（保证 _findDisplayedCatByBreakPoint 的二分可用）
      state.categoryBreakPoints.sort(
        (a, b) => Number(a.approxScrollTop || 0) - Number(b.approxScrollTop || 0),
      );
    } catch (e) {
      /* ignore */
    }
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
        box-sizing: border-box;
        overflow: hidden;
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
