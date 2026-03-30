import request from '@/sheep/request';

const MemberLevelApi = {
  getMemberLevelList: () => {
    return request({
      url: '/member/level/list',
      method: 'GET',
      custom: {
        showLoading: false,
      },
    });
  },
  
  // 创建会员开通/升级订单
  activateCreate: (data) => {
    return request({
      url: '/member/level/activate-create',
      method: 'POST',
      data,
      custom: {
        showLoading: true,
      },
    });
  },
};

export default MemberLevelApi;

