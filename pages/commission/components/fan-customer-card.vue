<template>
  <view class="customer-row" :class="{ 'with-divider': showDivider }">
    <image class="avatar" :src="sheep.$url.avatar(item?.avatar)" mode="aspectFill" />
    <view class="customer-main">
      <view class="customer-head">
        <text class="customer-name">{{ formatNickname(item?.nickname) }}</text>
        <view v-if="memberLabel" class="member-tag">
          <text class="member-tag-text">{{ memberLabel }}</text>
        </view>
      </view>
      <text class="meta-text">手机号：{{ formatMobile(item) }}</text>
      <text class="meta-text">加入时间：{{ formatDate(getJoinTime(item)) }}</text>
      <text class="meta-text">最后上线：{{ formatDate(getLastOnlineTime(item)) }}</text>
    </view>
    <view v-if="showArchive" class="archive-btn" @tap.stop="emit('archive', item)">
      <text class="archive-text">客户档案</text>
      <uni-icons type="right" size="14" color="#5D7757" />
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed } from 'vue';

  const props = defineProps({
    item: {
      type: Object,
      default: () => ({}),
    },
    showMemberTag: {
      type: Boolean,
      default: false,
    },
    showDivider: {
      type: Boolean,
      default: false,
    },
    showArchive: {
      type: Boolean,
      default: true,
    },
  });

  const emit = defineEmits(['archive']);

  const memberLabel = computed(() => {
    if (!props.showMemberTag) return '';
    const levelText =
      props.item?.levelName ||
      props.item?.memberLevelName ||
      props.item?.userLevelName ||
      props.item?.vipLevelName ||
      '';
    if (!levelText) return '会员客户';
    return String(levelText).includes('会员') ? levelText : `${levelText}会员`;
  });

  function formatNickname(name) {
    const text = String(name || '').trim();
    if (!text) return '未命名用户';
    if (text.length <= 10) return text;
    return `${text.slice(0, 10)}...`;
  }

  function formatMobile(item) {
    const mobile = String(
      item?.mobile || item?.phone || item?.bindMobile || item?.userMobile || item?.maskedMobile || '',
    ).trim();
    if (!mobile) return '--';
    if (mobile.includes('*')) return mobile;
    return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  }

  function getJoinTime(item) {
    return (
      item?.bindUserTime ||
      item?.brokerageTime ||
      item?.joinTime ||
      item?.createTime ||
      item?.createTimeMillis ||
      0
    );
  }

  function getLastOnlineTime(item) {
    return (
      item?.lastOnlineTime ||
      item?.lastLoginTime ||
      item?.lastActiveTime ||
      item?.lastVisitTime ||
      item?.updateTime ||
      0
    );
  }

  function formatDate(value) {
    if (!value) return '--';
    return sheep.$helper.timeFormat(value, 'yyyy.mm.dd');
  }
</script>

<style lang="scss" scoped>
  .customer-row {
    display: flex;
    align-items: center;
    padding: 28rpx 0;
  }

  .with-divider {
    border-bottom: 2rpx solid rgba(24, 37, 19, 0.08);
  }

  .avatar {
    width: 104rpx;
    height: 104rpx;
    border-radius: 52rpx;
    flex-shrink: 0;
  }

  .customer-main {
    flex: 1;
    min-width: 0;
    margin-left: 24rpx;
  }

  .customer-head {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
  }

  .customer-name {
    flex: 1;
    min-width: 0;
    color: #2d2d2d;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
  }

  .member-tag {
    flex-shrink: 0;
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    background: linear-gradient(90deg, #2d3258 0%, #47518d 100%);
  }

  .member-tag-text {
    color: #ffe7a6;
    font-size: 20rpx;
    line-height: 28rpx;
  }

  .meta-text {
    display: block;
    color: #979797;
    font-size: 25rpx;
    line-height: 36rpx;
    margin-top: 4rpx;
  }

  .archive-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: 164rpx;
    height: 66rpx;
    padding: 0 18rpx;
    margin-left: 20rpx;
    border-radius: 999rpx;
    border: 2rpx solid rgba(109, 140, 102, 0.7);
    background: #f8fbf5;
  }

  .archive-text {
    color: #5d7757;
    font-size: 26rpx;
    font-weight: 500;
    line-height: 36rpx;
    margin-right: 4rpx;
  }
</style>
