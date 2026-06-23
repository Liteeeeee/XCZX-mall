<template>
  <s-layout :bgStyle="{ color: '#FFF' }" title="仙草检测">
    <view class="ss-p-20 richtext" :style="{ paddingTop: sheep.$platform.navbar + 'px' }">
      <view v-if="isPdf" class="pdf-wrap">
        <view class="pdf-card">
          <text class="pdf-title">检测报告</text>
          <text class="pdf-desc">点击下方按钮预览 PDF</text>
          <button class="ss-reset-button pdf-btn" :disabled="pdfLoading" @tap="openPdf">
            <text class="pdf-btn-text">{{ pdfLoading ? '加载中...' : '预览 PDF' }}</text>
          </button>
        </view>
      </view>
      <mp-html v-else :content="parsedContent"></mp-html>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { ref, computed } from 'vue';
  import { onLoad, onUnload } from '@dcloudio/uni-app';

  const rawContent = ref('');
  const pdfUrl = ref('');
  const pdfLoading = ref(false);

  onLoad(() => {
    const content = uni.getStorageSync('qualificationDetection');
    if (content) {
      rawContent.value = content;
      pdfUrl.value = resolvePdfUrl(content);
      if (pdfUrl.value) {
        openPdf();
      }
    }
  });

  onUnload(() => {
    uni.removeStorageSync('qualificationDetection');
  });

  const isPdf = computed(() => Boolean(pdfUrl.value));

  function resolvePdfUrl(content) {
    if (!content) return '';
    if (typeof content === 'object') {
      const url = content?.pdfUrl || content?.url || content?.fileUrl || content?.path || '';
      return String(url || '').trim();
    }
    const text = String(content || '').trim();
    if (!text) return '';
    if (
      (text.startsWith('{') && text.endsWith('}')) ||
      (text.startsWith('[') && text.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(text);
        const url =
          parsed?.pdfUrl ||
          parsed?.url ||
          parsed?.fileUrl ||
          parsed?.path ||
          parsed?.data?.pdfUrl ||
          '';
        return String(url || '').trim();
      } catch (e) {}
    }
    const match =
      text.match(/https?:\/\/[^\s'"]+\.pdf(\?[^\s'"]*)?/i) ||
      text.match(/\/\/[^\s'"]+\.pdf(\?[^\s'"]*)?/i);
    if (match?.[0]) return match[0];
    const hrefMatch = text.match(/href=['"]([^'"]+\.pdf(?:\?[^'"]*)?)['"]/i);
    if (hrefMatch?.[1]) return hrefMatch[1];
    const srcMatch = text.match(/src=['"]([^'"]+\.pdf(?:\?[^'"]*)?)['"]/i);
    if (srcMatch?.[1]) return srcMatch[1];
    return '';
  }

  function downloadFile(url) {
    return new Promise((resolve, reject) => {
      uni.downloadFile({
        url,
        success: (res) => resolve(res),
        fail: (err) => reject(err),
      });
    });
  }

  function openDocument(filePath) {
    return new Promise((resolve, reject) => {
      uni.openDocument({
        filePath,
        showMenu: true,
        success: (res) => resolve(res),
        fail: (err) => reject(err),
      });
    });
  }

  async function openPdf() {
    const url = String(pdfUrl.value || '').trim();
    if (!url || pdfLoading.value) return;
    pdfLoading.value = true;
    try {
      const finalUrl = sheep.$url.cdn(url);
      const res = await downloadFile(finalUrl);
      if (res?.statusCode !== 200 || !res?.tempFilePath) {
        throw new Error('download failed');
      }
      await openDocument(res.tempFilePath);
    } catch (e) {
      uni.showToast({
        title: 'PDF 预览失败',
        icon: 'none',
      });
    } finally {
      pdfLoading.value = false;
    }
  }

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

  .pdf-wrap {
    padding-top: 20rpx;
  }

  .pdf-card {
    border-radius: 20rpx;
    background: #f6f7f2;
    padding: 28rpx;
  }

  .pdf-title {
    display: block;
    color: #111111;
    font-size: 34rpx;
    font-weight: 600;
    line-height: 46rpx;
    margin-bottom: 10rpx;
  }

  .pdf-desc {
    display: block;
    color: #888888;
    font-size: 26rpx;
    line-height: 38rpx;
    margin-bottom: 22rpx;
  }

  .pdf-btn {
    height: 88rpx;
    border-radius: 18rpx;
    background: #1e3f1c;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pdf-btn:disabled {
    opacity: 0.6;
  }

  .pdf-btn-text {
    color: #ffffff;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 42rpx;
  }

  :deep() {
    image {
      display: block;
    }
  }
</style>
