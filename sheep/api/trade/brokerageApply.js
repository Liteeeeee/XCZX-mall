import request from '@/sheep/request';

const BrokerageApplyApi = {
  createApply: (data) => {
    return request({
      url: '/trade/brokerage-apply/create',
      method: 'POST',
      data,
    });
  },
  resubmitApply: (data) => {
    return request({
      url: '/trade/brokerage-apply/resubmit',
      method: 'PUT',
      data,
    });
  },
  getApplyPage: (params) => {
    return request({
      url: '/trade/brokerage-apply/my-page',
      method: 'GET',
      params,
    });
  },
  getApply: () => {
    return request({
      url: '/trade/brokerage-apply/my',
      method: 'GET',
    });
  },
};

export default BrokerageApplyApi;

