import $store from '@/sheep/store';
import $platform from '@/sheep/platform';
import $router from '@/sheep/router';
import $url from '@/sheep/url';
import BrokerageApi from '@/sheep/api/trade/brokerage';
import { SharePageEnum } from '@/sheep/helper/const';

// #ifdef H5
import $wxsdk from '@/sheep/libs/sdk-h5-weixin';
// #endif

// 设置分享的平台渠道: 1=H5,2=微信公众号网页,3=微信小程序,4=App,...按需扩展
const platformMap = ['H5', 'WechatOfficialAccount', 'WechatMiniProgram', 'App'];

// 设置分享方式: 1=直接转发,2=海报,3=复制链接,...按需扩展
const fromMap = ['forward', 'poster', 'link'];

const SHARE_LANDING_ALLOWLIST = new Set([
  SharePageEnum.HOME.page,
  SharePageEnum.GOODS.page,
  SharePageEnum.GROUPON.page,
  SharePageEnum.SECKILL.page,
  SharePageEnum.GROUPON_DETAIL.page,
  SharePageEnum.POINT.page,
  SharePageEnum.MEMBER.page,
]);

function isAllowedShareLanding(page = '') {
  const normalized = normalizePagePath(String(page).split('?')[0] || '');
  return SHARE_LANDING_ALLOWLIST.has(normalized);
}

function sanitizeEntryTargetUrl(url = '') {
  if (!url) {
    return '';
  }
  const raw = String(url);
  const [path, query] = raw.split('?');
  const normalizedPath = normalizePagePath(path || '');
  if (!isAllowedShareLanding(normalizedPath)) {
    return '';
  }
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

// 设置分享信息参数
const getShareInfo = (
  scene = {
    title: '', // 自定义分享标题
    desc: '', // 自定义描述
    image: '', // 自定义分享图片
    params: {}, // 自定义分享参数
  },
  poster = {
    // 自定义海报数据
    type: 'user',
  },
) => {
  const shareInfo = {
    title: '', // 分享标题
    desc: '', // 描述
    image: '', // 分享图片
    path: '', // 分享页面+参数
    link: '', // 分享Url+参数
    query: '', // 分享参数
    timelineQuery: '',
    poster, // 海报所需数据
    forward: {}, // 转发所需参数
  };
  const app = $store('app');
  const shareConfig = app.platform.share;
  const forwardInfo = shareConfig.forwardInfo || {};
  shareInfo.title = scene.title || forwardInfo.title || app.info?.name || '';
  shareInfo.image = $url.cdn(scene.image || forwardInfo.image || app.info?.logo || '');
  shareInfo.desc = scene.desc || forwardInfo.desc || '';

  // 自动拼接分享用户参数
  const query = buildSpmQuery(scene.params);
  shareInfo.query = query;
  shareInfo.timelineQuery = buildTimelineQuery(scene.params, query);

  // 配置分享链接地址
  shareInfo.link = buildSpmLink(query, shareConfig.linkAddress);
  // 配置页面地址带参数
  shareInfo.path = buildSpmPath();

  // 配置页面转发参数
  if (shareConfig.methods.includes('forward')) {
    shareInfo.forward.path = buildSpmPath(query);
  }

  return shareInfo;
};

const buildTimelineQuery = (params = {}, spmQuery = '') => {
  const page = typeof params.page !== 'undefined' ? String(params.page) : SharePageEnum.HOME.value;
  const rawQuery = typeof params.query !== 'undefined' ? String(params.query) : '';
  const needId = [
    SharePageEnum.GOODS.value,
    SharePageEnum.GROUPON.value,
    SharePageEnum.SECKILL.value,
    SharePageEnum.GROUPON_DETAIL.value,
    SharePageEnum.POINT.value,
  ].includes(page);
  if (needId && rawQuery) {
    return `id=${encodeURIComponent(rawQuery)}${spmQuery ? `&${spmQuery}` : ''}`;
  }
  return spmQuery || '';
};

/**
 * 构造 spm 分享参数
 *
 * @param params json 格式，其中包含：1）shareId 分享用户的编号；2）page 页面类型；3）query 页面 ID（参数）；4）platform 平台类型；5）from 分享来源类型。
 * @return 分享串 `spm=${shareId}.${page}.${query}.${platform}.${from}`
 */
const buildSpmQuery = (params) => {
  const user = $store('user');
  let shareId = '0'; // 设置分享者用户ID
  let page = SharePageEnum.HOME.value; // 页面类型，默认首页
  if (typeof params.page !== 'undefined') {
    page = params.page;
  }

  const shouldAttachShareId = [
    SharePageEnum.GOODS.value,
    SharePageEnum.GROUPON.value,
    SharePageEnum.SECKILL.value,
    SharePageEnum.GROUPON_DETAIL.value,
    SharePageEnum.POINT.value,
    SharePageEnum.MEMBER.value,
  ].includes(String(page));

  if (typeof params.shareId === 'undefined') {
    if (user.isLogin) {
      // 无论是会员页(将解析为inviterId)还是其他普通页面/商品页(将解析为shareId)
      // 只要登录了，生成分享链接时均携带当前用户的 id
      if (shouldAttachShareId) {
        shareId = user.userInfo.id;
      }
    }
  } else {
    shareId = params.shareId;
  }

  let query = '0'; // 设置页面ID: 如商品ID、拼团ID等
  if (typeof params.query !== 'undefined') {
    query = params.query;
  }
  let platform = platformMap.indexOf($platform.name) + 1;
  let from = '1';
  if (typeof params.from !== 'undefined') {
    from = platformMap.indexOf(params.from) + 1;
  }
  // spmParams = ...  可按需扩展
  return `spm=${shareId}.${page}.${query}.${platform}.${from}`;
};

// 构造页面分享参数: 所有的分享都先到首页进行 spm 参数解析
const buildSpmPath = (query) => {
  // 默认是主页，页面 page，例如 pages/index/index，根路径前不要填加 /，
  // 不能携带参数（参数请放在scene字段里），如果不填写这个字段，默认跳主页面。scancode_time为系统保留参数，不允许配置
  // 页面分享时参数使用 ? 拼接
  return typeof query === 'undefined' ? `pages/index/index` : `pages/index/index?${query}`;
};

// 构造分享链接
const buildSpmLink = (query, linkAddress = '') => {
  return `${linkAddress}?${query}`;
};

// 解析Spm
const decryptSpm = (spm, options = {}) => {
  const user = $store('user');
  const currentPath = normalizePagePath(options.currentPath || '');
  let shareParamsArray = spm.split('.');
  let shareParams = {
    spm,
    shareId: 0,
    page: SharePageEnum.HOME.page,
    query: {},
    platform: '',
    from: '',
  };
  let query;
  const shareId = Number(shareParamsArray[0] || 0);
  shareParams.shareId = shareId;
  switch (shareParamsArray[1]) {
    case SharePageEnum.HOME.value:
      // 默认首页不跳转
      shareParams.page = SharePageEnum.HOME.page;
      break;
    case SharePageEnum.GOODS.value:
      // 普通商品
      shareParams.page = SharePageEnum.GOODS.page;
      shareParams.query = {
        id: shareParamsArray[2], // 设置活动编号
      };
      break;
    case SharePageEnum.GROUPON.value:
      // 拼团商品
      shareParams.page = SharePageEnum.GROUPON.page;
      shareParams.query = {
        id: shareParamsArray[2], // 设置活动编号
      };
      break;
    case SharePageEnum.SECKILL.value:
      // 秒杀商品
      shareParams.page = SharePageEnum.SECKILL.page;
      shareParams.query = {
        id: shareParamsArray[2], // 设置活动编号
      };
      break;
    case SharePageEnum.GROUPON_DETAIL.value:
      // 参与拼团
      shareParams.page = SharePageEnum.GROUPON_DETAIL.page;
      shareParams.query = {
        id: shareParamsArray[2], // 设置活动编号
      };
      break;
    case SharePageEnum.POINT.value:
      // 积分商品
      shareParams.page = SharePageEnum.POINT.page;
      shareParams.query = {
        id: shareParamsArray[2], // 设置活动编号
      };
      break;
    case SharePageEnum.MEMBER.value:
      // 会员中心
      shareParams.page = SharePageEnum.MEMBER.page;
      break;
  }
  if (!isAllowedShareLanding(shareParams.page)) {
    shareParams.page = SharePageEnum.HOME.page;
    shareParams.query = {};
  }
  shareParams.platform = platformMap[shareParamsArray[3] - 1];
  shareParams.from = fromMap[shareParamsArray[4] - 1];
  if (shareId > 0) {
    // 若页面为 MEMBER，则是会员邀请注册（存 inviterId）
    if (shareParamsArray[1] === SharePageEnum.MEMBER.value) {
      uni.setStorageSync('inviterId', String(shareId));
    } else {
      // 否则为商品/普通推广员分享（存 shareId）
      uni.setStorageSync('shareId', String(shareId));
    }
  }

  // 若未登录且有分享者ID，强制跳转登录页并设置 returnUrl
  if (shareId > 0 && !user.isLogin) {
    let returnUrl = '';
    if (shareParams.page !== SharePageEnum.HOME.page) {
      const queryStr = Object.keys(shareParams.query)
        .map((k) => `${k}=${shareParams.query[k]}`)
        .join('&');
      returnUrl = `${shareParams.page}${queryStr ? '?' + queryStr : ''}`;
    }
    if (returnUrl) {
      uni.setStorageSync('returnUrl', returnUrl);
    }
    $router.go('/pages/index/login');
    return shareParams;
  }

  // 已登录则直接绑定推广员
  // （注意：如果 shareId > 0，但是页面是 MEMBER 的情况，inviterId 已经在上面写入，
  //  邀请注册通常是在未登录注册时使用，若已登录则不需要再绑定 inviterId，除非业务要求。
  //  这里仅当存在普通的 shareId 时才走 bindBrokerageUser 逻辑）
  if (shareId > 0 && user.isLogin && shareParamsArray[1] !== SharePageEnum.MEMBER.value) {
    bindBrokerageUser();
  }

  if (
    shareParams.page !== SharePageEnum.HOME.page &&
    (!currentPath || currentPath !== shareParams.page)
  ) {
    $router.go(shareParams.page, shareParams.query);
  }
  return shareParams;
};

// 绑定推广员
const bindBrokerageUser = async () => {
  try {
    const shareId = Number(uni.getStorageSync('shareId') || 0);
    const promotionId = Number(uni.getStorageSync('promotionId') || 0);

    if (!shareId && !promotionId) {
      return;
    }

    const userStore = $store('user');
    // 如果未登录，跳转到登录页，登录成功后(loginAfter)会再次触发绑定
    if (!userStore.isLogin) {
      $router.go('/pages/index/login');
      return;
    }

    const userInfo = userStore.userInfo || {};
    let res;

    // 存在 promotionId，走 admin-api 推广人员绑定接口
    if (promotionId) {
      res = await BrokerageApi.bindBrokerageUser({
        promoterId: promotionId,
        userId: userInfo.id,
        mobile: userInfo.mobile || '',
        provinceId: userInfo.provinceId || 0,
        cityId: userInfo.cityId || 0,
        remark: '通过推广链接/二维码绑定',
      });
      uni.removeStorageSync('promotionId');
      if (res.code === 0) {
        uni.showToast({ title: res.msg || '推广员绑定成功', icon: 'success' });
      }
    }
    // 存在 shareId，走 app-api 分销用户绑定接口
    else if (shareId) {
      res = await BrokerageApi.bindBrokerageUserByShareId({
        bindUserId: shareId,
      });
      uni.removeStorageSync('shareId');
      if (res.code === 0) {
        uni.showToast({ title: res.msg || '分销绑定成功', icon: 'success' });
      }
    }
  } catch (e) {
    console.error(e);
  }
};

const parseSceneParams = (scene) => {
  const params = {};
  if (!scene) {
    return params;
  }
  decodeURIComponent(scene)
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
  return params;
};

function normalizePagePath(path = '') {
  if (!path) {
    return '';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

const extractEntryParams = (options = {}) => {
  const params = {
    ...(options.query || {}),
  };
  Object.keys(options).forEach((key) => {
    if (['path', 'query', 'scene', 'referrerInfo'].includes(key)) {
      return;
    }
    params[key] = options[key];
  });
  const scenes = [];
  if (typeof params.scene === 'string' && params.scene) {
    scenes.push(params.scene);
  }
  if (typeof options.scene === 'string' && options.scene) {
    scenes.push(options.scene);
  }
  scenes.forEach((scene) => {
    if (scene.includes('=') || scene.includes('&') || scene.includes('%3D') || scene.includes('%26')) {
      Object.assign(params, parseSceneParams(scene));
    }
  });
  return params;
};

const getPromotionReturnUrl = (promotionId) => {
  // promotionId 存在时，统一跳转到分销申请页，用户登录后/已登录时根据自身分销状态展示
  if (promotionId) {
    return '/pages/commission/apply';
  }
  return '';
};

const handlePromotionEntry = async (options = {}) => {
  const params = extractEntryParams(options);
  const promotionId = Number(params.promotionId || 0);
  if (!promotionId) {
    return false;
  }
  const currentPage = normalizePagePath(options.path);
  const returnUrl = getPromotionReturnUrl(promotionId);
  uni.setStorageSync('promotionId', String(promotionId));
  const userStore = $store('user');
  if (userStore.isLogin) {
    await bindBrokerageUser();
    if (returnUrl && currentPage !== returnUrl) {
      $router.go(returnUrl, {}, { redirect: currentPage === '/pages/index/login' });
    }
    return true;
  }
  if (returnUrl) {
    uni.setStorageSync('returnUrl', returnUrl);
  }
  if (currentPage !== '/pages/index/login') {
    $router.go('/pages/index/login');
  }
  return true;
};

// 更新公众号分享sdk
const updateShareInfo = (shareInfo) => {
  // #ifdef H5
  if ($platform.name === 'WechatOfficialAccount') {
    $wxsdk.updateShareInfo(shareInfo);
  }
  // #endif
};

export default {
  getShareInfo,
  updateShareInfo,
  decryptSpm,
  bindBrokerageUser,
  handlePromotionEntry,
  sanitizeEntryTargetUrl,
};
