<template>
  <s-layout class="coupon-wrap" title="优惠券" navbar="clear" :bgStyle="{ backgroundColor: '#f8f9f3' }">
    <view class="header-box">
      <su-status-bar />
      <view class="custom-nav" :style="{ height: (sheep.$platform.navbar - sheep.$platform.device.statusBarHeight) + 'px' }">
        <view class="nav-inner ss-flex ss-col-center">
          <view class="left-box ss-flex ss-col-center ss-p-l-30 ss-p-r-20" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <view class="title">优惠券</view>
        </view>
      </view>
    </view>
    <su-sticky bgColor="#f8f9f3" :offset="sheep.$platform.navbar">
      <view class="tab-container ss-p-x-20 ss-p-t-20">
        <su-tabs
          :list="tabMaps"
          :scrollable="false"
          @change="onTabsChange"
          :current="state.currentTab"
          :activeColor="'rgba(30, 63, 28, 1.0)'"
          :inactiveColor="'rgba(29, 33, 41, 1.0)'"
          :barStyle="{ backgroundColor: 'rgba(30, 63, 28, 1.0)' }"
          :customStyle="{ backgroundColor: '#f8f9f3' }"
        />
      </view>
      
      <!-- 二级过滤标签 -->
      <view class="sub-tabs ss-flex ss-row-around ss-col-center ss-p-y-20 ss-p-x-20">
        <view 
          v-for="(item, index) in subTabMaps" 
          :key="index"
          class="sub-tab-item"
          :class="{ active: state.currentSubTab === index }"
          @tap="onSubTabsChange(index, item.value)"
        >
          {{ item.name }}
        </view>
      </view>
    </su-sticky>
    <s-empty
      v-if="state.pagination.total === 0"
      icon="/static/coupon-empty.png"
      text="暂无优惠券"
    />
    
    <!-- 优惠券列表 -->
    <view class="coupon-list ss-p-x-32 ss-m-t-20">
      <view v-for="item in state.pagination.list" :key="item.id" class="ss-m-b-24">
        <s-coupon-list
          :data="item"
          type="user"
          @tap="sheep.$router.go('/pages/coupon/detail', { id: item.id })"
        >
          <template #default>
            <button
              class="ss-reset-button card-btn ss-flex ss-row-center ss-col-center"
              :class="item.status !== 1 ? 'disabled-btn' : ''"
              :disabled="item.status !== 1"
              @click.stop="sheep.$router.go('/pages/coupon/detail', { id: item.id })"
            >
              {{ item.status === 1 ? '立即使用' : item.status === 2 ? '已使用' : '已过期' }}
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
    type: '1',
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
    { name: '全部', value: '1' },
    { name: '最新领取', value: '2' },
    { name: '即将到期', value: '3' },
    { name: '已失效', value: '4' }
  ];

  function onTabsChange(e) {
    state.currentTab = e.index;
    // 重置二级标签
    state.currentSubTab = 0;
    state.type = subTabMaps[0].value;
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
    const { data, code } = await CouponApi.getCouponPage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
      status: state.type,
    });
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
      // 兼容原有的路由跳转参数
      const typeMap = {
        'all': 0, // 对应子标签'全部'，但通常不这样传
        'geted': 0, // 原'已领取' -> 现子标签'全部'
        'used': 0, // 原'已使用' -> 现无对应，默认跳到'全部'
        'expired': 3, // 原'已失效' -> 现子标签'已失效'
      };
      
      if (Option.type === 'expired') {
        state.currentSubTab = 3;
        state.type = '4'; // 已失效的 status
      } else {
        state.currentSubTab = 0;
        state.type = '1'; // 默认全部的 status
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
  
  .sub-tabs {
    background-color: #f8f9f3;
    .sub-tab-item {
      padding: 10rpx 36rpx;
      font-size: 24rpx;
      color: rgba(29, 33, 41, 1.0);
      background-color: #fff;
      border-radius: 30rpx;
      font-family: PingFangSC-Regular;
      border: 1px solid transparent;
      
      &.active {
        color: rgba(30, 63, 28, 1.0);
        border: 1px solid rgba(30, 63, 28, 1);
        font-family: PingFangSC-Semibold;
        font-weight: 600;
        background-color: #fff;
      }
    }
  }

  .card-btn {
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
    color: #ffffff !important;
  }
</style>
