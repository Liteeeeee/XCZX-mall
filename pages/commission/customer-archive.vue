<template>
  <s-layout navbar="clear" :bgStyle="{ color: '#F6F7F2' }">
    <view class="page">
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
            class="nav-bar-inner"
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
            <text class="nav-title">客户档案</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <view class="page-body">
        <view class="profile-card">
          <view class="profile-avatar-wrap">
            <image class="profile-avatar" :src="avatarUrl" mode="aspectFill" />
            <image
              v-if="memberTagImage"
              class="profile-member-tag"
              :src="memberTagImage"
              mode="aspectFit"
            />
          </view>
          <view class="profile-main">
            <text class="profile-name"
              >用户昵称：{{ displayTextPlaceholder(detail.userNickname) }}</text
            >
            <text class="profile-sub"
              >客户称呼：{{ displayTextPlaceholder(detail.customerNickname) }}</text
            >
            <text class="profile-sub">手机号：{{ formatMobile(detail.memberMobile) }}</text>
          </view>
        </view>

        <view class="section-card">
          <view class="section-head">
            <image class="section-badge-img" :src="docIcon" mode="aspectFit" />
            <text class="section-title">客户资料</text>
          </view>
          <view class="info-list">
            <view
              class="info-row"
              v-for="(item, index) in basicRows"
              :key="item.label"
              :class="{ 'no-border': index === basicRows.length - 1 }"
            >
              <text class="info-label">{{ item.label }}</text>
              <view
                v-if="item.type === 'text-input'"
                class="picker-trigger"
                @tap="openNicknameEditor"
              >
                <text class="info-value" :class="{ placeholder: item.isPlaceholder }">{{
                  item.value
                }}</text>
                <uni-icons type="right" size="14" color="#C7C7C7" />
              </view>
              <text v-else class="info-value" :class="{ placeholder: item.isPlaceholder }">{{
                item.value
              }}</text>
            </view>
          </view>
        </view>

        <view class="section-card">
          <view class="section-head">
            <image class="section-badge-img" :src="hobbyIcon" mode="aspectFit" />
            <text class="section-title">消费喜好</text>
          </view>
          <view class="preference-card" @tap="goPreferencePage">
            <image class="preference-icon-img" :src="consumeIcon" mode="aspectFit" />
            <view class="preference-main">
              <text class="preference-title">消费喜好</text>
              <text class="preference-desc">编辑客户的消费喜好，方便为您推荐适合的商品</text>
            </view>
            <uni-icons type="right" size="14" color="#4C92FF" />
          </view>
          <view class="info-list">
            <view
              class="info-row"
              v-for="(item, index) in preferenceRows"
              :key="item.label"
              :class="{ 'no-border': index === preferenceRows.length - 1 }"
            >
              <text class="info-label">{{ item.label }}</text>
              <view v-if="item.type === 'remark'" class="picker-trigger" @tap="openRemarkEditor">
                <text class="info-value multiline" :class="{ placeholder: item.isPlaceholder }">{{
                  item.value
                }}</text>
                <uni-icons type="right" size="14" color="#C7C7C7" />
              </view>
              <text
                v-else
                class="info-value multiline"
                :class="{ placeholder: item.isPlaceholder }"
                >{{ item.value }}</text
              >
            </view>
          </view>
        </view>
      </view>
    </view>

    <su-popup
      :show="state.remarkPopup"
      round="20"
      :showClose="false"
      maskBackgroundColor="rgba(0, 0, 0, 0.5)"
      backgroundColor="rgba(255, 255, 255, 1)"
      @close="closeRemarkEditor"
    >
      <view class="remark-modal">
        <view class="remark-header">
          <text class="remark-title">客户备注</text>
          <text class="remark-save" @tap="saveRemark">保存</text>
        </view>
        <textarea
          v-model="state.remarkDraft"
          class="remark-textarea"
          maxlength="200"
          placeholder="请输入"
          placeholder-class="remark-placeholder"
        />
      </view>
    </su-popup>

    <su-popup
      :show="state.nicknamePopup"
      round="20"
      :showClose="false"
      maskBackgroundColor="rgba(0, 0, 0, 0.5)"
      backgroundColor="rgba(255, 255, 255, 1)"
      @close="closeNicknameEditor"
    >
      <view class="remark-modal">
        <view class="remark-header">
          <text class="remark-title">客户称呼</text>
          <text class="remark-save" @tap="saveNickname">保存</text>
        </view>
        <input
          v-model="state.nicknameDraft"
          class="remark-textarea"
          maxlength="20"
          placeholder="请输入客户称呼"
          placeholder-class="remark-placeholder"
        />
      </view>
    </su-popup>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import { formatSelectedTagNames, getCustomerPreferenceOptions } from '@/sheep/api/member/fansTag';

  const state = reactive({
    memberId: 0,
    loading: false,
    tagsLoading: false,
    tagOptions: {
      clientStatus: [],
      customerPreference: [],
      customerInterest: [],
    },
    detail: {
      memberLevel: 0,
    },
    routeSeed: {},
    remarkPopup: false,
    remarkDraft: '',
    nicknamePopup: false,
    nicknameDraft: '',
  });

  const detail = computed(() => state.detail || {});

  const docIcon = computed(() => sheep.$url.cdn('/mp/static/智能客户管家/资料@2x.webp'));
  const hobbyIcon = computed(() => sheep.$url.cdn('/mp/static/智能客户管家/爱好@2x.webp'));
  const consumeIcon = computed(() => sheep.$url.cdn('/mp/static/智能客户管家/消费@2x.webp'));

  const avatarUrl = computed(() => {
    const avatar =
      detail.value?.avatar ||
      detail.value?.userAvatar ||
      detail.value?.memberAvatar ||
      state.routeSeed?.avatar ||
      '';
    return sheep.$url.avatar(avatar);
  });

  const memberTagImage = computed(() => {
    const level = Number(detail.value?.memberLevel || state.routeSeed?.memberLevel || 0);
    const levelMap = {
      1: '/mp/static/智能客户管家/member1.webp',
      2: '/mp/static/智能客户管家/member2.webp',
      3: '/mp/static/智能客户管家/member3.webp',
    };
    if (levelMap[level]) return sheep.$url.cdn(levelMap[level]);
    if (level > 3) return sheep.$url.cdn(levelMap[3]);
    return '';
  });

  const basicRows = computed(() => [
    buildStaticRow('生日', formatDateEmpty(detail.value?.birthday)),
    buildInputRow('客户称呼', String(detail.value?.customerNickname || '').trim()),
    buildRowEmpty('上次登陆日期', formatDateEmpty(detail.value?.lastLoginTime)),
    buildRowEmpty('上次购买日期', formatDateEmpty(detail.value?.lastPurchaseTime)),
    buildRowEmpty('历史消费', formatConsumeTextEmpty(detail.value)),
    buildRowEmpty(
      '加入时间',
      formatDateEmpty(detail.value?.registerTime || detail.value?.createTime),
    ),
  ]);

  const preferenceRows = computed(() => [
    buildTagRow(
      '客户状态',
      state.tagOptions.clientStatus,
      String(detail.value?.clientStatus || '').trim(),
    ),
    buildTagRow(
      '客户偏好',
      state.tagOptions.customerPreference,
      String(detail.value?.customerPreference || '').trim(),
    ),
    buildTagRow(
      '客户感兴趣',
      state.tagOptions.customerInterest,
      String(detail.value?.customerInterest || '').trim(),
    ),
    buildRowEmpty('最后浏览商品', String(detail.value?.lastBrowseProductName || '').trim()),
    buildRemarkRow('客户备注', String(detail.value?.customerRemark || '').trim()),
  ]);

  function buildRowEmpty(label, value) {
    const text = value || '';
    return {
      label,
      value: text,
      isPlaceholder: false,
      type: 'static',
    };
  }

  function buildStaticRow(label, value) {
    const text = value || '未填写';
    return {
      label,
      value: text,
      isPlaceholder: !value,
      type: 'static',
    };
  }

  function buildTagRow(label, options, currentValue) {
    const text = formatSelectedTagNames(options, currentValue);
    return {
      label,
      type: 'static',
      value: text || '',
      isPlaceholder: false,
    };
  }

  function buildRemarkRow(label, value) {
    const text = value || '未填写';
    return {
      label,
      key: 'customerRemark',
      type: 'remark',
      value: text,
      isPlaceholder: text === '未填写',
    };
  }

  function buildInputRow(label, value) {
    const text = value || '未填写';
    return {
      label,
      key: 'customerNickname',
      value: text,
      isPlaceholder: !value,
      type: 'text-input',
    };
  }

  function displayTextPlaceholder(value) {
    const text = String(value || '').trim();
    return text || '未填写';
  }

  function formatDateEmpty(value) {
    if (!value) return '';
    return sheep.$helper.timeFormat(value, 'yyyy-mm-dd');
  }

  function formatMobile(value) {
    const mobile = String(value || '').trim();
    if (!mobile) return '未填写';
    if (mobile.includes('*')) return mobile;
    return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  }

  function formatAmount(value) {
    if (value === null || value === undefined || value === '') return '0.00';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);
    return amount.toFixed(2);
  }

  function formatConsumeText(item) {
    const amount = formatAmount(item?.totalConsumeAmount);
    const count = Number(item?.totalConsumeCount || 0);
    return `￥${amount}${count ? `（${count}次）` : ''}`;
  }

  function formatConsumeTextEmpty(item) {
    if (
      item?.totalConsumeAmount === null ||
      item?.totalConsumeAmount === undefined ||
      item?.totalConsumeAmount === ''
    ) {
      const count = item?.totalConsumeCount;
      if (count === null || count === undefined || count === '' || Number(count) === 0) return '';
    }
    return formatConsumeText(item);
  }

  async function loadTagOptions() {
    if (state.tagsLoading) return;
    if (
      state.tagOptions.clientStatus.length ||
      state.tagOptions.customerPreference.length ||
      state.tagOptions.customerInterest.length
    ) {
      return;
    }
    state.tagsLoading = true;
    const options = await getCustomerPreferenceOptions();
    state.tagsLoading = false;
    state.tagOptions = {
      clientStatus: options.clientStatus || [],
      customerPreference: options.customerPreference || [],
      customerInterest: options.customerInterest || [],
    };
  }

  async function updateArchive(data) {
    if (!state.memberId) return false;
    const res = await BrokerageApi.updateBrokerageCustomer(
      {
        memberId: state.memberId,
        ...data,
      },
      { showLoading: true },
    );
    if (res?.code !== 0) return false;
    state.detail = {
      ...state.detail,
      ...data,
    };
    return true;
  }

  function openRemarkEditor() {
    state.remarkDraft = String(detail.value?.customerRemark || '').trim();
    state.remarkPopup = true;
  }

  function closeRemarkEditor() {
    state.remarkPopup = false;
  }

  async function saveRemark() {
    const text = String(state.remarkDraft || '').trim();
    const ok = await updateArchive({ customerRemark: text });
    if (ok) closeRemarkEditor();
  }

  function openNicknameEditor() {
    state.nicknameDraft = String(detail.value?.customerNickname || '').trim();
    state.nicknamePopup = true;
  }

  function closeNicknameEditor() {
    state.nicknamePopup = false;
  }

  async function saveNickname() {
    const text = String(state.nicknameDraft || '').trim();
    const ok = await updateArchive({ customerNickname: text });
    if (ok) closeNicknameEditor();
  }

  function goPreferencePage() {
    if (!state.memberId) return;
    sheep.$router.go('/pages/commission/customer-preference', {
      memberId: state.memberId,
      clientStatus: detail.value?.clientStatus || '',
      customerPreference: detail.value?.customerPreference || '',
      customerInterest: detail.value?.customerInterest || '',
    });
  }

  async function loadDetail() {
    if (!state.memberId || state.loading) return;
    state.loading = true;
    const res = await BrokerageApi.getBrokerageCustomer(state.memberId, {
      showLoading: true,
    });
    state.loading = false;
    if (res?.code !== 0 || typeof res?.data !== 'object') return;
    state.detail = {
      ...state.routeSeed,
      ...(res.data || {}),
    };
  }

  onLoad((options) => {
    state.memberId = Number(options?.memberId || 0);
    state.routeSeed = {
      avatar: options?.avatar || '',
      memberLevel: Number(options?.memberLevel || 0),
      userNickname: options?.userNickname || '',
      customerNickname: options?.customerNickname || '',
      memberMobile: options?.memberMobile || '',
    };
    state.detail = {
      ...state.detail,
      ...state.routeSeed,
    };
  });

  onShow(() => {
    loadTagOptions();
    loadDetail();
  });
</script>

<style lang="scss" scoped>
  .page {
    width: 750rpx;
    min-height: 100vh;
    background: #f6f7f2;
  }

  .fixed-header {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 10;
    background: #f6f7f2;
  }

  .nav-bar-inner {
    display: flex;
    align-items: center;
  }

  .nav-back {
    margin-left: 34rpx;
  }

  .nav-title {
    margin-left: 14rpx;
    color: #111111;
    font-size: 38rpx;
    font-weight: 600;
    line-height: 54rpx;
  }

  .page-body {
    padding: 18rpx 20rpx 40rpx;
  }

  .profile-card,
  .section-card {
    background: #ffffff;
    border-radius: 18rpx;
    box-shadow: 0 4rpx 18rpx rgba(37, 43, 23, 0.04);
  }

  .profile-card {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;
  }

  .profile-avatar-wrap {
    position: relative;
    width: 110rpx;
    height: 110rpx;
    flex-shrink: 0;
  }

  .profile-avatar {
    width: 110rpx;
    height: 110rpx;
    border-radius: 55rpx;
  }

  .profile-member-tag {
    position: absolute;
    left: 15rpx;
    bottom: -10rpx;
    width: 86rpx;
    height: 30rpx;
  }

  .profile-main {
    flex: 1;
    min-width: 0;
    margin-left: 26rpx;
  }

  .profile-name {
    display: block;
    color: #242424;
    font-size: 34rpx;
    font-weight: 600;
    line-height: 48rpx;
  }

  .profile-sub {
    display: block;
    color: #4a4a4a;
    font-size: 28rpx;
    line-height: 40rpx;
    margin-top: 6rpx;
  }

  .section-card {
    margin-top: 18rpx;
    padding: 22rpx 22rpx 4rpx;
  }

  .section-head {
    display: flex;
    align-items: center;
    margin-bottom: 18rpx;
  }

  .section-badge-img {
    width: 32rpx;
    height: 34rpx;
    margin-right: 12rpx;
    flex-shrink: 0;
  }

  .section-title {
    color: #303030;
    font-size: 34rpx;
    font-weight: 600;
    line-height: 48rpx;
  }

  .info-list {
    width: 100%;
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24rpx;
    padding: 26rpx 0;
    border-bottom: 1rpx solid rgba(32, 40, 20, 0.08);
  }

  .no-border {
    border-bottom: none;
  }

  .info-label {
    flex-shrink: 0;
    color: #2d2d2d;
    font-size: 28rpx;
    line-height: 42rpx;
  }

  .info-value {
    flex: 1;
    color: #2d2d2d;
    font-size: 28rpx;
    line-height: 42rpx;
    text-align: right;
  }

  .picker {
    flex: 1;
  }

  .picker-trigger {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10rpx;
  }

  .multiline {
    white-space: normal;
    word-break: break-all;
  }

  .placeholder {
    color: #c7c7c7;
  }

  .preference-card {
    display: flex;
    align-items: center;
    padding: 18rpx 20rpx;
    margin-bottom: 8rpx;
    border-radius: 16rpx;
    background: linear-gradient(180deg, #f4f7ff 0%, #eef2ff 100%);
  }

  .preference-icon-img {
    width: 48rpx;
    height: 48rpx;
    flex-shrink: 0;
  }

  .preference-main {
    flex: 1;
    min-width: 0;
    margin: 0 18rpx;
  }

  .preference-title {
    display: block;
    color: #323232;
    font-size: 28rpx;
    font-weight: 600;
    line-height: 40rpx;
  }

  .preference-desc {
    display: block;
    color: #b8b8b8;
    font-size: 22rpx;
    line-height: 32rpx;
    margin-top: 4rpx;
  }

  .remark-modal {
    width: 750rpx;
    max-width: 100%;
    padding: 24rpx 24rpx 30rpx;
    box-sizing: border-box;
  }

  .remark-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 18rpx;
  }

  .remark-title {
    color: #111111;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
  }

  .remark-save {
    color: #1e3f1c;
    font-size: 28rpx;
    font-weight: 600;
    line-height: 40rpx;
  }

  .remark-textarea {
    width: 100%;
    min-height: 240rpx;
    padding: 18rpx;
    border-radius: 16rpx;
    background: #f6f7f2;
    color: #2d2d2d;
    font-size: 28rpx;
    line-height: 40rpx;
    box-sizing: border-box;
  }

  .remark-placeholder {
    color: #c7c7c7;
  }
</style>
