import request from '@/sheep/request';

const LinggongSignStatus = {
  OK: 'ok',
  NEED_SUBMIT: 'NEED_SUBMIT',
  NEED_SIGN: 'NEED_SIGN',
  NEED_CERT: 'NEED_CERT',
};

function normalizeStatus(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const prefix = s.split('-')[0];
  const key = String(prefix || '').toUpperCase().replace(/_/g, '_');
  const lookup = {
    OK: LinggongSignStatus.OK,
    NEED_SUBMIT: LinggongSignStatus.NEED_SUBMIT,
    NEED_SIGN: LinggongSignStatus.NEED_SIGN,
    NEED_CERT: LinggongSignStatus.NEED_CERT,
  };
  if (key in lookup) return lookup[key];
  const low = String(s || '').toLowerCase();
  if (low === 'ok') return LinggongSignStatus.OK;
  return s;
}

const NO_LOAD = { showLoading: false };

const LinggongApi = {
  Status: LinggongSignStatus,
  normalizeStatus,

  getSignStatus: (data = {}) => {
    return request({
      url: '/trade/linggong/sign/status',
      method: 'POST',
      data,
      custom: NO_LOAD,
    });
  },

  submitSignInfo: (data) => {
    return request({
      url: '/trade/linggong/sign/submit',
      method: 'POST',
      data,
      custom: NO_LOAD,
    });
  },

  getSignUrl: (data = {}) => {
    return request({
      url: '/trade/linggong/sign/url',
      method: 'POST',
      data,
      custom: NO_LOAD,
    });
  },
};

export default LinggongApi;
