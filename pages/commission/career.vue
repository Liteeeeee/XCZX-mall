<template>
  <s-layout navbar="clear" :bgStyle="{ color: 'rgba(248, 249, 243, 1.0)' }">
    <view class="page flex-col">
      <view class="fixed-header">
        <su-status-bar />
        <view
          class="nav-bar-container"
          :style="{
            position: 'relative',
            height: sheep.$platform.navbar - sheep.$platform.device.statusBarHeight + 'px',
          }"
        >
          <view
            class="nav-bar-inner flex-row align-center"
            :style="{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '100%',
              left: '0',
              width: '100%',
            }"
          >
            <uni-icons type="left" size="22" color="rgba(0, 0, 0, 0.9)" @tap="sheep.$router.back()" class="nav-back" />
            <text class="nav-title">选择职业</text>
          </view>
        </view>
      </view>
      <view class="header-placeholder" :style="{ paddingTop: sheep.$platform.navbar + 'px' }"></view>

      <text class="text_3">您的职业</text>

      <view class="box_18">
        <view
          class="chip"
          v-for="item in state.options"
          :key="item"
          :class="state.current === item ? 'chip-active' : 'chip-normal'"
          @tap="onSelect(item)"
        >
          <text :class="state.current === item ? 'chip-text-active' : 'chip-text-normal'">{{ item }}</text>
        </view>
      </view>

      <text class="text_12">您的资质</text>
      
      <view class="box_21">
        <s-uploader
          v-model:url="state.images"
          fileMediatype="image"
          limit="3"
          mode="grid"
          :imageStyles="{ width: '210rpx', height: '210rpx', border: { radius: '20rpx', color: 'rgba(157,156,150,1)', style: 'solid', width: '1rpx' } }"
        >
          <view class="upload-box-inner">
            <uni-icons type="camera-filled" size="32" color="rgba(157, 156, 150, 1)" class="upload-icon" />
            <text class="upload-text">添加图片</text>
          </view>
        </s-uploader>
      </view>

      <text class="text_16">上传您的相关资质照片，可以帮助平台更快帮您通过审核。</text>

      <view class="footer">
        <view class="submit-btn" @tap="onSave">
          <text class="submit-text">保存</text>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { reactive } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import DictApi from '@/sheep/api/system/dict';
  import SUploader from '@/sheep/components/s-uploader/s-uploader.vue';

  const state = reactive({
    current: '',
    options: [],
    images: [],
  });

  function fallbackOptions() {
    return ['自由职业', '上班族', '个体经营', '宝妈', '学生', '公务员', '医生', '教师', '其他'];
  }

  function onSelect(item) {
    state.current = item;
  }

  function onSave() {
    if (!state.current) {
      uni.showToast({ title: '请选择职业', icon: 'none' });
      return;
    }
    uni.setStorageSync('brokerageApplyCareerName', state.current);
    // 存入资质照片以便上一页可能使用
    if (state.images && state.images.length > 0) {
      uni.setStorageSync('brokerageApplyImages', state.images);
    } else {
      uni.removeStorageSync('brokerageApplyImages');
    }
    sheep.$router.back();
  }

  async function loadOptions() {
    const types = ['brokerage_apply_career', 'brokerage_apply_profession', 'brokerage_apply_job', 'member_profession'];
    for (const t of types) {
      try {
        const { code, data } = await DictApi.getDictDataListByType(t);
        if (code !== 0 || !Array.isArray(data) || data.length === 0) {
          continue;
        }
        state.options = data.map((it) => it.label).filter(Boolean);
        if (state.options.length > 0) {
          return;
        }
      } catch (e) {}
    }
    state.options = fallbackOptions();
  }

  onLoad((options) => {
    state.current = options?.current || '';
    const images = uni.getStorageSync('brokerageApplyImages');
    if (images && Array.isArray(images)) {
      state.images = images;
    }
    loadOptions();
  });
</script>

<style lang="scss" scoped>
  .page {
    background-color: rgba(248, 249, 243, 1);
    width: 750rpx;
    min-height: 100vh;
    padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
  }

  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 10;
    background-color: rgba(248, 249, 243, 1);
  }

  .header-placeholder {
    width: 100%;
  }

  .nav-back {
    margin-left: 34rpx;
  }

  .nav-title {
    overflow-wrap: break-word;
    color: #000000;
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 50rpx;
    margin-left: 14rpx;
  }

  .text_3 {
    color: rgba(0, 0, 0, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 45rpx;
    margin: 22rpx 0 0 32rpx;
  }

  .box_18 {
    width: 686rpx;
    margin: 40rpx auto 0;
    display: flex;
    flex-wrap: wrap;
    gap: 28rpx;
  }

  .chip {
    width: 210rpx;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .chip-active {
    background-color: rgba(248, 249, 243, 1);
    border: 2rpx solid rgba(30, 63, 28, 1);
  }

  .chip-normal {
    background-color: rgba(255, 254, 250, 1);
    border: 1rpx solid rgba(157, 156, 150, 1);
  }

  .chip-text-active {
    color: rgba(30, 63, 28, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    line-height: 40rpx;
  }

  .chip-text-normal {
    color: rgba(159, 158, 152, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    line-height: 40rpx;
  }

  .text_12 {
    color: rgba(0, 0, 0, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 45rpx;
    margin: 60rpx 0 0 32rpx;
  }

  .box_21 {
    width: 686rpx;
    margin: 40rpx auto 0;
  }

  .upload-box-inner {
    width: 210rpx;
    height: 210rpx;
    background-color: rgba(255, 254, 250, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 20rpx;
  }

  .upload-icon {
    margin-bottom: 12rpx;
  }

  .upload-text {
    color: rgba(157, 156, 150, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    line-height: 40rpx;
  }

  .text_16 {
    color: rgba(181, 158, 109, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    line-height: 33rpx;
    margin: 40rpx 32rpx 0 32rpx;
  }

  .footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    background-color: rgba(255, 255, 250, 1);
    box-shadow: 0rpx -6rpx 10rpx 0rpx rgba(0, 0, 0, 0.02);
  }

  .submit-btn {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    border: 1rpx solid rgba(157, 156, 150, 1);
    width: 686rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .submit-text {
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    line-height: 45rpx;
  }

  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .align-center {
    display: flex;
    align-items: center;
  }
</style>
