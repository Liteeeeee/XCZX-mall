import request from '@/sheep/request';

const SpuApi = {
  // 获得商品 SPU 列表
  getSpuListByIds: (ids) => {
    return request({
      url: '/product/spu/list-by-ids',
      method: 'GET',
      params: { ids },
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
  // 获得商品结算信息
  getSettlementProduct: (spuIds) => {
    return request({
      url: '/trade/order/settlement-product',
      method: 'GET',
      params: { spuIds },
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
  // 获得商品 SPU 分页
  getSpuPage: (params) => {
    return request({
      url: '/product/spu/page',
      method: 'GET',
      params,
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
  // 获得商品 SKU 分页
  getSkuPage: (params) => {
    return request({
      url: '/product/sku/page',
      method: 'GET',
      params,
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
  // 查询商品
  getSpuDetail: (id) => {
    return request({
      url: '/product/spu/get-detail',
      method: 'GET',
      params: { id },
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
  // 获得商品 SPU 流式分页（游标翻页，双向无缝分类用）
  // params:
  //   categoryId?: number        定位分类：从当前结果集该分类第一条返回；有 cursorId 时忽略
  //   categoryIds?: number[]     分类编号数组（按序，FIELD 排序优先级与范围）
  //   cursorId?: number          当前锚点记录 ID（首次为空）
  //   direction?: 'up' | 'down'  down=向下翻（上滑加载更多）；up=向上翻（下拉逆向加载上一页）
  //   keyword?: string
  //   pageSize: number           必填，1~200
  //   reverse?: boolean          仅后端内部使用，前端不传
  getSpuStream: (params) => {
    return request({
      url: '/product/spu/stream',
      method: 'GET',
      params,
      // luch-request 默认会把数组序列化成 key[]=v（Spring 无法绑定到 List<Long>，导致 400），
      // 这里改为标准重复键格式：categoryIds=86&categoryIds=87&categoryIds=88
      paramsSerializer: (p) => {
        const parts = [];
        Object.keys(p || {}).forEach((k) => {
          const v = p[k];
          if (v === null || typeof v === 'undefined') return;
          const vs = Array.isArray(v) ? v : [v];
          vs.forEach((item) => {
            parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(item));
          });
        });
        return parts.join('&');
      },
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
};
export default SpuApi;
