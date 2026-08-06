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
            :scroll-with-animation="state.stream.forceNextScrollTop <= 0"
            :scroll-into-view="state.rightScrollIntoViewId"
            :scroll-top="
              state.stream.forceNextScrollTop > 0 ? state.stream.forceNextScrollTop : undefined
            "
            :top-padding="state.stream.dynamicTopPadding"
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
  const __DBG_RUN_ID__ = 'pre-fix';
  const __dbgState = {
    scrollAt: 0,
    sampleAt: 0,
    highlightAt: 0,
  };
  const __dbgEmit = (hypothesisId, location, msg, data = {}) => {
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
      if (typeof fetch === 'function') {
        fetch(__DBG_URL__, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
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
    PAGE_N: 5,
    EST_DIVIDER_HEIGHT: 255, // 1 banner + divider 毛玻璃 ≈ 250-260px
    EST_GOODS_HEIGHT: 180, // 商品卡片 widthFix 动态高，先估 180
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
    stream: {
      dynamicTopPadding: 0,
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
    state.pagination.total = 0;
    state.pagination.perCat.clear();
    state.categoryBreakPoints = [];
    state.prefetchCache.clear();
    state.rightScrollIntoViewId = '';

    // 如果是首个分类，不需要预留向上生长的负空间
    state.stream.dynamicTopPadding = targetIdx === 0 ? 0 : STREAM.TOP_PADDING;

    // 初始强制滚动定位到 Padding 下方，避免 scroll-into-view 失效导致的大白屏
    if (state.stream.dynamicTopPadding > 0) {
      state.stream.forceNextScrollTop = state.stream.dynamicTopPadding;
      setTimeout(() => {
        state.stream.forceNextScrollTop = 0;
      }, 100);
    }

    state.leftScrollIntoViewId = 'menu-item-' + targetIdx;
    state.categoryBreakPoints.push({
      catIdx: targetIdx,
      itemIndex: 0,
      approxScrollTop: 0,
    });
    // Stream 状态同步重置
    state.stream.headCursorId = null;
    state.stream.tailCursorId = null;
    state.stream.hasMoreHead = true;
    state.stream.hasMoreTail = true;
    state.stream.isLoadingHead = false;
    state.stream.isLoadingTail = false;
    state.stream.isLoadingAnchor = false;
    state.stream.scrollTopPinch = 0;
    state.stream.forceNextScrollTop = 0;
    state.stream.perCatStreamMeta.clear();
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
      const topPadding = state.stream.dynamicTopPadding || 0;
      const th = _streamTriggerPx();

      const insideAnchorWindow =
        state.stream.lastAnchorSettledAt > 0 &&
        now - state.stream.lastAnchorSettledAt < STREAM.IGNORE_N_SCROLL_AFTER_ANCHOR_MS;

      const nearTail =
        viewportH > 0 &&
        contentH > 0 &&
        state.lastScrollTop + viewportH >= topPadding + contentH - th;

      // nearHead：相对于“当前内容起始点”（topPadding - prependH）
      const contentStart = Math.max(0, topPadding - prependH);
      let nearHead;
      if (viewportH > 0 && contentH > 0 && contentH < viewportH * 1.5) {
        nearHead = state.lastScrollTop <= contentStart + Math.max(th, 220);
      } else {
        nearHead = state.lastScrollTop <= contentStart + th;
      }

      // ── 安全兜底：如果用户滑出了内容区域（进入了 padding 留白区），强制拉回 ──
      //    只有在没有正在加载且不是刚开始 anchor 时执行，避免干扰正常加载和定位
      const isSettled =
        !state.stream.isLoadingHead && !state.stream.isLoadingAnchor && !insideAnchorWindow;
      if (isSettled && state.lastScrollTop < contentStart - 5) {
        state.stream.forceNextScrollTop = contentStart;
        setTimeout(() => {
          state.stream.forceNextScrollTop = 0;
        }, 60);
      }

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
            '[STREAM_ASSERT_INSERT] nearHead(HEAD端 prepend) head=[' +
              head2 +
              '] tail=[' +
              tail2 +
              '] st=' +
              state.lastScrollTop.toFixed(1),
          );
          _streamPrependHeadPage();
        } else if (state.stream.dynamicTopPadding > 0) {
          // 兜底：如果已经没有更多了，但顶部 padding 还没裁掉，则裁掉它
          _streamMeasureAllHeights();
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

  // ────────────────── Stream 三条主路径 ──────────────────

  // 路径 1：点击 tab 冷启动 anchor（三明治上下文）
  async function _streamStartAnchorHydration(targetIdx) {
    if (state.stream.isLoadingAnchor) return;
    const L = state.categoryList.length;
    if (!L) return;
    const targetCat = state.categoryList[targetIdx];
    if (!targetCat) return;
    const categoryIds = _streamAllCategoryIds();
    const pageSize = Math.min(
      200,
      STREAM.ANCHOR_HEAD_N + STREAM.ANCHOR_MID_N + STREAM.ANCHOR_TAIL_N,
    );
    state.stream.isLoadingAnchor = true;
    state.loadStatus = 'loading';
    try {
      const res = await SpuApi.getSpuStream({
        categoryId: Number(targetCat.id),
        categoryIds,
        keyword: state.keyword || undefined,
        pageSize,
        // cursorId 不传 = 冷启动
        // direction 不传 = 冷启动（后端按 categoryId 正向定位）
        // reverse 永远不传（TODO_STREAM_R6）
      });
      if (!res || res.code !== 0) {
        state.stream.isLoadingAnchor = false;
        state.loadStatus = 'more';
        // 接口失败：降级到旧模式（单分类首屏），不 block 用户
        getGoodsList(targetIdx);
        return;
      }
      const list = Array.isArray(res.data?.list) ? res.data.list : [];
      const hasMore = !!res.data?.hasMore;
      const hasMoreOpposite = res.data?.hasMoreOpposite;
      if (list.length === 0) {
        state.loadStatus = 'noMore';
        _streamUpdateCursorsAfterResp([], 'anchor', false, hasMoreOpposite);
        state.stream.isLoadingAnchor = false;
        return;
      }
      const buckets = _streamSliceBucketsFromFlatList(list);
      // ① 更新 perCat meta
      for (const b of buckets) {
        const catIdx = state.categoryList.findIndex((c) => Number(c.id) === Number(b.categoryId));
        if (catIdx === -1) continue;
        const meta = _streamEnsureMetaForCat(catIdx);
        const bucketSlice = list.slice(b.range[0], b.range[1] + 1);
        if (bucketSlice.length) {
          meta.firstSeenId = Number(bucketSlice[0]?.id) ?? meta.firstSeenId;
          meta.lastSeenId = Number(bucketSlice[bucketSlice.length - 1]?.id) ?? meta.lastSeenId;
          // Workaround R4：如果该 bucket 数量 < PAGE_N 且在 head 端（target 的上一个），假设 headComplete
          // 这里只初始化 loaded 计数，完成状态在后续翻页时再精确判断
          if (b.count < STREAM.PAGE_N) {
            // 无法判断是 head 还是 tail 少 → 两个方向都先标 false，下次请求回来 list 为空再置 true
          }
        }
      }
      // ② 找定位分类首条 index（debug 用，保留函数调用方便断点）
      _streamFindAnchorFirstIndex(list, Number(targetCat.id));
      // ③ 决定虚拟 virtualActiveMenu：取 buckets 中出现过的所有分类的最大 idx
      let maxCatIdxInResp = targetIdx;
      let minCatIdxInResp = targetIdx;
      for (const b of buckets) {
        const i = state.categoryList.findIndex((c) => Number(c.id) === Number(b.categoryId));
        if (i === -1) continue;
        if (i > maxCatIdxInResp) maxCatIdxInResp = i;
        if (i < minCatIdxInResp) minCatIdxInResp = i;
      }
      state.virtualActiveMenu = Math.max(state.virtualActiveMenu, maxCatIdxInResp);
      state.topDisplayedCategoryIdx = targetIdx;
      state.activeMenu = targetIdx;
      // ── bp 初始化：第 1 个 bucket 的 approx=0；之后每个 bucket 的 approx 在前一个累计基础上 + 估算（下帧 DOM 采样 exact 覆盖）
      let cumEstimated = 0;
      // ④ 分段插入 goods + 每段开头插 divider marker
      for (let bi = 0; bi < buckets.length; bi++) {
        const b = buckets[bi];
        const catIdx = state.categoryList.findIndex((c) => Number(c.id) === Number(b.categoryId));
        if (catIdx === -1) continue;
        const markerItemIdx = state.pagination.mainList.length;
        const cat = state.categoryList[catIdx];
        state.pagination.mainList.push({
          __streamKey: 'm_' + catIdx + '_' + markerItemIdx,
          id: '__divider_' + catIdx + '_' + markerItemIdx,
          _type: MARKER_TYPE,
          _$catIdx: catIdx,
          categoryId: Number(cat?.id || 0),
          name: cat?.name || '',
          bannerPicUrl: state.bannerPicUrl || '',
        });
        state.pagination.list = [...state.pagination.prependList, ...state.pagination.mainList];
        // ── KEY FIX：approxScrollTop 严格按「当前累计估算高度」写，不再用 targetIdx 拍 0/ 非 target 乱估
        const approxScrollTop = Math.max(0, cumEstimated);
        state.categoryBreakPoints.push({
          catIdx,
          itemIndex: markerItemIdx,
          approxScrollTop,
        });
        // 累加估算：1 divider (250) + N goods (180 each)
        cumEstimated += STREAM.EST_DIVIDER_HEIGHT + b.count * STREAM.EST_GOODS_HEIGHT;
        const goodsSlice = list.slice(b.range[0], b.range[1] + 1);
        _appendGoodsToStream(catIdx, goodsSlice);
        _preloadImagesForGoods(goodsSlice);
        const meta = _streamEnsureMetaForCat(catIdx);
        meta.loadedTailCount = Number(meta.loadedTailCount || 0) + goodsSlice.length;
      }
      // ── 立刻重排 bp （升序 approxScrollTop，二分安全）
      state.categoryBreakPoints.sort(
        (a, b) => Number(a.approxScrollTop || 0) - Number(b.approxScrollTop || 0),
      );
      // ── 立刻高亮重算一次（这时 bp 已经按 approx 排序初始化好了，不会再切来切去）
      _syncTopDisplayedAndActiveMenuFromScroll(state.lastScrollTop);

      // 强制初始滚动定位到 Padding 下方，避免 scroll-into-view 失效导致大白屏
      if (state.stream.dynamicTopPadding > 0) {
        state.stream.forceNextScrollTop = state.stream.dynamicTopPadding;
        setTimeout(() => {
          state.stream.forceNextScrollTop = 0;
        }, 100);
      }

      // ⑤ 双端 cursor 与 hasMore（hasMoreOpposite=后端已补字段，直接用）
      _streamUpdateCursorsAfterResp(list, 'anchor', hasMore, hasMoreOpposite);
      // 如果结果集中最小分类就是第 0 个（最顶部没出现上一分类，HEAD 端直接已完整
      if (minCatIdxInResp === 0) state.stream.hasMoreHead = false;
      state.pagination.prependList = [];
      state.pagination.mainList = state.pagination.list;
      state.pagination.total = state.pagination.list.length;
      state.loadStatus = state.stream.hasMoreTail ? 'more' : 'noMore';
      // ⑥ 特殊兜底：如果本次首屏只有当前分类（count < ANCHOR 期望三段拼接需要）——例如当前分类只有 2 条商品，
      //   anchor 返回 list.length=2，这时用户向上滑一屏就直接撞顶；但 hasMoreHead=hasMoreOpposite=true（后端已给）
      //   且 headCursorId=list[0].id，接下来 nearTop 触发 _streamPrependHeadPage 会 direction=up + headCursorId
      //   加载上一分类 —— 实测：direction=up from headCursorId=641(88HEAD) → 返回[87,87,86,...]（正确！）
      //   → 所以 anchor 不需要额外兜底，正常流程即可触发逆向加载。
      // ⑥ nextTick 后：① DOM 采样修正 bp 为 exact（下一帧）② scroll 定位到 target divider 的顶
      nextTick(() => {
        // 先 scroll-into-view 定位到 target 分类的 divider（用户第一眼看到目标分类 banner）
        const targetDividerMarkerIdx = state.categoryBreakPoints.find(
          (bp) => bp.catIdx === targetIdx,
        )?.itemIndex;
        if (typeof targetDividerMarkerIdx === 'number') {
          const marker = state.pagination.list[targetDividerMarkerIdx];
          const markerDomId = _streamDomIdForItem(marker, targetDividerMarkerIdx);
          if (markerDomId) {
            state.rightScrollIntoViewId = '';
            nextTick(() => {
              state.rightScrollIntoViewId = markerDomId;
            });
          }
        }
        // 下一帧 DOM 采样 exact bp（减少 approx 偏差）
        setTimeout(() => {
          _streamResampleBreakPointsExact();
          // ════════════════════════════════════════════════════════════════
          // KEY FIX：不满一屏时（分类 88 这种整个才 2 条商品），永远滑不到撞顶，@scroll 也不会触发 nearTop
          // → 直接在渲染完立刻判断「内容高度 ≤ 视口」→ 主动触发缺少的那端
          // ════════════════════════════════════════════════════════════════
          if (STREAM.AUTO_TRIGGER_IF_SHORT_CONTENT) {
            _streamAutoTriggerIfShortContent();
          }
          // ════════════════════════════════════════════════════════════════
          // 自动预加载 (Auto-Preload)：冷启动完成后，静默加载上一分类，消除首次反向滑动的跳跃感
          // ════════════════════════════════════════════════════════════════
          if (state.stream.hasMoreHead && !state.stream.isLoadingHead) {
            _streamPrependHeadPage({ isAutoPreload: true, anchorCatIdx: targetIdx });
          }
          // ════════════════════════════════════════════════════════════════
          // 防误触发(A)：此刻开始允许 @scroll 触发 nearHead/nearTail 加载
          //（scroll-into-view 到中间分类的过程中会发一堆 scrollTop=0 的事件）
          // ════════════════════════════════════════════════════════════════
          state.stream.lastAnchorSettledAt = Date.now();
          // KEY FIX: 定位完成后清空 scroll-into-view，防止后续列表变更（如 prepend）时组件重新评估并强制跳回该锚点
          state.rightScrollIntoViewId = '';
        }, 260);
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
    _streamAutoTriggerIfShortContent('gesture');
  }

  function onRightScrollTouchEnd() {
    if (!state.enableStream) return;
    _streamAutoTriggerIfShortContent('touchend');
  }

  // 路径 2：scrolltolower 正向 append（TAIL 方向，传后端 direction=down）
  async function _streamAppendTailPage() {
    if (state.stream.isLoadingTail || state.stream.isLoadingAnchor || state.stream.isLoadingHead)
      return;
    if (!state.stream.hasMoreTail) {
      state.loadStatus = 'noMore';
      return;
    }
    state.stream.isLoadingTail = true;
    // #region debug-point D:append-start
    __dbgEmit('D', 'pages/index/category.vue:_streamAppendTailPage', '[DEBUG] append start', {
      tailCursorId: Number(state.stream.tailCursorId || 0),
      hasMoreTail: !!state.stream.hasMoreTail,
      listLength: Array.isArray(state.pagination.list) ? state.pagination.list.length : 0,
      scrollTop: Number(state.lastScrollTop || 0),
    });
    // #endregion
    try {
      const cursorId = state.stream.tailCursorId ?? undefined;
      const res = await SpuApi.getSpuStream({
        cursorId,
        direction: 'down', // 后端 direction=down → 更 TAIL（排名更后）
        keyword: state.keyword || undefined,
        pageSize: STREAM.PAGE_N,
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
      const buckets = _streamSliceBucketsFromFlatList(list);
      for (let bi = 0; bi < buckets.length; bi++) {
        const b = buckets[bi];
        const catIdx = state.categoryList.findIndex((c) => Number(c.id) === Number(b.categoryId));
        if (catIdx === -1) continue;
        const hadDivider = state.categoryBreakPoints.some((bp) => bp.catIdx === catIdx);
        if (!hadDivider) {
          const markerItemIdx = state.pagination.mainList.length;
          const cat = state.categoryList[catIdx];
          state.pagination.mainList.push({
            __streamKey: 'm_' + catIdx + '_' + markerItemIdx,
            id: '__divider_' + catIdx + '_' + markerItemIdx,
            _type: MARKER_TYPE,
            _$catIdx: catIdx,
            categoryId: Number(cat?.id || 0),
            name: cat?.name || '',
            bannerPicUrl: state.bannerPicUrl || '',
          });
          state.pagination.list = [...state.pagination.prependList, ...state.pagination.mainList];
          const viewportH = Number(menuScrollHeight.value || 0);
          const approxScrollTop = state.lastScrollTop + viewportH - 50;
          state.categoryBreakPoints.push({
            catIdx,
            itemIndex: markerItemIdx,
            approxScrollTop: Math.max(0, approxScrollTop),
          });
          if (state.virtualActiveMenu < catIdx) state.virtualActiveMenu = catIdx;
        }
        const goodsSlice = list.slice(b.range[0], b.range[1] + 1);
        _appendGoodsToStream(catIdx, goodsSlice);
        _preloadImagesForGoods(goodsSlice);
        const meta = _streamEnsureMetaForCat(catIdx);
        meta.loadedTailCount = Number(meta.loadedTailCount || 0) + goodsSlice.length;
        if (goodsSlice.length) {
          meta.lastSeenId = Number(goodsSlice[goodsSlice.length - 1]?.id) ?? meta.lastSeenId;
        }
        if (goodsSlice.length < STREAM.PAGE_N) meta.tailComplete = true;
      }
      _streamUpdateCursorsAfterResp(list, 'down_append_tail', hasMore, hasMoreOpposite);
      state.pagination.total = state.pagination.list.length;
      state.loadStatus = state.stream.hasMoreTail ? 'more' : 'noMore';
      // #region debug-point D:append-finish
      __dbgEmit('D', 'pages/index/category.vue:_streamAppendTailPage', '[DEBUG] append finish', {
        appendedCount: list.length,
        hasMoreTail: !!state.stream.hasMoreTail,
        tailCursorId: Number(state.stream.tailCursorId || 0),
        listLength: Array.isArray(state.pagination.list) ? state.pagination.list.length : 0,
      });
      // #endregion
      setTimeout(() => {
        _streamResampleBreakPointsExact();
        // append 后也可能不满一屏（极端情况）→ 同样兜底
        if (STREAM.AUTO_TRIGGER_IF_SHORT_CONTENT) {
          _streamAutoTriggerIfShortContent();
        }
      }, 200);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[STREAM_ERR] append tail failed', e);
    } finally {
      state.stream.isLoadingTail = false;
    }
  }

  async function _streamMeasureAllHeights() {
    if (secondOneRef.value) {
      const [prependH, mainH] = await Promise.all([
        secondOneRef.value.measurePrependHeight(),
        secondOneRef.value.measureContentHeight(),
      ]);
      state.stream.prependHeight = prependH;
      state._lastMeasureContentH = mainH;

      if (!state.stream.hasMoreHead && state.stream.dynamicTopPadding > 0) {
        const currentPadding = state.stream.dynamicTopPadding;
        if (Math.abs(currentPadding - prependH) > 2) {
          const diff = currentPadding - prependH;
          state.stream.dynamicTopPadding = prependH;
          state.stream.forceNextScrollTop = Math.max(0, state.lastScrollTop - diff);
          setTimeout(() => {
            state.stream.forceNextScrollTop = 0;
          }, 100);
        }
      }
    }
  }

  // 路径 3：逆向 prepend（HEAD 方向，传后端 direction=up，撞顶触发）
  async function _streamPrependHeadPage(opts = {}) {
    const isAutoPreload = opts.isAutoPreload;
    const anchorCatIdx = opts.anchorCatIdx;
    if (state.stream.isLoadingHead || state.stream.isLoadingAnchor || state.stream.isLoadingTail)
      return;
    if (!state.stream.hasMoreHead) return;
    state.stream.isLoadingHead = true;
    const scrollTopBefore = Number(state.lastScrollTop || 0);
    // #region debug-point D:prepend-start
    __dbgEmit('D', 'pages/index/category.vue:_streamPrependHeadPage', '[DEBUG] prepend start', {
      headCursorId: Number(state.stream.headCursorId || 0),
      hasMoreHead: !!state.stream.hasMoreHead,
      scrollTopBefore,
      listLength: Array.isArray(state.pagination.list) ? state.pagination.list.length : 0,
      topDisplayedCategoryIdx: state.topDisplayedCategoryIdx,
    });
    // #endregion
    const oldList = state.pagination.list || [];
    const L = oldList.length;

    try {
      const cursorId = state.stream.headCursorId ?? undefined;
      const res = await SpuApi.getSpuStream({
        cursorId,
        direction: 'up',
        keyword: state.keyword || undefined,
        pageSize: STREAM.PAGE_N,
        categoryIds: _streamAllCategoryIds(),
      });
      if (!res || res.code !== 0) {
        state.stream.isLoadingHead = false;
        return;
      }
      const list = Array.isArray(res.data?.list) ? res.data.list : [];
      const hasMore = !!res.data?.hasMore;
      const hasMoreOpposite = res.data?.hasMoreOpposite;
      if (list.length === 0) {
        state.stream.hasMoreHead = false;
        state.stream.isLoadingHead = false;
        setTimeout(() => {
          _streamMeasureAllHeights();
        }, 50);
        return;
      }
      // direction=up 后端已经 reverse 成自然顺序 HEAD→TAIL，items[0] = 本次返回最最 HEAD
      // 如果后端返回的是 TAIL->HEAD（比如由于 order by id desc 导致最下面的商品在最前面），必须将其翻转回自然顺序（HEAD->TAIL）
      if (list.length > 1) {
        const firstCatIdx = state.categoryList.findIndex(
          (c) => Number(c.id) === Number(list[0].categoryId),
        );
        const lastCatIdx = state.categoryList.findIndex(
          (c) => Number(c.id) === Number(list[list.length - 1].categoryId),
        );
        let needsReverse = false;
        if (firstCatIdx !== -1 && lastCatIdx !== -1 && firstCatIdx > lastCatIdx) {
          needsReverse = true;
        } else if (firstCatIdx === lastCatIdx) {
          const firstId = Number(list[0].id);
          const lastId = Number(list[list.length - 1].id);
          if (!isNaN(firstId) && !isNaN(lastId) && firstId > lastId) {
            needsReverse = true;
          }
        }
        if (needsReverse) list.reverse();
      }

      const buckets = _streamSliceBucketsFromFlatList(list);
      // ② 原子 prepend：保证 divider marker 始终在当前分类的最上方
      const itemsToPrepend = [];
      for (let bi = 0; bi < buckets.length; bi++) {
        const b = buckets[bi];
        const catIdx = state.categoryList.findIndex((c) => Number(c.id) === Number(b.categoryId));
        if (catIdx === -1) continue;
        const goodsSlice = list.slice(b.range[0], b.range[1] + 1);

        // 核心修复：如果旧列表中已经有该分类的 marker，必须将其挖出，因为我们要把它重新置于本次加载的 goodsSlice 之上
        const pIdx = state.pagination.prependList.findIndex(
          (x) => x._type === MARKER_TYPE && x._$catIdx === catIdx,
        );
        if (pIdx !== -1) state.pagination.prependList.splice(pIdx, 1);
        const mIdx = state.pagination.mainList.findIndex(
          (x) => x._type === MARKER_TYPE && x._$catIdx === catIdx,
        );
        if (mIdx !== -1) state.pagination.mainList.splice(mIdx, 1);
        const bpIdx = state.categoryBreakPoints.findIndex((bp) => bp.catIdx === catIdx);
        if (bpIdx !== -1) state.categoryBreakPoints.splice(bpIdx, 1);

        const cat = state.categoryList[catIdx];
        const markerId = '__divider_' + catIdx + '_prepend_' + Date.now() + '_' + bi;
        itemsToPrepend.push({
          item: {
            __streamKey: markerId,
            id: markerId,
            _type: MARKER_TYPE,
            _$catIdx: catIdx,
            categoryId: Number(cat?.id || 0),
            name: cat?.name || '',
            bannerPicUrl: state.bannerPicUrl || '',
          },
          catIdx,
          isMarker: true,
        });

        for (let gi = 0; gi < goodsSlice.length; gi++) {
          const g = goodsSlice[gi];
          itemsToPrepend.push({
            item: {
              ...g,
              _type: GOODS_TYPE,
              _$catIdx: catIdx,
              __streamKey:
                'g_prepend_' + catIdx + '_' + (g?.id || '') + '_' + Date.now() + '_' + gi,
            },
            catIdx,
            isMarker: false,
          });
        }
        const meta = _streamEnsureMetaForCat(catIdx);
        meta.loadedHeadCount = Number(meta.loadedHeadCount || 0) + goodsSlice.length;
        if (goodsSlice.length) {
          meta.firstSeenId = Number(goodsSlice[0]?.id) ?? meta.firstSeenId;
        }
        if (goodsSlice.length < STREAM.PAGE_N) meta.headComplete = true;
      }
      const prependedItemsCount = itemsToPrepend.length;
      // ══════════════════════════════════════════════════════════════════════════
      // ③ 单阶段真实偏移补偿（同步预估补偿）
      //   - 结合预加载，让请求和 DOM 插入发生在视口上方远处
      //   - 同时设置数据和预估高度差补偿，确保在同一帧生效，消除时间差导致的跳跃
      // ══════════════════════════════════════════════════════════════════════════
      let estPrependedHeight = 0;
      for (const p of itemsToPrepend) {
        estPrependedHeight += p.isMarker ? 250 : 180;
      }
      for (let i = 0; i < state.categoryBreakPoints.length; i++) {
        const old = state.categoryBreakPoints[i];
        state.categoryBreakPoints[i] = {
          ...old,
          approxScrollTop: (old.approxScrollTop || 0) + estPrependedHeight,
          itemIndex: Number(old.itemIndex || 0) + prependedItemsCount,
        };
      }
      let cumHeight = 0;
      for (let i = 0; i < itemsToPrepend.length; i++) {
        const p = itemsToPrepend[i];
        if (p.isMarker) {
          state.categoryBreakPoints.push({
            catIdx: p.catIdx,
            itemIndex: i,
            approxScrollTop: Math.max(0, cumHeight),
          });
        }
        cumHeight += p.isMarker ? 250 : 180;
      }
      state.categoryBreakPoints.sort((a, b) => Number(a.itemIndex || 0) - Number(b.itemIndex || 0));

      // ③-A 原子拼接 list，并将新增项目放入 prependList 供 Absolute Container 向上渲染
      const newItems = itemsToPrepend.map((x) => x.item);
      state.pagination.prependList = [...newItems, ...state.pagination.prependList];
      state.pagination.list = [...state.pagination.prependList, ...state.pagination.mainList];

      // 更新双端 cursor（up_prepend_head 场景）
      _streamUpdateCursorsAfterResp(list, 'up_prepend_head', hasMore, hasMoreOpposite);
      state.pagination.total = state.pagination.list.length;

      if (isAutoPreload && anchorCatIdx !== undefined) {
        // 冷启动自动预加载：用户正停留在目标分类，使用 scroll-into-view 原地锁定
        const markerItem = state.pagination.list.find(
          (it) => it._type === MARKER_TYPE && Number(it._$catIdx) === anchorCatIdx,
        );
        if (markerItem && markerItem.__streamKey) {
          nextTick(() => {
            state.rightScrollIntoViewId = '';
            nextTick(() => {
              state.rightScrollIntoViewId = markerItem.__streamKey;
            });
          });
        }
      }
      // 正常滚动触发的 prepend：完全依赖原生 scroll-anchoring，不进行任何手动 scrollTop 干预

      // ════════════════════════════════════════════════════════════════════════
      // ④ DOM 更新后：重新采样高亮
      // ════════════════════════════════════════════════════════════════════════
      setTimeout(() => {
        nextTick(async () => {
          try {
            // ── 动态测量并削减多余的顶部空白（当加载到真正最顶部时）──
            await _streamMeasureAllHeights();

            // ① 等 DOM layout 完成：对所有 divider marker 重新量 exact 位置写回 bp（Promise）
            await _streamResampleBreakPointsExact();
            // ② 立刻强制触发一次 DOM 高亮采样
            _streamScheduleHighlight();

            // #region debug-point D:prepend-finish
            __dbgEmit(
              'D',
              'pages/index/category.vue:_streamPrependHeadPage',
              '[DEBUG] prepend finish',
              {
                scrollTopBefore,
                listLength: Array.isArray(state.pagination.list) ? state.pagination.list.length : 0,
                headCursorId: Number(state.stream.headCursorId || 0),
                topDisplayedCategoryIdx: state.topDisplayedCategoryIdx,
              },
            );
            // #endregion
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[STREAM_ERR] prepend post-process failed', e);
          }
        });
      }, 32);
    } catch (e) {
      // eslint-disable-next-line no-console
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
