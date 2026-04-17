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
            height: poster.css.height + 'px',
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
        <button class="save-btn ss-reset-button" @tap="onSavePoster">
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
      :style="{
        width: poster.css.width * pixelRatio + 'px',
        height: poster.css.height * pixelRatio + 'px',
      }"
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
  import { reactive, ref, unref, nextTick, getCurrentInstance } from 'vue';
  import sheep from '@/sheep';
  import {
    getPosterData,
    getWxaQrcode,
    formatImageUrlProtocol,
  } from '@/sheep/components/s-share-modal/canvas-poster/poster';

  const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
    shareInfo: {
      type: Object,
      default: () => {},
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
  const currentInstance = getCurrentInstance();
  const sysInfo = uni.getSystemInfoSync();
  if (currentInstance?.proxy) {
    currentInstance.proxy.$sysInfo = sysInfo;
  }
  const pixelRatio = sysInfo.pixelRatio || 3;
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
      // 内部通过 downloadToTemp 获取，更加稳定，并且会自动处理协议和空格脏数据
      downloadToTemp(url).then(resolve).catch(reject);
    });
  };

  const downloadToTemp = (url) => {
    return new Promise((resolve, reject) => {
      // 确保对 URL 进行编码
      const safeUrl = encodeURI(formatImageUrlProtocol(url));
      uni.downloadFile({
        url: safeUrl,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) {
            resolve(res.tempFilePath);
            return;
          }
          reject(new Error(`download image fail status:${res.statusCode}`));
        },
        fail: reject,
      });
    });
  };

  const getGoodsUrlCandidates = (url) => {
    const fallback = sheep.$url.cdn('/mp/static/share/shareImage.webp');
    const raw = String(url || '');
    // 去除反引号、单双引号，并压缩多余空格为单空格（兼容某些错误的数据录入）
    const cleaned = raw.replace(/[`'"]/g, '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return [fallback];
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return [cleaned, fallback];
    }
    return [sheep.$url.cdn(cleaned), fallback];
  };

  const downloadToTempWithFallback = async (urls) => {
    let lastError = null;
    for (const url of urls) {
      try {
        return await downloadToTemp(url);
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error('download image fail');
  };

  const withTimeout = (promise, timeoutMs, message) => {
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const drawCanvas = (ctx) => {
    // reserve(第二个参数) 设置为 false，表示不保留之前画布上的内容
    return new Promise((resolve) => {
      ctx.draw(false, () => {
        resolve();
      });
    });
  };

  const canvasToTempWithRetry = async (ctx, width, height) => {
    let lastError = null;
    for (let i = 0; i < 5; i += 1) {
      try {
        return await withTimeout(canvasToTemp(width, height), 8000, '导出海报超时');
      } catch (e) {
        lastError = e;
        const errMsg = String(e?.errMsg || e?.message || '');
        if (errMsg.includes('canvas is empty')) {
          await drawCanvas(ctx);
        }
        await sleep(250 * (i + 1));
      }
    }
    throw lastError || new Error('导出海报失败');
  };

  const canvasToTemp = (width, height) => {
    return new Promise((resolve, reject) => {
      uni.canvasToTempFilePath(
        {
          canvasId: 'sharePosterCanvas',
          x: 0,
          y: 0,
          width: width * pixelRatio,
          height: height * pixelRatio,
          destWidth: width * pixelRatio,
          destHeight: height * pixelRatio,
          fileType: 'png',
          quality: 1,
          success: (res) => resolve(res.tempFilePath),
          fail: reject,
        },
        currentInstance?.proxy,
      );
    });
  };

  const renderPosterByCanvas = async () => {
    const width = Math.round(poster.css.width);
    const scale = width / 750;
    const height = 1080 * scale;

    // 先更新响应式高度，确保 template 中的 :height 得到更新
    if (poster.css.height !== height) {
      poster.css.height = height;
      await nextTick();
      await sleep(100); // 等待小程序引擎更新 Canvas 节点尺寸
    }

    // 传递当前组件实例的 proxy 以保证组件内 canvas 绑定正确
    const ctx = uni.createCanvasContext('sharePosterCanvas', currentInstance?.proxy);

    const bgUrl = sheep.$url.cdn('/mp/static/share/shareGuide.webp');
    const logoUrl = sheep.$url.cdn('/mp/static/share/shareLogo.webp');

    const sourcePicUrl =
      props.shareInfo?.poster?.picUrl || props.shareInfo?.image || props.shareInfo?.poster?.image;
    const goodsUrlCandidates = getGoodsUrlCandidates(sourcePicUrl);
    console.log('poster-source-picUrl', sourcePicUrl);
    console.log('poster-download-candidates', goodsUrlCandidates);
    const qrcodeData = await withTimeout(
      getWxaQrcode(props.shareInfo.path, props.shareInfo.query),
      12000,
      '小程序码生成超时',
    );
    const [bgPath, logoPath, goodsPath, qrcodePath] = await Promise.all([
      withTimeout(getImagePath(bgUrl), 10000, '海报背景图加载超时'),
      withTimeout(getImagePath(logoUrl), 10000, '海报Logo图加载超时'),
      withTimeout(downloadToTempWithFallback(goodsUrlCandidates), 12000, '商品图下载超时'),
      withTimeout(base64ToTempFile(qrcodeData), 10000, '小程序码写入临时文件超时'),
    ]);

    // 缩放绘制逻辑坐标
    ctx.scale(pixelRatio, pixelRatio);

    ctx.clearRect(0, 0, width, height);
    ctx.setFillStyle('#F8F9F3');
    ctx.fillRect(0, 0, width, height);

    // Draw card background
    ctx.drawImage(bgPath, 32 * scale, 40 * scale, 686 * scale, 1000 * scale);

    // Draw White Card
    ctx.save();
    ctx.beginPath();
    const cardX = 62 * scale;
    const cardY = 145 * scale;
    const cardW = 626 * scale;
    const cardH = 795 * scale;
    const cardR = 20 * scale;
    ctx.moveTo(cardX + cardR, cardY);
    ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, cardR);
    ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, cardR);
    ctx.arcTo(cardX, cardY + cardH, cardX, cardY, cardR);
    ctx.arcTo(cardX, cardY, cardX + cardW, cardY, cardR);
    ctx.setFillStyle('#FFFFFF');
    ctx.fill();
    ctx.restore();

    // Draw Logo
    ctx.drawImage(logoPath, 62 * scale, 60 * scale, 200 * scale, 61 * scale);

    // Draw Goods Image
    const thumb = 567 * scale;
    const imgX = 91.5 * scale;
    const imgY = 175 * scale;
    ctx.save();
    ctx.beginPath();
    // Rounded corner for goods image
    const r = 20 * scale;
    ctx.moveTo(imgX + r, imgY);
    ctx.arcTo(imgX + thumb, imgY, imgX + thumb, imgY + thumb, r);
    ctx.arcTo(imgX + thumb, imgY + thumb, imgX, imgY + thumb, r);
    ctx.arcTo(imgX, imgY + thumb, imgX, imgY, r);
    ctx.arcTo(imgX, imgY, imgX + thumb, imgY, r);
    ctx.clip();
    ctx.drawImage(goodsPath, imgX, imgY, thumb, thumb);
    ctx.restore();

    // Draw Title
    ctx.setFillStyle('#1D2129');
    // 使用较粗的字体样式（部分机型生效）
    ctx.font = `500 ${Math.round(28 * scale)}px sans-serif`;
    const title = String(props.shareInfo?.poster?.title || '');
    const titleMaxWidth = 380 * scale;

    // Simple text wrap for title (max 2 lines)
    let line1 = '';
    let line2 = '';
    let lineIndex = 0;
    for (let i = 0; i < title.length; i++) {
      const testLine = lineIndex === 0 ? line1 + title[i] : line2 + title[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > titleMaxWidth) {
        if (lineIndex === 0) {
          lineIndex++;
          line2 = title[i];
        } else {
          line2 = line2.slice(0, -1) + '…';
          break;
        }
      } else {
        if (lineIndex === 0) {
          line1 = testLine;
        } else {
          line2 = testLine;
        }
      }
    }
    const titleY = 772 * scale;
    ctx.fillText(line1, imgX, titleY + 28 * scale, titleMaxWidth);
    if (line2) {
      ctx.fillText(line2, imgX, titleY + 68 * scale, titleMaxWidth);
    }

    // Draw Price
    ctx.setFillStyle('#F53F3F');
    // 使用粗体和 DINAlternate 字体
    ctx.font = `bold ${Math.round(28 * scale)}px DINAlternate, sans-serif`;
    ctx.fillText('¥', 91.5 * scale, 910 * scale); // baseline adjusted
    ctx.font = `bold ${Math.round(50 * scale)}px DINAlternate, sans-serif`;
    const priceText = Number(props.shareInfo?.poster?.price || 0).toFixed(2);
    ctx.fillText(priceText, 111.5 * scale, 910 * scale);

    // Draw QR Code
    const qrcode = 142 * scale;
    const qrcodeLeft = 516.5 * scale;
    const qrcodeTop = 772 * scale;
    ctx.drawImage(qrcodePath, qrcodeLeft, qrcodeTop, qrcode, qrcode);

    // Draw Bottom Text
    ctx.setFillStyle('#1E3F1C');
    ctx.setFontSize(26 * scale);
    // ctx.fillText doesn't support letterSpacing directly in mini-program,
    // so we can either ignore letterSpacing or draw character by character.
    // For simplicity, we just draw it centered or left aligned.
    const slogan = '以甄选之心，传故土本草之韵';
    const sloganX = 116 * scale;
    const sloganY = 955 * scale + 26 * scale; // 调整 margintop 增加 20 * scale
    // Let's approximate letterSpacing manually
    let currentX = sloganX;
    for (let i = 0; i < slogan.length; i++) {
      ctx.fillText(slogan[i], currentX, sloganY);
      currentX += ctx.measureText(slogan[i]).width + 15 * scale;
    }

    await drawCanvas(ctx);
    await sleep(300);
    painterImageUrl.value = await canvasToTempWithRetry(ctx, width, height);
    if (!painterImageUrl.value) {
      throw new Error('海报导出失败');
    }
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
    console.log('poster-shareInfo', props.shareInfo);
    await nextTick();
    poster.views = await getPosterData({
      width: poster.css.width,
      shareInfo: props.shareInfo,
    });
    await withTimeout(renderPoster(), 35000, '海报生成超时');
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
      background-color: #1e3f1c;
      color: aliceblue;
    }
  }

  .poster-img {
    border-radius: 20rpx;
  }

  .poster-canvas {
    position: fixed;
    left: -9999px;
    top: -9999px;
    pointer-events: none;
  }
</style>
