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
            <uni-icons
              type="left"
              size="22"
              color="rgba(0, 0, 0, 0.9)"
              @tap="sheep.$router.back()"
              class="nav-back"
            />
            <text class="nav-title">分销</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <audit-reject
        v-if="state.showReject"
        :refuseReason="state.rejectApplyData?.refuseReason || ''"
        @contact="onRejectContact"
        @reapply="onRejectReapply"
      />

      <view v-else class="card flex-col">
        <view class="row flex-row">
          <text class="row-label">昵称</text>
          <text class="row-value">{{ userInfo?.nickname || '' }}</text>
        </view>
        <view class="divider"></view>

        <view class="row flex-row">
          <text class="row-label">手机号</text>
          <text class="row-prefix">+86</text>
          <uni-icons type="bottom" size="14" color="rgba(212, 212, 213, 1)" class="prefix-arrow" />
          <input
            class="row-input"
            type="number"
            maxlength="11"
            v-model="state.mobile"
            placeholder="请输入您的手机号"
            placeholder-class="placeholder"
          />
        </view>
        <view class="divider"></view>

        <!-- <view class="row flex-row">
          <text class="row-label">身份证号</text>
          <input
            class="row-input"
            type="idcard"
            maxlength="18"
            v-model="state.idCardNo"
            placeholder="请输入您的身份证号"
            placeholder-class="placeholder"
          />
        </view>
        <view class="divider"></view>

        <view class="row flex-col">
          <text class="row-label" style="margin-bottom: 24rpx;">身份证照片</text>
          <view class="idcard-upload-group flex-row justify-between">
            <view class="idcard-upload-item flex-col align-center">
              <s-uploader
                v-model:url="state.idCardFrontUrl"
                fileMediatype="image"
                limit="1"
                mode="grid"
                :imageStyles="{ width: '310rpx', height: '200rpx', border: { radius: '20rpx', color: 'rgba(157,156,150,1)', style: 'solid', width: '1rpx' } }"
              >
                <view class="upload-box-inner flex-col align-center justify-center">
                  <uni-icons type="camera-filled" size="32" color="rgba(157, 156, 150, 1)" class="upload-icon" />
                  <text class="upload-text">上传人像面</text>
                </view>
              </s-uploader>
            </view>
            <view class="idcard-upload-item flex-col align-center">
              <s-uploader
                v-model:url="state.idCardBackUrl"
                fileMediatype="image"
                limit="1"
                mode="grid"
                :imageStyles="{ width: '310rpx', height: '200rpx', border: { radius: '20rpx', color: 'rgba(157,156,150,1)', style: 'solid', width: '1rpx' } }"
              >
                <view class="upload-box-inner flex-col align-center justify-center">
                  <uni-icons type="camera-filled" size="32" color="rgba(157, 156, 150, 1)" class="upload-icon" />
                  <text class="upload-text">上传国徽面</text>
                </view>
              </s-uploader>
            </view>
          </view>
        </view> -->

        <view class="row flex-row" @tap="openCareerDrawer">
          <text class="row-label">职业</text>
          <text class="row-select" :class="state.careerName ? '' : 'row-select-placeholder'">{{
            state.careerName || '请选择'
          }}</text>
          <uni-icons
            type="right"
            size="14"
            color="rgba(212, 212, 213, 1)"
            class="row-right-arrow"
          />
        </view>
        <text class="text_12">资质上传(必填)</text>
        <text class="text_16">{{ careerDescription }}</text>
        <view class="box_21">
          <s-uploader
            v-model:url="state.images"
            fileMediatype="image"
            limit="3"
            mode="grid"
            :imageStyles="{
              width: '210rpx',
              height: '210rpx',
              border: {
                radius: '20rpx',
                color: 'rgba(157,156,150,1)',
                style: 'dashed',
                width: '1rpx',
              },
            }"
          >
            <view class="upload-box-inner">
              <image
                class="upload-img"
                :src="sheep.$url.cdn('/mp/static/upload.webp')"
                mode="aspectFit"
              />
              <text class="upload-text">添加图片</text>
            </view>
          </s-uploader>
        </view>

        <view class="divider"></view>

        <view class="row flex-row">
          <text class="row-label">性别</text>
          <view class="gender-group flex-row align-center">
            <view class="gender-option flex-row align-center" @tap="state.gender = 1">
              <view
                class="gender-check flex-col"
                :class="state.gender === 1 ? 'gender-check-on' : ''"
              >
                <view v-if="state.gender === 1" class="gender-check-tick"></view>
              </view>
              <text class="gender-text">先生</text>
            </view>
            <view
              class="gender-option flex-row align-center gender-option-right"
              @tap="state.gender = 2"
            >
              <view
                class="gender-check flex-col"
                :class="state.gender === 2 ? 'gender-check-on' : ''"
              >
                <view v-if="state.gender === 2" class="gender-check-tick"></view>
              </view>
              <text class="gender-text">女士</text>
            </view>
          </view>
        </view>
        <view class="divider"></view>

        <view class="row flex-row">
          <text class="row-label">申请原因</text>
          <input
            class="row-input-reason"
            v-model="state.reason"
            maxlength="50"
            placeholder="请输入申请原因"
            placeholder-class="placeholder"
          />
        </view>
      </view>

      <view v-if="!state.showReject" class="footer">
        <view class="submit-btn" @tap="onSubmit">
          <text class="submit-text">提交审核</text>
        </view>
      </view>

      <su-popup
        :show="state.showCareerDrawer"
        type="bottom"
        round="20"
        :showClose="true"
        backgroundColor="#FFFFFA"
        @close="closeCareerDrawer"
      >
        <view class="career-drawer flex-col">
          <text class="drawer-title">选择职业</text>
          <scroll-view class="career-list" scroll-y>
            <view
              class="career-item flex-row justify-between align-center"
              v-for="item in state.careerOptions"
              :key="item.value"
              @tap="state.tempCareerValue = item.value"
            >
              <text class="career-item-label">{{ item.label }}</text>
              <view
                class="gender-check flex-col"
                :class="state.tempCareerValue === item.value ? 'gender-check-on' : ''"
              >
                <view v-if="state.tempCareerValue === item.value" class="gender-check-tick"></view>
              </view>
            </view>
          </scroll-view>
          <view class="drawer-footer">
            <view class="submit-btn" @tap="onConfirmCareer">
              <text class="submit-text">确认</text>
            </view>
          </view>
        </view>
      </su-popup>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import BrokerageApplyApi from '@/sheep/api/trade/brokerageApply';
  import DictApi from '@/sheep/api/system/dict';
  import SUploader from '@/sheep/components/s-uploader/s-uploader.vue';
  import auditReject from '@/sheep/components/s-audit-reject/s-audit-reject.vue';

  const userInfo = computed(() => sheep.$store('user').userInfo || {});
  function fallbackOptions() {
    return ['自由职业', '上班族', '个体经营', '宝妈', '学生', '公务员', '医生', '教师', '其他'];
  }

  const state = reactive({
    mobile: '',
    idCardNo: '',
    idCardFrontUrl: '',
    idCardBackUrl: '',
    careerName: '',
    careerValue: '',
    tempCareerValue: '',
    careerOptions: [],
    images: [],
    gender: 1,
    reason: '',
    showReject: false,
    rejectApplyData: null,
    showCareerDrawer: false,
  });

  function openCareerDrawer() {
    state.tempCareerValue = state.careerValue;
    state.showCareerDrawer = true;
  }

  function closeCareerDrawer() {
    state.showCareerDrawer = false;
  }

  function onConfirmCareer() {
    const opt = state.careerOptions.find(
      (it) => String(it.value) === String(state.tempCareerValue),
    );
    if (opt) {
      state.careerName = opt.label;
      state.careerValue = opt.value;
    }
    closeCareerDrawer();
  }

  function syncCareerNameByValue() {
    if (!state.careerValue) return;
    const hit = state.careerOptions.find((it) => String(it.value) === String(state.careerValue));
    if (hit) state.careerName = hit.label;
  }

  const careerDescription = computed(() => {
    const hit = state.careerOptions.find((it) => String(it.value) === String(state.careerValue));
    return hit?.description || '上传您的相关资质照片，可以帮助平台更快帮您通过审核。';
  });

  async function loadCareerOptions() {
    try {
      const { code, data } = await DictApi.getDictDataListByType('occupation');
      if (code !== 0 || !Array.isArray(data) || data.length === 0) {
        state.careerOptions = fallbackOptions().map((label) => ({ label, value: label }));
        syncCareerNameByValue();
        return;
      }
      state.careerOptions = [...data]
        .sort((a, b) => Number(a?.sort ?? 0) - Number(b?.sort ?? 0))
        .map((it) => ({
          label: it?.label ?? it?.name ?? it?.value,
          value: it?.value ?? it?.label ?? it?.name,
          description: it?.description ?? it?.remark ?? '',
        }))
        .filter((it) => it.label && it.value);
      if (state.careerOptions.length === 0) {
        state.careerOptions = fallbackOptions().map((label) => ({ label, value: label }));
      }
      syncCareerNameByValue();
    } catch (e) {
      state.careerOptions = fallbackOptions().map((label) => ({ label, value: label }));
      syncCareerNameByValue();
    }
  }

  function onSelectCareer(opt) {
    if (!opt) return;
    state.careerName = opt.label;
    state.careerValue = opt.value;
  }

  function onRejectContact() {
    sheep.$router.go('/pages/chat/index');
  }

  function onRejectReapply() {
    hydrateForm(state.rejectApplyData);
    state.showReject = false;
  }

  function normalizeUploadUrl(url) {
    if (!url) return '';
    const value = String(url);
    if (/^https?:\/\//.test(value)) return value;
    return sheep.$url.cdn(value.startsWith('/') ? value : `/${value}`);
  }

  function parseAdditionalInfo(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return {};
    try {
      const obj = JSON.parse(value);
      if (obj && typeof obj === 'object') return obj;
      return {};
    } catch {
      return {};
    }
  }

  function hydrateForm(data) {
    if (!data) return;
    const additionalInfo = parseAdditionalInfo(data.additionalInfo);
    state.mobile = data.mobile || state.mobile || '';
    state.idCardNo = data.idCardNo || '';
    state.idCardFrontUrl = normalizeUploadUrl(data.idCardFrontUrl);
    state.idCardBackUrl = normalizeUploadUrl(data.idCardBackUrl);
    state.careerValue = data.occupation || '';
    state.careerName = '';
    syncCareerNameByValue();
    const imgs = additionalInfo.qualificationImages || additionalInfo.images;
    state.images = Array.isArray(imgs) ? imgs.map(normalizeUploadUrl).filter(Boolean) : [];
    state.gender = Number(data.gender) === 2 ? 2 : 1;
    state.reason = data.reason || additionalInfo.reason || additionalInfo.applyReason || '';
  }

  function normalizeMobile(v) {
    return String(v || '').replace(/\s/g, '');
  }

  function submitApply(payload) {
    uni.showLoading({ title: '提交中' });
    const applyData = state.rejectApplyData;
    const isResubmit = Boolean(applyData && Number(applyData.status) === 2);
    const submitFn = isResubmit ? BrokerageApplyApi.resubmitApply : BrokerageApplyApi.createApply;
    const submitPayload = { ...payload };
    if (isResubmit && applyData?.id) {
      submitPayload.applyId = applyData.id;
    }
    submitFn(submitPayload)
      .then((res) => {
        uni.hideLoading();
        if (res.code === 0) {
          uni.showToast({ title: '已提交', icon: 'none' });
          sheep.$router.redirect('/pages/commission/apply-success');
        }
      })
      .catch(() => {
        uni.hideLoading();
      });
  }

  async function onSubmit() {
    const mobile = normalizeMobile(state.mobile);
    if (!mobile) {
      uni.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    // const idCardNo = (state.idCardNo || '').trim();
    // if (!idCardNo) {
    //   uni.showToast({ title: '请输入身份证号', icon: 'none' });
    //   return;
    // }
    // // 简单的身份证格式校验（18位，最后一位可以是数字或Xx）
    // if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCardNo)) {
    //   uni.showToast({ title: '请输入正确的身份证号', icon: 'none' });
    //   return;
    // }
    // if (!state.idCardFrontUrl) {
    //   uni.showToast({ title: '请上传身份证人像面', icon: 'none' });
    //   return;
    // }
    // if (!state.idCardBackUrl) {
    //   uni.showToast({ title: '请上传身份证国徽面', icon: 'none' });
    //   return;
    // }
    if (!state.careerValue) {
      uni.showToast({ title: '请选择职业', icon: 'none' });
      return;
    }

    // 提取 key，去除可能存在的 CDN 前缀（兼容 http 和 https）
    const extractKey = (url) => {
      if (url) {
        return url.replace(/^https?:\/\/xiancao\.oss-cn-beijing\.aliyuncs\.com\//, '');
      }
      return url;
    };

    const payload = {
      mobile,
      idCardNo: '',
      idCardFrontUrl: '',
      idCardBackUrl: '',
      occupation: state.careerValue,
      gender: state.gender,
    };

    // 获取当前位置并拼装到 additionalInfo
    const additionalInfo = {
      reason: state.reason,
    };
    if (Array.isArray(state.images) && state.images.length > 0) {
      additionalInfo.qualificationImages = state.images.map(extractKey).filter(Boolean);
    }
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        additionalInfo.longitude = res.longitude;
        additionalInfo.latitude = res.latitude;
        payload.additionalInfo = JSON.stringify(additionalInfo);
        submitApply(payload);
      },
      fail: (err) => {
        console.error('获取定位失败：', err);
        // 如果获取定位失败，为了不阻塞用户申请，仍然允许提交
        payload.additionalInfo = JSON.stringify(additionalInfo);
        submitApply(payload);
      },
    });
  }

  onLoad(async () => {
    state.mobile = userInfo.value?.mobile || '';
    loadCareerOptions();

    // 检查是否有审核中的申请
    const { code, data } = await BrokerageApplyApi.getApply();
    if (code === 0 && data) {
      state.rejectApplyData = data;
      const status = Number(data.status);
      // status: 0 审核中, 1 审核通过, 2 审核拒绝
      if (status === 0) {
        uni.redirectTo({ url: '/pages/commission/apply-success' });
      } else if (status === 1) {
        // 如果已经通过审核，跳转到分销中心首页
        uni.redirectTo({ url: '/pages/commission/index' });
      } else if (status === 2) {
        state.showReject = true;
      }
    }
  });

  onShow(() => {});
</script>

<style lang="scss" scoped>
  .page {
    background-color: rgba(248, 249, 243, 1);
    width: 750rpx;
    min-height: 100vh;
    padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
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

  .capsule {
    background-color: rgba(255, 255, 255, 0.594);
    border-radius: 100rpx;
    width: 174rpx;
    border: 1rpx solid rgba(151, 151, 151, 0.198);
    padding: 12rpx 26rpx 13rpx 26rpx;
    margin-left: auto;
    margin-right: 16rpx;
    align-items: center;
  }

  .capsule-dots {
    background-color: rgba(0, 0, 0, 1);
    width: 37rpx;
    margin: 13rpx 0 11rpx 0;
  }

  .dot {
    width: 8rpx;
    height: 8rpx;
    margin: 3rpx 0 2rpx 0;
  }

  .dot-mid {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    width: 13rpx;
    height: 13rpx;
  }

  .capsule-divider {
    background-color: rgba(0, 0, 0, 0.2);
    width: 1rpx;
    height: 37rpx;
    margin-left: 23rpx;
  }

  .capsule-circle {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    margin: 2rpx 0 1rpx 25rpx;
    padding: 4rpx;
  }

  .capsule-circle-inner {
    background-color: rgba(0, 0, 0, 1);
    border-radius: 50%;
    padding: 7rpx;
  }

  .capsule-square {
    width: 12rpx;
    height: 12rpx;
  }

  .card {
    background-color: rgba(255, 254, 250, 1);
    border-radius: 20rpx;
    width: 686rpx;
    align-self: center;
    padding: 48rpx 23rpx 99rpx 23rpx;
    margin-top: 26rpx;
    box-sizing: border-box;
  }

  .row {
    min-height: 40rpx;
    align-items: center;
  }

  .row-label {
    width: 184rpx;
    flex-shrink: 0;
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .row-value {
    flex: 1;
    overflow-wrap: break-word;
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .divider {
    width: 639rpx;
    height: 1rpx;
    border-top: 1rpx solid rgba(157, 156, 150, 0.3);
    margin: 34rpx 0 35rpx 1rpx;
  }

  .row-prefix {
    flex-shrink: 0;
    overflow-wrap: break-word;
    color: rgba(212, 212, 213, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: right;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .prefix-arrow {
    flex-shrink: 0;
    margin: 0 27rpx 0 7rpx;
  }

  .row-right-arrow {
    flex-shrink: 0;
    margin-left: 10rpx;
  }

  .row-input {
    flex: 1;
    font-size: 28rpx;
    line-height: 40rpx;
    color: rgba(61, 61, 60, 1);
  }

  .row-select {
    flex: 1;
    overflow-wrap: break-word;
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
    color: rgba(61, 61, 60, 1);
  }

  .row-select-placeholder {
    color: rgba(212, 212, 213, 1);
  }

  .row-right {
    margin-left: auto;
  }

  .text_12 {
    color: rgba(0, 0, 0, 1);
    font-size: 28rpx;
    font-weight: 400;
    line-height: 45rpx;
    margin: 40rpx 0 0 0;
  }

  .box_21 {
    width: 639rpx;
    margin: 24rpx 0 0 0;
  }

  .text_16 {
    color: rgba(181, 158, 109, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    line-height: 33rpx;
    margin: 24rpx 0 0 0;
  }

  .gender-group {
    flex: 1;
    justify-content: flex-end;
  }

  .gender-option-right {
    margin-left: 107rpx;
  }

  .gender-check {
    width: 28rpx;
    height: 28rpx;
    border: 2rpx solid rgba(212, 212, 213, 1);
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .gender-check-on {
    border-color: rgba(30, 63, 28, 1);
    background-color: rgba(30, 63, 28, 1);
  }

  .gender-check-tick {
    width: 12rpx;
    height: 7rpx;
    border-left: 3rpx solid rgba(255, 254, 250, 1);
    border-bottom: 3rpx solid rgba(255, 254, 250, 1);
    transform: rotate(-45deg);
    margin-top: -2rpx;
  }

  .gender-text {
    flex-shrink: 0;
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: right;
    white-space: nowrap;
    line-height: 40rpx;
    margin-left: 6rpx;
  }

  .row-input-reason {
    flex: 1;
    font-size: 28rpx;
    line-height: 40rpx;
    color: rgba(61, 61, 60, 1);
    text-align: left;
  }

  .placeholder {
    color: rgba(212, 212, 213, 1);
    font-weight: 500;
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
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
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

  .justify-between {
    display: flex;
    justify-content: space-between;
  }

  .justify-center {
    display: flex;
    justify-content: center;
  }

  .justify-between {
    display: flex;
    justify-content: space-between;
  }

  .align-center {
    display: flex;
    align-items: center;
  }

  .idcard-upload-group {
    width: 100%;
    margin-top: 10rpx;
  }

  .idcard-upload-item {
    width: 310rpx;
  }

  .upload-box-inner {
    width: 100%;
    height: 100%;
    background-color: rgba(255, 254, 250, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .upload-img {
    width: 64rpx;
    height: 64rpx;
  }

  .upload-text {
    color: rgba(157, 156, 150, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    line-height: 40rpx;
    margin-top: 12rpx;
  }

  .career-drawer {
    width: 100%;
    background-color: rgba(255, 255, 250, 1);
  }

  .drawer-title {
    color: rgba(0, 0, 0, 0.9);
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    margin: 40rpx 32rpx 32rpx;
  }

  .career-list {
    width: 100%;
    max-height: 60vh;
    padding: 0 32rpx;
    box-sizing: border-box;
  }

  .career-item {
    background-color: rgba(248, 249, 243, 1);
    border-radius: 10rpx;
    width: 100%;
    height: 130rpx;
    padding: 25rpx 24rpx;
    margin-bottom: 24rpx;
    box-sizing: border-box;
  }

  .career-item-label {
    width: 518rpx;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    line-height: 40rpx;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .drawer-footer {
    width: 100%;
    padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    background-color: rgba(255, 255, 250, 1);
    box-shadow: 0rpx -6rpx 10rpx 0rpx rgba(0, 0, 0, 0.02);
  }
</style>
