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

const CUSTOMER_PREFERENCE_GROUPS = {
  clientStatus: ['客户状态', 'clientStatus', 'CLIENT_STATUS', 'client_status'],
  customerPreference: ['客户偏好', 'customerPreference', 'CUSTOMER_PREFERENCE', 'customer_preference'],
  customerInterest: ['客户感兴趣', 'customerInterest', 'CUSTOMER_INTEREST', 'customer_interest'],
};

function normalizeTagList(list) {
  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      id: item?.id,
      code: item?.code,
      name: String(item?.name || item?.tagName || item?.title || '').trim(),
    }))
    .filter((item) => item.name);
}

export function parseTagSelection(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getTagIdentity(option) {
  return String(option?.code || option?.id || option?.name || '').trim();
}

export function resolveSelectedTagOptions(options, rawValue) {
  const tokens = parseTagSelection(rawValue);
  const normalizedOptions = Array.isArray(options) ? options : [];
  const matched = [];
  const visited = new Set();

  tokens.forEach((token) => {
    const option = normalizedOptions.find((item) => {
      const code = String(item?.code || '').trim();
      const id = String(item?.id || '').trim();
      const name = String(item?.name || '').trim();
      return token === code || token === id || token === name;
    });
    if (!option) return;
    const identity = getTagIdentity(option);
    if (!identity || visited.has(identity)) return;
    visited.add(identity);
    matched.push(option);
  });

  return matched;
}

export function formatSelectedTagNames(options, rawValue, joiner = '、') {
  const matched = resolveSelectedTagOptions(options, rawValue);
  if (matched.length) return matched.map((item) => item.name).join(joiner);
  return parseTagSelection(rawValue).join(joiner);
}

function pickGroup(groups, matchers) {
  return (Array.isArray(groups) ? groups : []).find((group) => {
    const groupCode = String(group?.groupCode || group?.code || '').trim();
    const groupName = String(group?.groupName || group?.name || '').trim();
    return matchers.some((matcher) => matcher === groupCode || matcher === groupName);
  });
}

function normalizeGroupChildren(group) {
  const rawList =
    group?.tags || group?.children || group?.tagList || group?.fansTagList || group?.list || [];
  return normalizeTagList(rawList);
}

export async function getCustomerPreferenceOptions(custom = {}) {
  const [statusRes, preferenceRes, interestRes] = await Promise.all([
    FansTagApi.list({ groupCode: '1002' }, { showLoading: false, showError: false, ...custom }),
    FansTagApi.list({ groupCode: '1003' }, { showLoading: false, showError: false, ...custom }),
    FansTagApi.list({ groupCode: '1004' }, { showLoading: false, showError: false, ...custom }),
  ]);

  const options = {
    clientStatus: normalizeTagList(statusRes?.data),
    customerPreference: normalizeTagList(preferenceRes?.data),
    customerInterest: normalizeTagList(interestRes?.data),
  };

  if (options.clientStatus.length && options.customerPreference.length && options.customerInterest.length) {
    return options;
  }

  const groupsRes = await FansTagApi.listWithGroups({ showLoading: false, showError: false, ...custom });
  const groups = Array.isArray(groupsRes?.data)
    ? groupsRes.data
    : Array.isArray(groupsRes?.data?.list)
    ? groupsRes.data.list
    : Array.isArray(groupsRes?.data?.records)
    ? groupsRes.data.records
    : [];

  if (!options.clientStatus.length) {
    options.clientStatus = normalizeGroupChildren(pickGroup(groups, CUSTOMER_PREFERENCE_GROUPS.clientStatus));
  }
  if (!options.customerPreference.length) {
    options.customerPreference = normalizeGroupChildren(
      pickGroup(groups, CUSTOMER_PREFERENCE_GROUPS.customerPreference),
    );
  }
  if (!options.customerInterest.length) {
    options.customerInterest = normalizeGroupChildren(
      pickGroup(groups, CUSTOMER_PREFERENCE_GROUPS.customerInterest),
    );
  }

  return options;
}

export default FansTagApi;
