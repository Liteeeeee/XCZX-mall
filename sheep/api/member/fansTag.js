import request from '@/sheep/request';

const FansTagApi = {
  // 按动态条件获取可用标签列表（支持 groupId / groupCode / groupName / code / name 组合查询）
  list: (params, custom = {}) => {
    return request({
      url: '/member/fans-tag/list',
      method: 'GET',
      params,
      custom,
    });
  },
  // 获取所有标签组及下属标签（App端使用）
  listWithGroups: (custom = {}) => {
    return request({
      url: '/member/fans-tag/list-with-groups',
      method: 'GET',
      custom,
    });
  },
};

export default FansTagApi;
