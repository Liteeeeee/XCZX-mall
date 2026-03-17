<template>
  <s-layout
    title="会员中心"
    navbar="custom"
    :bgStyle="{ color: '#F8F9F3' }"
    :navbarStyle="template?.navigationBar"
    tabbar="/pages/index/member"
  >
    <view class="page flex-col">
      <view class="block_1 flex-col">
        <view class="block_2 flex-col" :style="{ backgroundImage: currentLevel.bgGradient }">
          <view :style="{ height: sheep.$platform.navbar + 'px' }"></view>

          <!-- 会员卡片轮播区域 -->
          <swiper
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
          </swiper>

          <!-- 静态权益展示区域 -->
          <s-member-level-rights :level="currentLevel" :userInfo="userInfo" />
        </view>

        <!-- 优势对比区域 -->
        <view class="block_18 flex-col">
          <text class="text_11">会员优势</text>
          <view class="advantage-container">
            <!-- 表头 -->
            <view class="advantage-row header">
              <view class="col-name"></view>
              <view class="col-value">普通会员</view>
              <view class="col-value highlight">升级会员</view>
            </view>
            <!-- 行数据 -->
            <view class="advantage-row" v-for="(row, index) in advantageRows" :key="index">
              <view class="col-name">{{ row.name }}</view>
              <view class="col-value">
                <text v-if="row.normal === 'check'" class="icon-check">✔</text>
                <image
                  v-else
                  class="advantage-icon"
                  :src="sheep.$url.static(memberData.shape_1, 'local')"
                  mode="aspectFit"
                ></image>
              </view>
              <view class="col-value highlight">
                <image
                  class="advantage-icon"
                  :src="sheep.$url.static(memberData.shape_2, 'local')"
                  mode="aspectFit"
                ></image>
              </view>
            </view>
          </view>
        </view>
        <!-- 升级操作区域 -->
        <view class="block_27 flex-col" v-if="currentLevel.id !== 'normal'">
          <view class="box_19 flex-col">
            <view class="box_20">
              <view>
                <text class="text_20">¥</text>
                <text class="text_21">{{ currentLevel.price }}</text></view
              >
              <view class="group_45">
                <view class="box_21 flex-col">
                  <view class="block_28 flex-col">
                    <text class="text_22">会员费将全额存入余额哦～</text>
                  </view>
                </view>
                <text class="text_23">/{{ currentLevel.upgradeName }}</text>
              </view>
              <view class="text-wrapper_4 flex-col" @tap="onUpgrade">
                <text class="text_24">升级会员</text>
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
                <text
                  class="text_26"
                  @tap="sheep.$router.go('/pages/public/richtext', { id: 'service-protocol' })"
                  >《服务协议》</text
                >
                <text class="text_27">和</text>
                <text
                  class="text_28"
                  @tap="sheep.$router.go('/pages/public/richtext', { id: 'payment-protocol' })"
                  >《支付协议》</text
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
  import { computed, reactive, onBeforeMount } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import memberData from '@/sheep/data/member';
  import sMemberLevelCard from '@/sheep/components/s-member-level-card/s-member-level-card.vue';
  import sMemberLevelRights from '@/sheep/components/s-member-level-card/s-member-level-rights.vue';
  import PayWalletApi from '@/sheep/api/pay/wallet';

  onShow(() => {
    // 页面显示时再次强制隐藏原生 tabBar，确保自定义 tabbar 渲染
    uni.hideTabBar({
      fail: () => {},
    });
  });

  onBeforeMount(() => {
    // 隐藏原生tabBar
    uni.hideTabBar({
      fail: () => {},
    });
    // 动态加载字体
    uni.loadFontFace({
      family: 'Kingsoft_Cloud_Font',
      source: 'url("/static/font/Kingsoft_Cloud_Font.TTF")',
      scopes: ['native', 'webview'],
      success: () => console.log('Kingsoft_Cloud_Font loaded'),
      fail: (err) => {
        uni.loadFontFace({
          family: 'Kingsoft_Cloud_Font',
          source: `url("https://file.sheepjs.com/static/font/Kingsoft_Cloud_Font.TTF")`,
          success: () => console.log('Kingsoft_Cloud_Font loaded via CDN'),
        });
      },
    });
  });

  const userInfo = computed(() => sheep.$store('user').userInfo);
  const isLogin = computed(() => sheep.$store('user').isLogin);

  const state = reactive({
    isAgreement: true,
    currentLevelIndex: 0,
  });

  // 获取装修模板，用于导航栏样式
  const template = computed(() => sheep.$store('app').template?.user || {});

  // 会员等级配置数据
  const memberLevels = [
    {
      id: 'normal',
      name: '普通会员',
      cardBg: memberData.card_bg,
      price: 0,
      upgradeName: '普通会员',
      bgGradient:
        'linear-gradient(181deg, rgba(245, 245, 245, 0.8) 0.018229%, rgba(199, 218, 195, 0.8) 12.37253%, rgba(245, 245, 245, 0.8) 99.958333%)',
      decoGradient:
        'linear-gradient(90deg, #1E3F1C 0%, rgba(30, 63, 28, 0.45) 17.81%, rgba(30, 63, 28, 0.1) 50.53%, rgba(163, 160, 191, 0) 100%)',
      badgeBg: 'rgba(30, 63, 28, 0.1)',
      badgeColor: 'rgba(30, 63, 28, 1)',
      mainColor: 'rgba(30, 63, 28, 1)',
      rights: [
        { icon: memberData.rights_2, title: '消费积分', desc: '购物返积分' },
        { icon: memberData.rights_1, title: '99元包邮', desc: '免费送到家' },
        { icon: memberData.rights_3, title: '会员关怀', desc: '专属铭牌' },
      ],
    },
    {
      id: 'golden',
      name: '黄金会员',
      cardBg: '/static/member/goldenCard.png',
      price: 999,
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
      cardBg: '/static/member/platinum.png',
      price: 999,
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
      cardBg: '/static/member/Dimond.png',
      price: 999,
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

  const currentLevel = computed(() => memberLevels[state.currentLevelIndex]);

  const onSwiperChange = (e) => {
    state.currentLevelIndex = e.detail.current;
  };

  async function onUpgrade() {
    if (!state.isAgreement) {
      sheep.$helper.toast('请先阅读并同意协议');
      return;
    }
    // 微信开发者工具无法唤起真实支付，直接跳转到失败结果页（模拟）
    sheep.$router.go('/pages/user/vip-result', {
      payState: 'fail',
    });
    
    // const price = currentLevel.value.price * 100;
    // const { code, data } = await PayWalletApi.createWalletRecharge({
    //   payPrice: price,
    // });
    // if (code !== 0) return;
    // sheep.$platform.pay('wechat', 'vip_upgrade', data.payOrderId);
  }

  const advantageRows = [
    { name: '最低8折专属折扣', normal: '-', upgrade: 'check' },
    { name: '最高2倍积分返现', normal: '-', upgrade: 'check' },
    { name: '健康咨询', normal: '-', upgrade: 'check' },
    { name: '优先发货', normal: '-', upgrade: 'check' },
    { name: '会员关怀', normal: '-', upgrade: 'check' },
    { name: '节气祝福', normal: '-', upgrade: 'check' },
  ];
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
    padding: 30rpx 0 0; // 强制清除左右内边距，确保 swiper 贴边
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
    padding: 40rpx 30rpx;
    box-sizing: border-box;
    align-self: auto;
    background-color: rgba(255, 254, 250, 1);
    border-radius: 20rpx;
  }

  .text_11 {
    margin: 0 0 30rpx;
  }

  .group_14 {
    width: 100%;
    padding-left: 0;
    background-color: transparent;
    margin-top: 20rpx;
  }

  /* 优势对比区域重构 */
  .text_4 {
    width: 216rpx;
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
    bottom: calc(78rpx + env(safe-area-inset-bottom));
    left: 0;
    background: #fff;
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
    font-family: 'PingFang SC';
    font-weight: 600;
    font-size: 62rpx;
    line-height: 87rpx;
  }

  .text_22 {
    color: #ffffff;
    font-size: 20rpx;
    line-height: 28rpx;
    white-space: nowrap;
  }

  /* 隐藏原有的装饰盒子 */
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
