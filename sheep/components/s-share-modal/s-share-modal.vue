<!-- 全局分享弹框 -->
<template>
  <view>
    <su-popup :show="state.showShareGuide" :showClose="false" @close="onCloseGuide" />
    <view v-if="state.showShareGuide" class="guide-wrap">
      <image
        v-if="!state.guideImageError"
        class="guide-image"
        :src="sheep.$url.cdn('/mp/static/share/shareGuide.webp')"
        @error="state.guideImageError = true"
      />
      <view v-else class="guide-tip">
        <text class="guide-tip-text">请点击右上角“...”</text>
        <text class="guide-tip-text">选择“分享到朋友圈”</text>
      </view>
    </view>

    <su-popup
      :show="show"
      round="20"
      :showClose="false"
      maskBackgroundColor="rgba(0, 0, 0, 0.5)"
      backgroundColor="rgba(255, 255, 250, 1.0)"
      @close="closeShareModal"
    >
      <view class="share-modal">
        <view class="share-header">
          <text class="share-header-title">分享方式</text>
          <image
            class="share-close"
            :src="sheep.$url.cdn('/mp/static/share/close.webp')"
            mode="aspectFit"
            @tap="closeShareModal"
          />
        </view>
        <view class="share-body">
          <button
            v-if="shareConfig.methods.includes('forward')"
            class="share-item"
            open-type="share"
            @tap="onShareByForward"
          >
            <image class="share-icon" :src="sheep.$url.cdn('/mp/static/share/shareWechat.webp')" mode="aspectFit" />
            <text class="share-text">微信好友</text>
          </button>

          <!-- 暂时隐藏朋友圈分享入口 -->
          <!--
          <button v-if="shareConfig.methods.includes('forward')" class="share-item" @tap="onShareByTimeline">
            <image class="share-icon" :src="sheep.$url.cdn('/mp/static/share/sharePyq.webp')" mode="aspectFit" />
            <text class="share-text">朋友圈</text>
          </button>
          -->

          <!-- 只有在非 user 类型（即非邀请会员场景）时，才显示生成海报按钮 -->
          <button
            v-if="shareConfig.methods.includes('poster') && shareInfo?.poster?.type !== 'user'"
            class="share-item"
            @tap="onShareByPoster"
          >
            <image class="share-icon" :src="sheep.$url.cdn('/mp/static/share/shareImage.webp')" mode="aspectFit" />
            <text class="share-text">生成海报</text>
          </button>
        </view>
      </view>
    </su-popup>

    <!-- 分享海报，对应操作 ② -->
    <canvas-poster
      ref="SharePosterRef"
      :show="state.showPosterModal"
      :shareInfo="shareInfo"
      @close="state.showPosterModal = false"
    />
  </view>
</template>
<script setup>
  /**
   * 分享弹窗
   */
  import { ref, unref, reactive, computed, nextTick } from 'vue';
  import sheep from '@/sheep';
  import canvasPoster from './canvas-poster/index.vue';
  import { closeShareModal, showAuthModal } from '@/sheep/hooks/useModal';

  const show = computed(() => sheep.$store('modal').share);
  const shareConfig = computed(() => sheep.$store('app').platform.share);
  const SharePosterRef = ref('');

  const props = defineProps({
    shareInfo: {
      type: Object,
      default() {},
    },
  });

  const state = reactive({
    showShareGuide: false, // H5 的指引
    showPosterModal: false, // 海报弹窗
    guideImageError: false,
  });

  // 操作 ②：生成海报分享
  const onShareByPoster = async () => {
    closeShareModal();
    if (!sheep.$store('user').isLogin) {
      showAuthModal();
      return;
    }
    uni.showLoading({ title: '生成中' });
    try {
      state.showPosterModal = true;
      await nextTick();
      await unref(SharePosterRef).getPoster();
    } catch (e) {
      const msg = e?.message || '';
      sheep.$helper.toast(msg ? `海报生成失败：${msg}` : '海报生成失败，请重试');
      console.error('海报生成失败', e);
      state.showPosterModal = false;
    } finally {
      uni.hideLoading({
        fail: () => {},
      });
    }
  };

  // 操作 ①：直接转发分享
  const onShareByForward = () => {
    closeShareModal();

    // #ifdef H5
    if (['WechatOfficialAccount', 'H5'].includes(sheep.$platform.name)) {
      state.showShareGuide = true;
      return;
    }
    // #endif

    // #ifdef APP-PLUS
    uni.share({
      provider: 'weixin',
      scene: 'WXSceneSession',
      type: 0,
      href: props.shareInfo.link,
      title: props.shareInfo.title,
      summary: props.shareInfo.desc,
      imageUrl: props.shareInfo.image,
      success: (res) => {
        console.log('success:' + JSON.stringify(res));
      },
      fail: (err) => {
        console.log('fail:' + JSON.stringify(err));
      },
    });
    // #endif
  };

  const onShareByTimeline = async () => {
    closeShareModal();

    // #ifdef MP-WEIXIN
    // 微信小程序点击朋友圈时，直接调用生成海报逻辑
    if (!sheep.$store('user').isLogin) {
      showAuthModal();
      return;
    }
    uni.showLoading({ title: '生成中' });
    try {
      state.showPosterModal = true;
      await nextTick();
      await unref(SharePosterRef).getPoster();
    } catch (e) {
      const msg = e?.message || '';
      sheep.$helper.toast(msg ? `海报生成失败：${msg}` : '海报生成失败，请重试');
      console.error('海报生成失败', e);
      state.showPosterModal = false;
    } finally {
      uni.hideLoading({
        fail: () => {},
      });
    }
    return;
    // #endif

    // #ifdef H5
    if (['WechatOfficialAccount', 'H5'].includes(sheep.$platform.name)) {
      state.showShareGuide = true;
      return;
    }
    // #endif

    // #ifdef APP-PLUS
    uni.share({
      provider: 'weixin',
      scene: 'WXSceneTimeline',
      type: 0,
      href: props.shareInfo.link,
      title: props.shareInfo.title,
      summary: props.shareInfo.desc,
      imageUrl: props.shareInfo.image,
      success: (res) => {
        console.log('success:' + JSON.stringify(res));
      },
      fail: (err) => {
        console.log('fail:' + JSON.stringify(err));
      },
    });
    // #endif
  };

  function onCloseGuide() {
    state.showShareGuide = false;
  }
</script>

<style lang="scss" scoped>
  .guide-wrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 10080;
  }

  .guide-image {
    right: 30rpx;
    top: 0;
    position: fixed;
    width: 580rpx;
    height: 430rpx;
    z-index: 10080;
  }

  .guide-tip {
    position: fixed;
    right: 30rpx;
    top: 40rpx;
    background: rgba(30, 63, 28, 0.92);
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    z-index: 10081;
  }

  .guide-tip-text {
    color: rgba(255, 254, 250, 1);
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .share-modal {
    background-color: rgba(255, 255, 250, 1.0);
    border-radius: 20rpx 20rpx 0 0;
    width: 750rpx;
  }

  .share-header {
    background-color: rgba(255, 255, 250, 1.0);
    border-radius: 20rpx 20rpx 0 0;
    position: relative;
    padding: 38rpx 37rpx 20rpx 107rpx;
  }

  .share-header-title {
    overflow-wrap: break-word;
    color: rgba(30, 63, 28, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 45rpx;
    width: 386rpx;
    margin-left: 220rpx;
  }

  .share-close {
    position: absolute;
    right: 37rpx;
    top: 38rpx;
    width: 45rpx;
    height: 45rpx;
  }

  .share-body {
    padding: 32rpx 30rpx 38rpx 30rpx;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }

  .share-item {
    width: 210rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    background-color: transparent;
    border: none;
    padding: 0;
    line-height: 1;
  }

  .share-item::after {
    border: none;
  }

  .share-icon {
    width: 90rpx;
    height: 90rpx;
  }

  .share-text {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 40rpx;
    margin-top: 21rpx;
  }
</style>
