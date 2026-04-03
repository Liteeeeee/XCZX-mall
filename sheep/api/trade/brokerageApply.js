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
};

export default BrokerageApplyApi;

