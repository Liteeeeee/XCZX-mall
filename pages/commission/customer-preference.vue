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
            <text class="nav-title">消费喜好</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <scroll-view
        scroll-y
        class="page-scroll"
        :style="{ height: `calc(100vh - ${sheep.$platform.navbar}px)` }"
      >
        <view class="page-body">
          <view class="section-block" v-for="section in sections" :key="section.key">
            <text class="section-title">{{ section.title }}</text>
            <view class="tag-grid">
              <view
                v-for="option in section.options"
                :key="`${section.key}-${option.code || option.id || option.name}`"
                class="tag-item"
                :class="{ active: isOptionSelected(section.key, option) }"
                @tap="toggleOption(section.key, option)"
              >
                <text class="tag-text" :class="{ active: isOptionSelected(section.key, option) }">{{
                  option.name
                }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="footer">
        <button class="save-btn" :loading="state.saving" @tap="savePreference">保存</button>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed, reactive } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import {
    getCustomerPreferenceOptions,
    getTagIdentity,
    parseTagSelection,
    resolveSelectedTagOptions,
  } from '@/sheep/api/member/fansTag';

  const state = reactive({
    memberId: 0,
    loading: false,
    saving: false,
    options: {
      clientStatus: [],
      customerPreference: [],
      customerInterest: [],
    },
    form: {
      clientStatus: [],
      customerPreference: [],
      customerInterest: [],
    },
  });

  const sections = computed(() => [
    {
      key: 'clientStatus',
      title: '客户状态',
      options: state.options.clientStatus,
    },
    {
      key: 'customerPreference',
      title: '客户偏好',
      options: state.options.customerPreference,
    },
    {
      key: 'customerInterest',
      title: '客户感兴趣',
      options: state.options.customerInterest,
    },
  ]);

  function isOptionSelected(key, option) {
    const identity = getTagIdentity(option);
    return state.form[key].includes(identity);
  }

  function toggleOption(key, option) {
    const identity = getTagIdentity(option);
    if (!identity) return;
    const selected = new Set(state.form[key]);
    if (selected.has(identity)) {
      selected.delete(identity);
    } else {
      selected.add(identity);
    }
    state.form[key] = Array.from(selected);
  }

  async function loadOptions() {
    if (state.loading) return;
    state.loading = true;
    const options = await getCustomerPreferenceOptions();
    state.loading = false;
    state.options = {
      clientStatus: options.clientStatus || [],
      customerPreference: options.customerPreference || [],
      customerInterest: options.customerInterest || [],
    };
    state.form.clientStatus = resolveSelectedTagOptions(
      state.options.clientStatus,
      state.form.clientStatus,
    ).map((item) => getTagIdentity(item));
    state.form.customerPreference = resolveSelectedTagOptions(
      state.options.customerPreference,
      state.form.customerPreference,
    ).map((item) => getTagIdentity(item));
    state.form.customerInterest = resolveSelectedTagOptions(
      state.options.customerInterest,
      state.form.customerInterest,
    ).map((item) => getTagIdentity(item));
  }

  async function savePreference() {
    if (!state.memberId || state.saving) return;
    state.saving = true;
    const res = await BrokerageApi.updateBrokerageCustomer(
      {
        memberId: state.memberId,
        clientStatus: state.form.clientStatus.join(','),
        customerPreference: state.form.customerPreference.join(','),
        customerInterest: state.form.customerInterest.join(','),
      },
      { showLoading: true },
    );
    state.saving = false;
    if (res?.code !== 0) return;
    sheep.$router.back();
  }

  onLoad((options) => {
    state.memberId = Number(options?.memberId || 0);
    state.form.clientStatus = parseTagSelection(options?.clientStatus);
    state.form.customerPreference = parseTagSelection(options?.customerPreference);
    state.form.customerInterest = parseTagSelection(options?.customerInterest);
    loadOptions();
  });
</script>

<style lang="scss" scoped>
  .page {
    width: 750rpx;
    min-height: 100vh;
    background: #f8f9f3;
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
    padding: 24rpx 22rpx 220rpx;
  }

  .section-block + .section-block {
    margin-top: 56rpx;
  }

  .section-title {
    display: block;
    color: #333333;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 58rpx;
    margin-bottom: 26rpx;
  }

  .tag-grid {
    display: grid;
    grid-template-columns: repeat(3, 190rpx);
    justify-content: space-between;
    gap: 28rpx 38rpx;
  }

  .tag-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 190rpx;
    height: 77rpx;
    border-radius: 4rpx;
    background: #f0f0f0;
    box-sizing: border-box;
  }

  .tag-item.active {
    background: #1e3f1c;
  }

  .tag-text {
    color: #4a4a4a;
    font-size: 28rpx;
    line-height: 40rpx;
    text-align: center;
    word-break: break-all;
  }

  .tag-text.active {
    color: #ffffff;
  }

  .footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 18rpx 22rpx calc(env(safe-area-inset-bottom) + 20rpx);
    background: #f6f7f2;
  }

  .save-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    border: none;
    border-radius: 18rpx;
    background: #1e3f1c;
    color: #ffffff;
    font-size: 32rpx;
    font-weight: 500;
  }

  .save-btn::after {
    border: none;
  }
</style>
