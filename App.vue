<script setup>
  import { onLaunch, onShow, onError } from '@dcloudio/uni-app';
  import { ShoproInit } from './sheep';
  import $share from '@/sheep/platform/share';

  onLaunch((options) => {
    // 隐藏原生导航栏 使用自定义底部导航
    uni.hideTabBar({
      fail: () => {},
    });

    // 加载Shopro底层依赖
    ShoproInit();

    // 全局处理扫码/太阳码携带的 promotionId，避免仅首页生效
    $share.handlePromotionEntry(options);

    const currentPath = options?.path ? `/${options.path}` : '';
    const params = {
      ...(options?.query || {}),
    };
    if (options?.scene) {
      try {
        decodeURIComponent(options.scene)
          .split('&')
          .forEach((pair) => {
            if (!pair) return;
            const idx = pair.indexOf('=');
            if (idx < 0) return;
            const key = pair.slice(0, idx);
            const value = pair.slice(idx + 1);
            if (!key) return;
            params[key] = value;
          });
      } catch (e) {}
    }

    if (params.spm && currentPath && currentPath !== '/pages/index/index') {
      const currentAllowed = !!$share.sanitizeEntryTargetUrl(currentPath);
      if (currentAllowed) {
        $share.decryptSpm(params.spm, { currentPath });
      } else {
        uni.setStorageSync('entrySpm', params.spm);
        uni.switchTab({
          url: '/pages/index/index',
        });
      }
    }

    if (params.inviterId && currentPath && currentPath !== '/pages/index/index') {
      uni.setStorageSync('inviterId', String(params.inviterId));
      const currentAllowed = !!$share.sanitizeEntryTargetUrl(currentPath);
      if (!currentAllowed) {
        uni.setStorageSync('entryInviterId', String(params.inviterId));
        uni.switchTab({
          url: '/pages/index/index',
        });
      }
    }

    // 动态加载字体（避免主包含入字体文件）
    uni.loadFontFace({
      family: 'OPPOSANS',
      source: `url("https://xiancao.oss-cn-beijing.aliyuncs.com/fonts/default_fonts.ttf")`,
      scopes: ['native'],
      success: () => console.log('OPPOSANS font loaded'),
      fail: (err) => console.log('OPPOSANS font load failed', err),
    });

    // #ifdef MP-WEIXIN
    if (typeof wx !== 'undefined' && wx.loadFontFace) {
      wx.loadFontFace({
        family: 'CountFont',
        source: `url("https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/count_font.ttf")`,
        success: () => console.log('CountFont font loaded'),
        fail: (err) => console.log('CountFont font load failed', err),
      });
    }
    // #endif

    // #ifndef MP-WEIXIN
    uni.loadFontFace({
      family: 'CountFont',
      source: `url("https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/count_font.ttf")`,
      success: () => console.log('CountFont font loaded'),
      fail: (err) => console.log('CountFont font load failed', err),
    });
    // #endif
  });

  onShow(() => {
    // #ifdef APP-PLUS
    // 获取urlSchemes参数
    const args = plus.runtime.arguments;
    if (args) {
    }

    // 获取剪贴板
    uni.getClipboardData({
      success: (res) => {},
    });
    // #endif
  });
</script>

<style lang="scss">
  @import '@/sheep/scss/index.scss';
</style>
