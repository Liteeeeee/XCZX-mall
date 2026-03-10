import request from '@/sheep/request';

const DiyApi = {
  getUsedDiyTemplate: () => {
    return request({
      url: '/promotion/diy-template/used',
      method: 'GET',
      custom: {
        showError: true,
        showLoading: false,
      },
    });
  },
  getDiyTemplate: (id) => {
    return request({
      url: '/promotion/diy-template/get',
      method: 'GET',
      params: {
        id
      },
      custom: {
        showError: true,
        showLoading: false,
      },
    });
  },
  getDiyPage: (id) => {
    return request({
      url: '/promotion/diy-page/get',
      method: 'GET',
      params: {
        id
      }
    });
  },
};

export default DiyApi;
