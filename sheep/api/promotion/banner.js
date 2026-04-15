import request from '@/sheep/request';

const BannerApi = {
  // 获得 banner 列表
  getBannerList: () => {
    return request({
      url: '/promotion/banner/list',
      method: 'GET',
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
};

export default BannerApi;
