import request from '@/sheep/request';

const BrokerageApi = {
  // 绑定推广员 (基于 promotionId 调用的管理员创建绑定关系接口)
  bindBrokerageUser: (data) => {
    return request({
      url: '/trade/promoter/bind',
      method: 'POST',
      data,
    });
  },
  // 绑定推广员 (基于 shareId 调用的普通分销用户绑定接口)
  bindBrokerageUserByShareId: (data) => {
    return request({
      url: '/trade/brokerage-user/bind',
      method: 'PUT',
      data,
    });
  },
  // 获得个人分销信息
  getBrokerageUser: () => {
    return request({
      url: '/trade/brokerage-user/get',
      method: 'GET',
    });
  },
  // 获得个人分销统计
  getBrokerageUserSummary: (custom = {}) => {
    return request({
      url: '/trade/brokerage-user/get-summary',
      method: 'GET',
      custom,
    });
  },
  // 获取分销员今日统计（订单数、佣金）
  getBrokerageRecordTodayStatistics: () => {
    return request({
      url: '/trade/brokerage-record/today-statistics',
      method: 'GET',
    });
  },
  // 获得分销记录分页
  getBrokerageRecordPage: (params) => {
    if (params.status === undefined) {
      delete params.status;
    }
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-record/page?${queryString}`,
      method: 'GET',
    });
  },
  // 获得分销订单分页（分销员查看自己粉丝下的分销订单）
  getBrokerageRecordOrderPage: (params) => {
    if (params.status === undefined) {
      delete params.status;
    }
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-record/order-page?${queryString}`,
      method: 'GET',
    });
  },
  // 创建分销提现
  createBrokerageWithdraw: (data) => {
    return request({
      url: '/trade/brokerage-withdraw/create',
      method: 'POST',
      data,
    });
  },
  // 获得分销提现分页
  getBrokerageWithdrawPage: (params) => {
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-withdraw/page?${queryString}`,
      method: 'GET',
    });
  },
  // 获得分销提现详情
  getBrokerageWithdraw: (id) => {
    return request({
      url: `/trade/brokerage-withdraw/get`,
      method: 'GET',
      params: { id },
    });
  },
  // 获得商品的分销金额
  getProductBrokeragePrice: (spuId) => {
    return request({
      url: '/trade/brokerage-record/get-product-brokerage-price',
      method: 'GET',
      params: { spuId },
    });
  },
  // 获得分销用户排行（基于佣金）
  getRankByPrice: (params) => {
    const queryString = `times=${params.times[0]}&times=${params.times[1]}`;
    return request({
      url: `/trade/brokerage-user/get-rank-by-price?${queryString}`,
      method: 'GET',
    });
  },
  // 获得分销用户排行分页（基于佣金）
  getBrokerageUserChildSummaryPageByPrice: (params) => {
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-user/rank-page-by-price?${queryString}`,
      method: 'GET',
    });
  },
  // 获得分销用户排行分页（基于用户量）
  getBrokerageUserRankPageByUserCount: (params) => {
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-user/rank-page-by-user-count?${queryString}`,
      method: 'GET',
    });
  },
  // 获得下级分销统计分页
  getBrokerageUserChildSummaryPage: (params) => {
    return request({
      url: '/trade/brokerage-user/child-summary-page',
      method: 'GET',
      params,
    });
  },
  // 获取我的客户档案分页（分销员查看自己的粉丝客户列表）
  getBrokerageCustomerPage: (params, custom = {}) => {
    return request({
      url: '/member/brokerage-customer/page',
      method: 'GET',
      params,
      custom,
    });
  },
  // 获取客户档案详情（初次查询时自动创建，后续直接返回）
  getBrokerageCustomer: (memberId, custom = {}) => {
    return request({
      url: '/member/brokerage-customer/get',
      method: 'GET',
      params: { memberId },
      custom,
    });
  },
  // 编辑客户档案（分销员可编辑部分：客户昵称、生日、状态、偏好、兴趣、备注）
  updateBrokerageCustomer: (data, custom = {}) => {
    return request({
      url: '/member/brokerage-customer/update',
      method: 'PUT',
      data,
      custom: {
        showSuccess: true,
        successMsg: '更新成功',
        ...custom,
      },
    });
  },
  // 获得粉丝分页
  getBrokerageUserFansPage: (params, custom = {}) => {
    return request({
      url: '/trade/brokerage-user/fans-page',
      method: 'GET',
      params,
      custom,
    });
  },
};

export default BrokerageApi;
