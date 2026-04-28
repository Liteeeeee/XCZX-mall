<template>
  <s-layout :bgStyle="{ color: '#FFF' }" title="仙草检测">
    <view class="ss-p-20 richtext" :style="{ paddingTop: sheep.$platform.navbar + 'px' }">
      <mp-html :content="parsedContent"></mp-html>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { ref, computed } from 'vue';
  import { onLoad, onUnload } from '@dcloudio/uni-app';

  const rawContent = ref('');

  onLoad(() => {
    const content = uni.getStorageSync('qualificationDetection');
    if (content) {
      rawContent.value = content;
    }
  });

  onUnload(() => {
    uni.removeStorageSync('qualificationDetection');
  });

  const parsedContent = computed(() => {
    let content = rawContent.value || '';
    if (content) {
      content = content.replace(/<img[^>]*src=['"]([^'"]+)[^>]*>/gi, (match, src) => {
        if (src.includes('aliyuncs.com') && !src.includes('?x-oss-process')) {
          return match.replace(src, `${src}?x-oss-process=image/resize,w_750/quality,q_80`);
        }
        return match;
      });
      content = content.replace(/<img/gi, '<img style="max-width:100%;height:auto;display:block;"');
    }
    return content;
  });
</script>

<style lang="scss" scoped>
  .richtext {
    min-height: 100vh;
    background-color: #fff;
  }
  :deep() {
    image {
      display: block;
    }
  }
</style>
