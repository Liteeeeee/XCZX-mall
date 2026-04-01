<!-- 首页，支持店铺装修 -->
<template>
  <view v-if="template">
    <s-layout
      title="首页"
      navbar="custom"
      tabbar="/pages/index/index"
      :bgStyle="template.page"
      :navbarStyle="template.navigationBar"
      onShareAppMessage
    >
      <!-- 首页自定义导航左侧 -->
      <template #navbarLeft>
        <view class="navbar-left-box ss-flex ss-row-left ss-col-center">
          <image
            class="logo"
            :src="sheep.$url.static('/static/log.webp')"
            mode="aspectFit"
          ></image>
          <text class="title">仙草甄选</text>
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
      const sceneParams = decodeURIComponent(options.scene).split('=');
      console.log('sceneParams=>', sceneParams);
      options[sceneParams[0]] = sceneParams[1];
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
    }

    // 进入指定页面(完整页面路径)
    if (options.page) {
      sheep.$router.go(decodeURIComponent(options.page));
    }
  });

  onShow(async() => {
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
    bottom: 19vh;
    left: 50%;
    transform: translateX(-50%);
    width: 140rpx;
    height: 140rpx;
    z-index: 99999;
    pointer-events: none; /* 防止遮挡用户点击事件 */
  }

  .navbar-left-box {
    display: flex;
    align-items: center;

    .logo {
      width: 75rpx;
      height: 72rpx;
      margin-right: 12rpx;
    }

    .title {
      font-size: 31rpx;
      font-weight: bold;
      color: #fff;
      font-family: Kingsoft_Cloud_Font;
    }
  }
</style>
