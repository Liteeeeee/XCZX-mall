import request from '@/sheep/request';

const WordingApi = {
  // 获取当前可用的话术分类列表
  getWordingCategoryList: (custom = {}) => {
    return request({
      url: '/member/wording/category-list',
      method: 'GET',
      custom,
    });
  },
  // 获取话术分页
  getWordingPage: (params, custom = {}) => {
    return request({
      url: '/member/wording/page',
      method: 'GET',
      params,
      custom,
    });
  },
  // 获取话术详情（含参数元数据）
  getWording: (id, custom = {}) => {
    return request({
      url: '/member/wording/get',
      method: 'GET',
      params: { id },
      custom,
    });
  },
  // 批量发送话术
  sendBatchWording: (data, custom = {}) => {
    return request({
      url: '/member/wording/send-batch',
      method: 'POST',
      data,
      custom,
    });
  },
};

export default WordingApi;
