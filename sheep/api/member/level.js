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
};

export default MemberLevelApi;

