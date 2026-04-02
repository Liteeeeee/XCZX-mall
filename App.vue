<script setup>
  import { onLaunch, onShow, onError } from '@dcloudio/uni-app';
  import { ShoproInit } from './sheep';

  onLaunch(() => {
    // 隐藏原生导航栏 使用自定义底部导航
    uni.hideTabBar({
      fail: () => {},
    });

    // 加载Shopro底层依赖
    ShoproInit();

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
