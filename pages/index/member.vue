<template>
  <s-layout title="会员中心" 
    navbar="custom"
    :bgStyle="{ color: '#F8F9F3' }"
    :navbarStyle="template?.navigationBar"
    tabbar="/pages/index/member" >
    <view class="page flex-col">
      <view class="block_1 flex-col">
        <view class="block_2 flex-col">
          <view :style="{ height: sheep.$platform.navbar + 'px' }"></view>
          <!-- 等级卡片区域 -->
          <view class="box_5 flex-col" style="background: none !important;">
            <image
              :src="sheep.$url.static(memberData.card_bg, 'local')"
              mode="scaleToFill"
              style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 0"
            ></image>
            <view style="position: relative; z-index: 1">
              <view class="text-wrapper_1 flex-col">
                <text class="text_3">当前等级</text>
              </view>
              <view class="text-group_1 flex-col">
                <view style="width: 20rpx;"></view>
                <text class="text_4">{{ userInfo.levelName || '普通会员' }}</text>
                <view style="height: 14rpx;"></view>
                <text class="text_5">健康省钱·专属服务一站式享</text>
              </view>
              <view style="margin-top: 40rpx !important;" class="group_5 flex-col"></view>
              <view class="group_6 flex-row">
                <text style="margin-left: 20rpx;" class="text_6">已有{{ userInfo.experience || 0 }}成长值</text>
                <text class="text_7" @tap="sheep.$router.go('/pages/index/index')">升级会员 </text>
              </view>
              <view class="group_8 flex-col"></view>
            </view>
          </view>
          <view class="box_6 flex-col"></view>
        </view>
        <!-- 权益区域 -->
        <view class="block_14 flex-col">
          <text class="text_8">已解锁3项权益</text>
          <view class="section_5 flex-row justify-between">
            <view class="rights-item flex-col align-center" v-for="(item, index) in rightsList" :key="index">
              <image class="rights-icon" :src="sheep.$url.static(item.icon, 'local')" mode="aspectFit"></image>
              <text class="rights-title">{{ item.title }}</text>
              <text class="rights-desc">{{ item.desc }}</text>
            </view>
          </view>
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
                <image v-else class="advantage-icon" :src="sheep.$url.static(memberData.shape_1, 'local')" mode="aspectFit"></image>
              </view>
              <view class="col-value highlight">
                <image class="advantage-icon" :src="sheep.$url.static(memberData.shape_2, 'local')" mode="aspectFit"></image>
              </view>
            </view>
          </view>
        </view>
        <!-- 升级操作区域 -->
        <view class="block_27 flex-col">
          <view class="box_19 flex-col">
            <view class="box_20 flex-row justify-end">
             <view> <text class="text_20">¥</text>
              <text class="text_21">999</text></view>
              <view class="group_45">
                <view class="box_21 flex-col">
                  <view class="block_28 flex-col">
                    <text class="text_22">会员费将全额存入余额哦～</text>
                  </view>
                </view>
                <text class="text_23">/永久黄金会员</text>
              </view>
              <view class="text-wrapper_4 flex-col" @tap="sheep.$router.go('/pages/pay/recharge')">
                <text class="text_24">升级会员</text>
              </view>
            </view>
            <view class="box_23 flex-row justify-between">
              <view class="agreement-checkbox-wrapper" @tap="state.isAgreement = !state.isAgreement">
                <view class="agreement-checkbox" :class="{ 'is-checked': state.isAgreement }">
                  <text class="icon-checkmark" v-if="state.isAgreement">✓</text>
                </view>
              </view>
              <view class="text-wrapper_5">
                <text class="text_25">开通即代表同意</text>
                <text class="text_26" @tap="sheep.$router.go('/pages/public/richtext', { id: 'service-protocol' })">《服务协议》</text>
                <text class="text_27">和</text>
                <text class="text_28" @tap="sheep.$router.go('/pages/public/richtext', { id: 'payment-protocol' })">《支付协议》</text>
              </view>
            </view>
          </view>
        </view>
        <!-- 底部占位符，防止内容被底部的“立即开通”栏和导航栏遮挡 -->
        <view style="height: 130rpx; width: 100%;"></view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive, onBeforeMount } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import memberData from '@/sheep/data/member';

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
    // 动态加载字体，确保在不同端生效
    // 注意：微信小程序中加载本地字体文件有严格限制，推荐使用网络地址
    // 加载金山云技术体
  uni.loadFontFace({
    family: 'Kingsoft_Cloud_Font',
    // 尝试使用相对路径，uni-app 在编译时会自动处理
    source: 'url("/static/font/Kingsoft_Cloud_Font.TTF")',
    scopes: ['native', 'webview'],
    success: () => {
      console.log('Kingsoft_Cloud_Font loaded successfully');
    },
    fail: (err) => {
      console.warn('First attempt failed, trying absolute path...', err);
      // 如果相对路径失败，尝试使用带协议的路径（仅限开发环境且开启不校验域名）
      uni.loadFontFace({
        family: 'Kingsoft_Cloud_Font',
        source: `url("https://file.sheepjs.com/static/font/Kingsoft_Cloud_Font.TTF")`,
        success: () => console.log('Kingsoft_Cloud_Font loaded via CDN fallback'),
        fail: (err2) => console.error('All font loading attempts failed:', err2)
      });
    }
  });
  });

  const userInfo = computed(() => sheep.$store('user').userInfo);
  const isLogin = computed(() => sheep.$store('user').isLogin);
  const state = reactive({
    isAgreement: true
  });
  // 获取装修模板，用于导航栏样式
  const template = computed(() => sheep.$store('app').template?.user || {});

  const advantageRows = [
      { name: '最低8折专属折扣', normal: '-', upgrade: 'check' },
      { name: '最高2倍积分返现', normal: '-', upgrade: 'check' },
      { name: '健康咨询', normal: '-', upgrade: 'check' },
      { name: '优先发货', normal: '-', upgrade: 'check' },
      { name: '会员关怀', normal: '-', upgrade: 'check' },
      { name: '节气祝福', normal: '-', upgrade: 'check' },
    ];

    const rightsList = [
      {
        icon: memberData.rights_2,
        title: '消费积分',
        desc: '购物返积分',
      },
      {
        icon: memberData.rights_1,
        title: '99元包邮',
        desc: '免费送到家',
      },
      {
        icon: memberData.rights_3,
        title: '会员关怀',
        desc: '专属铭牌',
      },
    ];

  const loopData0 = reactive([
    {
      lanhutext0: '消费积分',
      lanhufontColor0: 'rgba(61,61,60,1.000000)',
      lanhutext1: '购物返积分',
    },
    {
      lanhutext0: '99元包邮',
      lanhufontColor0: 'rgba(29,33,41,1.000000)',
      lanhutext1: '免费送到家',
    },
    {
      lanhutext0: '会员关怀',
      lanhufontColor0: 'rgba(29,33,41,1.000000)',
      lanhutext1: '专属铭牌',
    },
  ]);
</script>

<style lang="scss">
  @import './member.rpx.css';

  /* 适配 s-layout 和响应式优化 */
  .page {
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }

  .block_1 {
    width: 100% !important;
    height: auto !important;
    min-height: 100vh;
    background-color: #F8F9F3 !important;
  }

  .block_2 {
    width: 100% !important;
    padding: 30rpx 30rpx 40rpx !important;
    box-sizing: border-box !important;
    position: relative !important;
  }

  /* 等级卡片 */
  .box_5 {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    width: 100% !important;
    height: 396rpx !important;
    margin: 0 auto !important;
    padding-top: 55rpx  !important;
    box-sizing: border-box !important;
    background: none !important;
    border-radius: 20rpx !important;
    overflow: hidden !important;
  }

  .text-wrapper_1 {
    width: 98rpx !important;
    height: 30rpx !important;
    background: rgba(30, 63, 28, 0.2) !important;
    border-radius: 15rpx 0 15rpx 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin-right: 0 !important;
    padding: 0 !important;
  }

  .text_3 {
    font-size: 20rpx !important;
    color: #1E3F1C !important;
    line-height: 26rpx !important;
  }

  .text-group_1 {
    margin: 20rpx 20rpx 0 !important;
  }

  .text_4 {
    width: 216rpx !important;
    height: 85rpx !important;
    font-family: Kingsoft_Cloud_Font !important;
    font-size: 60rpx !important;
    color: #1E3F1C !important;
    line-height: 84rpx !important;
    text-align: left !important;
    font-style: normal !important;
    text-transform: none !important;
  }

  .group_5 {
    width: 590rpx !important;
    height: 8rpx !important;
    border-radius: 4rpx !important;
    background: linear-gradient(90deg, #1E3F1C 0%, rgba(30, 63, 28, 0.45) 17.81%, rgba(30, 63, 28, 0.1) 50.53%, rgba(163, 160, 191, 0) 100%) !important;
    margin: 20rpx 0 0 20rpx !important;
  }

  .group_6 {
    margin: 20rpx 20rpx 0 0 !important;
    width: 100% !important;
    justify-content: space-between !important;
    align-items: center !important;
  }

  .text_7 {
    margin-left: 0 !important;
  }

  /* 装饰背景图 - 隐藏或调整 */
  .group_8 {
    display: none !important;
  }

  .box_6 {
    display: none !important;
  }

  /* 权益区域 */
  .block_14 {
    width: 100% !important;
    padding: 80rpx 30rpx 40rpx !important; /* 增加顶部 padding 以避开弧度区域 */
    box-sizing: border-box !important;
    border: none !important;
    margin-top: -90rpx !important; /* 向上移动覆盖等级卡片底部 */
    background: radial-gradient(circle at 50% -4450rpx, transparent 4485rpx, rgba(248, 249, 243, 1) 400.5rpx) !important;
    position: relative !important;
    z-index: 1 !important;
  }

  .text_8 {
    margin: 0 0 30rpx !important;
  }

  .section_5 {
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-start !important; /* 改为左对齐 */
    margin-top: 20rpx !important;
    overflow-x: auto !important; /* 允许横向滚动 */
    overflow-y: hidden !important; /* 强制禁止垂直滚动 */
    -webkit-overflow-scrolling: touch !important; /* 平滑滚动 */
  }

  .rights-item {
    flex: none !important; /* 移除 flex: 1 */
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    margin-right: 60rpx !important; /* 固定右间距 60rpx */

    &:last-child {
      margin-right: 0 !important;
    }
  }

  .rights-icon {
    width: 80rpx !important;
    height: 80rpx !important;
    margin-bottom: 16rpx !important;
  }

  .rights-title {
    font-size: 26rpx !important;
    color: rgba(29, 33, 41, 1) !important;
    font-weight: 600 !important;
    line-height: 24rpx !important;
    margin-bottom: 8rpx !important;
  }

  .rights-desc {
    font-size: 24rpx !important;
    color: rgba(134, 144, 156, 1) !important;
    line-height: 24rpx !important;
    text-align: center !important;
  }

  .list_1 {
    display: none !important;
  }

  .text-wrapper_2 {
    flex: 1 !important;
    align-items: center !important;
  }

  /* 优势对比区域 */
  .block_18 {
    width: calc(100% - 40rpx) !important;
    margin: 20rpx !important;
    padding: 40rpx 30rpx !important;
    box-sizing: border-box !important;
    align-self: auto !important;
    background-color: rgba(255, 254, 250, 1);
    border-radius: 20rpx !important;
  }

  .text_11 {
    margin: 0 0 30rpx !important;
  }

  .group_14 {
    width: 100% !important;
    padding-left: 0 !important;
    background-color: transparent !important;
    margin-top: 20rpx !important;
  }

  /* 优势对比区域重构 */
  .text_4 {
    width: 216rpx !important;
    height: 85rpx !important;
    font-family: Kingsoft_Cloud_Font !important;
    font-size: 60rpx !important;
    color: #1E3F1C !important;
    line-height: 84rpx !important;
    text-align: left !important;
    font-style: normal !important;
    text-transform: none !important;
  }

  .advantage-container {
    width: 643rpx !important;
    height: 536rpx !important;
    background: #F8F9F3 !important;
    border-radius: 22rpx !important;
    margin: 30rpx auto !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }

  .advantage-row {
    flex: 1 !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: stretch !important;
    /* 加深边框颜色，确保在高亮背景下也清晰可见 */
    border-bottom: 1rpx solid rgba(30, 63, 28, 0.1) !important;
    padding: 0 !important;

    &:last-child {
      border-bottom: none !important;
    }

    .col-name {
      flex: 1.5 !important;
      font-size: 26rpx !important;
      color: #3D3D3C !important;
      text-align: left !important;
      padding-left: 30rpx !important;
      display: flex !important;
      align-items: center !important;
    }

    .col-value {
      flex: 1 !important;
      font-size: 26rpx !important;
      color: rgba(213, 213, 213, 1);
      text-align: center !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;

      &.highlight {
        color: #1E3F1C !important;
        font-weight: bold !important;
        background-color: rgba(255, 255, 250, 0.5) !important;
        padding-right: 30rpx !important;
      }
    }

    .advantage-icon {
      width: 35rpx !important;
      height: 35rpx !important;
    }

    &.header {
      border-bottom: none !important;
      .col-value {
        color: rgba(213, 213, 213, 1);
        font-weight: bold !important;
      }
    }
  }

  .icon-check {
    color: #1E3F1C !important;
    font-weight: bold !important;
  }

  .text-wrapper_3 {
    display: none !important;
  }

  /* 升级操作区域 */
  .block_27 {
    width: 100% !important;
    padding: 20rpx 0 0 !important;
  }

  /* 升级会员操作栏相关样式 */
  .box_19 {
    width: 100% !important;
    height: auto !important;
    padding: 30rpx !important;
    box-sizing: border-box !important;
    position: fixed !important;
    bottom: calc(94rpx + env(safe-area-inset-bottom)) !important;
    left: 0 !important;
    background: #fff !important;
    border-radius: 20rpx 20rpx 0 0 !important;
    z-index: 99 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
  }

  .box_20 {
    width: 100% !important;
    padding-left: 20rpx !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
  }

  .agreement-checkbox-wrapper {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin-right: 12rpx !important;
  }

  .agreement-checkbox {
    width: 28rpx !important;
    height: 28rpx !important;
    border: 2rpx solid #333 !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    transition: all 0.2s !important;

    &.is-checked {
      background-color: #000 !important;
      border-color: #000 !important;
    }
  }

  .icon-checkmark {
    color: #fff !important;
    font-size: 18rpx !important;
    font-weight: bold !important;
    line-height: 1 !important;
  }

  .box_23 {
    width: 100% !important;
    position: relative !important;
    margin-top: 20rpx !important;
    display: flex !important;
    flex-direction: row !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .text-wrapper_5 {
    width: auto !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
  }

  .block_28 {
    background: rgba(240, 92, 54, 1) !important;
    border-radius: 12rpx !important;
    padding: 10rpx 20rpx !important;
    position: relative !important;
    margin-bottom: 20rpx !important;
    width: fit-content !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    /* 会话气泡的小尖尖 (左下方) */
    &::after {
      content: '' !important;
      position: absolute !important;
      bottom: -12rpx !important;
      left: 30rpx !important;
      width: 0 !important;
      height: 0 !important;
      border-left: 12rpx solid transparent !important;
      border-right: 12rpx solid transparent !important;
      border-top: 14rpx solid rgba(240, 92, 54, 1) !important;
      /* 稍微倾斜一点让它更像气泡 */
      transform: skewX(-20deg) !important;
    }
  }

  .text_21 {
    font-family: "PingFang SC" !important;
    font-weight: 600 !important;
    font-size: 62rpx !important;
    line-height: 87rpx !important;
  }

  .text_22 {
    color: #FFFFFF !important;
    font-size: 20rpx !important;
    line-height: 28rpx !important;
    white-space: nowrap !important;
  }

  /* 隐藏原有的装饰盒子 */
  .box_22 {
    display: none !important;
  }

  /* 隐藏对比图中的绝对定位线条 */
  .group_40, .group_41, .group_42, .group_43, .group_44 {
    display: none !important;
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
