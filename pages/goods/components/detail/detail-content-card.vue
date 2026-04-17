<template>
  <view class="detail-content-card bg-white ss-m-x-20 ss-p-t-20">
    <view class="card-header ss-flex ss-col-center ss-m-b-30 ss-m-l-20">
      <view class="title ss-m-l-20 ss-m-r-20">详情</view>
    </view>
    <view class="card-content">
      <mp-html
        ref="mpHtmlRef"
        :content="htmlContent"
        lazy-load
        :error-img="sheep.$url.static('/static/goods-empty.webp')"
        @error="onError"
      ></mp-html>
    </view>
  </view>
</template>

<script setup>
  import { ref, watch, nextTick } from 'vue';
  import sheep from '@/sheep';

  const props = defineProps({
    content: {
      type: String,
      default: '',
    },
  });

  const mpHtmlRef = ref(null);
  const htmlContent = ref('');

  // 监听 content 变化，实现分段渲染防止单次 setData 数据量过大
  watch(
    () => props.content,
    (newVal) => {
      if (!newVal) {
        htmlContent.value = '';
        return;
      }

      // 以图片标签或段落为界限粗略拆分长图 HTML，这里简单以 <img> 标签作为切割标识
      // 将多个相邻的图片拆分成几段
      const splitHtml = newVal.split(/(?=<img)/i).filter(Boolean);

      if (splitHtml.length > 0) {
        // 先渲染第一段
        htmlContent.value = splitHtml[0];

        // 延迟分批追加后续内容
        if (splitHtml.length > 1) {
          let currentIndex = 1;
          const appendNext = () => {
            if (currentIndex < splitHtml.length) {
              setTimeout(() => {
                if (mpHtmlRef.value && mpHtmlRef.value.setContent) {
                  // setContent(content, append)
                  mpHtmlRef.value.setContent(splitHtml[currentIndex], true);
                  currentIndex++;
                  appendNext();
                }
              }, 300); // 每 300ms 渲染一张长图
            }
          };
          nextTick(() => {
            appendNext();
          });
        }
      } else {
        htmlContent.value = newVal;
      }
    },
    { immediate: true },
  );

  // 监听并抛出图片加载失败原因
  const onError = (err) => {
    console.error('【富文本媒体加载失败】:', err);
    // err 结构通常为 { source: 'img', attrs: {...}, errMsg: '...' }
    if (err.source === 'img') {
      console.error(`图片加载失败: ${err.attrs?.src}，原因: ${err.errMsg || '未知'}`);
      // 可根据业务需求接入埋点或上报日志
    }
  };
</script>

<style lang="scss" scoped>
  .detail-content-card {
    .card-header {
      .title {
        font-size: 30rpx;
        font-weight: bold;
      }

      .des {
        font-size: 24rpx;
        color: $dark-9;
      }

      .more-btn {
        font-size: 24rpx;
        color: var(--ui-BG-Main);
      }
    }
  }

  :deep() {
    image {
      display: block;
    }
  }
</style>
