<!-- 个人中心：支持装修 -->
<template>
  <s-layout
    title="我的"
    tabbar="/pages/index/user"
    navbar="custom"
    :bgStyle="template.page"
    :navbarStyle="template.navigationBar"
    onShareAppMessage
  >
    <!-- 调试层：只有在没有渲染列表时显示 -->
    <view v-if="renderList.length === 0" style="padding: 200rpx 40rpx; text-align: center; background: #fff; border: 2px dashed #ccc; margin: 20rpx;">
      <view style="color: #ff4d4f; font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx;">[DEBUG] 装修数据未就绪</view>
      <view style="color: #999; font-size: 24rpx; margin-bottom: 20rpx; white-space: pre-wrap; text-align: left;">
        Template: {{ template ? '已加载' : '未加载' }}
        Components: {{ template?.components?.length || 0 }}
        Data: {{ template?.data?.length || 0 }}
        Full Template JSON: {{ JSON.stringify(template || {}).substring(0, 200) }}...
      </view>
      <button style="width: 200rpx; height: 60rpx; line-height: 60rpx; font-size: 24rpx;" @tap="sheep.$router.go('/pages/index/index')">刷新首页</button>
    </view>

    <!-- 上半部分：用户卡片 (UserCardPro) -->
    <view
      class="user-top-bg"
      :style="[
        {
          background: `url(${sheep.$url.static('/static/user/userBg.png')}) no-repeat top center / 100% auto`,
        },
      ]"
    >
      <view v-for="(item, index) in userCardList" :key="'top-' + index">
        <s-block :styles="item.property.style || {}">
          <s-block-item :type="item.id" :data="item.property" :styles="item.property.style || {}" />
        </s-block>
      </view>
    </view>

    <!-- 下半部分：大盒子包裹订单和信息 (UserOrder & UserInfo) -->
    <view class="user-bottom-content" :style="{ 'margin-top': marginTop }" v-if="orderCardList.length > 0 || userInfoList.length > 0">
      <view v-for="(item, index) in orderCardList" :key="'order-' + index">
        <s-block-item :type="item.id" :data="item.property" :styles="item.property.style || {}" />
      </view>
      <view v-for="(item, index) in userInfoList" :key="'info-' + index">
        <s-block-item :type="item.id" :data="item.property" :styles="item.property.style || {}" />
      </view>
    </view>

    <!-- 渲染其他未被包裹的组件 -->
    <view v-for="(item, index) in otherList" :key="'other-' + index">
      <s-block :styles="item.property.style || {}">
        <s-block-item :type="item.id" :data="item.property" :styles="item.property.style || {}" />
      </s-block>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed } from 'vue';
  import { onShow, onPageScroll, onPullDownRefresh } from '@dcloudio/uni-app';
  import sheep from '@/sheep';

  // 隐藏原生tabBar
  uni.hideTabBar({
    fail: () => {},
  });
// 获取个人中心模板
  const template = computed(() => {
    return sheep.$store('app').template.user;
  });

  // 渲染列表：兼容 components 和 data 字段
  const renderList = computed(() => {
    const list = template.value?.components || template.value?.data || [];
    console.log('User page renderList:', list);
    return list;
  });

  // 用户卡片组件 (上半部分)
  const userCardList = computed(() => renderList.value.filter((item) => item.id === 'UserCardPro'));

  // 订单和信息组件 (下半部分包裹内容)
  const orderCardList = computed(() => renderList.value.filter((item) => item.id === 'UserOrder'));
  const userInfoList = computed(() => renderList.value.filter((item) => item.id === 'UserInfo'));

  // 其他组件
  const otherList = computed(() =>
    renderList.value.filter(
      (item) => !['UserCardPro', 'UserOrder', 'UserInfo'].includes(item.id),
    ),
  );

  // 计算 margin-top
  const marginTop = computed(() => {
    const user = sheep.$store('user');
    const isLogin = user.isLogin;
    const userInfo = user.userInfo;
    // 判断是否为VIP：已登录 且 levelName存在 且 不等于'普通会员'
    const isVip = !isLogin || userInfo && userInfo.levelName && userInfo.levelName === '普通会员';
    
    // 根据你的需求，默认是 -139rpx，VIP 是 -169rpx (即 -139 - 30)
    const value = isVip ? '-100rpx' : '-139rpx'; 
    console.log('当前是否为VIP:', !!isVip, ' | 期望的 rpx 值为:', value);
    
    return value;
  });

  onShow(() => {
    sheep.$store('user').updateUserData();
  });

  onPullDownRefresh(() => {
    sheep.$store('user').updateUserData();
    setTimeout(function () {
      uni.stopPullDownRefresh();
    }, 800);
  });

  onPageScroll(() => {});
</script>

<style lang="scss" scoped>
  .user-top-bg {
    width: 100%;
  }

  .user-bottom-content {
    width: 100%;
    min-height: calc(100vh - 480rpx);
    padding: 80rpx 30rpx 20rpx;
    // margin-top: -139rpx; // 向上移动以覆盖在卡片下方，现已通过js动态计算
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    background: radial-gradient(
      circle at 50% -4450rpx,
      transparent 4485rpx,
      rgba(248, 249, 243, 1) 400.5rpx
    );
  }
</style>
