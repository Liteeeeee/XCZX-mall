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
};

export default OemApi;
