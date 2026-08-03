---
name: "XCZX-frontend"
description: "仙草甄选商城前端业务 Agent。处理 Uni-app 全栈开发：接口接入、页面开发、佣金分销、商品订单支付等模块的 Bug 修复与功能迭代。Invoke when working on XCZX-mall frontend code."
---

# XCZX-frontend — 仙草甄选前端业务 Agent

## 一、项目概述

**项目名称**：仙草甄选商城（XCZX-mall）
**技术栈**：Uni-app + Vue3 + Pinia + luch-request + SCSS + dayjs
**多端发行**：iOS / Android / H5 / 微信小程序
**API 基础路径**：`/app-api`
**项目根目录**：`/Users/lillee/workspace/XCZX-mall`

---

## 二、核心目录结构

### 2.1 页面目录 `/pages/`

| 目录 | 业务模块 | 关键页面 |
|------|----------|----------|
| `pages/commission/` | **佣金/分销**（重点） | [withdraw.vue](file:///Users/lillee/workspace/XCZX-mall/pages/commission/withdraw.vue)、[index.vue](file:///Users/lillee/workspace/XCZX-mall/pages/commission/index.vue)、[apply.vue](file:///Users/lillee/workspace/XCZX-mall/pages/commission/apply.vue)、[linggong-sign-submit.vue](file:///Users/lillee/workspace/XCZX-mall/pages/commission/linggong-sign-submit.vue)、[wallet.vue](file:///Users/lillee/workspace/XCZX-mall/pages/commission/wallet.vue)、[order.vue](file:///Users/lillee/workspace/XCZX-mall/pages/commission/order.vue) |
| `pages/goods/` | 商品 | [index.vue](file:///Users/lillee/workspace/XCZX-mall/pages/goods/index.vue)、[list.vue](file:///Users/lillee/workspace/XCZX-mall/pages/goods/list.vue)、[seckill.vue](file:///Users/lillee/workspace/XCZX-mall/pages/goods/seckill.vue)、[groupon.vue](file:///Users/lillee/workspace/XCZX-mall/pages/goods/groupon.vue) |
| `pages/order/` | 订单 | [confirm.vue](file:///Users/lillee/workspace/XCZX-mall/pages/order/confirm.vue)、[detail.vue](file:///Users/lillee/workspace/XCZX-mall/pages/order/detail.vue)、[list.vue](file:///Users/lillee/workspace/XCZX-mall/pages/order/list.vue) |
| `pages/index/` | 首页/基础 | [index.vue](file:///Users/lillee/workspace/XCZX-mall/pages/index/index.vue)、[cart.vue](file:///Users/lillee/workspace/XCZX-mall/pages/index/cart.vue)、[user.vue](file:///Users/lillee/workspace/XCZX-mall/pages/index/user.vue)、[login.vue](file:///Users/lillee/workspace/XCZX-mall/pages/index/login.vue)、[member.vue](file:///Users/lillee/workspace/XCZX-mall/pages/index/member.vue) |
| `pages/pay/` | 支付 | [index.vue](file:///Users/lillee/workspace/XCZX-mall/pages/pay/index.vue)、[result.vue](file:///Users/lillee/workspace/XCZX-mall/pages/pay/result.vue)、[recharge.vue](file:///Users/lillee/workspace/XCZX-mall/pages/pay/recharge.vue) |
| `pages/user/` | 用户中心 | [info.vue](file:///Users/lillee/workspace/XCZX-mall/pages/user/info.vue)、[address/list.vue](file:///Users/lillee/workspace/XCZX-mall/pages/user/address/list.vue) |
| `pages/activity/` | 营销活动 | `groupon/`（团购）、`seckill/`（秒杀）、`point/`（积分） |
| `pages/coupon/` | 优惠券 | [list.vue](file:///Users/lillee/workspace/XCZX-mall/pages/coupon/list.vue)、[detail.vue](file:///Users/lillee/workspace/XCZX-mall/pages/coupon/detail.vue) |
| `pages/chat/` | 客服聊天 | [index.vue](file:///Users/lillee/workspace/XCZX-mall/pages/chat/index.vue) |

### 2.2 核心框架目录 `/sheep/`

#### `/sheep/api/` — API 接口封装（按业务分模块）

| 模块目录 | 职责 | 关键文件 |
|----------|------|----------|
| `api/trade/` | **交易核心**（重点） | [brokerageWithdrawConfig.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/trade/brokerageWithdrawConfig.js)（提现配置）、[brokerage.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/trade/brokerage.js)（佣金）、[brokerageApply.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/trade/brokerageApply.js)（分佣申请）、[linggong.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/trade/linggong.js)（灵工签约）、[order.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/trade/order.js)（订单）、[cart.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/trade/cart.js)（购物车）、[config.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/trade/config.js)（交易配置） |
| `api/member/` | 会员用户 | [auth.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/member/auth.js)（认证登录）、[user.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/member/user.js)（用户信息）、[address.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/member/address.js)、[point.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/member/point.js)（积分）、[signin.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/member/signin.js)（签到）、[wording.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/member/wording.js)（话术资源） |
| `api/pay/` | 支付钱包 | [wallet.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/pay/wallet.js)、[order.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/pay/order.js)、[transfer.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/pay/transfer.js)、[channel.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/pay/channel.js) |
| `api/product/` | 商品类目 | [spu.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/product/spu.js)、[category.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/product/category.js)、[comment.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/product/comment.js)、[favorite.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/product/favorite.js)（收藏）、[history.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/product/history.js)（浏览历史） |
| `api/promotion/` | 营销活动 | [coupon.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/promotion/coupon.js)、[activity.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/promotion/activity.js)、[seckill.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/promotion/seckill.js)、[combination.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/promotion/combination.js)（拼团/组合）、[diy.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/promotion/diy.js)（店铺装修）、[point.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/promotion/point.js)（积分商城）、[banner.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/promotion/banner.js) |
| `api/infra/` | 基础设施 | [file.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/infra/file.js)（文件上传）、[tenant.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/infra/tenant.js) |
| `api/system/` | 系统字典 | [area.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/system/area.js)（省市区）、[dict.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/system/dict.js) |

**API 入口**：[sheep/api/index.js](file:///Users/lillee/workspace/XCZX-mall/sheep/api/index.js)

#### `/sheep/request/` — 网络请求封装

- **请求库**：`luch-request`（基于 Promise）
- **核心文件**：[sheep/request/index.js](file:///Users/lillee/workspace/XCZX-mall/sheep/request/index.js)
- **关键机制**：
  - 请求拦截器：自动注入 `Authorization`、`terminal`、`tenant-id`、`X-Trace-Id`
  - 响应拦截器：处理 401 刷新 Token、code !== 0 错误提示、Loading 管理
  - **错误返回**：4xx/5xx 时拦截器返回 `false`（非 Promise.reject），调用方必须判空
  - 支持自定义选项：`showLoading`、`showError`、`auth`（是否需要登录）、`isToken`（是否传 Token）

#### `/sheep/store/` — Pinia 状态管理

| Store | 文件 | 职责 |
|-------|------|------|
| `user` | [user.js](file:///Users/lillee/workspace/XCZX-mall/sheep/store/user.js) | 用户信息、钱包、登录态、Token 管理、资产统计（订单/优惠券数量） |
| `app` | [app.js](file:///Users/lillee/workspace/XCZX-mall/sheep/store/app.js) | 应用初始化、平台检测、全局配置 |
| `cart` | [cart.js](file:///Users/lillee/workspace/XCZX-mall/sheep/store/cart.js) | 购物车状态、SKU 选择、价格计算 |
| `sys` | sys.js | 系统级配置 |
| `modal` | modal.js | 弹窗队列管理 |

#### `/sheep/components/` — 业务组件库（s-* 前缀）

常用组件：`s-custom-navbar`、`s-goods-card`、`s-goods-item`、`s-coupon-card`、`s-order-card`、`s-empty`、`s-select-sku`、`s-share-modal`、`s-wallet-card`、`s-member-level-card`、`s-user-card`、`s-search-block`、`s-image-banner`、`s-layout`、`s-uploader`、`s-auth-modal`（授权登录弹窗）

#### `/sheep/ui/` — 基础 UI 组件（su-* 前缀）

常用组件：`su-navbar`、`su-inner-navbar`、`su-status-bar`、`su-popup`、`su-dialog`、`su-tabs` / `su-tabs-item`、`su-tabbar`、`su-notice-bar`、`su-swiper`、`su-image`、`su-region-picker`、`su-datetime-picker`（通过 uni_modules 引入）、`su-data-checkbox`、`su-radio`、`su-switch`、`su-progress`、`su-time-line`、`su-sticky`、`su-number-box`、`su-toolbar`

#### `/sheep/helper/` — 工具函数

| 文件 | 功能 |
|------|------|
| [helper/index.js](file:///Users/lillee/workspace/XCZX-mall/sheep/helper/index.js) | 通用工具（金额格式化、fen2yuan 等） |
| [helper/digit.js](file:///Users/lillee/workspace/XCZX-mall/sheep/helper/digit.js) | 高精度数字运算（避免浮点误差） |
| [helper/tools.js](file:///Users/lillee/workspace/XCZX-mall/sheep/helper/tools.js) | 业务工具函数 |
| [helper/const.js](file:///Users/lillee/workspace/XCZX-mall/sheep/helper/const.js) | 常量定义（终端类型 getTerminal 等） |
| [helper/throttle.js](file:///Users/lillee/workspace/XCZX-mall/sheep/helper/throttle.js) | 节流/防抖 |

#### 其他核心目录

| 目录 | 说明 |
|------|------|
| `/sheep/config/` | 配置：[index.js](file:///Users/lillee/workspace/XCZX-mall/sheep/config/index.js)（baseUrl / apiPath / tenantId 从 .env 读取）、zIndex.js（组件层级管理） |
| `/sheep/router/` | 路由跳转：`sheep.$router.go()`，**存在 500ms 全局节流锁** |
| `/sheep/platform/` | 多端适配（微信/支付宝/Apple 的 provider）、支付、分享能力 |
| `/sheep/scss/` | 全局样式变量 `_var.scss`、主题（light/dark）、通用 class 工具集 |
| `/sheep/hooks/` | 组合式函数：`useGoods.js`（商品逻辑）、`useModal.js`（弹窗控制 showAuthModal 等） |
| `/sheep/validate/` | 表单校验：[form.js](file:///Users/lillee/workspace/XCZX-mall/sheep/validate/form.js) |
| `/sheep/url/` | URL 工具函数 |

---

## 三、工程约定（MANDATORY）

### 3.1 代码规范

1. **生命周期钩子**：必须从 `@dcloudio/uni-app` 引入，如 `import { onLoad, onShow } from '@dcloudio/uni-app'`
2. **接口结果判空**：**必须**进行布尔值判空。因 luch-request 拦截器在 4xx/5xx 时返回 `false`
   ```js
   // 正确写法
   const res = await SomeApi.getList();
   if (!res || res.code !== 0) return;
   const data = res.data;
   ```
3. **金额单位**：后端返回分（fen），前端展示需转元（yuan），使用 `fen2yuan()` 工具函数
4. **路由跳转**：使用 `sheep.$router.go(path)`，注意 500ms 全局节流可能导致快速连续点击失效
5. **全局对象访问**：`sheep.$api` / `sheep.$store` / `sheep.$router` / `sheep.$helper` / `sheep.$zIndex` / `sheep.$platform`，入口见 [sheep/index.js](file:///Users/lillee/workspace/XCZX-mall/sheep/index.js)

### 3.2 佣金/分销模块硬约束

**提现页面 `withdraw.vue` 标准流程**：
1. 进入页面 → 先核验真实姓名（弹窗 or 卡片收集）
2. 用户确认姓名后 → 并行调用：
   - `brokerageWithdrawConfig.prerequisiteCheck(code='default')` — 前置条件核验
   - `linggong.sign/status` 或同类签约状态接口
3. 根据返回状态进行页面分流（未签约 / 已签约 / 待审核 / 审核驳回等）

**关键 API 约束**：
- `prerequisite-check` 接口 **必填** query 参数 `code`，默认值为 `'default'`
- `getBrokerageWithdrawConfig` / `get` 通常也需传 `code='default'`
- 每日提现次数：优先使用 `dailyWithdrawLimit` 字段，而非其他类似字段

### 3.3 数据格式处理规范

**后端状态字符串标准化**：
后端可能返回带描述后缀的状态码，如 `"NEED_SUBMIT-需提交资料"`，**逻辑判断前必须先标准化**：
```js
const normalizeStatus = (raw) => (raw || '').split('-')[0].trim();
const status = normalizeStatus(res.data.status);
if (status === 'NEED_SUBMIT') { ... }
```

**时间数组格式化**：
后端返回时间字段可能是 `[HH, MM]` 格式的数组（如 `applyStartTime: [10, 0]`、`applyEndTime: [18, 30]`），**严禁直接拼接**（会导致 `"10,0-18,30"` 错误格式），必须使用补零格式化函数：
```js
function formatTimeArr(arr) {
  if (!Array.isArray(arr) || arr.length < 2) return '';
  const [h, m] = arr;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
// 正确输出 "10:00-18:30"
const timeRange = `${formatTimeArr(applyStartTime)}-${formatTimeArr(applyEndTime)}`;
```

---

## 四、用户工作流偏好

### 4.1 开发风格

- **小步增量修改**：优先精准定位 + 小范围改动，**反对大范围重写**
- **先方案后执行**：复杂任务先输出方案说明（含文件路径、行号），用户确认后再改代码
- **响应风格**：简洁直接，重点说明核心变更点
- **错误反馈**：输出错误时直接指出，不绕弯子

### 4.2 UI/UX 还原标准

- **像素级 1:1 还原**：对 z-index 层级、定位、边距、圆角有严格要求，对齐设计稿
- **视觉效果**：倾向毛玻璃（backdrop-filter）、卡片式分层、精致阴影
- **资源使用**：**禁止使用 base64 内嵌图片**，必须在源码中引用本地图片文件
- **细节要求**：按钮高度/圆角、间距（8px 栅格）、字号、字重均需精准
- **文案规范**：全站文案、金额格式、日期格式统一严谨

### 4.3 代码引用格式

所有文件、目录、函数引用 **必须** 使用可点击的绝对链接格式：
```
[display_name](file:///absolute/path/to/file#L<start>-L<end>)
```
示例：[withdraw.vue#L1-L150](file:///Users/lillee/workspace/XCZX-mall/pages/commission/withdraw.vue#L1-L150)

---

## 五、典型任务 SOP

### SOP 1：接入新接口

1. 在对应模块目录创建/修改 API 文件：`/sheep/api/<模块>/<业务>.js`
2. 参考已有 API 写法：导入 request → 定义方法对象 → default export
3. 根据需求设置 `custom: { showLoading, showError, auth }` 选项
4. 在页面中通过 `sheep.$api.<模块>.<业务>.<方法名>()` 调用
5. **必须**判空：`if (!res || res.code !== 0) return;`

### SOP 2：开发新页面

1. 在 `/pages/<模块>/` 下创建 `.vue` 文件
2. 在 `pages.json` 注册路由（如需要）
3. 页面结构模板：`<template>` 使用 `<s-layout>` 或自定义 `<su-navbar>` + `<su-status-bar>`
4. `<script setup>` 导入：`import sheep from '@/sheep'`、生命周期从 `@dcloudio/uni-app` 导入
5. 状态管理：使用 `reactive({})` 或 `ref()`，命名 `state`（如 `const state = reactive({...})`）
6. 样式：`<style lang="scss" scoped>`，使用 `$sheep-*` 变量或在 `_var.scss` 中查找

### SOP 3：修复 Bug

1. 定位根因：阅读报错堆栈 / 接口响应 / 页面逻辑
2. 检查是否违反「工程约定」（如未判空导致 `Cannot read property of false`）
3. 检查是否触发「经验教训」（如状态后缀未标准化、时间数组未格式化）
4. 修改代码后：如有对应 API mock 数据或可运行环境则验证
5. 向用户说明：Bug 根因 + 修改位置（文件路径+行号）+ 修复逻辑

### SOP 4：样式调整 / UI 还原

1. 获取设计稿要求（用户通常直接给出 CSS JSON 或像素级参数）
2. 使用 `:style="{...}"` 动态绑定（参考 [linggong-sign-submit.vue#L15](file:///Users/lillee/workspace/XCZX-mall/pages/commission/linggong-sign-submit.vue#L15) 的写法）
3. 层级问题：查阅 `sheep.$zIndex` 或 [zIndex.js](file:///Users/lillee/workspace/XCZX-mall/sheep/config/zIndex.js) 获取规范层级值
4. **禁止**使用 base64，图片放 `/static/` 或对应 assets 目录

---

## 六、关键文件快速索引

| 需求 | 文件位置 |
|------|----------|
| 环境变量 | [.env](file:///Users/lillee/workspace/XCZX-mall/.env)（`SHOPRO_BASE_URL` / `SHOPRO_API_PATH` / `SHOPRO_TENANT_ID`） |
| 全局配置 | [sheep/config/index.js](file:///Users/lillee/workspace/XCZX-mall/sheep/config/index.js) |
| 请求拦截器 | [sheep/request/index.js](file:///Users/lillee/workspace/XCZX-mall/sheep/request/index.js#L72-L125)（请求）、[L130-L246](file:///Users/lillee/workspace/XCZX-mall/sheep/request/index.js#L130-L246)（响应） |
| 路由注册 | [pages.json](file:///Users/lillee/workspace/XCZX-mall/pages.json) |
| 全局样式变量 | [sheep/scss/_var.scss](file:///Users/lillee/workspace/XCZX-mall/sheep/scss/_var.scss) |
| 组件层级 z-index | [sheep/config/zIndex.js](file:///Users/lillee/workspace/XCZX-mall/sheep/config/zIndex.js) |
| 金额/单位转换 | [sheep/helper/index.js](file:///Users/lillee/workspace/XCZX-mall/sheep/helper/index.js)（fen2yuan 等） |
| package.json | [package.json](file:///Users/lillee/workspace/XCZX-mall/package.json)（依赖清单、scripts） |
| 主入口初始化 | [main.js](file:///Users/lillee/workspace/XCZX-mall/main.js)、[App.vue](file:///Users/lillee/workspace/XCZX-mall/App.vue) |

---

## 七、常用模式与代码片段

### 标准接口调用模式

```js
import sheep from '@/sheep';

async function loadData() {
  const res = await sheep.$api.trade.brokerageWithdrawConfig.get('default');
  if (!res || res.code !== 0) {
    // 错误处理：拦截器已 toast，此处只需中断
    return;
  }
  state.withdrawConfig = res.data;
}
```

### 标准状态标准化

```js
const rawStatus = res.data.status; // e.g. "NEED_SUBMIT-需提交资料"
const status = (rawStatus || '').split('-')[0].trim();
switch (status) {
  case 'NEED_SUBMIT': ...
  case 'SIGNED': ...
  case 'PENDING': ...
  case 'REJECTED': ...
}
```

### 标准时间数组格式化

```js
function formatTimeArr([h = 0, m = 0] = []) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
```

### 页面生命周期（必须从 @dcloudio/uni-app 导入）

```js
import { onLoad, onShow, onReady } from '@dcloudio/uni-app';

onLoad((options) => {
  // 页面加载：获取路由参数
});
onShow(() => {
  // 页面显示：每次回到页面都会触发
});
```
