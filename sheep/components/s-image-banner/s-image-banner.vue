<!-- 装修图文组件：图片轮播 -->
<template>
  <su-swiper
    :list="imgList"
    :dotStyle="swiperDotStyle"
    :imageMode="swiperImageMode"
    dotCur="bg-mask-40"
    :seizeHeight="swiperHeight"
    :autoplay="data.autoplay"
    :interval="data.interval * 1000"
    :mode="data.type"
    :height="swiperHeight"
  />
</template>

<script setup>
  import { computed } from 'vue';
  import sheep from '@/sheep';

  // 轮播图
  const props = defineProps({
    data: {
      type: Object,
      default: () => ({}),
    },
    styles: {
      type: Object,
      default: () => ({}),
    },
  });

  function px2rpx(px) {
    //计算比例
    let scale = uni.upx2px(100) / 100;
    return px / scale;
  }

  const swiperHeight = computed(() => {
    if (props.data?.fullScreen) {
      const device = sheep.$platform?.device || {};
      const win = Number(device.windowHeight);
      const screen = Number(device.screenHeight);
      const navbar = Number(sheep.$platform?.navbar);

      let h =
        Number.isFinite(win) && win > 0 ? win : Number(uni.getSystemInfoSync().windowHeight) || 667;
      if (Number.isFinite(navbar) && navbar > 0) h += navbar;
      if (Number.isFinite(screen) && screen > 0) h = Math.min(h, screen);

      return px2rpx(h);
    }
    return px2rpx(props.data?.height || 300);
  });

  const swiperDotStyle = computed(() => {
    if (props.data?.fullScreen) return 'progress';
    return props.data?.indicator === 'dot' ? 'long' : 'tag';
  });

  const swiperImageMode = computed(() => (props.data?.fullScreen ? 'aspectFill' : 'scaleToFill'));

  const imgList = computed(() =>
    props.data.items.map((item) => {
      const src = item.type === 'img' ? item.imgUrl : item.videoUrl;
      return {
        ...item,
        type: item.type === 'img' ? 'image' : 'video',
        src: sheep.$url.cdn(src),
        poster: sheep.$url.cdn(item.imgUrl),
      };
    }),
  );
</script>

<style></style>
