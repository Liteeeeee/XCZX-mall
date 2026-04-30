<template>
  <s-layout
    title=""
    navbar="custom"
    :bgStyle="{ color: '#F8F9F3' }"
    :navbarStyle="navbarStyle"
    tabbar="/pages/index/member"
    :onShareAppMessage="shareInfo"
  >
    <view class="page flex-col">
      <view class="block_1 flex-col">
        <view class="block_2 flex-col" :style="{ backgroundImage: currentLevel.bgGradient }">
          <!-- 会员卡片轮播区域 -->
          <!-- <swiper
            class="member-swiper"
            @change="onSwiperChange"
            :current="state.currentLevelIndex"
            circular
            previous-margin="48rpx"
            next-margin="48rpx"
          >
            <swiper-item v-for="(level, index) in memberLevels" :key="index">
              <view
                class="swiper-item-inner"
                :class="{ active: state.currentLevelIndex === index }"
              >
                <s-member-level-card :level="level" :userInfo="userInfo" />
              </view>
            </swiper-item>
          </swiper> -->

          <!-- 进度条组件 -->
          <s-member-progress
            :experience="userInfo?.experience || 0"
            :currentLevel="currentLevel"
            :nextLevel="nextLevel"
            :isVipOpened="isVipOpened"
            :userInfo="userInfo"
          ></s-member-progress>
          <!-- 静态权益展示区域 -->
          <s-member-level-rights
            :level="currentLevel"
            :userInfo="userInfo"
            :rightsAll="state.rightsAll"
            :rightsUnlockedMap="state.rightsUnlockedMap"
            :rightsUnlockLoaded="state.rightsUnlockLoaded"
            :isVipOpened="isVipOpened"
          />
        </view>

        <!-- 优势对比区域 -->
        <view class="block_18 flex-col">
          <text class="text_11">会员优势</text>
          <view
            class="section_13 flex-row justify-between"
            v-for="(item, index) in advantageRows"
            :key="index"
            :style="{
              backgroundImage: item.backgroundImage
                ? `url(${sheep.$url.cdn(item.backgroundImage)})`
                : 'none',
            }"
            @tap="onTapAdvantage(item)"
          >
            <view class="text-wrapper_40 flex-col">
              <text class="text_20">{{ item.title }}</text>
              <view class="desc-row flex-row align-center">
                <view class="desc-lines flex-row">
                  <view
                    class="desc-item flex-row align-center"
                    v-for="(d, di) in Array.isArray(item.desc) ? item.desc : [item.desc]"
                    :key="di"
                  >
                    <image
                      class="desc-side-icon left"
                      :src="
                        sheep.$url.cdn(
                          'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipNeo/zuodaosui.webp',
                        )
                      "
                      mode="aspectFit"
                    />
                    <text class="text_21">{{ d }}</text>
                    <image
                      class="desc-side-icon right"
                      :src="
                        sheep.$url.cdn(
                          'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipNeo/youdaosui.webp',
                        )
                      "
                      mode="aspectFit"
                    />
                  </view>
                </view>
              </view>
            </view>
            <!-- <view class="text-wrapper_12 flex-col" @tap="onViewPrivilege(item)">
              <text class="text_22">查看特权</text>
            </view> -->
          </view>
        </view>
        <!-- 升级操作区域 -->
        <view class="block_27 flex-col" v-if="currentLevel && !isVipOpened">
          <view class="box_19 flex-col">
            <view class="box_20">
              <view class="box_20_left">
                <view class="price-wrap">
                  <text class="text_20">¥</text>
                  <text class="text_21">{{ currentLevel.price }}</text>
                </view>
                <view class="group_45">
                  <view class="box_21 flex-col">
                    <view class="block_28 flex-col">
                      <text class="text_22">会员费将全额存入余额哦～</text>
                    </view>
                  </view>
                </view>
                <text class="text_23">/{{ currentLevel.upgradeName }}</text>
              </view>
              <view class="text-wrapper_4 flex-col" @tap="onUpgrade">
                <text class="text_24">{{ isVipOpened ? '会员卡充值' : '升级会员' }}</text>
              </view>
            </view>
            <view class="box_23 flex-row">
              <view
                class="agreement-checkbox-wrapper"
                @tap="state.isAgreement = !state.isAgreement"
              >
                <view class="agreement-checkbox" :class="{ 'is-checked': state.isAgreement }">
                  <text class="icon-checkmark" v-if="state.isAgreement">✓</text>
                </view>
              </view>
              <view class="text-wrapper_5">
                <text class="text_25">开通即代表同意</text>
                <text class="text_26" @tap="sheep.$router.go('/pages/index/userAgreement')"
                  >《服务协议》</text
                >
                <text class="text_27">和</text>
                <text class="text_28" @tap="sheep.$router.go('/pages/index/privacyPolicy')"
                  >《隐私协议》</text
                >
              </view>
            </view>
          </view>
        </view>
        <!-- 底部占位符，防止内容被底部的“立即开通”栏和导航栏遮挡 -->
        <view style="height: 130rpx; width: 100%"></view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive, onBeforeMount, watch } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import memberData from '@/sheep/data/member';
  import sMemberLevelCard from '@/sheep/components/s-member-level-card/s-member-level-card.vue';
  import sMemberProgress from '@/sheep/components/s-member-level-card/s-member-progress.vue';
  import sMemberLevelRights from '@/sheep/components/s-member-level-card/s-member-level-rights.vue';
  import MemberLevelApi from '@/sheep/api/member/level';
  import MemberRightsApi from '@/sheep/api/member/rights';
  import { SharePageEnum } from '@/sheep/helper/const';

  async function loadMemberLevelList() {
    const { code, data } = await MemberLevelApi.getMemberLevelList();
    if (code !== 0) return;
    if (!Array.isArray(data)) return;
    state.levelList = data;
  }

  async function loadAllRights() {
    if (!isLogin.value) {
      state.rightsAll = [];
      return;
    }
    const pageSize = 200;
    let pageNo = 1;
    const all = [];
    for (;;) {
      const { code, data } = await MemberRightsApi.getRightsPage({
        pageNo,
        pageSize,
        status: 0,
      });
      if (code !== 0) break;
      const list = Array.isArray(data?.list)
        ? data.list
        : Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data?.items)
        ? data.items
        : [];
      all.push(...list);
      const totalRaw = data?.total ?? data?.count;
      const total = Number(totalRaw);
      if (Number.isFinite(total) && total > 0) {
        if (all.length >= total) break;
      } else if (list.length < pageSize) {
        break;
      }
      pageNo += 1;
      if (pageNo > 50) break;
    }
    state.rightsAll = all;
  }

  let rightsUnlocking = false;
  async function loadUnlockedRightsByLevel(memberLevelId) {
    if (rightsUnlocking) return;
    if (!isLogin.value) {
      state.rightsUnlockedMap = {};
      state.rightsUnlockLoaded = false;
      state.rightsUnlockedLevelId = null;
      return;
    }
    const id = Number(memberLevelId);
    if (!Number.isFinite(id)) {
      state.rightsUnlockedMap = {};
      state.rightsUnlockLoaded = false;
      state.rightsUnlockedLevelId = null;
      return;
    }
    if (state.rightsUnlockLoaded && state.rightsUnlockedLevelId === id) return;
    rightsUnlocking = true;
    state.rightsUnlockLoaded = false;
    try {
      const { code, data } = await MemberRightsApi.getRightsByLevel(id);
      if (code !== 0) {
        state.rightsUnlockedMap = {};
        state.rightsUnlockLoaded = true;
        state.rightsUnlockedLevelId = id;
        return;
      }
      const list = Array.isArray(data) ? data : Array.isArray(data?.list) ? data.list : [];
      const unlockedMap = {};
      for (const it of list) {
        const rid = Number(it?.id ?? it?.rightsId ?? it?.rightId ?? it?.rights_id);
        if (Number.isFinite(rid)) unlockedMap[rid] = true;
      }
      state.rightsUnlockedMap = unlockedMap;
      state.rightsUnlockLoaded = true;
      state.rightsUnlockedLevelId = id;
    } finally {
      rightsUnlocking = false;
    }
  }

  onShow(async () => {
    // 页面显示时再次强制隐藏原生 tabBar，确保自定义 tabbar 渲染
    uni.hideTabBar({
      fail: () => {},
    });
    state.hasAutoLocated = false;
    state.hasUserInteracted = false;
    await loadMemberLevelList();
    await loadAllRights();
  });

  onBeforeMount(() => {
    // 隐藏原生tabBar
    uni.hideTabBar({
      fail: () => {},
    });
    // 动态加载字体
    uni.loadFontFace({
      family: 'Kingsoft_Cloud_Font',
      source: `url("https://xiancao.oss-cn-beijing.aliyuncs.com/fonts/default_fonts.ttf")`,
      scopes: ['native', 'webview'],
      success: () => console.log('Kingsoft_Cloud_Font loaded via CDN'),
      fail: (err) => console.log('Kingsoft_Cloud_Font load failed', err),
    });
  });

  const userInfo = computed(() => sheep.$store('user').userInfo);
  const isLogin = computed(() => sheep.$store('user').isLogin);

  const shareInfo = computed(() => {
    return sheep.$platform.share.getShareInfo(
      {
        title: '加入会员，开启专属权益',
        desc: '更多优惠等你来领',
        image: sheep.$url.cdn('/mp/static/sharePage.png'),
        params: {
          page: SharePageEnum.MEMBER.value,
        },
      },
      {
        type: 'user', // 指定分享类型
      },
    );
  });

  const state = reactive({
    isAgreement: true,
    currentLevelIndex: 0,
    levelList: [],
    rightsAll: [],
    rightsUnlockedMap: {},
    rightsUnlockLoaded: false,
    rightsUnlockedLevelId: null,
    hasAutoLocated: false,
    hasUserInteracted: false,
  });

  // 获取装修模板，用于导航栏样式
  const template = computed(() => sheep.$store('app').template?.user || {});

  // 会员等级配置数据
  const defaultMemberLevels = [
    {
      id: 'golden',
      name: '黄金会员',
      cardBg: 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/member/goldenCard.webp',
      price: 1000,
      upgradeName: '永久黄金会员',
      bgGradient:
        'linear-gradient(181deg, rgba(245, 245, 245, 0.8) 0.018229%, rgba(255, 204, 162, 0.8) 12.37253%, rgba(245, 245, 245, 0.8) 99.958333%)',
      decoGradient:
        'linear-gradient( 90deg, #E6A058 0%, rgba(214,154,93,0.45) 17.81%, rgba(215,156,94,0.1) 50.53%, rgba(215,156,94,0) 100%)',
      badgeBg: 'rgba(212,152,91,0.2)',
      badgeColor: 'rgba(230, 160, 88, 1)',
      mainColor: 'rgba(81, 59, 37, 1)',
      rights: [
        { icon: memberData.rights_4, title: '专属折扣', desc: '最高9.5折' },
        { icon: memberData.rights_1, title: '包邮', desc: '免费送到家' },
        { icon: memberData.rights_2, title: '消费积分', desc: '1.2倍返还' },
        { icon: memberData.rights_3, title: '免费退换', desc: '免费退换货' },
      ],
    },
    {
      id: 'platinum',
      name: '铂金会员',
      cardBg: 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/member/platinum.webp',
      price: 1000,
      upgradeName: '永久黄金会员',
      bgGradient:
        'linear-gradient(181deg, rgba(245, 245, 245, 0.8) 0.018229%, rgba(170, 188, 226, 0.8) 12.37253%, rgba(245, 245, 245, 0.8) 99.958333%)',
      decoGradient:
        'linear-gradient( 90deg, #7799D1 0%, rgba(119,153,209,0.45) 17.81%, rgba(119,153,209,0.1) 50.53%, rgba(119,153,209,0) 100%)',
      badgeBg: 'rgba(119, 153, 209, 0.24)',
      badgeColor: 'rgba(33, 75, 98, 1)',
      mainColor: 'rgba(33, 75, 98, 1)',
      rights: [
        { icon: memberData.rights_4, title: '专属折扣', desc: '最高9折' },
        { icon: memberData.rights_1, title: '包邮', desc: '免费送到家' },
        { icon: memberData.rights_2, title: '消费积分', desc: '1.5倍返还' },
        { icon: memberData.rights_3, title: '免费退换', desc: '免费退换货' },
      ],
    },
    {
      id: 'diamond',
      name: '钻石会员',
      cardBg: 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/member/Dimond.webp',
      price: 1000,
      upgradeName: '永久黄金会员',
      bgGradient:
        'linear-gradient(181deg, rgba(245, 245, 245, 0.8) 0.018229%, rgba(238, 187, 255, 0.8)  18.37253%, rgba(245, 245, 245, 0.8) 99.958333%)',
      decoGradient:
        'linear-gradient( 90deg, #7E63E9 0%, rgba(127,99,233,0.45) 17.81%, rgba(127,99,233,0.1) 50.53%, rgba(127,99,233,0) 100%)',
      badgeBg: 'rgba(126, 97, 235, 0.24)',
      badgeColor: 'rgba(112, 90, 198, 1)',
      mainColor: 'rgba(42, 26, 100, 1)',
      rights: [
        { icon: memberData.rights_4, title: '专属折扣', desc: '最高9折' },
        { icon: memberData.rights_1, title: '包邮', desc: '免费送到家' },
        { icon: memberData.rights_2, title: '消费积分', desc: '1.5倍返还' },
        { icon: memberData.rights_5, title: '免费退换', desc: '免费退换货' },
        { icon: memberData.rights_6, title: '专属客服', desc: '1对1' },
        { icon: memberData.rights_7, title: '优先购物', desc: '新品优先选' },
        { icon: memberData.rights_8, title: '周边礼品', desc: '领周边好礼' },
      ],
    },
  ];

  const memberLevels = computed(() => {
    const baseById = defaultMemberLevels.reduce((acc, item) => {
      if (item?.id) acc[item.id] = item;
      return acc;
    }, {});

    const apiList = state.levelList;
    if (!Array.isArray(apiList) || apiList.length === 0) return defaultMemberLevels;

    const idByLevel = {
      1: 'golden',
      2: 'platinum',
      3: 'diamond',
    };

    const mapped = apiList
      .filter(
        (item) =>
          item &&
          (Number(item.level) === 1 || Number(item.level) === 2 || Number(item.level) === 3),
      )
      .sort((a, b) => Number(a.level) - Number(b.level))
      .map((item) => {
        const normalizedLevel = Number(item.level);
        const id = idByLevel[normalizedLevel];
        const base = baseById[id] || {};
        const rawName = typeof item.name === 'string' ? item.name.replace(/\s/g, '') : '';
        const name = rawName ? (rawName.endsWith('会员') ? rawName : `${rawName}会员`) : base.name;
        const cardBg = item.backgroundUrl || base.cardBg;
        const price = typeof item.price === 'number' ? item.price : base.price;
        const upgradeName =
          typeof item.upgradeName === 'string' ? item.upgradeName : base.upgradeName;
        const rights = Array.isArray(item.rights) && item.rights.length ? item.rights : base.rights;
        return {
          ...base,
          id,
          memberLevelId: item.id ?? null,
          name,
          cardBg,
          price,
          upgradeName,
          rights,
          experience: item.experience ?? base.experience,
          discountPercent: item.discountPercent ?? base.discountPercent,
          icon: item.icon ?? base.icon,
        };
      });

    const result = mapped.filter(Boolean);
    return result.filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);
  });

  const currentUserLevelId = computed(() => {
    const idByLevel = {
      1: 'golden',
      2: 'platinum',
      3: 'diamond',
    };

    const rawLevel = userInfo.value?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3)
      return idByLevel[normalizedLevel];

    const rawLevelName = userInfo.value?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName.includes('钻石')) return 'diamond';
    if (levelName.includes('铂金')) return 'platinum';
    if (levelName.includes('黄金')) return 'golden';

    return 'golden';
  });

  watch(
    memberLevels,
    (list) => {
      if (!Array.isArray(list) || list.length === 0) {
        state.currentLevelIndex = 0;
        return;
      }
      if (state.currentLevelIndex >= list.length) state.currentLevelIndex = 0;
    },
    { immediate: true },
  );

  watch(
    [memberLevels, currentUserLevelId, isLogin],
    ([list, levelId, login]) => {
      if (!login) return;
      if (!Array.isArray(list) || list.length === 0) return;
      if (!levelId) return;
      if (state.hasAutoLocated || state.hasUserInteracted) return;
      const idx = list.findIndex((v) => v?.id === levelId);
      if (idx >= 0) {
        state.currentLevelIndex = idx;
        state.hasAutoLocated = true;
      }
    },
    { immediate: true },
  );

  const currentLevel = computed(() => memberLevels.value[state.currentLevelIndex] || {});

  const userMemberLevelId = computed(() => {
    const rawLevel = userInfo.value?.level;
    const levelValue =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      levelValue === null || levelValue === undefined || levelValue === ''
        ? null
        : Number(levelValue);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) {
      const hit = Array.isArray(state.levelList)
        ? state.levelList.find((it) => Number(it?.level) === normalizedLevel)
        : null;
      const id = Number(hit?.id);
      if (Number.isFinite(id)) return id;
      return null;
    }
    const rawLevelName = userInfo.value?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName) {
      let derivedLevel = null;
      if (levelName.includes('黄金')) derivedLevel = 1;
      if (levelName.includes('铂金')) derivedLevel = 2;
      if (levelName.includes('钻石')) derivedLevel = 3;
      if (derivedLevel !== null) {
        const hit = Array.isArray(state.levelList)
          ? state.levelList.find((it) => Number(it?.level) === derivedLevel)
          : null;
        const id = Number(hit?.id);
        return Number.isFinite(id) ? id : null;
      }
    }
    const direct =
      userInfo.value?.memberLevelId ??
      userInfo.value?.levelId ??
      userInfo.value?.memberLevelID ??
      (typeof rawLevel === 'object' && rawLevel
        ? rawLevel.memberLevelId ?? rawLevel.levelId
        : null);
    const directId = Number(direct);
    if (Number.isFinite(directId)) return directId;
    return null;
  });

  watch(
    [userMemberLevelId, () => state.rightsAll, isLogin],
    async ([memberLevelId, all, login]) => {
      if (!login) return;
      if (!Array.isArray(all) || all.length === 0) return;
      if (memberLevelId === null || memberLevelId === undefined) return;
      await loadUnlockedRightsByLevel(memberLevelId);
    },
    { immediate: true },
  );

  const navTitle = computed(() => currentLevel.value?.name || '会员中心');

  const navbarStyle = computed(() => {
    const base = template.value?.navigationBar;
    if (!base) return base;
    const patchCells = (cells) => {
      if (!Array.isArray(cells)) return cells;
      return cells.filter((item) => item?.type !== 'text');
    };
    return {
      ...base,
      list: patchCells(base.list),
      mpCells: patchCells(base.mpCells),
      otherCells: patchCells(base.otherCells),
    };
  });

  const onSwiperChange = (e) => {
    state.currentLevelIndex = e.detail.current;
    state.hasUserInteracted = true;
  };

  const nextLevel = computed(() => {
    const list = memberLevels.value || [];
    if (list.length === 0) return null;

    // 假设索引递增代表等级递增
    if (state.currentLevelIndex < list.length - 1) {
      return list[state.currentLevelIndex + 1];
    }

    // 如果已经是最高等级，就返回当前等级，避免超出
    return list[list.length - 1];
  });

  const isVipOpened = computed(() => {
    const rawLevel = userInfo.value?.level;
    const levelValue =
      typeof rawLevel === 'object' && rawLevel ? rawLevel.level ?? rawLevel.id ?? null : rawLevel;
    const normalizedLevel =
      levelValue === null || levelValue === undefined || levelValue === ''
        ? null
        : Number(levelValue);

    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) return true;

    const rawLevelName = userInfo.value?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (
      levelName &&
      !levelName.includes('无会员') &&
      (levelName.includes('黄金') || levelName.includes('铂金') || levelName.includes('钻石'))
    ) {
      return true;
    }
    return false;
  });

  async function onUpgrade() {
    if (isVipOpened.value) {
      sheep.$router.go('/pages/user/wallet/vip-recharge');
      return;
    }
    if (!state.isAgreement) {
      sheep.$helper.toast('请先阅读并同意协议');
      return;
    }

    // 调用后端接口创建开通/升级订单
    const { code, data } = await MemberLevelApi.activateCreate({
      payPrice: currentLevel.value.price * 100, // 假设 price 单位是元，接口需要分
      validPayPriceAndPackageId: true,
    });

    if (code === 0 && data?.payOrderId) {
      // 成功获取到支付订单，跳转收银台
      sheep.$router.redirect('/pages/pay/index', {
        id: data.payOrderId,
        orderType: 'vip_upgrade', // 可选，告知收银台这是会员升级订单，以便支付成功后跳回合适页面
      });
    } else if (code !== 0) {
      sheep.$helper.toast(data?.msg || '创建支付订单失败');
    }
  }

  const advantageRows = [
    {
      title: '会员基础礼包',
      desc: ['试用包邮', '推荐有礼', '会员费抵扣'],
      backgroundImage: 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipNeo/shichiBg.png',
    },

    {
      title: '会员专享折扣特权',
      desc: ['积分特权', '会员价专享'],
      backgroundImage:
        'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipNeo/zhuanxiangzhekou.png',
    },
    {
      title: '仙草会员生日礼遇',
      desc: ['当天赠送全场八折券'],
      backgroundImage: 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipNeo/shengriBg.png',
    },
    {
      title: '线上健康咨询服务',
      desc: ['会员每年免费健康咨询x3次', '专属客服'],
      backgroundImage:
        'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipNeo/xianshangjiankang.png',
    },
  ];

  function onTapAdvantage(item) {
    if (item.title === '仙草会员生日礼遇') {
      sheep.$router.go('/pages/user/info', { from: 'birthday' });
    }
  }
</script>

<style lang="scss">
  @import './member.rpx.css';

  /* 适配 s-layout 和响应式优化 */
  .page {
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .block_1 {
    width: 100%;
    height: auto;
    min-height: 100vh;
    background-color: #f8f9f3;
  }

  .block_2 {
    width: 100%;
    padding: 0rpx 0 0; // 强制清除左右内边距，确保 swiper 贴边
    box-sizing: border-box;
    position: relative;
  }

  .member-swiper {
    width: 100% !important;
    height: 480rpx !important;
    margin: 0 0 !important; // 确保没有水平外边距
  }

  .swiper-item-inner {
    width: 100%;
    height: 100%;
    transform: scale(0.9);
    transition: all 0.4s ease;
    opacity: 0.5;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    padding: 0 10rpx; // 减小非活动项的间距，让侧边预览更靠近主卡片
  }

  .swiper-item-inner.active {
    transform: scale(1);
    opacity: 1;
    padding: 0;
  }

  /* 装饰背景图 - 隐藏或调整 */
  .group_8 {
    display: none;
  }

  .list_1 {
    display: none;
  }

  .text-wrapper_2 {
    flex: 1;
    align-items: center;
  }

  /* 优势对比区域 */
  .block_18 {
    width: calc(100% - 40rpx);
    margin: 20rpx;
    margin-top: 0rpx;
    box-sizing: border-box;
    align-self: auto;
    border-radius: 20rpx;
  }

  .text_11 {
    margin: 0 0 30rpx;
    color: #1d2129;
  }

  .group_14 {
    width: 100%;
    padding-left: 0;
    background-color: transparent;
    margin-top: 20rpx;
  }

  /* 优势对比区域重构 */
  .text_4 {
    height: 85rpx;
    font-family: Kingsoft_Cloud_Font;
    font-size: 60rpx;
    color: #1e3f1c;
    line-height: 84rpx;
    text-align: left;
    font-style: normal;
    text-transform: none;
  }

  .advantage-container {
    width: 643rpx;
    height: 536rpx;
    background: #f8f9f3;
    border-radius: 22rpx;
    margin: 30rpx auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .advantage-row {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    /* 加深边框颜色，确保在高亮背景下也清晰可见 */
    border-bottom: 1rpx solid rgba(30, 63, 28, 0.1);
    padding: 0;

    &:last-child {
      border-bottom: none;
    }

    .col-name {
      flex: 1.5;
      font-size: 26rpx;
      color: #3d3d3c;
      text-align: left;
      padding-left: 30rpx;
      display: flex;
      align-items: center;
    }

    .col-value {
      flex: 1;
      font-size: 26rpx;
      color: rgba(213, 213, 213, 1);
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;

      &.highlight {
        color: #1e3f1c;
        font-weight: bold;
        background-color: rgba(255, 255, 250, 0.5);
        padding-right: 30rpx;
      }
    }

    .advantage-icon {
      width: 35rpx;
      height: 35rpx;
    }

    &.header {
      border-bottom: none;
      .col-value {
        color: rgba(213, 213, 213, 1);
        font-weight: bold;
      }
    }
  }

  .icon-check {
    color: #1e3f1c;
    font-weight: bold;
  }

  .text-wrapper_3 {
    display: none;
  }

  .block_18 {
    .section_13 {
      background-color: rgba(88, 120, 104, 1);
      border-radius: 21rpx;
      position: relative;
      width: 690rpx;
      overflow: hidden;
      align-self: center;
      margin-top: 24rpx;
      padding: 374rpx 24rpx 23rpx 24rpx;
      box-sizing: border-box;
      align-items: flex-end;
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: center;
    }

    .text-wrapper_40,
    .text-wrapper_12 {
      position: relative;
      z-index: 2;
    }

    .text-wrapper_40 {
      width: 100%;
      align-items: center;
    }

    .text_20 {
      overflow-wrap: break-word;
      color: rgba(255, 236, 183, 1);
      font-size: 42rpx;
      font-family: PingFangSC-Medium;
      font-weight: 500;
      text-align: center;
      white-space: nowrap;
      line-height: 42rpx;
      margin-right: 0;
    }

    .text_21 {
      overflow-wrap: break-word;
      color: rgba(255, 236, 183, 1);
      font-size: 26rpx;
      font-weight: normal;
      text-align: left;
      white-space: nowrap;
      line-height: 42rpx;
      margin: 0;
    }

    .desc-row {
      margin-top: 19rpx;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      width: 100%;
      overflow: hidden;
    }

    .desc-side-icon {
      width: 28rpx;
      height: 28rpx;
      flex: none;
    }

    .desc-item + .desc-item {
      margin-left: 14rpx;
    }

    .desc-lines {
      flex: 0 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
    }

    .desc-lines .text_21 {
      flex: none;
    }

    .text-wrapper_12 {
      background-image: linear-gradient(
        90deg,
        rgba(255, 254, 224, 1) 0,
        rgba(255, 232, 165, 1) 100%
      );
      border-radius: 100px;
      margin: 21rpx 0 22rpx 0;
      padding: 10rpx 34rpx 10rpx 32rpx;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .text_22 {
      overflow-wrap: break-word;
      color: rgba(86, 42, 8, 1);
      font-size: 28rpx;
      font-family: PingFangSC-Medium;
      font-weight: 500;
      text-align: left;
      white-space: nowrap;
      line-height: 40rpx;
    }

    .group_44 {
      height: 442rpx;
      width: 695rpx;
      position: absolute;
      left: -4rpx;
      top: -66rpx;
      padding: 227rpx 1rpx 0 4rpx;
      box-sizing: border-box;
      pointer-events: none;
      z-index: 1;
    }

    .box_40 {
      background-image: linear-gradient(
        180deg,
        rgba(88, 120, 104, 0) 0,
        rgba(88, 120, 104, 1) 100%
      );
      width: 690rpx;
      height: 215rpx;
    }

    .group_45 {
      background-image: linear-gradient(
        180deg,
        rgba(255, 243, 224, 1) 0,
        rgba(229, 202, 162, 1) 100%
      );
      position: absolute;
      left: 214rpx;
      top: 441rpx;
      width: 22rpx;
      height: 32rpx;
      pointer-events: none;
      z-index: 2;
    }

    .group_46 {
      background-image: linear-gradient(
        180deg,
        rgba(255, 243, 224, 1) 0,
        rgba(229, 202, 162, 1) 100%
      );
      position: absolute;
      left: 299rpx;
      top: 441rpx;
      width: 22rpx;
      height: 32rpx;
      pointer-events: none;
      z-index: 2;
    }
  }

  /* 升级操作区域 */
  .block_27 {
    width: 100%;
    padding: 20rpx 0 0;
  }

  /* 升级会员操作栏相关样式 */
  .box_19 {
    width: 100%;
    height: auto;
    padding: 30rpx;
    box-sizing: border-box;
    position: fixed;
    bottom: calc(86rpx + env(safe-area-inset-bottom));
    left: 0;
    background: #fffffa;
    border-radius: 20rpx 20rpx 0 0;
    z-index: 99;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .box_20 {
    width: 100%;
    padding-left: 20rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    .box_20_left {
      display: flex;
      align-items: baseline;
      position: relative;
    }

    .price-wrap {
      display: flex;
      align-items: baseline;
    }

    .group_45 {
      position: absolute;
      top: -28rpx;
      left: 150rpx;
      white-space: nowrap;
    }
  }

  .agreement-checkbox-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12rpx;
  }

  .agreement-checkbox {
    width: 28rpx;
    height: 28rpx;
    border: 2rpx solid #333;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    transition: all 0.2s;

    &.is-checked {
      background-color: #000;
      border-color: #000;
    }
  }

  .icon-checkmark {
    color: #fff;
    font-size: 18rpx;
    font-weight: bold;
    line-height: 1;
  }

  .box_23 {
    width: 100%;
    position: relative;
    margin-top: 20rpx;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .text-wrapper_5 {
    width: auto;
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .block_28 {
    background: rgba(240, 92, 54, 1);
    border-radius: 12rpx;
    padding: 10rpx 20rpx;
    position: relative;
    margin-bottom: 20rpx;
    width: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;

    /* 会话气泡的小尖尖 (左下方) */
    &::after {
      content: '';
      position: absolute;
      bottom: -12rpx;
      left: 30rpx;
      width: 0;
      height: 0;
      border-left: 12rpx solid transparent;
      border-right: 12rpx solid transparent;
      border-top: 14rpx solid rgba(240, 92, 54, 1);
      /* 稍微倾斜一点让它更像气泡 */
      transform: skewX(-20deg);
    }
  }

  .text_21 {
    font-family: DINAlternate-Bold;
    font-weight: 700;
    font-size: 62rpx;
    line-height: 87rpx;
  }

  .text_22 {
    color: #ffffff;
    font-size: 20rpx;
    line-height: 28rpx;
    white-space: nowrap;
  }
  .box_22 {
    display: none;
  }

  /* 隐藏对比图中的绝对定位线条 */
  .group_40,
  .group_41,
  .group_42,
  .group_43,
  .group_44 {
    display: none;
  }

  /* 基础布局辅助 */
  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .justify-between {
    justify-content: space-between;
  }

  .justify-end {
    justify-content: flex-end;
  }

  .justify-center {
    justify-content: center;
  }

  .align-center {
    align-items: center;
  }
</style>
