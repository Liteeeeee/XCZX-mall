import request from '@/sheep/request';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const PointCouponExchangeApi = {
  getPointCouponExchangePage: (params) => {
    return request({
      url: 'promotion/point-coupon-exchange/page',
      method: 'GET',
      params,
      custom: {
        showLoading: false,
      },
    });
  },
  getPointCouponExchange: (id) => {
    return request({
      url: 'promotion/point-coupon-exchange/get',
      method: 'GET',
      params: { id },
      custom: {
        showLoading: false,
      },
    });
  },
  getPointCouponExchangeRecordPage: (params) => {
    return request({
      url: 'promotion/point-coupon-exchange/record/page',
      method: 'GET',
      params,
      custom: {
        showLoading: false,
        auth: true,
      },
    });
  },
  getPointCouponExchangeRecord: (id) => {
    return request({
      url: 'promotion/point-coupon-exchange/record/get',
      method: 'GET',
      params: { id },
      custom: {
        showLoading: false,
        auth: true,
      },
    });
  },
  exchangeCoupon: (exchangeId, requestNo) => {
    return request({
      url: 'promotion/point-coupon-exchange/exchange',
      method: 'POST',
      data: {
        requestNo: requestNo || uuidv4(),
        exchangeId,
      },
      custom: {
        auth: true,
      },
    });
  },
};

export default PointCouponExchangeApi;
