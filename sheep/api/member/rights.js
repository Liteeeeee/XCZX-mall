import request from '@/sheep/request';

const MemberRightsApi = {
  getRightsPage: (params) => {
    return request({
      url: '/member/rights/page',
      method: 'GET',
      params,
      custom: {
        showLoading: false,
      },
    });
  },
  getRightsByLevel: (memberLevelId) => {
    return request({
      url: '/member/rights/list-by-level',
      method: 'GET',
      params: {
        memberLevelId,
      },
      custom: {
        showLoading: false,
      },
    });
  },
  getRights: (id) => {
    return request({
      url: '/member/rights/get',
      method: 'GET',
      params: {
        id,
      },
      custom: {
        showLoading: false,
      },
    });
  },
};

export default MemberRightsApi;
