<template>
  <s-layout
    class="coupon-wrap"
    title="优惠券"
    navbar="clear"
    :bgStyle="{ backgroundColor: '#f8f9f3' }"
  >
    <view class="header-box">
      <su-status-bar />
      <view
        class="custom-nav"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view class="nav-inner ss-flex ss-col-center">
          <view
            class="left-box ss-flex ss-col-center ss-p-l-30 ss-p-r-20"
            @tap="sheep.$router.back()"
          >
            <text class="sicon-back"></text>
          </view>
          <view class="title">优惠券</view>
        </view>
      </view>
    </view>
    <su-sticky bgColor="#f8f9f3" :offset="sheep.$platform.navbar">
      <view class="section_2 flex-col">
        <view class="text-wrapper_9 flex-row ss-flex">
          <text
            class="tab-item"
            :class="state.currentSubTab === 0 ? 'text_3' : 'text_all_inactive'"
            @tap="onSubTabsChange(0, 'all')"
            >全部</text
          >
          <text
            class="tab-item"
            :class="state.currentSubTab === 1 ? 'text_3' : 'text_inactive_color'"
            @tap="onSubTabsChange(1, '1')"
            >未使用</text
          >
          <text
            class="tab-item"
            :class="state.currentSubTab === 2 ? 'text_3' : 'text_inactive_color'"
            @tap="onSubTabsChange(2, '2')"
            >已失效</text
          >
        </view>
        <view class="section_7">
          <view
            class="section_3"
            :style="{
              transform: `translateX(${state.currentSubTab * 250 + 109}rpx)`,
              transition: 'transform 0.3s',
            }"
          ></view>
        </view>
      </view>
    </su-sticky>
    <s-empty
      v-if="state.pagination.total === 0"
      :icon="sheep.$url.static('/static/coupon-empty.webp')"
      text="暂无优惠券"
    />

    <!-- 优惠券列表 -->
    <view class="coupon-list ss-p-x-32 ss-m-t-20">
      <view v-for="item in state.pagination.list" :key="item.id" class="ss-m-b-24">
        <s-coupon-list :data="item" type="user" :disabled="item.status !== 1 || isExpired(item)">
          <template #default>
            <button
              class="ss-reset-button coupon-btn ss-flex ss-row-center ss-col-center"
              :class="item.status !== 1 || isExpired(item) ? 'disabled-btn' : ''"
              :disabled="item.status !== 1 || isExpired(item)"
              @click.stop="
                item.status === 1 && !isExpired(item)
                  ? sheep.$router.go('/pages/index/category')
                  : sheep.$router.go('/pages/coupon/detail', { id: item.id })
              "
            >
              {{
                item.status === 1 && !isExpired(item)
                  ? '立即使用'
                  : item.status === 2
                  ? '已使用'
                  : '已过期'
              }}
            </button>
          </template>
        </s-coupon-list>
      </view>
    </view>

    <uni-load-more
      v-if="state.pagination.total > 0"
      :status="state.loadStatus"
      :content-text="{
        contentdown: '上拉加载更多',
      }"
      @tap="loadMore"
    />
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import { concat } from 'lodash-es';
  import { resetPagination } from '@/sheep/helper/utils';
  import CouponApi from '@/sheep/api/promotion/coupon';

  // 数据
  const state = reactive({
    currentTab: 0, // 当前 tab
    currentSubTab: 0, // 当前子 tab
    type: 'all',
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 5,
    },
    loadStatus: '',
  });

  const tabMaps = [
    {
      name: '全部',
      value: 'all',
    },
    {
      name: '满减券',
      value: '1',
    },
    {
      name: '折扣券',
      value: '2',
    },
  ];

  const subTabMaps = [
    { name: '全部', value: 'all' },
    { name: '未使用', value: '1' },
    { name: '已失效', value: '2' },
  ];

  function onTabsChange(e) {
    state.currentTab = e.index;
    // 重置二级标签
    state.currentSubTab = 0;
    state.type = 'all';
    resetPagination(state.pagination);
    getCoupon();
  }

  function onSubTabsChange(index, value) {
    state.currentSubTab = index;
    state.type = value;
    // 根据二级标签刷新数据
    resetPagination(state.pagination);
    getCoupon();
  }

  // 判断是否过期
  function isExpired(item) {
    if (!item.validEndTime) return false;
    return item.validEndTime < new Date().getTime();
  }

  // 获得优惠劵模版列表（保留供参考或后续领券页使用）
  async function getData() {
    state.loadStatus = 'loading';
    const { data, code } = await CouponApi.getCouponTemplatePage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
    });
    if (code !== 0) {
      return;
    }
    state.pagination.list = concat(state.pagination.list, data.list);
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  // 获得我的优惠劵
  async function getCoupon() {
    state.loadStatus = 'loading';
    const params = {
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
      discountType: state.currentTab === 0 ? undefined : tabMaps[state.currentTab].value,
    };
    if (['1', '2'].includes(state.type)) {
      params.status = state.type;
    }
    const { data, code } = await CouponApi.getCouponPage(params);
    if (code !== 0) {
      return;
    }
    state.pagination.list = concat(state.pagination.list, data.list);
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  // 领取优惠劵
  async function getBuy(id) {
    const { code } = await CouponApi.takeCoupon(id);
    if (code !== 0) {
      return;
    }
    uni.showToast({
      title: '领取成功',
    });
    setTimeout(() => {
      resetPagination(state.pagination);
      getData();
    }, 1000);
  }

  // 加载更多
  function loadMore() {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getCoupon();
  }

  onLoad((Option) => {
    if (Option.type) {
      if (Option.type === 'expired') {
        state.currentSubTab = 2;
        state.type = '2'; // 已失效的 status 为 2
      } else if (Option.type === 'geted' || Option.type === 'unused') {
        state.currentSubTab = 1;
        state.type = '1'; // 未使用的 status 为 1
      } else {
        state.currentSubTab = 0;
        state.type = 'all'; // 默认全部
      }
    }
    getCoupon();
  });

  onReachBottom(() => {
    loadMore();
  });
</script>
<style lang="scss" scoped>
  .custom-nav {
    position: relative;
    width: 100%;

    .nav-inner {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 100%;
      width: 100%;

      .left-box {
        .sicon-back {
          font-size: 32rpx;
          color: #1e3f1c;
        }
      }

      .title {
        font-size: 36rpx;
        font-weight: 600;
        color: rgba(30, 63, 28, 0.9);
      }
    }
  }

  .header-box {
    width: 100%;
    background-color: #f8f9f3;
  }

  .section_2 {
    box-shadow: 0px 6px 10px 0px rgba(0, 0, 0, 0.03);
    background-color: rgba(248, 249, 243, 1);
    padding: 24rpx 0 0 0;
  }

  .text-wrapper_9 {
    display: flex;
    width: 100%;
  }

  .tab-item {
    flex: 1;
    text-align: center;
  }

  .text_3 {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1) !important;
    font-size: 32rpx;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
    line-height: 48rpx;
  }

  .text_all_inactive {
    overflow-wrap: break-word;
    color: rgba(29, 33, 41, 1);
    font-size: 32rpx;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 48rpx;
  }

  .text_inactive_color {
    color: rgba(29, 33, 41, 1) !important;
    font-weight: normal !important;
  }

  .section_7 {
    margin-top: 18rpx;
    position: relative;
    width: 100%;
    height: 6rpx;
  }

  .section_3 {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 1998px;
    width: 32rpx;
    height: 6rpx;
    position: absolute;
    left: 0;
    bottom: 0;
  }

  .coupon-btn {
    padding: 12rpx 24rpx;
    height: 52rpx;
    border-radius: 26rpx;
    background: #1e3f1c;
    color: #ffffff;
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
  }

  .disabled-btn {
    background: #d9d9d9;
    color: #333333 !important;
  }
</style>
