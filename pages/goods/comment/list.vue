<!-- 商品评论的分页 -->
<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F8F9F3' }">
    <view class="fixed-header" :style="{ height: sheep.$platform.navbar + 'px' }">
      <su-status-bar />
      <view
        class="nav-bar-container"
        :style="{ height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px' }"
      >
        <view
          class="nav-bar-inner ss-flex ss-col-center"
          :style="{ height: '100%', paddingLeft: '20rpx' }"
        >
          <view class="back-btn ss-flex ss-col-center ss-row-center" @tap="sheep.$router.back()">
            <text class="sicon-back"></text>
          </view>
          <text class="nav-title ss-m-l-10">全部评论</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <view class="comment-page">
      <view class="tabs-card">
        <su-tabs
          :list="state.type"
          :scrollable="false"
          @change="onTabsChange"
          :current="state.currentTab"
        />
      </view>

      <view class="comment-list" v-if="state.pagination.total > 0">
        <view class="list-item" v-for="item in state.pagination.list" :key="item">
          <comment-item :item="item" />
        </view>
      </view>

      <s-empty
        v-if="state.pagination.total === 0"
        text="暂无数据"
        :icon="sheep.$url.static('/static/data-empty.webp')"
      />
      <uni-load-more
        icon-type="auto"
        v-if="state.pagination.total > 0"
        :status="state.loadStatus"
        :content-text="{
          contentdown: '上拉加载更多',
        }"
        @tap="loadMore"
      />
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import CommentApi from '@/sheep/api/product/comment';
  import { onLoad, onReachBottom } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import { concat } from 'lodash-es';
  import commentItem from '../components/detail/comment-item.vue';

  const state = reactive({
    id: 0, // 商品 SPU 编号
    type: [
      { type: 0, name: '全部' },
      { type: 1, name: '好评' },
      { type: 2, name: '中评' },
      { type: 3, name: '差评' },
    ],
    currentTab: 0, // 选中的 TAB
    loadStatus: '',
    pagination: {
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 8,
    },
  });

  // 切换选项卡
  function onTabsChange(e) {
    state.currentTab = e.index;
    // 加载列表
    state.pagination.pageNo = 1;
    state.pagination.list = [];
    state.pagination.total = 0;
    getList();
  }

  async function getList() {
    // 加载列表
    state.loadStatus = 'loading';
    let res = await CommentApi.getCommentPage(
      state.id,
      state.pagination.pageNo,
      state.pagination.pageSize,
      state.type[state.currentTab].type,
    );
    if (res.code !== 0) {
      return;
    }
    // 合并列表
    state.pagination.list = concat(state.pagination.list, res.data.list);
    state.pagination.total = res.data.total;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  // 加载更多
  function loadMore() {
    if (state.loadStatus === 'noMore') {
      return;
    }
    state.pagination.pageNo++;
    getList();
  }

  onLoad((options) => {
    state.id = options.id;
    getList();
  });

  // 上拉加载更多
  onReachBottom(() => {
    loadMore();
  });
</script>

<style lang="scss" scoped>
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    background: #f8f9f3;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* #ifdef H5 */
    max-width: 750rpx;
    left: 50%;
    transform: translateX(-50%);
    /* #endif */
  }

  .nav-bar-container {
    background: #f8f9f3;
    display: flex;
    align-items: center;
  }

  .back-btn {
    width: 60rpx;
    height: 60rpx;
    color: #000000;
    font-size: 40rpx;
  }

  .nav-title {
    color: #000000;
    font-size: 36rpx;
    font-weight: 600;
  }

  .comment-page {
    padding: 20rpx 24rpx 32rpx;
    background: #f8f9f3;
    min-height: calc(100vh - var(--window-top));
    box-sizing: border-box;
  }

  .tabs-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 8rpx 12rpx;
  }

  .comment-list {
    margin-top: 20rpx;
    border-radius: 20rpx;
    overflow: hidden;
  }

  .list-item {
    padding: 32rpx 30rpx 20rpx 20rpx;
    background: #fff;
    margin-bottom: 20rpx;
    border-radius: 20rpx;

    .avatar {
      width: 52rpx;
      height: 52rpx;
      border-radius: 50%;
    }

    .nickname {
      font-size: 26rpx;
      font-weight: 500;
      color: #999999;
    }

    .create-time {
      font-size: 24rpx;
      font-weight: 500;
      color: #c4c4c4;
    }

    .content-title {
      font-size: 26rpx;
      font-weight: 400;
      color: #666666;
      line-height: 42rpx;
    }

    .content-img {
      width: 174rpx;
      height: 174rpx;
    }

    .cicon-info-o {
      font-size: 26rpx;
      color: #c4c4c4;
    }

    .foot-title {
      font-size: 24rpx;
      font-weight: 500;
      color: #999999;
    }
  }

  .list-item:last-child {
    margin-bottom: 0;
  }

  .btn-box {
    width: 100%;
    height: 120rpx;
    background: #fff;
    border-top: 2rpx solid #eee;
  }

  .tab-btn {
    width: 130rpx;
    height: 62rpx;
    background: #eeeeee;
    border-radius: 31rpx;
    font-size: 28rpx;
    font-weight: 400;
    color: #999999;
    border: 1px solid #e5e5e5;
    margin-right: 10rpx;
  }
</style>
