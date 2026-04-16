<template>
  <view class="progress-card" :style="{ backgroundImage: bgImage }">
    <!-- 上部分：左右两部分 -->
    <view class="progress-header ss-flex ss-row-between ss-col-center">
      <view class="header-left flex-col">
        <!-- 绝对定位的圆弧装饰图 -->
        <image v-if="arcImage" class="arc-img" :src="arcImage" mode="aspectFit"></image>

        <!-- 插入原有的会员名及省钱模块 -->
        <view class="text-group_1 flex-col">
          <text
            class="text_4"
            :style="{ color: props.currentLevel?.mainColor || themeTextColor }"
            >{{ currentLevelName }}</text
          >
          <view style="height: 14rpx"></view>
          <view
            v-if="showSavedMoney"
            class="saved-money-tip"
            :style="{
              color: props.currentLevel?.mainColor || themeTextColor,
              backgroundImage: 'url(' + sheep.$url.static('/static/member/countBg.webp') + ')',
            }"
          >
            <text class="saved-money-text">累计已省{{ totalSavedMoneyText }}元</text>
          </view>
          <text
            v-else
            class="text_5"
            :style="{ color: props.currentLevel?.mainColor || themeTextColor }"
            >健康省钱·专属服务一站式</text
          >
          <view
            class="upgrade-tip"
            :style="{
              marginTop: '40rpx',
              marginBottom: '12rpx',
              fontSize: '24rpx',
              color: inactiveBtnStyle.color,
            }"
            v-if="!isHighestLevel"
          >
            达到1个任意条件升级为<text :style="{ color: nextThemeColor }">{{ nextLevelName }}</text>
          </view>
          <view
            class="upgrade-tip"
            style="margin-top: 40rpx; margin-bottom: 12rpx; font-size: 24rpx; color: #61567d"
            v-else
          >
            您已经升级到最高等级了！
          </view>
        </view>
      </view>
      <view class="header-right">
        <!-- 如果需要展示升级条件，可以移动到这里或者其他合适位置 -->
        <image
          class="badge-icon"
          :src="badgeImage"
          mode="aspectFit"
          v-if="badgeImage"
          style="position: relative; top: 40rpx; right: -40rpx"
        ></image>
        <view class="current-total-box ss-flex ss-col-bottom">
          <text
            class="current-val"
            :style="{ color: valueColor, fontSize: '28rpx', fontWeight: 'bold' }"
            >{{ currentVal }}</text
          >
          <text
            class="total-val"
            :style="{ color: valueColor, fontSize: '28rpx', fontWeight: 'bold' }"
          >
            / {{ totalVal }}</text
          >
        </view>
      </view>
    </view>

    <!-- 下半部分：进度条及交互 -->
    <view class="progress-body">
      <!-- 进度条轨道与节点 -->
      <view class="progress-track-box">
        <view class="progress-track">
          <view
            class="progress-fill"
            :style="{ width: percent + '%', background: themeBgColor }"
          ></view>
        </view>
        <view class="progress-nodes ss-flex ss-row-between">
          <view class="node start-node active" :style="{ background: themeBgColor }"></view>
          <view
            class="node end-node"
            :class="{ active: percent >= 100 }"
            :style="{ background: percent >= 100 ? themeBgColor : '#fff' }"
            v-if="!isHighestLevel"
          ></view>
        </view>
      </view>

      <!-- 节点文案 -->
      <view class="node-labels ss-flex ss-row-between">
        <text :style="{ color: themeTextColor }" class="label-text">{{ currentLevelName }}</text>
        <text :style="{ color: themeTextColor }" class="label-text" v-if="!isHighestLevel">{{
          nextLevelName
        }}</text>
      </view>

      <!-- 底部切换按钮及气泡 -->
      <view class="action-box ss-flex ss-row-between ss-col-bottom">
        <view class="switch-btns ss-flex">
          <view
            class="switch-btn ss-flex ss-col-center ss-row-center"
            :class="{ active: activeTab === 'invite' }"
            :style="{
              background: activeTab === 'invite' ? themeBgColor : inactiveBtnStyle.bg,
              color: activeTab === 'invite' ? '#fff' : inactiveBtnStyle.color,
            }"
            @tap="activeTab = 'invite'"
          >
            <image
              class="icon-box"
              src="https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/yaoqingIcon.png"
              mode="aspectFit"
            ></image>
            <text>邀请会员</text>
          </view>
          <view
            class="switch-btn ss-flex ss-col-center ss-row-center"
            :class="{ active: activeTab === 'consume' }"
            :style="{
              background: activeTab === 'consume' ? themeBgColor : inactiveBtnStyle.bg,
              color: activeTab === 'consume' ? '#fff' : inactiveBtnStyle.color,
            }"
            @tap="activeTab = 'consume'"
          >
            <image
              class="icon-box"
              src="https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/xiaofeiIcon.png"
              mode="aspectFit"
            ></image>
            <text>消费获得</text>
          </view>
        </view>

        <view class="bubble-box">
          <view
            class="bubble ss-flex ss-col-center"
            :style="{
              background: inactiveBtnStyle.bg,
              color: inactiveBtnStyle.color,
              '--bubble-bg': inactiveBtnStyle.bg,
            }"
          >
            <text>{{
              activeTab === 'invite'
                ? `还需邀请${remainInvite}人升级`
                : `还需消费${remainConsume}元升级`
            }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { ref, computed } from 'vue';

  const props = defineProps({
    // 当前用户的成长值/经验值
    experience: {
      type: Number,
      default: 0,
    },
    // 用户的当前等级对象
    currentLevel: {
      type: Object,
      default: () => ({ name: '无会员', experience: 0 }),
    },
    // 用户的下一等级对象
    nextLevel: {
      type: Object,
      default: () => ({ name: '铂金会员', experience: 10000 }),
    },
    // 用户信息，用于计算省钱逻辑
    userInfo: {
      type: Object,
      default: () => ({}),
    },
  });

  // 控制是否显示已省金额逻辑
  const showSavedMoney = computed(() => {
    // 假设判断条件为：用户已登录且累计省钱金额 > 0
    return props.userInfo?.id && Number(props.userInfo?.totalSavedMoney) > 0;
  });

  // 格式化展示已省金额（示例）
  const totalSavedMoneyText = computed(() => {
    return props.userInfo?.totalSavedMoney || '0.00';
  });

  // 判断是否为最高等级（钻石会员）
  const isHighestLevel = computed(() => {
    const levelName = props.currentLevel?.name || '';
    return levelName.includes('钻石');
  });
  // 假设这里体验值等同于消费金额，而邀请人数则为其他逻辑，您可以根据实际业务调整
  const currentVal = computed(() => props.experience);
  const totalVal = computed(() => props.nextLevel?.experience || 10000);

  // 计算进度条百分比（将整体分为 110%：10% 用于左侧留白，100% 用于正常进度）
  const percent = computed(() => {
    if (totalVal.value <= 0) return 100;
    let actualProgress = (currentVal.value / totalVal.value) * 100;
    actualProgress = actualProgress > 100 ? 100 : actualProgress < 0 ? 0 : actualProgress;

    // 整体占 110%，起始点为 10% 的宽度，实际进度占剩下的 100% 宽度（相对于整体的 100/110）
    return 10 + (actualProgress * 100) / 110;
  });

  // 获取当前等级主题字体颜色，由于背景使用渐变，这里仍然保留一个用于字体的纯色值
  const themeTextColor = computed(() => {
    const levelName = props.currentLevel?.name || '';
    if (levelName.includes('钻石')) return '#692196';
    if (levelName.includes('铂金')) return '#8091C5';
    if (levelName.includes('黄金')) return '#D9AF86';
    return '#8490b8'; // 默认回退色
  });

  // 获取会员等级装饰图片(VipArc)
  const arcImage = computed(() => {
    const levelName = props.currentLevel?.name || '';
    console.log('======>', levelName);
    // 这里增加一个判断：如果用户不是会员（等级为空或特定的非会员标识），则使用未开通的图片
    if (!levelName) {
      return 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipArc/weikaitong.png';
    }

    if (levelName.includes('钻石'))
      return 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipArc/bojin.png'; // 根据您的要求，钻石也是 bojin.png
    if (levelName.includes('铂金'))
      return 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipArc/bojin.png';
    if (levelName.includes('黄金'))
      return 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipArc/huangjin.png';

    // 如果存在未匹配到具体名称的情况，也视作未开通或默认情况处理
    return 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipArc/weikaitong.png';
  });
  const valueColor = computed(() => {
    const levelName = props.currentLevel?.name || '';
    if (levelName.includes('钻石')) return '#6E449F';
    if (levelName.includes('铂金')) return '#44579F';
    if (levelName.includes('黄金')) return '#6F3F0F';
    return '#4a567a'; // 默认回退色
  });
  const nextThemeColor = computed(() => {
    const levelName = props.nextLevel?.name || '';
    if (levelName.includes('钻石')) return '#692196';
    if (levelName.includes('铂金')) return '#8091C5';
    if (levelName.includes('黄金')) return '#D9AF86';
    return '#8490b8'; // 默认回退色
  });

  // 获取等级专属徽章图标
  const badgeImage = computed(() => {
    const levelName = props.currentLevel?.name || '';
    if (levelName.includes('钻石'))
      return 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipBadge/zuanshiBadge.png';
    if (levelName.includes('铂金'))
      return 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipBadge/bojinBadge.png';
    if (levelName.includes('黄金'))
      return 'https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/vipBadge/huangjinBadge.png';
    return '';
  });
  const bgImage = computed(() => {
    const levelName = props.currentLevel?.name || '';
    if (levelName.includes('钻石'))
      return 'url("https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/progressBg/zuanshiBg.png")';
    if (levelName.includes('铂金'))
      return 'url("https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/progressBg/bojinBg.png")';
    if (levelName.includes('黄金'))
      return 'url("https://xiancao.oss-cn-beijing.aliyuncs.com/mp/static/progressBg/huangjinBg.png")';
    return 'none'; // 默认无背景图
  });
  const inactiveBtnStyle = computed(() => {
    const levelName = props.currentLevel?.name || '';
    if (levelName.includes('钻石')) return { bg: '#C9A9EC', color: '#79409A' };
    if (levelName.includes('铂金')) return { bg: '#BAD0F7', color: '#3F5497' };
    if (levelName.includes('黄金')) return { bg: '#F7DEBF', color: '#6F3F0F' };
    return { bg: '#d5ddf2', color: '#7b88b2' }; // 默认回退
  });
  // 根据等级名称映射主题色（背景颜色，支持渐变）
  const themeBgColor = computed(() => {
    const levelName = props.currentLevel?.name || '';
    if (levelName.includes('钻石')) return 'linear-gradient(90deg, #7044A2 0%, #6C2CA0 100%)';
    if (levelName.includes('铂金')) return 'linear-gradient(90deg, #778CC3 0%, #455994 100%)';
    if (levelName.includes('黄金')) return 'linear-gradient(90deg, #AB6E2D 0%, #895130 100%)';
    return '#8490b8'; // 默认回退色
  });

  // 等级名称
  const currentLevelName = computed(() => props.currentLevel?.name || '无会员');
  const nextLevelName = computed(() => props.nextLevel?.name || '铂金会员');

  // 剩余差值（为了演示气泡文案，此处提供基础的计算，需根据后端真实规则调整）
  const remainConsume = computed(() => {
    const diff = totalVal.value - currentVal.value;
    return diff > 0 ? diff : 0;
  });
  // 假设每邀请 1 人获得 2500 经验值（模拟数据）
  const remainInvite = computed(() => Math.ceil(remainConsume.value / 2500));

  const activeTab = ref('consume'); // 默认激活消费
</script>

<style lang="scss" scoped>
  .progress-card {
    width: 750rpx;
    height: 670rpx;
    padding: 30rpx 0;
    padding-top: 130rpx;
    box-sizing: border-box;
    /* 背景色/背景图通过内联样式传入 */
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center bottom;
    overflow: visible;
  }

  .text-group_1 {
    width: auto;
    position: relative;
    .text_4 {
      font-size: 52rpx;
      font-family: Kingsoft_Cloud_Font;
      font-weight: 700;
      line-height: 52rpx;
    }
    .text_5 {
      font-size: 24rpx;
      font-family: PingFangSC-Regular;
      font-weight: 400;
      line-height: 24rpx;
    }
    .saved-money-tip {
      display: inline-flex;
      align-items: center;
      padding: 0 16rpx;
      height: 40rpx;
      border-radius: 20rpx;
      background-size: 100% 100%;
      background-repeat: no-repeat;
      .saved-money-text {
        font-size: 20rpx;
        font-family: PingFangSC-Medium;
        font-weight: 500;
      }
    }
  }
  .progress-header {
    margin-bottom: 30rpx;
    padding: 0 40rpx;
    align-items: flex-end; /* 使左右底部对齐 */
    position: relative;
    .header-left {
      display: flex;
      flex-direction: column;
      position: relative;
      .arc-img {
        position: absolute;
        top: -68rpx; /* 可根据需要微调位置 */
        left: -4rpx;
        width: 445rpx;
        height: 50rpx;
        z-index: 0;
      }
      .text-group_1 {
        z-index: 1; /* 确保文字在装饰图之上 */
      }
    }
    .header-right {
      font-size: 28rpx;
      font-weight: bold;
      color: #4a567a;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      .badge-icon {
        width: 276rpx;
        height: 247rpx;
        margin-bottom: 20rpx; /* 可根据需要调整图标与下方文字间距 */
      }
      .total-val {
        font-size: 24rpx;
        color: #8c93a8;
        font-weight: normal;
      }
    }
  }

  .progress-body {
    position: relative;
  }

  .progress-track-box {
    position: relative;
    height: 20rpx;
    display: flex;
    align-items: center;
    padding: 0 0; /* 移除内边距，让轨道填满 */
  }

  .progress-track {
    width: 100%;
    height: 8rpx;
    background-color: #fff;
    border-radius: 4rpx;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    /* background-color 改为内联样式传入 */
    border-radius: 4rpx;
    transition: width 0.3s;
  }

  .progress-nodes {
    position: absolute;
    top: 0;
    left: 0; /* 从头开始布局，首节点定位在 10% 处 */
    right: 0;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .node {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    background-color: #fff;
    border: 4rpx solid #fff;
    box-sizing: border-box;
    z-index: 2;
    position: absolute; /* 改为绝对定位 */
    top: 50%;
    transform: translateY(-50%);

    &.start-node {
      left: calc(10% - 10rpx); /* 定位在 10% 处，减去半径居中 */
    }

    &.end-node {
      right: 75rpx; /* 右侧节点保持偏移向内靠拢 */
    }

    &.active {
      /* 背景色由内联样式决定，这里只保留边框状态 */
      border-color: #fff;
    }
  }

  .node-labels {
    margin-top: 16rpx;
    padding: 0 40rpx;
    position: relative; /* 为绝对定位标签提供参考 */
    height: 30rpx; /* 固定高度防止塌陷 */
    .label-text {
      font-size: 24rpx;
      color: #a4adc1;
      position: absolute;

      &:first-child {
        left: calc(10% - 10rpx); /* 对齐 10% 的进度条节点并减去圆圈半径，与 .start-node 保持一致 */
      }

      &:last-child {
        right: 75rpx; /* 与 .end-node 的 right 保持完全一致 */
      }
    }
  }

  .action-box {
    margin-top: 30rpx;
    padding: 0 40rpx;
  }

  .switch-btns {
    .switch-btn {
      padding: 10rpx 20rpx;
      font-size: 24rpx;
      color: #7b88b2;
      background-color: #d5ddf2;
      border-radius: 8rpx;
      margin-right: 16rpx;
      transition: all 0.3s;

      .icon-box {
        width: 28rpx;
        height: 28rpx;
        margin-right: 8rpx;
      }

      &.active {
        /* color和backgroundColor由内联传入 */
      }
    }
  }

  .bubble-box {
    position: relative;
  }

  .bubble {
    padding: 10rpx 16rpx;
    border-radius: 8rpx;
    font-size: 24rpx;
    display: flex;
    align-items: center;
    position: relative;
    /* 背景色和文字颜色通过内联样式传入 */
  }

  .bubble::before {
    content: '';
    position: absolute;
    top: -12rpx;
    right: 30rpx;
    border-left: 12rpx solid transparent;
    border-right: 12rpx solid transparent;
    /* 边框颜色通过内联样式的 currentColor 继承或者单独处理，此处我们通过内联变量传递 */
    border-bottom: 12rpx solid var(--bubble-bg, #d5ddf2);
  }

  .help-icon {
    display: inline-block;
    width: 26rpx;
    height: 26rpx;
    line-height: 26rpx;
    text-align: center;
    border-radius: 50%;
    border: 2rpx solid currentColor; /* 使用继承的字体颜色 */
    font-size: 18rpx;
    margin-left: 8rpx;
  }
</style>
