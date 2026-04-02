import DiyApi from '@/sheep/api/promotion/diy';
import { getTenantByWebsite } from '@/sheep/api/infra/tenant';
import { getTenantId } from '@/sheep/request';
import { defineStore } from 'pinia';
import $platform from '@/sheep/platform';
import $router from '@/sheep/router';
import user from './user';
import sys from './sys';
import { baseUrl, h5Url } from '@/sheep/config';

const app = defineStore({
  id: 'app',
  state: () => ({
    paramsForTabbar: {}, // 为全局tabbar跳转传参用。原因是 tabbar 无法传参，只能通过全局状态传递
    info: {
      // 应用信息
      name: '', // 商城名称
      logo: '', // logo
      version: '', // 版本号
      copyright: '', // 版权信息 I
      copytime: '', // 版权信息 II

      cdnurl: '', // 云存储域名
      filesystem: '', // 云存储平台
    },
    platform: {
      share: {
        methods: [], // 支持的分享方式
        forwardInfo: {}, // 默认转发信息
        posterInfo: {}, // 海报信息
        linkAddress: '', // 复制链接地址
      },
      bind_mobile: 0, // 登陆后绑定手机号提醒 (弱提醒，可手动关闭)
    },
    template: {
      // 店铺装修模板
      basic: {
        tabbar: {
          items: [
            { text: '首页', url: '/pages/index/index', iconUrl: '/static/tabbar/home.webp', activeIconUrl: '/static/tabbar/home_active.webp' },
            { text: '会员', url: '/pages/index/member', iconUrl: '/static/tabbar/member.webp', activeIconUrl: '/static/tabbar/member_active.webp' },
            { text: '购物车', url: '/pages/index/cart', iconUrl: '/static/tabbar/cart.webp', activeIconUrl: '/static/tabbar/cart_active.webp' },
            { text: '我的', url: '/pages/index/user', iconUrl: '/static/tabbar/user.webp', activeIconUrl: '/static/tabbar/user_active.webp' }
          ],
          style: { color: '#333', activeColor: '#1E3F1C', bgType: 'color', bgColor: '#fff' }
        },
      }, // 基本信息
      home: {
        // 首页模板
        style: {},
        data: [],
      },
      user: {
        // 个人中心模板
        style: {},
        data: [],
      },
    },
    shareInfo: {}, // 全局分享信息
    has_wechat_trade_managed: 0, // 小程序发货信息管理  0 没有 || 1 有
  }),
  actions: {
    // 获取Shopro应用配置和模板
    async init(templateId = null) {
      console.log('ShoproInit started...');
      // 检查网络
      const networkStatus = await $platform.checkNetwork();
      console.log('Network status:', networkStatus);
      if (!networkStatus) {
        $router.error('NetworkError');
      }

      // 检查配置
      console.log('BaseUrl:', baseUrl);
      if (typeof baseUrl === 'undefined') {
        $router.error('EnvError');
      }

      // 加载租户
      console.log('Adapting tenant...');
      await adaptTenant();

      // 加载装修配置
      console.log('Adapting template...');
      await adaptTemplate(this.template, templateId);

      // TODO 芋艿：【初始化优化】未来支持管理后台可配；对应 https://api.shopro.sheepjs.com/shop/api/init
      if (true) {
        this.info = {
          name: '仙草甄选商城',
          logo: 'https://static.iocoder.cn/ruoyi-vue-pro-logo.webp',
          version: '2026.01',
          copyright: '全部开源，个人与企业可 100% 免费使用',
          copytime: 'Copyright© 2018-2025',

          cdnurl: 'https://xiancao.oss-cn-beijing.aliyuncs.com', // 云存储域名
          filesystem: 'qcloud', // 云存储平台
        };
        this.platform = {
          share: {
            methods: ['forward', 'poster', 'link'],
            linkAddress: h5Url,
            posterInfo: {
              user_bg: '/static/img/shop/config/user-poster-bg.webp',
              goods_bg: '/static/img/shop/config/goods-poster-bg.webp',
              groupon_bg: '/static/img/shop/config/groupon-poster-bg.webp',
            },
            forwardInfo: {
              title: '',
              image: '',
              desc: '',
            },
          },
          bind_mobile: 0,
        };
        this.has_wechat_trade_managed = 0;

        // 加载主题
        const sysStore = sys();
        sysStore.setTheme();

        // 模拟用户登录
        const userStore = user();
        if (userStore.isLogin) {
          userStore.loginAfter();
        }
        return Promise.resolve(true);
      } else {
        $router.error('InitError', res.msg || '加载失败');
      }
    },
    // 设置 paramsForTabbar
    setParamsForTabbar(params = {}) {
      this.paramsForTabbar = params;
    },
    clearParamsForTabbar() {
      this.paramsForTabbar = {};
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'app-store',
      },
    ],
  },
});

/** 初始化租户编号 */
const adaptTenant = async () => {
  // 1. 获取当前租户 ID
  const oldTenantId = getTenantId();
  let newTenantId = null;

  try {
    // 2.1 情况一：H5：根据 url 参数、域名来获取新的租户ID
    // #ifdef H5
    // H5 环境下的处理逻辑
    if (window?.location) {
      // 优先从 URL 查询参数获取 tenantId
      const urlParams = new URLSearchParams(window.location.search);
      newTenantId = urlParams.get('tenantId');

      // 如果 URL 参数中没有，则通过 host 获取
      if (!newTenantId && window.location.host) {
        const { data } = await getTenantByWebsite(window.location.host);
        newTenantId = data?.id;
      }
    }
    // #endif

    // 2.2 情况二：微信小程序：小程序环境下的处理逻辑 - 根据 appId 获取租户
    // #ifdef MP
    const appId = uni.getAccountInfoSync()?.miniProgram?.appId;
    if (appId) {
      const { data } = await getTenantByWebsite(appId);
      newTenantId = data?.id;
    }
    // #endif

    // 3. 如果是新租户（不相等），则进行切换
    // noinspection EqualityComparisonWithCoercionJS
    if (newTenantId && newTenantId != oldTenantId) {
      // 清理掉登录用户的 token
      const userStore = user();
      userStore.setToken();

      // 设置新的 tenantId 到本地存储
      uni.setStorageSync('tenant-id', newTenantId);
      console.log('租户 ID 已更新:', `${oldTenantId} -> ${newTenantId}`);
    }
  } catch (error) {
    console.error('adaptTenant 执行失败:', error);
  }
};

/** 初始化装修模版 */
const adaptTemplate = async (appTemplate, templateId) => {
  console.log('Fetching DIY template...', templateId);
  const { data: diyTemplate } = templateId
    ? // 查询指定模板，一般是预览时使用
      await DiyApi.getDiyTemplate(templateId)
    : await DiyApi.getUsedDiyTemplate();
  console.log('DIY template data:', diyTemplate);
  // 模板不存在
  if (!diyTemplate) {
    console.error('Template not found or error occurred. Using default empty template to prevent redirect.');
    // 提供基础兜底数据，防止首页白屏
    appTemplate.basic.tabbar = {
      items: [
        { text: '首页', url: '/pages/index/index', iconUrl: '/static/tabbar/home.webp', activeIconUrl: '/static/tabbar/home_active.webp' },
        { text: '会员', url: '/pages/index/member', iconUrl: '/static/tabbar/member.webp', activeIconUrl: '/static/tabbar/member_active.webp' },
        { text: '购物车', url: '/pages/index/cart', iconUrl: '/static/tabbar/cart.webp', activeIconUrl: '/static/tabbar/cart_active.webp' },
        { text: '我的', url: '/pages/index/user', iconUrl: '/static/tabbar/user.webp', activeIconUrl: '/static/tabbar/user_active.webp' }
      ],
      style: { color: '#333', activeColor: '#1E3F1C', bgType: 'color', bgColor: '#fff' }
    };
    appTemplate.home = {
       style: { bgType: 'color', bgColor: '#fff' },
       data: [],
       components: [
         {
           id: 'TitleBar',
           property: {
             title: '装修加载失败',
             description: '未获取到装修模板，请检查后端配置或网络',
             style: {
               textAlign: 'center',
               color: '#ff4d4f',
               fontSize: 20,
             },
           },
         },
       ],
     };
    // $router.error('TemplateError'); // 暂时屏蔽重定向，让应用能进入首页
    return;
  }

  const tabBar = diyTemplate?.property?.tabBar;
  if (tabBar && tabBar.items && tabBar.items.length > 0) {
    appTemplate.basic.tabbar = tabBar;
    // 强制修改第二个 tabbar 项为会员中心
    if (appTemplate.basic.tabbar.items && appTemplate.basic.tabbar.items.length >= 2) {
      appTemplate.basic.tabbar.items[1].text = '会员';
      appTemplate.basic.tabbar.items[1].url = '/pages/index/member';
    }
  } else {
    // 如果装修模板中没有配置 Tabbar，使用默认数据
    appTemplate.basic.tabbar = {
      items: [
        { text: '首页', url: '/pages/index/index', iconUrl: '/static/tabbar/home.webp', activeIconUrl: '/static/tabbar/home_active.webp' },
        { text: '会员', url: '/pages/index/member', iconUrl: '/static/tabbar/member.webp', activeIconUrl: '/static/tabbar/member_active.webp' },
        { text: '购物车', url: '/pages/index/cart', iconUrl: '/static/tabbar/cart.webp', activeIconUrl: '/static/tabbar/cart_active.webp' },
        { text: '我的', url: '/pages/index/user', iconUrl: '/static/tabbar/user.webp', activeIconUrl: '/static/tabbar/user_active.webp' }
      ],
      style: { color: '#333', activeColor: '#1E3F1C', bgType: 'color', bgColor: '#fff' }
    };
  }
  appTemplate.home = diyTemplate?.home;
  appTemplate.user = diyTemplate?.user;

  // 强制开启沉浸式导航
  if (appTemplate.home?.navigationBar) {
    appTemplate.home.navigationBar.styleType = 'inner';
    appTemplate.home.navigationBar.bgColor = 'transparent';
  }
  if (appTemplate.user?.navigationBar) {
    appTemplate.user.navigationBar.styleType = 'inner';
    appTemplate.user.navigationBar.bgColor = 'transparent';
  }

  // 临时：注入用户提供的“我的”页面装修数据
  // TODO: 后续应直接使用接口返回的 diyTemplate?.user
  const userDecoration = {
    "page": { "description": "", "backgroundColor": "#f5f5f5", "backgroundImage": "" },
    "navigationBar": { "bgType": "color", "bgColor": "transparent", "bgImg": "", "styleType": "inner", "alwaysShow": true, "mpCells": [{ "type": "text", "textColor": "#111111" }], "otherCells": [{ "type": "text", "textColor": "#111111" }], "_local": { "previewMp": true, "previewOther": false } },
    "components": [
      { 
        "id": "UserCardPro", 
        "property": { 
          "nickname": "请先登录", 
          "mobile": "", 
          "levelName": "", 
          "stats": [{ "label": "余额", "value": "0.00" }, { "label": "积分", "value": "0" }, { "label": "优惠券", "value": "0" }], 
          "style": { "bgType": "color", "bgColor": "#e0fde0", "marginBottom": 8, "paddingTop": 20, "paddingRight": 20, "paddingBottom": 20, "paddingLeft": 20, "borderRadius": 12 } 
        } 
      },
      { 
        "id": "UserOrder", 
        "property": { 
          "title": "我的订单", 
          "items": [{ "icon": "ep:wallet", "name": "待付款", "url": "" }, { "icon": "ep:box", "name": "待发货", "url": "" }, { "icon": "ep:van", "name": "待收货", "url": "" }, { "icon": "ep:circle-check", "name": "已完成", "url": "" }], 
          "style": { "bgType": "color", "bgColor": "#fff", "marginLeft": 8, "marginRight": 8, "marginBottom": 8, "paddingTop": 0, "paddingRight": 0, "paddingBottom": 0, "paddingLeft": 0, "borderRadius": 8 } 
        } 
      },
      { 
        "id": "UserInfo", 
        "property": { 
          "title": "我的信息", 
          "items": [{ "icon": "ep:setting", "name": "我的设置", "url": "" }, { "icon": "ep:location", "name": "地址管理", "url": "" }, { "icon": "ep:user-filled", "name": "平台合伙人", "url": "" }], 
          "style": { "bgType": "color", "bgColor": "#fff", "marginLeft": 8, "marginRight": 8, "marginBottom": 8, "paddingTop": 0, "paddingRight": 0, "paddingBottom": 0, "paddingLeft": 0, "borderRadius": 8 } 
        } 
      }
    ]
  };
  
  // 强制注入，避免被空接口结果覆盖
  const hasComponents = (template) => {
    if (!template) return false;
    const hasC = (template.components && Array.isArray(template.components) && template.components.length > 0);
    const hasD = (template.data && Array.isArray(template.data) && template.data.length > 0);
    return hasC || hasD;
  };

  if (!hasComponents(appTemplate.user)) {
    console.log('User template is empty, forcing injection of userDecoration');
    appTemplate.user = JSON.parse(JSON.stringify(userDecoration));
  } else {
    console.log('User template has components, merging navigationBar');
    // 即使有接口数据，也确保 navigationBar 是沉浸式的
    appTemplate.user.navigationBar = userDecoration.navigationBar;
  }
};

export default app;
