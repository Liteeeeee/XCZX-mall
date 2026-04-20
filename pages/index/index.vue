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
      <!-- 首页自定义导航左侧 -->
      <template #navbarLeft>
        <view class="navbar-left-box ss-flex ss-row-left ss-col-center">
          <image class="logo" :src="sheep.$url.static('/static/log.webp')" mode="aspectFit"></image>
        </view>
      </template>

      <s-block
        v-for="(item, index) in template.components"
        :key="index"
        :styles="item.property.style"
      >
        <s-block-item :type="item.id" :data="item.property" :styles="item.property.style" />
      </s-block>
    </s-layout>

    <!-- 下拉引导动图：移到 s-layout 外层，避免被容器裁剪或层级遮挡 -->
    <image
      v-show="showDownGuide"
      class="down-guide"
      :src="sheep.$url.static('/static/down.gif')"
      mode="aspectFit"
    ></image>
  </view>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onShow, onPageScroll, onPullDownRefresh } from '@dcloudio/uni-app';
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
      styleType: 'normal',
      bgColor,
    };
  });
  const showDownGuide = ref(true);

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

    // 预览模板
    if (options.templateId) {
      sheep.$store('app').init(options.templateId);
    }

    // 解析分享信息
    if (options.spm) {
      $share.decryptSpm(options.spm);
    }

    // 邀请注册：兼容二维码/链接直接携带 inviterId
    if (options.inviterId) {
      uni.setStorageSync('inviterId', options.inviterId);
      uni.setStorageSync('shareId', options.inviterId);
      if (!sheep.$store('user').isLogin) {
        sheep.$router.go('/pages/index/login');
        return;
      }
    }

    // 进入指定页面(完整页面路径)
    if (options.page) {
      sheep.$router.go(decodeURIComponent(options.page));
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

    // 首次进入上滑引导逻辑
    const hasShownSwipeUp = uni.getStorageSync('hasShownSwipeUpGuide');
    if (!hasShownSwipeUp) {
      // 标记为已展示
      uni.setStorageSync('hasShownSwipeUpGuide', true);
      // 页面渲染完成后，延迟一会儿进行滑动
      setTimeout(() => {
        // 1. 缓慢向下滑动一段距离（比如200像素），耗时400ms
        uni.pageScrollTo({
          scrollTop: 200,
          duration: 400,
          success: () => {
            // 2. 停顿一会儿(200ms)后，再缓慢滑回到顶部，耗时400ms
            setTimeout(() => {
              uni.pageScrollTo({
                scrollTop: 0,
                duration: 400,
              });
            }, 200);
          },
        });
      }, 800);
    }
  });

  // 下拉刷新
  onPullDownRefresh(() => {
    sheep.$store('app').init();
    setTimeout(function () {
      uni.stopPullDownRefresh();
    }, 800);
  });

  onPageScroll((e) => {
    // 根据滚动距离判断是否展示下拉引导动图
    showDownGuide.value = e.scrollTop < 50;
  });
</script>

<style lang="scss" scoped>
  .down-guide {
    position: fixed;
    bottom: 12vh;
    left: 50%;
    transform: translateX(-50%);
    width: 110rpx;
    height: 110rpx;
    z-index: 99999;
    pointer-events: none; /* 防止遮挡用户点击事件 */
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

  // 首页专属的轮播图指示器样式：隐藏指示器
  :deep(.ui-swiper-dot) {
    display: none !important;
  }

  // 强制首页的轮播图按 1282rpx 比例显示
  :deep(.ui-swiper) {
    height: 1282rpx !important;
    swiper {
      height: 1282rpx !important;
    }
  }
</style>
