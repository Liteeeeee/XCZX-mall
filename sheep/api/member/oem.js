import request from '@/sheep/request';

const OemApi = {
  getHealthConsultLaunchUrl: () => {
    return request({
      url: '/member/oem/launch-url',
      method: 'POST',
      custom: {
        showLoading: true,
        loadingMsg: '加载中',
        showError: true,
        auth: true,
      },
    });
  },
  // 领取激活码
  getActivationCode: () => {
    return request({
      url: '/member/oem/activation-code',
      method: 'POST',
      custom: {
        showLoading: true,
        loadingMsg: '领取中',
        showError: true,
        auth: true,
      },
    });
  },
};

export default OemApi;
