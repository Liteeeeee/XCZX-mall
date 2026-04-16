import request from '@/sheep/request';

const AppProductApi = {
  // 获得推荐商品分页
  getRecommendPage: (params) => {
    return request({
      url: '/app/product/recommend/page',
      method: 'GET',
      params,
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
};

export default AppProductApi;
