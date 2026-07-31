import request from '@/sheep/request';

const NO_LOAD = { showLoading: false };

const BrokerageWithdrawConfigApi = {
  getBrokerageWithdrawConfig: (code) => {
    return request({
      url: `/trade/brokerage-withdraw-config/get`,
      method: 'GET',
      params: {
        code,
      },
    });
  },

  get: (code = 'default') => {
    return request({
      url: '/trade/brokerage-withdraw-config/get',
      method: 'GET',
      params: { code },
      custom: NO_LOAD,
    });
  },

  prerequisiteCheck: (code = 'default') => {
    return request({
      url: '/trade/brokerage-withdraw-config/prerequisite-check',
      method: 'GET',
      params: { code },
      custom: NO_LOAD,
    });
  },
};

export default BrokerageWithdrawConfigApi;
