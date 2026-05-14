<!-- 评价  -->
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
          <text class="nav-title ss-m-l-10">评价</text>
        </view>
      </view>
    </view>
    <view class="header-placeholder" :style="{ height: sheep.$platform.navbar + 'px' }"></view>

    <view class="comment-page">
      <view class="comment-card" v-for="(item, index) in state.commentItems" :key="item.id">
        <view class="commont-from-wrap">
          <s-goods-item
            :img="item.picUrl"
            :title="item.spuName"
            :skuText="item.properties.map((property) => property.valueName).join(' ')"
            :price="item.payPrice"
            :num="item.count"
          />
        </view>

        <view class="form-item">
          <view class="star-box ss-flex ss-col-center">
            <view class="star-title ss-m-r-40">商品质量</view>
            <uni-rate v-model="state.commentList[index].descriptionScores" />
          </view>
          <view class="star-box ss-flex ss-col-center">
            <view class="star-title ss-m-r-40">服务态度</view>
            <uni-rate v-model="state.commentList[index].benefitScores" />
          </view>
          <view class="area-box">
            <uni-easyinput
              :inputBorder="false"
              type="textarea"
              maxlength="120"
              autoHeight
              v-model="state.commentList[index].content"
              placeholder="宝贝满足你的期待吗？说说你的使用心得，分享给想买的他们吧~"
            />
            <view class="img-box">
              <s-uploader
                v-model:url="state.commentList[index].images"
                fileMediatype="image"
                limit="9"
                mode="grid"
                :imageStyles="{ width: '168rpx', height: '168rpx' }"
                @success="(payload) => uploadSuccess(payload, index)"
              />
            </view>
          </view>
          <view class="checkbox-container">
            <checkbox-group @change="(event) => toggleAnonymous(index, event)">
              <label>
                <checkbox value="anonymousChecked" />
                匿名评论
              </label>
            </checkbox-group>
          </view>
        </view>
      </view>
    </view>

    <su-fixed bottom placeholder bg="bg-white" v-if="state.commentItems.length > 0">
      <view class="foot_box ss-flex ss-row-center ss-col-center">
        <button class="ss-reset-button post-btn" @tap="onSubmit">发布</button>
      </view>
    </su-fixed>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { onLoad } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import OrderApi from '@/sheep/api/trade/order';

  const state = reactive({
    orderInfo: {},
    commentItems: [],
    commentList: [],
    id: null,
  });

  /**
   * 切换是否匿名
   *
   * @param commentIndex  当前评论下标
   * @param event 复选框事件
   */
  function toggleAnonymous(commentIndex, event) {
    state.commentList[commentIndex].anonymous = event.detail.value[0] === 'anonymousChecked';
  }

  /**
   * 发布评论
   *
   * @returns {Promise<void>}
   */
  async function onSubmit() {
    if (state.commentList.length === 0) {
      sheep.$helper.toast('暂无可评价商品');
      return;
    }
    // 顺序提交评论
    for (const comment of state.commentList) {
      await OrderApi.createOrderItemComment(comment);
    }
    // 都评论好，返回
    sheep.$router.back();
  }

  /**
   * 图片添加到表单
   *
   * @param payload 上传成功后的回调数据
   * @param commentIndex  当前评论的下标
   */
  function uploadSuccess(payload, commentIndex) {
    state.commentList[commentIndex].picUrls = payload.tempFilePaths;
  }

  onLoad(async (options) => {
    if (!options.id) {
      sheep.$helper.toast(`缺少订单信息，请检查`);
      return;
    }
    state.id = options.id;

    const { code, data } = await OrderApi.getOrderDetail(state.id);
    if (code !== 0) {
      sheep.$helper.toast('无待评价订单');
      return;
    }
    const commentableItems = Array.isArray(data.items)
      ? data.items.filter((item) => {
          const afterSaleStatus = Number(item?.afterSaleStatus ?? 0);
          const commentStatus = Boolean(item?.commentStatus);
          return afterSaleStatus === 0 && commentStatus === false;
        })
      : [];
    if (commentableItems.length === 0) {
      sheep.$helper.toast('暂无可评价商品');
      sheep.$router.back();
      return;
    }
    // 处理评论
    commentableItems.forEach((item) => {
      state.commentList.push({
        anonymous: false,
        orderItemId: item.id,
        descriptionScores: 5,
        benefitScores: 5,
        content: '',
        picUrls: [],
      });
    });
    state.commentItems = commentableItems;
    state.orderInfo = data;
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

  .comment-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
  }

  .commont-from-wrap {
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }

  .form-item {
    background: #fff;

    .star-box {
      height: 100rpx;
      padding: 0;
    }

    .star-title {
      color: #3d3d3c;
      font-size: 28rpx;
      font-weight: 600;
    }
  }

  .area-box {
    width: 100%;
    min-height: 306rpx;
    background: rgba(249, 250, 251, 1);
    border-radius: 20rpx;
    padding: 28rpx;
    box-sizing: border-box;

    .img-box {
      margin-top: 20rpx;
    }
  }

  .checkbox-container {
    padding: 20rpx 0 10rpx;
    color: #666666;
    font-size: 24rpx;
  }

  .foot_box {
    height: 120rpx;
    background: #ffffff;
  }

  .post-btn {
    width: 690rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    color: #ffffff;
    background: #1e3f1c;
    margin-bottom: 20rpx;
  }
</style>
