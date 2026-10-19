import config from './config';

const CLOSED = Object.freeze({
  healthy: false,
  qcx: false,
  ai: false,
  sms: false,
  miniappAuth: false,
  realName: false,
  payment: false,
  memberFree: false,
});

function request(path) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: config.API_BASE.replace(/\/+$/, '') + '/api/v1' + path,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        const body = res && res.data;
        const httpOk = res && res.statusCode >= 200 && res.statusCode < 300;
        const bizOk = body && (body.code === 0 || body.code === 200);
        if (!httpOk || !bizOk) {
          reject(new Error('capability request failed'));
          return;
        }
        resolve(Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body);
      },
      fail: reject,
    });
  });
}

export async function loadCapabilities() {
  try {
    const [featureResult, memberFreeResult] = await Promise.all([
      request('/cms/feature-flags')
        .then((value) => ({ ok: true, value }))
        .catch(() => ({ ok: false, value: null })),
      request('/member-free/config')
        .then((value) => ({ ok: true, value }))
        .catch(() => ({ ok: false, value: null })),
    ]);
    const items = featureResult.value;
    if (!featureResult.ok || !Array.isArray(items)) {
      return { ...CLOSED };
    }
    const memberFree = memberFreeResult.ok ? memberFreeResult.value : null;
    const usable = (key) => {
      const item = items.find((row) => row && row.key === key);
      return !!(item && item.enabled === true && item.available === true);
    };
    return {
      healthy: true,
      qcx: usable('consult.qcx'),
      ai: usable('ai.consultation'),
      sms: usable('notification.sms'),
      miniappAuth: usable('auth.wechatMiniProgram'),
      realName: usable('auth.tencentRealName'),
      payment: usable('payment.wechat'),
      memberFree: !!(memberFree && memberFree.enabled === true),
    };
  } catch (e) {
    return { ...CLOSED };
  }
}
