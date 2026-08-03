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
              <text class="text_27">{{ state.categoryList[state.activeMenu]?.name || '' }}</text>
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
            <!-- 下一个分类过渡条（非最后一个分类且已加载完本分类时显示） -->
            <view
              v-if="
                (state.style === 'first_one' || state.style === 'first_two') &&
                state.pagination.total > 0 &&
                state.loadStatus === 'noMore' &&
                state.activeMenu < state.categoryList.length - 1
              "
              class="next-category-hint"
            >
              <view class="next-hint-l flex-row">
                <text class="next-hint-label">下一个分类</text>
                <text class="next-hint-name">{{
                  state.categoryList[state.activeMenu + 1]?.name || ''
                }}</text>
              </view>
              <uni-icons type="right" size="16" color="rgba(30, 63, 28, 0.9)" />
            </view>
            <!-- 最后一个分类的 noMore 状态（保留原组件） -->
            <uni-load-more
              v-if="
                (state.style === 'first_one' || state.style === 'first_two') &&
                state.pagination.total > 0 &&
                state.activeMenu >= state.categoryList.length - 1
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

  const state = reactive({
    style: 'first_two', // first_one（一级 - 样式一）, first_two（二级 - 样式二）, second_one（二级）
    categoryList: [], // 商品分类树
    activeMenu: 0, // 选中的一级菜单，在 categoryList 的下标
    pendingCategoryId: null,

    pagination: {
      // 商品分页
      list: [], // 商品列表
      total: [], // 商品总数
      pageNo: 1,
      pageSize: 6,
    },
    loadStatus: '',
    keyword: '',
    bannerPicUrl: '',
    showBannerPreviewVideo: false,
    bannerPreviewVideoUrl: '',

    // 分类丝滑切换（新增）
    rightScrollIntoViewId: '', // 右栏 scroll-view scroll-into-view 锚点
    leftScrollIntoViewId: '', // 左栏 scroll-view 滚动到目标 id
    isSwitchingCategory: false, // 分类切换锁，防止重复触发
    lastScrollTop: 0, // 记录上一次滚动位置，判断方向
  });

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

  // 加载商品分类
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

  // 选中菜单（左栏点击 / 自动切换 / 外部传参 均走此处）
  const onMenu = (val) => {
    state.activeMenu = val;
    state.leftScrollIntoViewId = 'menu-item-' + val; // 左栏同步滚到可视区
    state.pagination.pageNo = 1;
    state.pagination.list = [];
    state.pagination.total = 0;
    // 丝滑滚动到右栏顶部（先清空锚点 → 下一帧再设锚点，规避 uni-app 同值不触发滚动的坑）
    state.rightScrollIntoViewId = '';
    nextTick(() => {
      state.rightScrollIntoViewId = 'right-scroll-top-anchor';
    });
    getGoodsList();
  };

  // 加载商品列表
  async function getGoodsList() {
    // 加载列表
    state.loadStatus = 'loading';
    const res = await SpuApi.getSpuPage({
      categoryId: state.categoryList[state.activeMenu].id,
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
      keyword: state.keyword,
    });
    if (!res || res.code !== 0) {
      // 失败时也要解锁切换锁（否则锁死）
      state.isSwitchingCategory = false;
      return;
    }
    // 合并列表
    state.pagination.list = concat(state.pagination.list, res.data.list);
    state.pagination.total = res.data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  // 监听右栏滚动（记录位置 & 方向）
  function onRightScroll(e) {
    state.lastScrollTop = e.detail.scrollTop || 0;
  }

  // 【核心】丝滑切到下一个分类
  async function switchToNextCategory() {
    if (state.isSwitchingCategory) return;
    if (!Array.isArray(state.categoryList) || state.categoryList.length === 0) return;
    if (state.activeMenu >= state.categoryList.length - 1) return;
    state.isSwitchingCategory = true;
    const nextIdx = state.activeMenu + 1;
    // 过渡条已由 v-if 渲染（毛玻璃卡片），给用户一个短暂的感知时间
    await new Promise((r) => setTimeout(r, 380));
    // 走 onMenu 统一逻辑：左栏滚动 + 右栏滚顶 + 重置分页 + 拉新商品
    onMenu(nextIdx);
    // 等商品请求回来 & 滚动动画差不多完成，再解锁
    setTimeout(() => {
      state.isSwitchingCategory = false;
    }, 700);
  }

  // 加载更多商品（改造：到底后如果已 noMore 且非最后分类 → 自动切下一个）
  function loadMore() {
    if (state.isSwitchingCategory) return;
    if (state.loadStatus === 'noMore') {
      // 本分类已加载完，判断是否有下一个分类可切
      if (state.activeMenu < state.categoryList.length - 1) {
        switchToNextCategory();
      }
      return;
    }
    state.pagination.pageNo++;
    getGoodsList();
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
    // 处理 tabbar 传参的情况
    const tabbarParams = appStore.paramsForTabbar || {};
    const tabbarId = tabbarParams.id;
    appStore.clearParamsForTabbar(); // 使用完后清理，避免影响下次跳转
    const id = state.pendingCategoryId || (tabbarId ? Number(tabbarId) : null);
    state.pendingCategoryId = null;

    if (id) {
      // 如果有传参 id（比如从首页分类入口跳过来），则去匹配对应的分类
      const foundCategory = state.categoryList.find(
        (category) => Number(category.id) === Number(id),
      );
      if (foundCategory) {
        onMenu(state.categoryList.indexOf(foundCategory));
      } else {
        onMenu(0);
      }
    } else {
      // 如果没有传参，并且是第一次加载（loadStatus 为空），才默认选中第一个
      if (state.categoryList.length > 0 && state.loadStatus === '') {
        onMenu(0);
      }
      // 如果已有数据且没有传参（例如从商品详情页返回），则什么都不做，保留原状
    }
  }

  onShow(async () => {
    // 只有当分类列表为空时才去请求，避免每次显示页面（如返回时）重新加载刷新
    if (state.categoryList.length === 0) {
      await getList();
    }
    initMenuIndex();
    if (!state.bannerPicUrl) {
      await loadBanner();
    }
  });

  function onSearch() {
    state.pagination.pageNo = 1;
    state.pagination.list = [];
    state.pagination.total = 0;
    getGoodsList();
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
