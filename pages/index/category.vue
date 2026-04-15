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
          <text class="nav-title ss-m-l-10">商品分类</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

    <view class="s-category">
      <!-- <view class="search-wrap">
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
      </view> -->
      <view class="three-level-wrap ss-flex ss-col-top">
        <!-- 商品分类（左） -->
        <view class="side-menu-wrap">
          <scroll-view scroll-y :style="[{ height: menuScrollHeight + 'px' }]">
            <view
              class="menu-item ss-flex"
              v-for="(item, index) in state.categoryList"
              :key="item.id"
              :class="[{ 'menu-item-active': index === state.activeMenu }]"
              @tap="onMenu(index)"
            >
              <view class="menu-icon-wrap">
                <image
                  class="menu-icon"
                  :class="{ 'menu-icon-muted': index !== state.activeMenu }"
                  :src="sheep.$url.cdn(item.picUrl)"
                  mode="aspectFit"
                />
              </view>
              <view class="menu-title ss-line-2">
                {{ item.name }}
              </view>
            </view>
          </scroll-view>
        </view>
        <!-- 商品分类（右） -->
        <view class="goods-list-box" v-if="state.categoryList?.length">
          <scroll-view scroll-y :style="[{ height: menuScrollHeight + 'px' }]">
            <image v-if="bannerPicUrl" class="banner-img" :src="bannerPicUrl" mode="widthFix" />
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
            <uni-load-more
              v-if="
                (state.style === 'first_one' || state.style === 'first_two') &&
                state.pagination.total > 0
              "
              :status="state.loadStatus"
              :content-text="{
                contentdown: '点击查看更多',
              }"
              @tap="loadMore"
            />
          </scroll-view>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import secondOne from './components/second-one.vue';
  import sheep from '@/sheep';
  import CategoryApi from '@/sheep/api/product/category';
  import BannerApi from '@/sheep/api/promotion/banner';
  import SpuApi from '@/sheep/api/product/spu';
  import { onShow } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import { concat } from 'lodash-es';
  import { handleTree } from '@/sheep/helper/utils';

  const state = reactive({
    style: 'first_two', // first_one（一级 - 样式一）, first_two（二级 - 样式二）, second_one（二级）
    categoryList: [], // 商品分类树
    activeMenu: 0, // 选中的一级菜单，在 categoryList 的下标

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
  const searchBlockHeightPx = Math.ceil((142 / 750) * windowWidth);
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
    state.activeMenu = 0;
  }

  // 选中菜单
  const onMenu = (val) => {
    state.activeMenu = val;
    state.pagination.pageNo = 1;
    state.pagination.list = [];
    state.pagination.total = 0;
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
    if (res.code !== 0) {
      return;
    }
    // 合并列表
    state.pagination.list = concat(state.pagination.list, res.data.list);
    state.pagination.total = res.data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  // 加载更多商品
  function loadMore() {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getGoodsList();
  }
  function initMenuIndex() {
    // TODO @AI：可优化：增加一个 params.id 的兼容
    const appStore = sheep.$store('app');
    // 处理 tabbar 传参的情况
    const tabbarParams = appStore.paramsForTabbar || {};
    const id = tabbarParams.id;
    appStore.clearParamsForTabbar(); // 使用完后清理，避免影响下次跳转
    // 首页点击分类的处理：查找满足条件的分类
    const foundCategory = state.categoryList.find((category) => category.id === Number(id));
    // 如果找到则调用 onMenu 自动勾选相应分类，否则调用 onMenu(0) 勾选第一个分类
    onMenu(foundCategory ? state.categoryList.indexOf(foundCategory) : 0);
  }
  onShow(async () => {
    await getList();
    initMenuIndex();
    await loadBanner();
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
        width: 200rpx;
        height: 100%;
        background-color: #f6f6f6;
        position: fixed;
        left: 0;

        .menu-item {
          width: 100%;
          min-height: 180rpx;
          padding: 24rpx 10rpx 20rpx 10rpx;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all linear 0.2s;

          .menu-icon-wrap {
            width: 52rpx;
            height: 52rpx;
            position: relative;
            border-radius: 8rpx;
            overflow: hidden;
          }

          .menu-icon {
            width: 100%;
            height: 100%;
          }

          .menu-icon-muted {
            filter: grayscale(100%) brightness(82%);
            opacity: 0.82;
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
        width: calc(100vw - 200rpx);
        padding: 10px;
        margin-left: 200rpx;
      }

      .banner-img {
        width: calc(100vw - 130px);
        border-radius: 5px;
      }
    }
  }
</style>
