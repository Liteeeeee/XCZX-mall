<template>
  <view class="s-member-level-rights-wrapper">
    <!-- 权益区域 -->
    <view class="block_14 flex-col">
      <!-- 会员统计数据 -->
      <view class="member-stats-card flex-row align-center" v-if="isCurrent">
        <view class="stats-item flex-col align-center">
          <text class="stats-title">累计已省金额</text>
          <text class="stats-value">{{ userInfo.totalSavings || '1000.00' }}</text>
        </view>
        <view class="stats-line"></view>
        <view class="stats-item flex-col align-center">
          <text class="stats-title">累计获得积分</text>
          <text class="stats-value">{{ userInfo.totalPoints || '1000' }}</text>
        </view>
      </view>

      <text class="text_8">{{ isUnlocked ? '已解锁' : '待解锁' }}{{ level.rights.length }}项权益</text>
      <view class="section_5 flex-row" v-if="level.rights && level.rights.length > 0">
        <view class="rights-item" v-for="(item, index) in level.rights" :key="index">
          <image class="rights-icon" :src="sheep.$url.static(item.icon)" mode="aspectFit"></image>
          <text class="rights-title">{{ item.title }}</text>
          <text class="rights-desc">{{ item.desc }}</text>
        </view>
      </view>

      <view class="box_89 flex-col" v-if="isUnlocked" :style="upgradeGuideCardStyle">
        <text class="text_64">会员升级攻略{{ '>' }}</text>
        <view class="upgrade-guide-tipbar flex-row align-center">
          <text class="upgrade-guide-tipbar-text">保留原有会员成长值</text>
        </view>
        <view class="box_90 flex-row" v-if="platinumItem">
          <view class="text-wrapper_34 flex-col">
            <text class="paragraph_5">{{ platinumItem.levelTag[0] }}\n{{ platinumItem.levelTag[1] }}</text>
          </view>
          <view class="block_41 flex-col">
            <view class="box_91 flex-row justify-between">
              <text class="text_56">{{ platinumItem.title }}</text>
              <view class="group_107 flex-col">
                <view class="block_42 flex-col">
                  <view class="block_43 flex-col">
                    <view class="box_92 flex-col"></view>
                    <view class="box_93 flex-col"></view>
                  </view>
                </view>
              </view>
            </view>
            <text class="text_57">邀请{{ platinumItem.needInvite }}人成功开通黄金会员</text>
          </view>
          <view class="text-wrapper_35 flex-col" v-if="platinumItem.achieved">
            <text class="text_58">已达成</text>
          </view>
          <view class="text-wrapper_37 flex-col" v-else>
            <text class="text_61">未达条件</text>
          </view>
        </view>
        <view class="box_94 flex-row">
          <view class="box_95 flex-col"></view>
        </view>
        <view class="box_96 flex-row" v-if="diamondItem">
          <view class="text-wrapper_36 flex-col">
            <text class="paragraph_6">{{ diamondItem.levelTag[0] }}\n{{ diamondItem.levelTag[1] }}</text>
          </view>
          <view class="box_97 flex-col">
            <view class="group_108 flex-row justify-between">
              <text class="text_59">{{ diamondItem.title }}</text>
              <view class="section_69 flex-col">
                <view class="group_109 flex-col">
                  <view class="section_70 flex-col">
                    <view class="box_98 flex-col"></view>
                    <view class="box_99 flex-col"></view>
                  </view>
                </view>
              </view>
            </view>
            <text class="text_60">邀请{{ diamondItem.needInvite }}人成功开通黄金会员</text>
            <view class="group_110 flex-col" v-if="!diamondItem.achieved">
              <view class="box_100 flex-col" :style="{ width: diamondItem.progressPercent + '%' }"></view>
            </view>
          </view>
          <view class="text-wrapper_35 flex-col" v-if="diamondItem.achieved">
            <text class="text_58">已达成</text>
          </view>
          <view class="text-wrapper_37 flex-col" v-else>
            <text class="text_61">未达条件</text>
          </view>
        </view>
        
      
      </view>
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { computed } from 'vue';

  const props = defineProps({
    level: {
      type: Object,
      required: true,
      default: () => ({})
    },
    userInfo: {
      type: Object,
      default: () => ({})
    }
  });

  const isCurrent = computed(() => {
    const idByLevel = {
      1: 'golden',
      2: 'platinum',
      3: 'diamond',
    };

    const rawLevel = props.userInfo?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel
        ? rawLevel.level ?? rawLevel.id ?? null
        : rawLevel;
    const normalizedLevel = level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) {
      return idByLevel[normalizedLevel] === props.level.id;
    }
    if (normalizedLevel === 0 || normalizedLevel === null) {
      return props.level.id === 'normal';
    }

    const rawLevelName = props.userInfo?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (!levelName) return props.level.id === 'normal';
    return levelName === props.level.name;
  });

  const currentUserLevel = computed(() => {
    const rawLevel = props.userInfo?.level;
    const level =
      typeof rawLevel === 'object' && rawLevel
        ? rawLevel.level ?? rawLevel.id ?? null
        : rawLevel;
    const normalizedLevel = level === null || level === undefined || level === '' ? null : Number(level);
    if (normalizedLevel === 1 || normalizedLevel === 2 || normalizedLevel === 3) return normalizedLevel;
    if (normalizedLevel === 0 || normalizedLevel === null) return 0;
    const rawLevelName = props.userInfo?.levelName;
    const levelName = typeof rawLevelName === 'string' ? rawLevelName.replace(/\s/g, '') : '';
    if (levelName.includes('钻石')) return 3;
    if (levelName.includes('铂金')) return 2;
    if (levelName.includes('黄金')) return 1;
    return 0;
  });

  const currentCardLevel = computed(() => {
    const id = props.level?.id;
    if (id === 'diamond') return 3;
    if (id === 'platinum') return 2;
    if (id === 'golden') return 1;
    return 0;
  });

  const isUnlocked = computed(() => currentCardLevel.value <= currentUserLevel.value);

  const guideBgUrl = computed(() => {
    const raw = 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipNeo/background.webp';
    if (!raw) return '';
    if (/^https?:\/\//.test(raw)) return raw;
    return raw.startsWith('/') ? raw : `/${raw}`;
  });

  const upgradeGuideCardStyle = computed(() => {
    const rawBg = guideBgUrl.value;
    const bgLayer = (() => {
      if (!rawBg) return '';
      if (/^https?:\/\//.test(rawBg)) return `url(${sheep.$url.cdn(rawBg)})`;
      if (rawBg.startsWith('/static/')) return sheep.$url.css(rawBg, 'local');
      return `url(${rawBg})`;
    })();
    return {
      backgroundImage: bgLayer || 'none',
      backgroundRepeat: bgLayer ? 'no-repeat' : 'no-repeat',
      backgroundSize: bgLayer ? '100% 100%' : 'auto',
      backgroundPosition: bgLayer ? 'center' : 'center',
    };
  });

  const inviteSuccessCount = computed(() => {
    const u = props.userInfo || {};
    const raw =
      u.inviteSuccessCount ??
      u.inviteCount ??
      u.inviteUserCount ??
      u.inviteMemberCount ??
      u.invitedCount ??
      0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  });

  const upgradeGuideItems = computed(() => {
    const invite = inviteSuccessCount.value;
    const tasks = [
      { id: 'platinum', levelTag: ['铂金', '会员'], title: '直升铂金会员', needInvite: 1, targetLevel: 2 },
      { id: 'diamond', levelTag: ['钻石', '会员'], title: '直升钻石会员', needInvite: 3, targetLevel: 3 },
    ];
    return tasks.map((t) => {
      const achieved = currentUserLevel.value >= t.targetLevel || invite >= t.needInvite;
      const ratio = t.needInvite > 0 ? invite / t.needInvite : 0;
      const progressPercent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
      return { ...t, achieved, progressPercent };
    });
  });

  const platinumItem = computed(() => upgradeGuideItems.value.find((item) => item.id === 'platinum'));
  const diamondItem = computed(() => upgradeGuideItems.value.find((item) => item.id === 'diamond'));
</script>

<style lang="scss" scoped>
  .s-member-level-rights-wrapper {
    width: 100%;
    margin-top: -155rpx; // 向上移动以覆盖在卡片下方
    position: relative;
    z-index: 1;
  }

  /* 权益区域样式 */
  .block_14 {
    width: 100%;
    padding: 80rpx 30rpx 20rpx; // 调整顶部内边距，并将下边距设为 20rpx
    box-sizing: border-box;
    background: radial-gradient(circle at 50% -4450rpx, transparent 4485rpx, rgba(248, 249, 243, 1) 400.5rpx);
  }

  /* 会员统计卡片 */
  .member-stats-card {
    width: 100%;
    height: 160rpx;
    background: #FFFFFF;
    border: 1rpx solid #F0F0F0;
    border-radius: 16rpx;
    margin-bottom: 40rpx;
    display: flex;
    flex-direction: row;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
  }

  .stats-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .stats-title {
    font-size: 24rpx;
    color: #999999;
    margin-bottom: 12rpx;
  }

  .stats-value {
    font-size: 36rpx;
    color: #333333;
    font-weight: bold;
    font-family: DIN; // 这种数字通常使用 DIN 字体
  }

  .stats-line {
    width: 1rpx;
    height: 60rpx;
    background: #EEEEEE;
  }

  .text_8 {
    font-size: 28rpx;
    color: rgba(29, 33, 41, 1);
    font-weight: bold;
    margin-bottom: 10rpx;
    padding-left: 10rpx;
  }

  .section_5 {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap; // 允许换行
    padding: 10rpx 0;
  }

  .box_89 {
    background-color: rgba(42, 37, 51, 1);
    border-radius: 20px;
    overflow: hidden;
    align-self: center;
    margin-top: 22rpx;
    width: 690rpx;
    position: relative;
    padding: 207rpx 23rpx 33rpx 23rpx;
    box-sizing: border-box;
  }

  .upgrade-guide-tipbar {
    width: 642rpx;
    height: 48rpx;
    background: #3a3642;
    border-radius: 10rpx;
    border: 1rpx solid rgba(181, 158, 109, 0.2);
    box-sizing: border-box;
    margin: 16rpx 0 16rpx 0;
    padding: 0 18rpx;
  }

  .upgrade-guide-tipbar-text {
    font-size: 22rpx;
    color: rgba(255, 254, 250, 1);
    line-height: 48rpx;
    white-space: nowrap;
  }

  .box_90 {
    width: 100%;
  }

  .text-wrapper_34,
  .text-wrapper_36 {
    background-image: linear-gradient(
      180deg,
      rgba(66, 62, 73, 1) 0,
      rgba(47, 43, 55, 1) 50.1875%,
      rgba(66, 63, 74, 1) 100%
    );
    border-radius: 14px;
    border: 1px solid rgba(181, 158, 109, 0.2);
    padding: 21rpx 16rpx 20rpx 17rpx;
    box-sizing: border-box;
    flex: none;
  }

  .paragraph_5,
  .paragraph_6 {
    background-image: linear-gradient(180deg, rgba(255, 254, 247, 1) 0, rgba(227, 197, 144, 1) 100%);
    height: 62rpx;
    overflow-wrap: break-word;
    font-size: 24rpx;
    font-family: Kingsoft_Cloud_Font;
    font-weight: normal;
    text-align: left;
    line-height: 34rpx;
    white-space: pre-line;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .block_41 {
    margin: 13rpx 0 12rpx 32rpx;
    flex: 1;
    min-width: 0;
  }

  .box_91 {
    width: 221rpx;
    margin: 0 29rpx 0 1rpx;
  }

  .text_56,
  .text_59 {
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 45rpx;
  }

  .group_107,
  .section_69 {
    background-color: rgba(255, 254, 250, 0.3);
    margin: 12rpx 0 9rpx 0;
  }

  .block_42 {
    padding: 1rpx 1rpx 2rpx 2rpx;
  }

  .block_43 {
    padding: 4rpx 10rpx 3rpx 9rpx;
  }

  .box_92,
  .box_98 {
    width: 2rpx;
    height: 11rpx;
    background-color: rgba(255, 254, 250, 1);
  }

  .box_93,
  .box_99 {
    width: 2rpx;
    height: 2rpx;
    margin-top: 2rpx;
    background-color: rgba(255, 254, 250, 1);
  }

  .text_57,
  .text_60 {
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 22rpx;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 30rpx;
    margin-top: 1rpx;
  }

  .text-wrapper_35 {
    background-image: linear-gradient(90deg, rgba(255, 254, 224, 1) 0, rgba(255, 232, 165, 1) 100%);
    border-radius: 100px;
    margin: 21rpx 0 20rpx 38rpx;
    padding: 10rpx 33rpx;
  }

  .text_58,
  .text_61 {
    overflow-wrap: break-word;
    color: rgba(86, 42, 8, 1);
    font-size: 28rpx;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .text-wrapper_37 {
    background-image: linear-gradient(90deg, rgba(255, 254, 224, 0.5) 0, rgba(255, 232, 165, 0.5) 100%);
    border-radius: 100px;
    margin: 21rpx 0 20rpx 38rpx;
    padding: 10rpx 19rpx;
  }

  .box_94 {
    margin: 23rpx 0 0 110rpx;
  }

  .box_95 {
    width: 532rpx;
    height: 1rpx;
    border: 1px solid rgba(151, 151, 151, 0.3);
  }

  .box_96 {
    margin-top: 24rpx;
  }

  .box_97 {
    margin: 6rpx 0 5rpx 32rpx;
    flex: 1;
    min-width: 0;
  }

  .group_108 {
    width: 221rpx;
    margin: 0 121rpx 0 1rpx;
  }

  .group_109 {
    padding: 2rpx 1rpx 1rpx 2rpx;
  }

  .section_70 {
    padding: 3rpx 10rpx 3rpx 9rpx;
  }

  .group_110 {
    background-color: rgba(157, 156, 150, 0.1);
    border-radius: 87px;
    margin-top: 10rpx;
    padding-right: 243rpx;
  }

  .box_100 {
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 87px;
    width: 100rpx;
    height: 4rpx;
  }

  .box_101 {
    margin: 23rpx 0 0 110rpx;
  }

  .group_111 {
    width: 532rpx;
    height: 1rpx;
    border: 1px solid rgba(151, 151, 151, 0.3);
  }

  .box_102 {
    height: 431rpx;
    width: 1130rpx;
    position: absolute;
    left: -304rpx;
    top: -155rpx;
    pointer-events: none;
  }

  .text_62 {
    width: 427rpx;
    height: 243rpx;
    overflow-wrap: break-word;
    color: rgba(235, 108, 1, 0.08);
    font-size: 200rpx;
    font-family: AlibabaPuHuiTiH;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 242rpx;
    margin: 163rpx 715rpx 25rpx -12rpx;
  }

  .box_103 {
    box-shadow: 0px -6px 68px 0px rgba(42, 37, 51, 1);
    height: 139rpx;
    width: 802rpx;
    position: absolute;
    left: 248rpx;
    top: 361rpx;
    padding: 74rpx 80rpx 17rpx 80rpx;
    box-sizing: border-box;
  }

  .box_104 {
    background-color: rgba(58, 54, 66, 1);
    border-radius: 10px;
    position: relative;
    border: 1px solid rgba(181, 158, 109, 0.2);
    padding: 8rpx 385rpx 8rpx 35rpx;
  }

  .text_63 {
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 22rpx;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 30rpx;
  }

  .group_112 {
    background-image: linear-gradient(90deg, rgba(58, 54, 66, 1) 0, rgba(58, 54, 66, 0) 100%);
    border-radius: 10px;
    height: 46rpx;
    width: 56rpx;
    position: absolute;
    left: 1rpx;
    top: 1rpx;
    padding: 11rpx 24rpx 11rpx 8rpx;
  }

  .section_71 {
    background-color: rgba(255, 254, 250, 1);
  }

  .box_105 {
    padding: 2rpx 1rpx 1rpx 2rpx;
  }

  .block_44 {
    padding: 3rpx 10rpx 3rpx 9rpx;
  }

  .box_106 {
    width: 2rpx;
    height: 11rpx;
    background-color: rgba(58, 54, 66, 1);
  }

  .box_107 {
    width: 2rpx;
    height: 2rpx;
    margin-top: 2rpx;
    background-color: rgba(58, 54, 66, 1);
  }

  .box_108 {
    background-image: linear-gradient(180deg, rgba(42, 37, 51, 0) 0, rgba(42, 37, 51, 1) 100%);
    position: absolute;
    left: 56rpx;
    top: -81rpx;
    width: 690rpx;
    height: 165rpx;
    padding: 82rpx 389rpx 41rpx 24rpx;
  }

  .text_64 {
    overflow-wrap: break-word;
    color: rgba(255, 249, 220, 1);
    font-size: 42rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    line-height: 42rpx;
  }

  .group_113 {
    width: 12rpx;
    height: 20rpx;
    margin: 11rpx 0 11rpx 0;
  }

  .rights-item {
    flex: none;
    width: 25%; // 一行四项
    margin-bottom: 30rpx; // 换行后的行间距
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
  }

  .rights-icon {
    width: 80rpx;
    height: 80rpx;
    margin-bottom: 16rpx;
  }

  .rights-title {
    font-size: 24rpx;
    color: #333;
    font-weight: 600;
    margin-bottom: 8rpx;
    white-space: nowrap;
  }

  .rights-desc {
    font-size: 20rpx;
    color: #999;
    text-align: center;
    white-space: nowrap;
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
    align-items: center;
  }
</style>
