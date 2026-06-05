<!-- 首页，支持店铺装修 -->
<template>
  <view v-if="template">
    <s-layout
      title="首页"
      navbar="custom"
      tabbar="/pages/index/index"
      :bgStyle="template.page"
      :navbarStyle="homeNavbarStyle"
      onShareAppMessage
    >
      <view class="home-content" :style="{ height: pageHeightPx + 'px' }">
        <s-block v-for="(item, index) in homeComponents" :key="index" :styles="item.property.style">
          <s-block-item :type="item.id" :data="item.property" :styles="item.property.style" />
        </s-block>
      </view>
      <view v-if="showHomeStickyPanel" class="home-sticky-panel">
        <view
          class="home-sticky-top"
          :style="{ backgroundImage: `url(${stickyLongBgUrl})` }"
          @tap="onTapHomeMember"
        >
          <view class="home-sticky-top-left">
            <image class="home-sticky-top-left-icon" :src="stickyMemberIconUrl" mode="aspectFit" />
            <text class="home-sticky-top-left-text">成为仙草会员，尊享会员权益</text>
          </view>
          <image class="home-sticky-top-right-icon" :src="stickyGroupIconUrl" mode="aspectFit" />
        </view>
        <view class="home-sticky-bottom">
          <view
            class="home-sticky-bottom-item"
            :style="{ backgroundImage: `url(${stickyShortBgUrl})` }"
            @tap="onTapHomeBrandStory"
          >
            <view class="home-sticky-bottom-left">
              <text class="home-sticky-bottom-title">仙草品牌</text>
              <text class="home-sticky-bottom-subtitle">以本草匠心滋养</text>
            </view>
            <image
              class="home-sticky-bottom-right-icon"
              :src="stickyBrandIconUrl"
              mode="aspectFit"
            />
          </view>
          <view
            class="home-sticky-bottom-item"
            :style="{ backgroundImage: `url(${stickyShortBgUrl})` }"
            @tap="onTapHomeCategory"
          >
            <view class="home-sticky-bottom-left">
              <text class="home-sticky-bottom-title">更多产品</text>
              <text class="home-sticky-bottom-subtitle">点击查看更多甄品</text>
            </view>
            <image class="home-sticky-bottom-right-icon" :src="stickyIconUrl" mode="aspectFit" />
          </view>
        </view>
      </view>
    </s-layout>
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import $share from '@/sheep/platform/share';
  // 隐藏原生tabBar
  uni.hideTabBar({
    fail: () => {},
  });

  const template = computed(() => sheep.$store('app').template?.home);
  const homeNavbarStyle = computed(() => {
    const nav = template.value?.navigationBar || {};
    const bgColor =
      nav.bgColor && nav.bgColor !== 'transparent' ? nav.bgColor : 'rgba(248, 249, 243, 1.0)';
    return {
      ...nav,
      styleType: 'inner',
      bgColor,
    };
  });

  const pageHeightPx = computed(() => {
    const device = sheep.$platform?.device || {};
    const win = Number(device.windowHeight);
    const screen = Number(device.screenHeight);
    const navbar = Number(sheep.$platform?.navbar);

    let h =
      Number.isFinite(win) && win > 0 ? win : Number(uni.getSystemInfoSync().windowHeight) || 667;
    if (homeNavbarStyle.value?.styleType === 'inner' && Number.isFinite(navbar) && navbar > 0)
      h += navbar;
    if (Number.isFinite(screen) && screen > 0) h = Math.min(h, screen);

    return h;
  });

  const homeComponents = computed(() => {
    const list = template.value?.components || [];
    if (!Array.isArray(list)) return [];
    return list.map((item, index) => {
      if (index !== 0 || item?.id !== 'Carousel') return item;
      const style = item?.property?.style || {};
      return {
        ...item,
        property: {
          ...item.property,
          style: {
            ...style,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
          },
          fullScreen: true,
          height: pageHeightPx.value,
        },
      };
    });
  });

  const showHomeStickyPanel = computed(() => {
    const first = homeComponents.value?.[0];
    return first?.id === 'Carousel' && !!first?.property?.fullScreen;
  });

  const stickyLongBgUrl = computed(() => sheep.$url.cdn('/mp/static/version2Index/长框@2x.webp'));
  const stickyShortBgUrl = computed(() => sheep.$url.cdn('/mp/static/version2Index/短框@2x.webp'));
  const stickyMemberIconUrl = computed(() =>
    sheep.$url.cdn('/mp/static/version2Index/会员@2x.webp'),
  );
  const stickyGroupIconUrl = computed(() =>
    sheep.$url.cdn('/mp/static/version2Index/编组@2x.webp'),
  );
  const stickyBrandIconUrl = computed(() =>
    sheep.$url.cdn('/mp/static/version2Index/品牌图标@2x.webp'),
  );
  const stickyIconUrl = computed(() => sheep.$url.cdn('/mp/static/version2Index/产品图标@2x.webp'));

  function onTapHomeBrandStory() {
    sheep.$router.go('/pages/index/story');
  }

  function onTapHomeMember() {
    sheep.$router.go('/pages/index/member');
  }

  function onTapHomeCategory() {
    sheep.$router.go('/pages/index/category');
  }

  // 在此处拦截改变一下首页轮播图 此处先写死后期复活 放到启动函数里
  // (async function() {
  // console.log('原代码首页定制化数据',template)
  // let {
  // 	data
  // } = await index2Api.decorate();
  // console.log('首页导航配置化过高无法兼容',JSON.parse(data[1].value))
  // 改变首页底部数据 但是没有通过数组id获取商品数据接口
  // let {
  // 	data: datas
  // } = await index2Api.spids();
  // template.value.data[9].data.goodsIds = datas.list.map(item => item.id);
  // template.value.data[0].data.list = JSON.parse(data[0].value).map(item => {
  // 	return {
  // 		src: item.picUrl,
  // 		url: item.url,
  // 		title: item.name,
  // 		type: "image"
  // 	}
  // })
  // }())

  onLoad((options) => {
    // #ifdef MP
    // 小程序识别二维码
    if (options.scene) {
      const scene = decodeURIComponent(options.scene);
      scene.split('&').forEach((pair) => {
        if (!pair) return;
        const idx = pair.indexOf('=');
        if (idx < 0) return;
        const k = pair.slice(0, idx);
        const v = pair.slice(idx + 1);
        if (!k) return;
        options[k] = v;
      });
    }
    // #endif

    const entrySpm = uni.getStorageSync('entrySpm');
    if (!options.spm && entrySpm) {
      options.spm = entrySpm;
      uni.removeStorageSync('entrySpm');
    }
    const entryInviterId = uni.getStorageSync('entryInviterId');
    if (!options.inviterId && entryInviterId) {
      options.inviterId = entryInviterId;
      uni.removeStorageSync('entryInviterId');
    }

    // 预览模板
    if (options.templateId) {
      sheep.$store('app').init(options.templateId);
    }

    // 解析分享信息
    if (options.spm) {
      $share.decryptSpm(options.spm);
    }

    // 邀请注册：兼容二维码/链接直接携带 inviterId
    if (options.inviterId && !options.spm) {
      uni.setStorageSync('inviterId', options.inviterId);
      const memberUrl = '/pages/index/member';
      if (!sheep.$store('user').isLogin) {
        uni.setStorageSync('returnUrl', memberUrl);
        sheep.$router.go('/pages/index/login');
        return;
      }
      sheep.$router.go(memberUrl);
      return;
    }

    // 进入指定页面(完整页面路径)
    if (options.page) {
      let targetUrl = '';
      try {
        targetUrl = decodeURIComponent(options.page);
      } catch (e) {
        targetUrl = options.page;
      }
      const sanitized = $share.sanitizeEntryTargetUrl(targetUrl);
      if (sanitized) {
        sheep.$router.go(sanitized);
      }
    }
  });

  onShow(async () => {
    // #ifdef APP-PLUS
    // ios首次授权网络，需要重新加载一次应用初始化
    // 可能需要考虑上uni.onNetworkStatusChange，uni.offNetworkStatusChange组合拳以及主动主动唤起权限申请
    // 一开始放app.vue，感觉负载太重，搬到这里来了。
    // 如果你的首页不是这个页面，需要把代码搬过去。
    if (sheep.$platform.os === 'ios') {
      if (await sheep.$platform.checkNetwork()) {
        await sheep.$store('app').init();
      }
    }
    // #endif
  });
</script>

<style lang="scss" scoped>
  .home-content {
    position: relative;
    overflow: hidden;
  }

  .navbar-left-box {
    display: flex;
    align-items: center;

    .logo {
      width: 208rpx;
      height: 65rpx;
    }

    .title {
      font-size: 31rpx;
      font-weight: bold;
      color: #000000;
      font-family: Kingsoft_Cloud_Font;
    }
  }

  .home-sticky-panel {
    width: 100%;
    height: 292rpx;
    padding: 0 32rpx 58rpx;
    box-sizing: border-box;
    position: fixed;
    left: 0;
    bottom: 142rpx;
    z-index: 15;
    display: flex;
    flex-direction: column;
  }

  .home-sticky-top {
    width: 100%;
    height: 90rpx;
    margin-bottom: 24rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-position: center;
  }

  .home-sticky-top-left {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .home-sticky-top-left-icon {
    width: 42rpx;
    height: 36rpx;
  }

  .home-sticky-top-left-text {
    font-size: 28rpx;
    color: #ffffff;
    margin-left: 12rpx;
    font-weight: 300;
  }

  .home-sticky-top-right-icon {
    width: 120rpx;
    height: 44rpx;
  }

  .home-sticky-bottom {
    width: 100%;
    height: 120rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .home-sticky-bottom-item {
    width: 49%;
    height: 120rpx;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-position: center;
    padding: 0 24rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .home-sticky-bottom-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }

  .home-sticky-bottom-title {
    font-size: 32rpx;
    color: #ffffff;
    line-height: 1.2;
  }

  .home-sticky-bottom-subtitle {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.2;
  }

  .home-sticky-bottom-right-icon {
    width: 78rpx;
    height: 78rpx;
  }

  :deep(.ui-swiper .ui-swiper-dot.progress) {
    position: fixed;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    justify-content: center;
    bottom: 470rpx;
    z-index: 20;
  }

  :deep(.ui-swiper .ui-swiper-dot.default .line-box),
  :deep(.ui-swiper .ui-swiper-dot.long .line-box),
  :deep(.ui-swiper .ui-swiper-dot.line .line-box) {
    background: rgba(255, 255, 255, 0.6);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.14);
  }

  :deep(.ui-swiper .ui-swiper-dot.default .line-box.cur),
  :deep(.ui-swiper .ui-swiper-dot.long .line-box.cur),
  :deep(.ui-swiper .ui-swiper-dot.line .line-box.cur) {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.18);
  }

  :deep(.ui-swiper .ui-swiper-dot.long .line-box) {
    width: 12rpx;
    height: 12rpx;
    margin: 0 12rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.35);
  }

  :deep(.ui-swiper .ui-swiper-dot.long .line-box.cur) {
    width: 34rpx;
    border-color: rgba(255, 255, 255, 0.92);
  }

  :deep(.ui-swiper .ui-swiper-dot.default .line-box.cur::after) {
    width: 6rpx;
    height: 6rpx;
    background-color: rgba(255, 255, 255, 0.98);
  }

  :deep(.ui-swiper .ui-swiper-dot.tag) {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    justify-content: center;
    color: #ffffff;
    background: rgba(0, 0, 0, 0.22);
    border: 2rpx solid rgba(255, 255, 255, 0.42);
    box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.12);
    padding: 10rpx 24rpx;
    border-radius: 999rpx;
    font-weight: 600;
  }
</style>
