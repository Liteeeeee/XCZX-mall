import App from './App';
import { createSSRApp } from 'vue';
import { setupPinia } from './sheep/store';
import sheep from '@/sheep';
import { SharePageEnum } from '@/sheep/helper/const';

export function createApp() {
  const app = createSSRApp(App);
  
  setupPinia(app);

  app.mixin({
    onShareAppMessage() {
      const shareInfo = buildGlobalShareInfo();
      return {
        title: shareInfo.title,
        path: shareInfo.forward?.path || shareInfo.path || 'pages/index/index',
        imageUrl: shareInfo.image,
      };
    },
    onShareTimeline() {
      const shareInfo = buildGlobalShareInfo();
      return {
        title: shareInfo.title,
        query: shareInfo.query || '',
        imageUrl: shareInfo.image,
      };
    },
  });

  return {
    app,
  };
}

function buildGlobalShareInfo() {
  let route = '';
  let options = {};
  try {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
    const last = pages && pages.length ? pages[pages.length - 1] : null;
    route = last?.route || '';
    options = last?.options || last?.$page?.options || {};
  } catch (e) {}

  const path = route ? `/${route}` : '';
  const mapping = resolveShareMapping(path, options);
  if (!mapping) {
    return sheep.$platform.share.getShareInfo();
  }
  return sheep.$platform.share.getShareInfo({
    params: {
      page: mapping.page,
      query: mapping.query,
    },
  });
}

function resolveShareMapping(path, options = {}) {
  if (!path) {
    return null;
  }
  if (path === SharePageEnum.MEMBER.page) {
    return {
      page: SharePageEnum.MEMBER.value,
      query: undefined,
    };
  }
  if (path === SharePageEnum.GOODS.page) {
    return {
      page: SharePageEnum.GOODS.value,
      query: options.id,
    };
  }
  if (path === SharePageEnum.GROUPON.page) {
    return {
      page: SharePageEnum.GROUPON.value,
      query: options.id,
    };
  }
  if (path === SharePageEnum.SECKILL.page) {
    return {
      page: SharePageEnum.SECKILL.value,
      query: options.id,
    };
  }
  if (path === SharePageEnum.POINT.page) {
    return {
      page: SharePageEnum.POINT.value,
      query: options.id,
    };
  }
  if (path === SharePageEnum.GROUPON_DETAIL.page) {
    return {
      page: SharePageEnum.GROUPON_DETAIL.value,
      query: options.id,
    };
  }
  return null;
}
