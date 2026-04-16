import request from '@/sheep/request';

const DictApi = {
  // 根据字典类型查询字典数据信息
  getDictDataListByType: (dictType) => {
    return request({
      url: `/system/dict-data/type`,
      method: 'GET',
      params: {
        dictType,
        type: dictType,
      },
    });
  },
};

export default DictApi;
