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

    <view v-for="(item, index) in renderList" :key="index">
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

<style></style>
