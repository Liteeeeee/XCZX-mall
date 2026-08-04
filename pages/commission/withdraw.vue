<!-- 分佣提现 -->
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
            <text class="nav-title">提现</text>
          </view>
        </view>
      </view>
      <view
        class="header-placeholder"
        :style="{ paddingTop: sheep.$platform.navbar + 'px' }"
      ></view>

      <su-popup
        :show="state.showRealNameForm"
        type="bottom"
        round="20"
        @close="state.showRealNameForm = false"
        backgroundColor="rgba(255, 255, 250, 1.0)"
      >
        <view class="realname-form flex-col">
          <view class="realname-form-header flex-row align-center justify-between">
            <text class="realname-form-title">请填写真实姓名</text>
            <text class="realname-form-close" @tap="state.showRealNameForm = false">×</text>
          </view>
          <view class="realname-form-body flex-col">
            <view class="realname-form-item">
              <text class="realname-form-label">真实姓名</text>
              <input
                class="realname-form-input"
                v-model="state.realNameInput"
                placeholder="请输入您的真实姓名"
                placeholder-class="realname-placeholder"
              />
            </view>
            <text class="realname-form-tip"
              >真实姓名将作为签约、认证及提现校验的身份依据，请确保与身份证上的姓名保持一致。</text
            >
          </view>
          <view class="realname-form-footer">
            <button class="ss-reset-button apply-btn" @tap="onConfirmRealName">
              <text class="apply-btn-text">确认并继续</text>
            </button>
          </view>
        </view>
      </su-popup>

      <view class="realname-gate-card flex-col" v-if="!state.realNameConfirmed">
        <view class="realname-gate-header flex-row align-center">
          <view class="realname-gate-icon"></view>
          <text class="realname-gate-title">身份信息核验</text>
        </view>
        <text class="realname-gate-subtitle"
          >进入提现流程前，请先填写并校验您的真实姓名，用于签约状态查询与提现身份校验。</text
        >
        <view
          class="realname-gate-display flex-row align-center justify-between"
          v-if="state.realNameInput"
        >
          <text class="realname-gate-label">真实姓名</text>
          <text class="realname-gate-value">{{ state.realNameInput }}</text>
        </view>
        <button class="ss-reset-button apply-btn realname-gate-btn" @tap="onConfirmRealName">
          <text class="apply-btn-text">{{
            state.realNameInput ? '确认并继续' : '填写真实姓名'
          }}</text>
        </button>
      </view>

      <view class="main-content-wrap flex-col" v-if="state.realNameConfirmed">
        <view class="amount-card flex-col">
          <text class="amount-label">提现金额</text>
          <view class="amount-row flex-row align-end">
            <text class="currency">¥</text>
            <input
              class="amount-input"
              v-model="state.priceInput"
              type="digit"
              placeholder="0.00"
              placeholder-class="amount-placeholder"
            />
            <text class="withdraw-all" @tap="onWithdrawAll">全部提现</text>
          </view>
          <view class="divider-line"></view>
          <text class="balance-tip"
            >可提现余额{{ fen2yuan(state.brokerageInfo.brokeragePrice) }}元</text
          >
          <view class="withdraw-fee-row flex-row align-center justify-between">
            <text class="withdraw-audit-tip-text withdraw-service-text">预计手续费</text>
            <text class="withdraw-fee-value">{{ withdrawFeeText }}</text>
          </view>
          <view class="withdraw-fee-row flex-row align-center justify-between">
            <text class="withdraw-audit-tip-text withdraw-service-text">预计到账金额</text>
            <text class="withdraw-fee-value withdraw-arrive">¥{{ withdrawArriveText }}</text>
          </view>
          <view class="withdraw-audit-tip">
            <text class="withdraw-audit-tip-text">{{ withdrawThresholdTip }}</text>
            <text class="withdraw-audit-tip-text">{{ withdrawArrivalTip }}</text>
            <view class="withdraw-service-row flex-row align-center justify-between">
              <text class="withdraw-audit-tip-text withdraw-service-text"
                >如用户无法成功即时提现，请联系客服协助处理</text
              >
              <button class="ss-reset-button withdraw-contact-btn" open-type="contact">
                联系客服
              </button>
            </view>
          </view>
        </view>

        <view class="rules-card flex-col">
          <view class="rules-header flex-row align-center justify-between">
            <text class="rules-title">提现规则</text>
            <text class="rules-subtitle"></text>
          </view>
          <view class="rules-list flex-col">
            <view v-for="(item, idx) in withdrawRuleItems" :key="idx" class="rules-row flex-row">
              <text class="rules-label">{{ item.label }}</text>
              <text class="rules-value">{{ item.value }}</text>
            </view>
            <view
              v-if="state.withdrawConfig?.withdrawDescription"
              class="rules-desc rules-row flex-row"
            >
              <text class="rules-label">提现说明</text>
              <text class="rules-value rules-multiline">{{
                state.withdrawConfig.withdrawDescription
              }}</text>
            </view>
          </view>
        </view>

        <su-fixed bottom placeholder :bgStyles="{ backgroundColor: 'rgba(255, 255, 250, 1.0)' }">
          <view class="bottom-bar flex-col">
            <view class="agreement-box flex-row align-center justify-center">
              <view class="radio-box flex-row align-center" @tap="state.isAgree = !state.isAgree">
                <view class="coupon-check flex-col" :class="state.isAgree ? 'coupon-check-on' : ''">
                  <image
                    v-if="state.isAgree"
                    class="check-icon"
                    :src="sheep.$url.cdn('/mp/static/confirmSelected.png')"
                    mode="aspectFit"
                  ></image>
                </view>
                <text class="agreement-text">我已阅读并同意</text>
              </view>
              <text class="agreement-link" @tap="state.showStatement = true">《提现相关声明》</text>
            </view>
            <button class="ss-reset-button apply-btn" @tap="onConfirm">
              <text class="apply-btn-text">申请提现</text>
            </button>
          </view>
        </su-fixed>
      </view>

      <su-popup
        :show="state.showStatement"
        type="bottom"
        round="20"
        @close="state.showStatement = false"
        showClose
        backgroundColor="rgba(255, 255, 250, 1.0)"
      >
        <view class="statement-modal flex-col">
          <text class="statement-title">提现相关声明</text>
          <scroll-view class="statement-content" scroll-y>
            <view class="statement-text">
              <view class="statement-subtitle">收益说明</view>
              (1)您的粉丝下单付款并完成收货后，您将获得佣金收益;<br />
              (2)当出现取消订单、退货退款、或者因订单异常等情况时，将相应扣除收益，实际根据系统结算为准。<br />
              <view class="statement-subtitle">名词解析</view>
              1.累计推广收益:自您成为平台合伙人之日起至今已经结算的收益合计;<br />
              2.今日付款订单:今天确认付款的订单;<br />
              3.今日预估订单收益:今日所有已付款订单的预估收益;<br />
              4.今日推广商品:今日推广商品次数;<br />
              <view class="statement-subtitle">提现说明</view>
              <view v-for="(line, idx) in withdrawStatementLines" :key="idx">
                {{ idx + 1 }}.{{ line }};<br />
              </view>
            </view>
          </scroll-view>
          <view class="statement-footer flex-col">
            <button
              class="ss-reset-button apply-btn"
              @tap="
                state.isAgree = true;
                state.showStatement = false;
              "
            >
              <text class="apply-btn-text">已阅读并同意</text>
            </button>
          </view>
        </view>
      </su-popup>
    </view>
  </s-layout>
</template>

<script setup>
  import { onBeforeMount, reactive, computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { fen2yuan } from '@/sheep/hooks/useGoods';
  import BrokerageApi from '@/sheep/api/trade/brokerage';
  import BrokerageWithdrawConfigApi from '@/sheep/api/trade/brokerageWithdrawConfig';
  import LinggongApi from '@/sheep/api/trade/linggong';
  import TradeConfigApi from '@/sheep/api/trade/config';

  const WITHDRAW_SUBSCRIBE_TEMPLATE_ID = '9_HMmiB6fKcwt6_FwhZ8l4Q-uvnrkA8MKwRst9Ka-GY';

  const state = reactive({
    isAgree: false,
    showStatement: false,
    priceInput: '',

    brokerageInfo: {},
    withdrawConfig: null,

    frozenDays: 14,
    minPrice: 0,
    maxPrice: 0,
    withdrawDailyTimes: 1,
    withdrawTimeRange: '全天可申请',
    withdrawArrivalTime: '审核通过后1-3个工作日到账',
    withdrawAuditTime: '提交后1-3个工作日完成审核',

    submitting: false,
    pendingWithdrawPayload: null,

    preCheckLoaded: false,
    preCheckPassed: false,
    preCheckData: null,
    preCheckTip: '',
    signStatusLoaded: false,
    signStatusRaw: '',
    signStatus: '',
    signStatusTip: '',

    showRealNameForm: false,
    realNameInput: '',
    realNameConfirmed: false,
    realNameSubmitting: false,
  });

  const withFen2Yuan = (fen) => {
    const n = Number(fen || 0);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Number((n / 100).toFixed(2));
  };

  const currentMinYuan = computed(() => {
    const cfgMin = withFen2Yuan(state.withdrawConfig?.withdrawMinPrice);
    const legacyMin = Number(state.minPrice || 0) || 0;
    if (cfgMin > 0) return cfgMin;
    return legacyMin > 0 ? legacyMin : 200;
  });

  const currentMaxYuan = computed(() => {
    const cfgMax = withFen2Yuan(state.withdrawConfig?.withdrawMaxPrice);
    const legacyMax = Number(state.maxPrice || 0) || 0;
    if (cfgMax > 0) return cfgMax;
    return legacyMax > 0 ? legacyMax : 0;
  });

  const currentFeeRate = computed(() => {
    const n = Number(state.withdrawConfig?.withdrawFeeRate);
    return Number.isFinite(n) && n > 0 ? Number(n.toFixed(4)) : 0;
  });

  const currentApplyTimeRange = computed(() => {
    const cfg = state.withdrawConfig;
    const startStr = cfg
      ? formatTimeArr(cfg.applyStartTime) || formatTimeArr(cfg.withdrawApplyStartTime)
      : '';
    const endStr = cfg
      ? formatTimeArr(cfg.applyEndTime) || formatTimeArr(cfg.withdrawApplyEndTime)
      : '';
    if (startStr && endStr) {
      return `${startStr}-${endStr}`;
    }
    return state.withdrawTimeRange || '全天可申请';
  });

  const currentDailyLimit = computed(() => {
    const n = Number(state.withdrawConfig?.dailyWithdrawLimit);
    if (Number.isFinite(n) && n > 0) return n;
    return Number(state.withdrawDailyTimes || 0) || 1;
  });

  const withdrawFeeText = computed(() => {
    const price = Number(state.priceInput || 0);
    if (!price || price <= 0 || currentFeeRate.value <= 0) return '¥0.00';
    const fee = Number((price * (currentFeeRate.value / 100)).toFixed(2));
    return `¥${fee.toFixed(2)}（${currentFeeRate.value}%）`;
  });

  const withdrawArriveText = computed(() => {
    const price = Number(state.priceInput || 0);
    if (!price || price <= 0) return '0.00';
    const fee =
      currentFeeRate.value > 0 ? Number((price * (currentFeeRate.value / 100)).toFixed(2)) : 0;
    return Math.max(price - fee, 0).toFixed(2);
  });

  const withdrawRuleItems = computed(() => {
    const balanceYuan = fen2yuan(state.brokerageInfo?.brokeragePrice || 0);
    const frozenYuan = fen2yuan(state.brokerageInfo?.frozenPrice || 0);
    const frozenDays = Number(state.frozenDays || 0) || 14;
    const minYuan = currentMinYuan.value;
    const maxYuan = currentMaxYuan.value;
    const rate = currentFeeRate.value;
    const daily = currentDailyLimit.value;
    const timeRange = currentApplyTimeRange.value;
    const auditTime = state.withdrawAuditTime || '提交后1-3个工作日完成审核';
    const arrivalTime = state.withdrawArrivalTime || '审核通过后1-3个工作日到账';

    const list = [
      { label: '可提现额度', value: `${balanceYuan}元` },
      {
        label: '提现门槛',
        value: `账户可提现金额满${minYuan}元后方可申请提现`,
      },
      { label: '冻结收益', value: `${frozenYuan}元` },
      {
        label: '冻结期',
        value: frozenDays > 0 ? `${frozenDays}天（冻结期内收益不可提现）` : '无',
      },
      {
        label: '单笔额度',
        value: `最低${minYuan}元${maxYuan > 0 ? `，最高${maxYuan}元` : ''}`,
      },
    ];
    if (rate > 0) {
      list.push({ label: '提现手续费', value: `${rate}%，具体以实际结算为准` });
    }
    list.push(
      { label: '每日次数', value: daily > 0 ? `${daily}次` : '不限制' },
      { label: '提现时间', value: timeRange },
      { label: '审核时间', value: auditTime },
      { label: '到账时间', value: arrivalTime },
      { label: '到账说明', value: '提现申请提交后进入审核流程，非即时到账' },
      { label: '客服协助', value: '如用户无法成功即时提现，请联系在线客服处理' },
    );
    return list;
  });

  const withdrawThresholdTip = computed(() => {
    const minYuan = currentMinYuan.value;
    return `提现门槛：账户可提现金额满${minYuan}元后方可申请提现。`;
  });

  const withdrawArrivalTip = computed(() => {
    const arrivalTime = state.withdrawArrivalTime || '审核通过后1-3个工作日到账';
    return `到账说明：提现申请提交后需平台审核，非即时到账，通常${arrivalTime}`;
  });

  const withdrawStatementLines = computed(() => {
    const base = withdrawRuleItems.value.map((it) => `${it.label}：${it.value}`);
    const frozenDays = Number(state.frozenDays || 0) || 14;
    const extra = [
      '可提现额度为已结算且非冻结的收益金额，具体以页面展示为准',
      withdrawThresholdTip.value,
      '提现申请提交后需先审核，平台不支持即时提现或即时到账',
      frozenDays > 0
        ? `佣金收益存在${frozenDays}天售后冻结期，冻结期结束后自动解冻`
        : '佣金收益无售后冻结期',
      '如用户无法成功即时提现，请联系在线客服协助处理',
      '同一时间只能申请一笔提现，在审核结束前不能再次申请',
      '已申请提现的金额会从账户余额中扣除，并被冻结',
      '提现失败后，冻结金额会再次计入账户余额中，可重新申请提现',
      '实际审核与到账时间可能受节假日、渠道处理进度影响，请以最终到账为准',
    ].filter(Boolean);
    if (state.withdrawConfig?.withdrawDescription) {
      extra.unshift(state.withdrawConfig.withdrawDescription);
    }
    return base.concat(extra);
  });

  function normalizeWithdrawPrice(value) {
    const n = Number(value);
    if (!n || n <= 0) {
      return 0;
    }
    return n / 100;
  }

  function pickNumber(obj, keys = []) {
    if (!obj) {
      return 0;
    }
    for (const k of keys) {
      const v = obj[k];
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) {
        return n;
      }
    }
    return 0;
  }

  function pickString(obj, keys = []) {
    if (!obj) return '';
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return '';
  }

  function formatTimeArr(arr) {
    if (!Array.isArray(arr) || arr.length < 2) return '';
    const h = String(Number(arr[0] || 0)).padStart(2, '0');
    const m = String(Number(arr[1] || 0)).padStart(2, '0');
    return `${h}:${m}`;
  }

  function pickTimeRange(obj) {
    if (!obj) return '';
    const start =
      pickString(obj, ['withdrawStartTime', 'startTime', 'timeStart', 'withdrawTimeStart']) ||
      formatTimeArr(obj.applyStartTime) ||
      formatTimeArr(obj.withdrawApplyStartTime) ||
      '';
    const end =
      pickString(obj, ['withdrawEndTime', 'endTime', 'timeEnd', 'withdrawTimeEnd']) ||
      formatTimeArr(obj.applyEndTime) ||
      formatTimeArr(obj.withdrawApplyEndTime) ||
      '';
    if (start && end) return `${start}-${end}`;
    return '';
  }

  async function getWithdrawConfig() {
    try {
      const res = await BrokerageWithdrawConfigApi.get('default');
      if (!res) return;
      if (res.code === 0 && res.data) {
        state.withdrawConfig = res.data;
        const cfg = res.data;
        const minRaw = pickNumber(cfg, ['withdrawMinPrice', 'minPrice', 'minWithdrawPrice']);
        const maxRaw = pickNumber(cfg, ['withdrawMaxPrice', 'maxPrice', 'maxWithdrawPrice']);
        state.minPrice = normalizeWithdrawPrice(minRaw);
        state.maxPrice = normalizeWithdrawPrice(maxRaw);
        const dailyLimit = pickNumber(cfg, [
          'dailyWithdrawLimit',
          'withdrawDailyTimes',
          'dailyTimes',
          'dayTimes',
        ]);
        if (dailyLimit > 0) state.withdrawDailyTimes = dailyLimit;
        const timeRange =
          pickString(cfg, ['withdrawTimeRange', 'withdrawTime', 'timeRange', 'availableTime']) ||
          pickTimeRange(cfg);
        if (timeRange) state.withdrawTimeRange = timeRange;
        const auditTime = pickString(cfg, [
          'withdrawAuditTime',
          'auditTime',
          'reviewTime',
          'auditDesc',
        ]);
        if (auditTime) state.withdrawAuditTime = auditTime;
        const arrivalTime = pickString(cfg, [
          'withdrawArrivalTime',
          'arrivalTime',
          'transferTime',
          'arrivalDesc',
        ]);
        if (arrivalTime) state.withdrawArrivalTime = arrivalTime;
        const frozenDaysRaw = pickNumber(cfg, [
          'frozenDays',
          'brokerageFrozenDays',
          'freezeDays',
          'freezePeriodDays',
          '冻结天数',
        ]);
        state.frozenDays = frozenDaysRaw && frozenDaysRaw > 0 ? frozenDaysRaw : 14;
      }
    } catch (e) {}
  }

  function onWithdrawAll() {
    const balance = Number(state.brokerageInfo.brokeragePrice || 0) / 100;
    const maxLimit = currentMaxYuan.value || 0;
    const actualMax = maxLimit > 0 ? Math.min(maxLimit, balance) : balance;
    state.priceInput = String(Number(actualMax || 0).toFixed(2));
  }

  async function validateWithdrawParams() {
    if (!state.isAgree) {
      sheep.$helper.toast('请先阅读并勾选同意提现声明');
      return null;
    }
    const realName = String(state.realNameInput || '').trim();
    if (!realName) {
      sheep.$helper.toast('请先完成真实姓名核验');
      return null;
    }
    const price = Number(state.priceInput || 0);
    const maxPriceAvailable = Number(state.brokerageInfo.brokeragePrice || 0) / 100;
    const minLimit = currentMinYuan.value;
    const maxLimit = currentMaxYuan.value;
    const actualMax = maxLimit > 0 ? Math.min(maxLimit, maxPriceAvailable) : maxPriceAvailable;
    if (!price || price < minLimit) {
      sheep.$helper.toast(`提现金额不得小于${minLimit}元`);
      return null;
    }
    if (price > maxPriceAvailable) {
      sheep.$helper.toast('提现金额不得大于可提现余额');
      return null;
    }
    if (price > actualMax) {
      sheep.$helper.toast(`提现金额不得大于${Number(actualMax).toFixed(2)}元`);
      return null;
    }
    if (WITHDRAW_SUBSCRIBE_TEMPLATE_ID && typeof uni?.requestSubscribeMessage === 'function') {
      try {
        uni.requestSubscribeMessage({
          tmplIds: [WITHDRAW_SUBSCRIBE_TEMPLATE_ID],
          success: () => {},
          fail: () => {},
        });
      } catch (e) {}
    }
    const priceFen = Math.round(price * 100);
    const data = {
      type: 7,
      price: priceFen,
      transferChannelCode: 'linggong',
      userAccount: '',
      userName: realName,
    };
    return data;
  }

  async function doCreateWithdraw(data) {
    let res = await BrokerageApi.createBrokerageWithdraw(data);
    if (!res) {
      sheep.$helper.toast('提现失败：网络异常');
      return false;
    }
    if (res.code !== 0) {
      if (res.msg) {
        sheep.$helper.toast(res.msg);
      } else {
        sheep.$helper.toast('提现失败');
      }
      return false;
    }
    uni.showModal({
      title: '操作成功',
      content: '您的提现申请已成功提交',
      cancelText: '继续提现',
      confirmText: '查看记录',
      success: (res) => {
        if (res.confirm) {
          sheep.$router.go('/pages/commission/wallet', { type: 2 });
          return;
        }
        getBrokerageUser();
        state.priceInput = '';
      },
    });
    return true;
  }

  async function openLinggongWebview() {
    const res = await LinggongApi.getSignUrl({ realName: state.realNameInput });
    if (!res) {
      sheep.$helper.toast('获取签约链接失败：网络异常');
      return false;
    }
    if (res.code !== 0 || !res.data) {
      sheep.$helper.toast(res.msg || '获取签约链接失败');
      return false;
    }
    let url = '';
    let errorMsg = '';
    let successFlag = true;
    if (typeof res.data === 'string') {
      url = res.data;
    } else if (res.data && typeof res.data === 'object') {
      successFlag = res.data.success !== false;
      errorMsg = String(res.data.errorMsg || res.data.errorMessage || res.data.msg || '').trim();
      url =
        res.data.certUrl ||
        res.data.url ||
        res.data.h5Url ||
        res.data.signUrl ||
        res.data.pageUrl ||
        '';
    }
    if (!successFlag || !url) {
      sheep.$helper.toast(errorMsg || '获取签约链接失败');
      return false;
    }
    try {
      if (/^https?:\/\//.test(url)) {
        uni.navigateTo({
          url:
            '/pages/public/webview?url=' +
            encodeURIComponent(url + (url.indexOf('?') > -1 ? '&' : '?') + '_t=' + Date.now()),
          fail() {
            sheep.$router.go(url);
          },
        });
        return true;
      }
    } catch (e) {}
    sheep.$router.go(url);
    return true;
  }

  async function handleSignStatus(status, payload) {
    const S = LinggongApi.Status;
    if (LinggongApi.isSuccessStatus(status)) {
      if (payload) {
        const ok = await doCreateWithdraw(payload);
        if (ok) {
          state.pendingWithdrawPayload = null;
        }
      }
      return;
    }
    if (status === S.NEED_SUBMIT) {
      if (payload) {
        state.pendingWithdrawPayload = payload;
      }
      sheep.$router.go('/pages/commission/linggong-sign-submit');
      return;
    }
    if (status === S.NEED_SIGN) {
      if (payload) {
        state.pendingWithdrawPayload = payload;
      }
      await openLinggongWebview();
      return;
    }
    if (status === S.NEED_CERT) {
      if (payload) {
        state.pendingWithdrawPayload = payload;
      }
      await openLinggongWebview();
      return;
    }
    if (!LinggongApi.isSuccessStatus(status)) {
      sheep.$helper.toast(`当前状态：${status || '未知'}，暂无法提现`);
    }
  }

  async function ensurePreSignFlow(status, payload) {
    const S = LinggongApi.Status;
    if (!status) return false;
    if (status === S.NEED_SUBMIT) {
      if (payload) {
        state.pendingWithdrawPayload = payload;
      }
      try {
        uni.navigateTo({
          url: '/pages/commission/linggong-sign-submit',
          fail() {
            sheep.$helper.toast('跳转资料提交页失败');
          },
        });
      } catch (e) {
        sheep.$router.go('/pages/commission/linggong-sign-submit');
      }
      return true;
    }
    if (status === S.NEED_SIGN) {
      if (payload) {
        state.pendingWithdrawPayload = payload;
      }
      await openLinggongWebview();
      return true;
    }
    if (status === S.NEED_CERT) {
      if (payload) {
        state.pendingWithdrawPayload = payload;
      }
      await openLinggongWebview();
      return true;
    }
    return false;
  }

  async function refreshPreCheck() {
    const preRes = await BrokerageWithdrawConfigApi.prerequisiteCheck();
    if (!preRes) {
      state.preCheckLoaded = true;
      state.preCheckPassed = false;
      state.preCheckTip = '前置检查失败：网络异常';
      return false;
    }
    if (preRes.code !== 0) {
      state.preCheckLoaded = true;
      state.preCheckPassed = false;
      state.preCheckTip = preRes.msg || '提现前置检查失败';
      return false;
    }
    const preData = preRes.data || {};
    const inTime = preData.inTime !== undefined ? !!preData.inTime : true;
    const dailyTimesOk = preData.dailyTimesOk !== undefined ? !!preData.dailyTimesOk : true;
    state.preCheckLoaded = true;
    state.preCheckData = preData;
    if (!dailyTimesOk) {
      state.preCheckPassed = false;
      state.preCheckTip = preData.dailyTimesMsg || '今日提现次数已达上限';
      return false;
    }
    if (!inTime) {
      state.preCheckPassed = false;
      state.preCheckTip =
        preData.timeRangeMsg ||
        (preData.startTime && preData.endTime
          ? `当前不在提现时段内，提现时间：${preData.startTime}-${preData.endTime}`
          : '当前不在提现时段内');
      return false;
    }
    state.preCheckPassed = true;
    state.preCheckTip = '';
    return true;
  }

  async function refreshSignStatus() {
    const statusRes = await LinggongApi.getSignStatus({ realName: state.realNameInput });
    if (!statusRes) {
      state.signStatusLoaded = true;
      state.signStatusRaw = '';
      state.signStatus = '';
      state.signStatusTip = '查询签约状态失败：网络异常';
      return '';
    }
    if (statusRes.code !== 0) {
      state.signStatusLoaded = true;
      state.signStatusRaw = '';
      state.signStatus = '';
      state.signStatusTip = statusRes.msg || '查询签约状态失败';
      return '';
    }
    const raw =
      statusRes.data && typeof statusRes.data === 'object' && statusRes.data.status !== undefined
        ? statusRes.data.status
        : statusRes.data || '';
    const normalized = LinggongApi.normalizeStatus(raw);
    state.signStatusLoaded = true;
    state.signStatusRaw = String(raw);
    state.signStatus = normalized;
    state.signStatusTip = '';
    return normalized;
  }

  async function onConfirmRealName() {
    const realName = String(state.realNameInput || '').trim();
    if (!realName) {
      state.showRealNameForm = true;
      sheep.$helper.toast('请输入真实姓名');
      return;
    }
    if (realName.length < 2 || realName.length > 20) {
      state.showRealNameForm = true;
      sheep.$helper.toast('请填写合法的真实姓名');
      return;
    }
    if (state.realNameSubmitting) return;
    state.realNameSubmitting = true;
    state.showRealNameForm = false;
    uni.showLoading({ title: '处理中...', mask: true });
    try {
      state.realNameConfirmed = true;
      await getWithdrawConfig();
      const preOk = await refreshPreCheck();
      if (!preOk && state.preCheckTip) {
        sheep.$helper.toast(state.preCheckTip);
      }
      const status = await refreshSignStatus();
      if (status) {
        const handled = await ensurePreSignFlow(status, null);
        if (!handled && !LinggongApi.isSuccessStatus(status)) {
          sheep.$helper.toast('当前状态：' + state.signStatusRaw);
        }
      } else if (state.signStatusTip) {
        sheep.$helper.toast(state.signStatusTip);
      }
    } catch (e) {
      state.realNameConfirmed = false;
      sheep.$helper.toast('处理异常，请稍后重试');
    } finally {
      uni.hideLoading();
      state.realNameSubmitting = false;
    }
  }

  async function continuePendingWithdraw() {
    const payload = state.pendingWithdrawPayload;
    if (!payload) return;
    const realName = String(state.realNameInput || '').trim();
    if (!realName) {
      state.realNameConfirmed = false;
      return;
    }
    state.submitting = true;
    uni.showLoading({ title: '处理中...', mask: true });
    try {
      await refreshPreCheck();
      if (!state.preCheckPassed) {
        sheep.$helper.toast(state.preCheckTip || '提现前置校验未通过');
        return;
      }
      const status = await refreshSignStatus();
      if (!status) {
        if (state.signStatusTip) {
          sheep.$helper.toast(state.signStatusTip);
        }
        return;
      }
      await handleSignStatus(status, payload);
    } catch (e) {
      sheep.$helper.toast('处理异常，请稍后重试');
    } finally {
      uni.hideLoading();
      state.submitting = false;
    }
  }

  onShow(async () => {
    if (!state.realNameConfirmed) {
      return;
    }
    await getWithdrawConfig();
    if (state.pendingWithdrawPayload) {
      await continuePendingWithdraw();
      return;
    }
    const preOk = await refreshPreCheck();
    if (!preOk && state.preCheckTip) {
      sheep.$helper.toast(state.preCheckTip);
    }
    const status = await refreshSignStatus();
    if (status) {
      const handled = await ensurePreSignFlow(status, null);
      if (!handled && !LinggongApi.isSuccessStatus(status)) {
        sheep.$helper.toast('当前状态：' + (state.signStatusRaw || status));
      }
    } else if (state.signStatusTip) {
      sheep.$helper.toast(state.signStatusTip);
    }
  });

  // 提交提现
  const onConfirm = async () => {
    if (!state.realNameConfirmed) {
      state.showRealNameForm = true;
      sheep.$helper.toast('请先填写真实姓名');
      return;
    }
    if (state.submitting) return;
    state.submitting = true;
    uni.showLoading({ title: '处理中...', mask: true });
    try {
      const payload = await validateWithdrawParams();
      if (!payload) return;

      if (!state.preCheckLoaded) {
        await refreshPreCheck();
      }
      if (!state.preCheckPassed) {
        sheep.$helper.toast(state.preCheckTip || '提现前置校验未通过');
        return;
      }
      if (!state.signStatusLoaded) {
        await refreshSignStatus();
      }
      if (!state.signStatus && state.signStatusTip) {
        sheep.$helper.toast(state.signStatusTip);
        return;
      }
      await handleSignStatus(state.signStatus, payload);
    } catch (e) {
      sheep.$helper.toast('提现异常，请稍后重试');
    } finally {
      uni.hideLoading();
      state.submitting = false;
    }
  };

  // 获得分销配置 (冻结期等全局交易参数)
  async function getWithdrawRules() {
    const res = await TradeConfigApi.getTradeConfig();
    if (!res || res.code !== 0) {
      return;
    }
    if (res.data) {
      state.frozenDays = Number(res.data.brokerageFrozenDays || 0) || 14;
    }
  }

  // 获得分销信息
  async function getBrokerageUser() {
    const { data, code } = await BrokerageApi.getBrokerageUser();
    if (code === 0) {
      state.brokerageInfo = data;
    }
  }

  onBeforeMount(() => {
    getWithdrawRules();
    getBrokerageUser();
    getWithdrawConfig();
  });
</script>

<style lang="scss" scoped>
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

  .align-center {
    display: flex;
    align-items: center;
  }

  .align-end {
    display: flex;
    align-items: flex-end;
  }

  .page {
    background-color: rgba(248, 249, 243, 1);
    width: 750rpx;
    min-height: 100vh;
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

  .account-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 30rpx;
    width: 680rpx;
    margin: 18rpx 38rpx 0 32rpx;
    padding: 35rpx 24rpx 35rpx 24rpx;
    box-sizing: border-box;
  }

  .realname-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 30rpx;
    width: 680rpx;
    margin: 18rpx 38rpx 0 32rpx;
    padding: 35rpx 24rpx 35rpx 24rpx;
    box-sizing: border-box;
  }

  .account-label {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .realname-input {
    flex: 1;
    text-align: right;
    font-size: 28rpx;
    color: rgba(102, 102, 102, 1);
    margin-left: 20rpx;
  }

  .account-value {
    overflow-wrap: break-word;
    color: rgba(102, 102, 102, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .amount-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 30rpx;
    margin: 24rpx 38rpx 0 32rpx;
    padding: 32rpx 18rpx 28rpx 23rpx;
    box-sizing: border-box;
  }

  .amount-label {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 40rpx;
  }

  .amount-row {
    margin-top: 24rpx;
  }

  .currency {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 58rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    line-height: 81rpx;
  }

  .amount-input {
    overflow-wrap: break-word;
    color: rgba(61, 61, 60, 1);
    font-size: 70rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    line-height: 82rpx;
    height: 82rpx;
    margin-left: 32rpx;
    flex: 1;
    min-width: 0;
  }

  .amount-placeholder {
    color: rgba(157, 156, 150, 1);
    font-size: 70rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
  }

  .withdraw-all {
    overflow-wrap: break-word;
    color: rgba(181, 158, 109, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    line-height: 45rpx;
    margin-left: 24rpx;
  }

  .divider-line {
    width: 639rpx;
    border: 2rpx solid rgba(151, 151, 151, 0.2);
    margin-top: 12rpx;
  }

  .balance-tip {
    overflow-wrap: break-word;
    color: rgba(157, 156, 150, 1);
    font-size: 24rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 33rpx;
    margin-top: 21rpx;
  }

  .withdraw-fee-row {
    padding: 18rpx 0 0 0;
  }

  .withdraw-fee-row + .withdraw-fee-row {
    padding-top: 10rpx;
  }

  .withdraw-fee-value {
    color: rgba(61, 61, 60, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 38rpx;
  }

  .withdraw-arrive {
    color: rgba(30, 63, 28, 1);
    font-size: 28rpx;
    font-family: DINAlternate-Bold;
    font-weight: 700;
  }

  .withdraw-audit-tip {
    margin-top: 16rpx;
    padding: 16rpx 18rpx;
    background: rgba(248, 249, 243, 1);
    border-radius: 20rpx;
  }

  .withdraw-audit-tip-text {
    display: block;
    color: rgba(102, 102, 102, 1);
    font-size: 24rpx;
    line-height: 36rpx;
  }

  .withdraw-audit-tip-text + .withdraw-audit-tip-text {
    margin-top: 6rpx;
  }

  .withdraw-service-row {
    margin-top: 12rpx;
    gap: 16rpx;
  }

  .withdraw-service-text {
    flex: 1;
    white-space: normal;
  }

  .withdraw-contact-btn {
    flex-shrink: 0;
    min-width: 144rpx;
    height: 56rpx;
    padding: 0 20rpx;
    border-radius: 28rpx;
    background: rgba(30, 63, 28, 0.08);
    border: 2rpx solid rgba(30, 63, 28, 0.18);
    color: rgba(30, 63, 28, 1);
    font-size: 24rpx;
    line-height: 56rpx;
    text-align: center;
  }

  .rules-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 30rpx;
    margin: 24rpx 38rpx 0 32rpx;
    padding: 28rpx 24rpx;
    box-sizing: border-box;
    border: 2rpx solid rgba(151, 151, 151, 0.12);
    box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.04);
  }

  .rules-header {
    padding-bottom: 18rpx;
    border-bottom: 2rpx solid rgba(151, 151, 151, 0.12);
  }

  .rules-title {
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 40rpx;
  }

  .rules-subtitle {
    color: rgba(157, 156, 150, 1);
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .rules-list {
    padding-top: 14rpx;
  }

  .rules-row {
    padding: 16rpx 0;
    border-bottom: 2rpx solid rgba(151, 151, 151, 0.1);
  }

  .rules-row:last-child {
    border-bottom: none;
  }

  .rules-label {
    width: 160rpx;
    color: rgba(61, 61, 60, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 40rpx;
    flex-shrink: 0;
  }

  .rules-value {
    flex: 1;
    color: rgba(102, 102, 102, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    line-height: 40rpx;
    overflow-wrap: break-word;
    text-align: right;
  }

  .bottom-bar {
    box-shadow: 0rpx -6rpx 10rpx 0rpx rgba(0, 0, 0, 0.02);
    background-color: rgba(255, 255, 250, 1);
    padding: 24rpx 32rpx 24rpx 32rpx;
  }

  .agreement-box {
    margin-bottom: 24rpx;
    font-size: 24rpx;
  }

  .radio-box {
    cursor: pointer;
  }

  .coupon-check {
    width: 28rpx;
    height: 28rpx;
    border: 2rpx solid rgba(206, 199, 189, 1);
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 1);
    margin-right: 12rpx;
    overflow: hidden;
  }

  .coupon-check-on {
    border-color: transparent;
    background-color: transparent;
  }

  .check-icon {
    width: 100%;
    height: 100%;
  }

  .agreement-text {
    color: rgba(157, 156, 150, 1);
    font-family: PingFangSC-Regular;
  }

  .agreement-link {
    color: rgba(30, 63, 28, 1);
    font-family: PingFangSC-Regular;
    cursor: pointer;
  }

  .statement-modal {
    width: 100%;
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx 20rpx 0 0;
    overflow: hidden;
  }

  .statement-title {
    color: rgba(0, 0, 0, 0.9);
    font-size: 36rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    text-align: center;
    margin: 40rpx 32rpx 32rpx;
  }

  .statement-content {
    width: 100%;
    max-height: 60vh;
    padding: 0 40rpx;
    box-sizing: border-box;
  }

  .statement-text {
    color: rgba(102, 102, 102, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Regular;
    line-height: 48rpx;
    margin-bottom: 40rpx;
  }

  .statement-subtitle {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.9);
    margin-top: 24rpx;
    margin-bottom: 8rpx;
    font-size: 30rpx;
  }

  .statement-subtitle:first-child {
    margin-top: 0;
  }

  .statement-footer {
    width: 100%;
    padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    background-color: rgba(255, 255, 250, 1);
    box-shadow: 0rpx -6rpx 10rpx 0rpx rgba(0, 0, 0, 0.02);
  }

  .apply-btn {
    background-color: rgba(30, 63, 28, 1);
    border-radius: 20rpx;
    border: 2rpx solid rgba(157, 156, 150, 1);
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .apply-btn-text {
    overflow-wrap: break-word;
    color: rgba(255, 254, 250, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Regular;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    line-height: 45rpx;
  }

  .realname-gate-card {
    background-color: rgba(255, 255, 250, 1);
    border-radius: 30rpx;
    margin: 24rpx 38rpx 0 32rpx;
    padding: 36rpx 28rpx 32rpx 28rpx;
    box-sizing: border-box;
    border: 2rpx solid rgba(151, 151, 151, 0.12);
    box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.05);
  }

  .realname-gate-header {
    margin-bottom: 18rpx;
  }

  .realname-gate-icon {
    width: 40rpx;
    height: 40rpx;
    border-radius: 12rpx;
    margin-right: 16rpx;
    background: linear-gradient(135deg, rgba(30, 63, 28, 0.9) 0%, rgba(181, 158, 109, 0.9) 100%);
    position: relative;
  }

  .realname-gate-icon::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 10rpx;
    transform: translateX(-50%);
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background-color: rgba(255, 255, 250, 1);
  }

  .realname-gate-icon::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 22rpx;
    transform: translateX(-50%);
    width: 22rpx;
    height: 10rpx;
    border-radius: 10rpx 10rpx 6rpx 6rpx;
    background-color: rgba(255, 255, 250, 1);
  }

  .realname-gate-title {
    color: rgba(61, 61, 60, 1);
    font-size: 30rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 42rpx;
  }

  .realname-gate-subtitle {
    color: rgba(102, 102, 102, 1);
    font-size: 26rpx;
    font-family: PingFangSC-Regular;
    line-height: 40rpx;
    margin-top: 4rpx;
  }

  .realname-gate-display {
    margin-top: 24rpx;
    padding: 24rpx 26rpx;
    background-color: rgba(248, 249, 243, 1);
    border-radius: 20rpx;
  }

  .realname-gate-label {
    color: rgba(102, 102, 102, 1);
    font-size: 26rpx;
    line-height: 38rpx;
  }

  .realname-gate-value {
    color: rgba(61, 61, 60, 1);
    font-size: 28rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 40rpx;
  }

  .realname-gate-btn {
    margin-top: 28rpx;
  }

  .realname-form {
    width: 100%;
    background-color: rgba(255, 255, 250, 1);
    border-radius: 20rpx 20rpx 0 0;
  }

  .realname-form-header {
    padding: 36rpx 32rpx 18rpx 32rpx;
    border-bottom: 2rpx solid rgba(151, 151, 151, 0.1);
  }

  .realname-form-title {
    flex: 1;
    color: rgba(61, 61, 60, 1);
    font-size: 32rpx;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    line-height: 44rpx;
    text-align: center;
  }

  .realname-form-close {
    width: 44rpx;
    height: 44rpx;
    text-align: center;
    line-height: 40rpx;
    font-size: 40rpx;
    color: rgba(157, 156, 150, 1);
    padding-left: 12rpx;
  }

  .realname-form-body {
    padding: 28rpx 32rpx 20rpx 32rpx;
  }

  .realname-form-item {
    background-color: rgba(248, 249, 243, 1);
    border-radius: 20rpx;
    padding: 22rpx 26rpx;
  }

  .realname-form-label {
    display: block;
    color: rgba(157, 156, 150, 1);
    font-size: 24rpx;
    line-height: 34rpx;
    margin-bottom: 8rpx;
  }

  .realname-form-input {
    color: rgba(61, 61, 60, 1);
    font-size: 32rpx;
    line-height: 46rpx;
    min-height: 46rpx;
    width: 100%;
  }

  .realname-placeholder {
    color: rgba(157, 156, 150, 0.8);
    font-size: 32rpx;
  }

  .realname-form-tip {
    color: rgba(102, 102, 102, 1);
    font-size: 24rpx;
    line-height: 38rpx;
    margin-top: 18rpx;
  }

  .realname-form-footer {
    padding: 18rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
    background-color: rgba(255, 255, 250, 1);
  }

  .main-content-wrap {
    width: 100%;
  }
</style>
