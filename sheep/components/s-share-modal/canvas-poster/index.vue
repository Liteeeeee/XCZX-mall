<!-- 海报弹窗 -->
<template>
  <view>
    <su-popup :show="show" round="10" @close="onClosePoster" type="center" class="popup-box">
      <view class="ss-flex-col ss-col-center ss-row-center">
        <image
          v-if="!!painterImageUrl"
          class="poster-img"
          :src="painterImageUrl"
          :style="{
            height: poster.css.height+ 'px',
            width: poster.css.width + 'px',
          }"
          :show-menu-by-longpress="true"
        />
      </view>
      <view
        class="poster-btn-box ss-m-t-20 ss-flex ss-row-between ss-col-center"
        v-if="!!painterImageUrl"
      >
        <button class="cancel-btn ss-reset-button" @tap="onClosePoster">取消</button>
        <button class="save-btn ss-reset-button ui-BG-Main" @tap="onSavePoster">
          {{
            ['wechatOfficialAccount', 'H5'].includes(sheep.$platform.name)
              ? '长按图片保存'
              : '保存图片'
          }}
        </button>
      </view>
    </su-popup>
    <!-- #ifdef MP-WEIXIN -->
    <canvas
      canvas-id="sharePosterCanvas"
      class="poster-canvas"
      :style="{ width: poster.css.width + 'px', height: poster.css.height + 'px' }"
    />
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <l-painter
      isCanvasToTempFilePath
      pathType="url"
      @success="setPainterImageUrl"
      hidden
      ref="painterRef"
    />
    <!-- #endif -->
    </view>
</template>

<script setup>
  /**
   * 海报生成和展示
   * 提示：小程序码默认跳转首页，由首页进行 spm 参数解析后跳转到对应的分享页面
   * @description 用于生成分享海报，如：分享商品海报。
   * @tutorial https://ext.dcloud.net.cn/plugin?id=2389
   * @property {Boolean} show   弹出层控制
   * @property {Object}  shareInfo 分享信息
   */
  import { reactive, ref, unref, nextTick } from 'vue';
  import sheep from '@/sheep';
  import { getPosterData, getWxaQrcode, formatImageUrlProtocol } from '@/sheep/components/s-share-modal/canvas-poster/poster';

  const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
    shareInfo: {
      type: Object,
      default: () => {
      },
    },
  });

  const poster = reactive({
    css: {
      // 根节点若无尺寸，自动获取父级节点
      width: sheep.$platform.device.windowWidth * 0.9,
      height: 600,
    },
    views: [],
  });

  const emits = defineEmits(['success', 'close']);

  const onClosePoster = () => {
    emits('close');
  };

  const painterRef = ref(); // 海报画板（非微信小程序）
  const painterImageUrl = ref(); // 海报 url
  const waitPainterReady = async () => {
    for (let i = 0; i < 100; i += 1) {
      if (painterRef.value) return;
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('海报画板未初始化');
  };
  // 渲染海报
  const renderPoster = async () => {
    // #ifdef MP-WEIXIN
    await renderPosterByCanvas();
    return;
    // #endif
    await waitPainterReady();
    await painterRef.value.render(unref(poster));
  };
  // 获得生成的图片
  const setPainterImageUrl = (path) => {
    painterImageUrl.value = path;
  };
  // #ifdef MP-WEIXIN
  const base64ToTempFile = (dataUrl) => {
    return new Promise((resolve, reject) => {
      try {
        const base64 = String(dataUrl || '').replace(/^data:image\/\w+;base64,/, '');
        const fs = uni.getFileSystemManager();
        const filePath = `${wx.env.USER_DATA_PATH}/poster_qrcode_${Date.now()}.png`;
        fs.writeFile({
          filePath,
          data: uni.base64ToArrayBuffer(base64),
          encoding: 'binary',
          success: () => resolve(filePath),
          fail: reject,
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  const getImagePath = (url) => {
    return new Promise((resolve, reject) => {
      uni.getImageInfo({
        src: formatImageUrlProtocol(url),
        success: (res) => resolve(res.path),
        fail: reject,
      });
    });
  };

  const downloadToTemp = (url) => {
    return new Promise((resolve, reject) => {
      const safeUrl = encodeURI(formatImageUrlProtocol(url));
      uni.downloadFile({
        url: safeUrl,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) {
            resolve(res.tempFilePath);
            return;
          }
          reject(new Error('download image fail'));
        },
        fail: reject,
      });
    });
  };

  const canvasToTemp = (width, height) => {
    return new Promise((resolve, reject) => {
      uni.canvasToTempFilePath(
        {
          canvasId: 'sharePosterCanvas',
          x: 0,
          y: 0,
          width,
          height,
          destWidth: width * 2,
          destHeight: height * 2,
          success: (res) => resolve(res.tempFilePath),
          fail: reject,
        },
      );
    });
  };

  const renderPosterByCanvas = async () => {
    const ctx = uni.createCanvasContext('sharePosterCanvas');
    const width = poster.css.width;
    const bgUrl =
      sheep.$url.cdn(sheep.$store('app').platform.share.posterInfo.goods_bg || '/static/img/shop/config/goods-poster-bg.webp');
    const goodsUrl = props.shareInfo?.poster?.picUrl || props.shareInfo?.poster?.image || '/mp/static/share/shareImage.webp';
    const qrcodeData = await getWxaQrcode(props.shareInfo.path, props.shareInfo.query);
    const [bgPath, goodsPath, qrcodePath] = await Promise.all([
      getImagePath(bgUrl),
      downloadToTemp(goodsUrl),
      base64ToTempFile(qrcodeData),
    ]);
    const bgInfo = await new Promise((resolve, reject) => {
      uni.getImageInfo({ src: bgPath, success: resolve, fail: reject });
    });
    const height = Math.round((bgInfo.height / bgInfo.width) * width);
    poster.css.height = height;

    ctx.drawImage(bgPath, 0, 0, width, height);

    const cardWidth = width * 0.915;
    const cardLeft = (width - cardWidth) / 2;
    const cardTop = width * 0.24;
    const cardHeight = width * 0.37;
    const thumb = width * 0.29;
    const qrcode = width * 0.205;
    const titleLeft = cardLeft + thumb + width * 0.055;
    const titleMaxWidth = cardWidth - thumb - qrcode - width * 0.12;

    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight);
    ctx.drawImage(goodsPath, cardLeft + width * 0.035, cardTop + width * 0.04, thumb, thumb);
    ctx.setFillStyle('#1D2129');
    ctx.setFontSize(14);
    const title = String(props.shareInfo?.poster?.title || '');
    const clippedTitle = title.length > 22 ? `${title.slice(0, 22)}…` : title;
    ctx.fillText(clippedTitle, titleLeft, cardTop + width * 0.07, titleMaxWidth);
    ctx.setFillStyle('#F53F3F');
    ctx.setFontSize(18);
    ctx.fillText('¥', titleLeft, cardTop + width * 0.25);
    ctx.setFontSize(26);
    const priceText = Number(props.shareInfo?.poster?.price || 0).toFixed(2);
    ctx.fillText(priceText, titleLeft + width * 0.05, cardTop + width * 0.25);
    const qrcodeLeft = cardLeft + cardWidth - qrcode - width * 0.035;
    const qrcodeTop = cardTop + width * 0.075;
    ctx.drawImage(qrcodePath, qrcodeLeft, qrcodeTop, qrcode, qrcode);
    ctx.setFillStyle('#1E3F1C');
    ctx.setFontSize(12);
    ctx.fillText('微信扫码', qrcodeLeft + width * 0.03, cardTop + width * 0.33);

    await new Promise((resolve) => ctx.draw(false, resolve));
    painterImageUrl.value = await canvasToTemp(width, height);
  };
  // #endif

  // 保存海报图片
  const onSavePoster = () => {
    if (['WechatOfficialAccount', 'H5'].includes(sheep.$platform.name)) {
      sheep.$helper.toast('请长按图片保存');
      return;
    }

    // 非H5 保存到相册
    uni.saveImageToPhotosAlbum({
      filePath: painterImageUrl.value,
      success: (res) => {
        onClosePoster();
        sheep.$helper.toast('保存成功');
      },
      fail: (err) => {
        sheep.$helper.toast('保存失败');
        console.log('图片保存失败:', err);
      },
    });
  };

  // 获得海报数据
  async function getPoster() {
    painterImageUrl.value = undefined;
    await nextTick();
    poster.views = await getPosterData({
      width: poster.css.width,
      shareInfo: props.shareInfo,
    });
    await renderPoster();
  }

  defineExpose({
    getPoster,
  });
</script>

<style lang="scss" scoped>
  .popup-box {
    position: relative;
  }

  .poster-title {
    color: #999;
  }

  // 分享海报
  .poster-btn-box {
    width: 600rpx;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -80rpx;

    .cancel-btn {
      width: 240rpx;
      height: 70rpx;
      line-height: 70rpx;
      background: $white;
      border-radius: 35rpx;
      font-size: 28rpx;
      font-weight: 500;
      color: $dark-9;
    }

    .save-btn {
      width: 240rpx;
      height: 70rpx;
      line-height: 70rpx;
      border-radius: 35rpx;
      font-size: 28rpx;
      font-weight: 500;
    }
  }

  .poster-img {
    border-radius: 20rpx;
  }

  .poster-canvas {
    position: fixed;
    left: -9999px;
    top: -9999px;
    opacity: 0;
    pointer-events: none;
  }

</style>
