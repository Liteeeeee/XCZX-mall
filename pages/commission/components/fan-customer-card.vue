<template>
  <view class="customer-row" :class="{ 'with-divider': showDivider }">
    <image class="avatar" :src="resolveAvatar(item)" mode="aspectFill" />
    <view class="customer-body">
      <view class="customer-main">
        <text class="customer-name">{{
          formatNickname(item?.nickname || item?.customerNickname || item?.userNickname)
        }}</text>
        <text class="meta-text">手机号：{{ formatMobile(item) }}</text>
        <text class="meta-text">加入时间：{{ formatDate(getJoinTime(item)) }}</text>
        <text class="meta-text">最后上线：{{ formatDate(getLastOnlineTime(item)) }}</text>
      </view>
      <view class="customer-side">
        <image
          v-if="memberTagImage"
          class="member-tag-image"
          :src="memberTagImage"
          mode="aspectFit"
        />
        <view v-if="showArchive" class="archive-btn" @tap.stop="emit('archive', item)">
          <text class="archive-text">客户档案</text>
          <uni-icons type="right" size="14" color="#1E3F1C" />
        </view>
      </view>
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

  const memberTagImage = computed(() => {
    if (!props.showMemberTag) return '';
    const level = Number(props.item?.memberLevel || 0);
    const levelMap = {
      1: '/mp/static/智能客户管家/member1.webp',
      2: '/mp/static/智能客户管家/member2.webp',
      3: '/mp/static/智能客户管家/member3.webp',
    };
    if (levelMap[level]) return sheep.$url.cdn(levelMap[level]);
    if (level > 3) return sheep.$url.cdn(levelMap[3]);
    return '';
  });

  function formatNickname(name) {
    const text = String(name || '').trim();
    if (!text) return '未命名用户';
    if (text.length <= 10) return text;
    return `${text.slice(0, 10)}...`;
  }

  function formatMobile(item) {
    const mobile = String(
      item?.mobile ||
        item?.phone ||
        item?.bindMobile ||
        item?.userMobile ||
        item?.maskedMobile ||
        item?.memberMobile ||
        '',
    ).trim();
    if (!mobile) return '--';
    if (mobile.includes('*')) return mobile;
    return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  }

  function resolveAvatar(item) {
    return sheep.$url.avatar(
      item?.avatar ||
        item?.userAvatar ||
        item?.memberAvatar ||
        item?.headImg ||
        item?.headUrl ||
        '',
    );
  }

  function getJoinTime(item) {
    return (
      item?.bindUserTime ||
      item?.brokerageTime ||
      item?.joinTime ||
      item?.registerTime ||
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
    align-items: flex-start;
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

  .customer-body {
    flex: 1;
    min-width: 0;
    margin-left: 24rpx;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 20rpx;
  }

  .customer-main {
    flex: 1;
    min-width: 0;
  }

  .customer-name {
    display: block;
    color: #2d2d2d;
    font-size: 32rpx;
    font-weight: 600;
    line-height: 44rpx;
    margin-bottom: 10rpx;
  }

  .customer-side {
    width: 140rpx;
    min-height: 152rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    flex-shrink: 0;
  }

  .member-tag-image {
    flex-shrink: 0;
    width: 120rpx;
    height: 36rpx;
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
    min-width: 156rpx;
    height: 66rpx;
    padding: 0 18rpx;
    border-radius: 999rpx;
    border: 2rpx solid rgba(109, 140, 102, 0.7);
    background: #f8fbf5;
  }

  .archive-text {
    color: #1e3f1c;
    font-size: 26rpx;
    font-weight: 500;
    line-height: 36rpx;
    margin-right: 4rpx;
  }
</style>
