import request from '@/sheep/request';

const TradeSummaryApi = {
  getSummary: () => {
    return request({
      url: '/trade/summary/get',
      method: 'GET',
      custom: {
        showLoading: false,
      },
    });
  },
};

export default TradeSummaryApi;
