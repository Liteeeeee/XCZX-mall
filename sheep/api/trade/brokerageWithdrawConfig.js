import request from '@/sheep/request';

const BrokerageWithdrawConfigApi = {
  // 获得佣金提现配置
  getBrokerageWithdrawConfig: (code) => {
    return request({
      url: `/trade/brokerage-withdraw-config/get`,
      method: 'GET',
      params: {
        code,
      },
    });
  },
};

export default BrokerageWithdrawConfigApi;
