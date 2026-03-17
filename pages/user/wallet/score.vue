<!-- 我的积分 -->
<template>
  <s-layout class="wallet-wrap" title="积分明细" navbar="clear" :bgStyle="{ backgroundColor: '#f8f9f3' }">
    <view class="header-box">
      <su-status-bar />
      <view class="custom-nav" :style="{ height: (sheep.$platform.navbar - sheep.$platform.device.statusBarHeight) + 'px' }">
        <view class="nav-inner ss-flex ss-col-center">
          <view class="left-box ss-flex ss-col-center ss-p-l-30 ss-p-r-20" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <view class="title">积分明细</view>
        </view>
      </view>

      <view class="score-container ss-flex ss-row-between ss-col-center ss-p-x-40">
        <view class="score-box ss-flex-col">
          <view class="ss-m-b-10">
            <text class="all-title">当前积分</text>
          </view>
          <text class="all-num">{{ userInfo.point || 0 }}</text>
        </view>
        <view class="use-btn ss-flex ss-row-center ss-col-center" @tap="sheep.$router.go('/pages/goods/index')">
          去使用
        </view>
      </view>
    </view>
    <!-- tab -->
    <su-sticky :customNavHeight="sys_navBar">
      <view class="tab-box">
        <su-tabs
          :list="tabMaps"
          @change="onChange"
          :scrollable="false"
          :current="state.currentTab"
        ></su-tabs>
      </view>
    </su-sticky>

    <!-- list -->
    <view class="list-box">
      <view v-if="state.pagination.total > 0">
        <view
          class="list-item ss-flex ss-col-center ss-row-between"
          v-for="item in state.pagination.list"
          :key="item.id"
        >
          <view class="ss-flex-col">
            <view class="name ss-flex ss-col-center"
              >{{ item.title }}{{ item.description ? ' - ' + item.description : '' }}
              <image class="coin-icon ss-m-l-10" src="https://file.sheepjs.com/storage/img/2024/11/12/f2a417df4eb042d3be477eb0c8715837.png" mode="aspectFit" />
            </view>
            <view class="time">{{
              sheep.$helper.timeFormat(item.createTime, 'yyyy.mm.dd hh:MM')
            }}</view>
          </view>
          <view class="add" v-if="item.point > 0">+{{ item.point }}</view>
          <view class="minus" v-else>{{ item.point }}</view>
        </view>
      </view>
      <s-empty v-else text="暂无数据" icon="/static/data-empty.png" />
    </view>

    <uni-load-more
      v-if="state.pagination.total > 0"
      :status="state.loadStatus"
      :content-text="{
        contentdown: '上拉加载更多',
      }"
      @tap="onLoadMore"
    />
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import { concat } from 'lodash-es';
  import dayjs from 'dayjs';
  import PointApi from '@/sheep/api/member/point';
  import { resetPagination } from '@/sheep/helper/utils';

  const userInfo = computed(() => sheep.$store('user').userInfo);
  const sys_navBar = sheep.$platform.navbar;

  const state = reactive({
    currentTab: 0,
    pagination: {
      list: 0,
      total: 0,
      pageSize: 6,
      pageNo: 1,
    },
    loadStatus: '',
    date: [],
    today: '',
  });

  const tabMaps = [
    {
      name: '明细',
      value: 'all',
    },
    {
      name: '收入',
      value: 'true',
    },
    {
      name: '支出',
      value: 'false',
    },
  ];

  const dateFilterText = computed(() => {
    if (state.date[0] === state.date[1]) {
      return state.date[0];
    } else {
      return state.date.join('~');
    }
  });

  async function getLogList() {
    state.loadStatus = 'loading';
    let { code, data } = await PointApi.getPointRecordPage({
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
      addStatus: state.currentTab > 0 ? tabMaps[state.currentTab].value : undefined,
    });
    if (code !== 0) {
      return;
    }
    state.pagination.list = concat(state.pagination.list, data.list);
    state.pagination.total = data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  onLoad(() => {
    getLogList();
  });

  function onChange(e) {
    state.currentTab = e.index;
    resetPagination(state.pagination);
    getLogList();
  }

  function onChangeTime(e) {
    state.date[0] = e[0];
    state.date[1] = e[e.length - 1];
    resetPagination(state.pagination);
    getLogList();
  }

  function onLoadMore() {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getLogList();
  }

  onReachBottom(() => {
    onLoadMore();
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
        font-size: 32rpx;
        font-weight: 500;
        color: #1e3f1c;
      }
    }
  }

  .header-box {
    width: 100%;
    background: url('https://file.sheepjs.com/storage/img/2024/11/12/3df8a9a4b8784d1ab1b83d81f2113f8c.png') no-repeat;
    background-size: 100% 100%;
    padding: 0 0 120rpx 0;
    box-sizing: border-box;

    .score-container {
      padding-top: 30rpx;
    }

    .score-box {
      .all-num {
        font-size: 64rpx;
        font-family: AlibabaPuHuiTiB;
        color: #000000;
        line-height: 88rpx;
      }

      .all-title {
        font-size: 28rpx;
        color: #9d9c96;
        line-height: 40rpx;
      }
    }
    
    .use-btn {
      background: linear-gradient(270deg, #0f5c31 0%, #06943f 100%);
      border-radius: 34rpx;
      padding: 0 39rpx;
      height: 68rpx;
      font-size: 28rpx;
      color: #fffefa;
    }
  }

  // 筛选
  .tab-box {
    background-color: #fffefa;
    border-radius: 22rpx 22rpx 0 0;
    margin: -80rpx 33rpx 0;
    overflow: hidden;
  }

  .list-box {
    background: #fffefa;
    margin: 0 33rpx;
    padding: 0 30rpx;
    border-radius: 0 0 22rpx 22rpx;
    
    .list-item {
      border-bottom: 1rpx solid rgba(157, 156, 150, 0.3);
      padding: 30rpx 0;
      &:last-child {
        border-bottom: none;
      }

      .name {
        font-size: 28rpx;
        font-weight: 500;
        color: rgba(0, 0, 0, 1);
        line-height: 28rpx;
        margin-bottom: 20rpx;
        
        .coin-icon {
          width: 32rpx;
          height: 32rpx;
        }
      }

      .time {
        font-size: 28rpx;
        font-weight: normal;
        color: rgba(157, 156, 150, 1);
        line-height: 28rpx;
      }

      .add {
        font-size: 32rpx;
        font-family: Helvetica;
        font-weight: normal;
        color: rgba(54, 208, 7, 1);
      }

      .minus {
        font-size: 32rpx;
        font-family: Helvetica;
        font-weight: normal;
        color: rgba(255, 0, 0, 1);
      }
    }
  }
</style>
