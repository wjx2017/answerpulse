# PayPal 动态下单版 — 自动升级操作手册

> **适用版本**: AnswerPulse v0.2.0+ (PayPal 动态下单 / 自动激活)
> **最后更新**: 2026-04-18

---

## 1. 概述

用户在站内直接通过 PayPal 按钮完成支付后，系统**自动**将该用户升级为 Pro，无需手动操作。

### 整体架构

```
用户在 /pricing 点击 PayPal 按钮
  → PayPal JS SDK 弹出结账窗口
  → 用户完成支付
  → onApprove 回调触发 → POST /api/paypal/capture-order
    → 后端验证订单金额/币种
    → 后端调用 PayPal API capture 订单
    → 后端更新 Supabase profiles → plan='pro'
  → 前端收到成功响应 → 触发 profile-refresh 事件
  → Header / ProBanner 自动刷新，显示 PRO 状态 ✅
```

### 降级方案

如果 PayPal JS SDK 加载失败或客户端不可用，用户仍可通过原有的 **PayPal 付款链接** 完成支付（需手动激活，24h 内处理）。

---

## 2. 环境变量配置

### 2.1 必须配置（动态下单）

```env
# 从 https://developer.paypal.com/dashboard/applications 获取
NEXT_PUBLIC_PAYPAL_CLIENT_ID=Axxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=Exxxxxxxxxxxxxxxxxxxx
```

### 2.2 可选配置

```env
# PayPal API 地址（默认线上，测试用沙箱）
NEXT_PUBLIC_PAYPAL_API_URL=https://api-m.sandbox.paypal.com
```

### 2.3 保留配置（降级回退）

```env
# 原有 PayPal 付款链接，作为降级方案保留
NEXT_PUBLIC_PAYPAL_PAYMENT_LINK=https://www.paypal.com/ncp/payment/XXXXX
```

### 2.4 价格配置

```env
# 必须与 PayPal 应用中的金额一致
NEXT_PUBLIC_PRO_PRICE=9
NEXT_PUBLIC_PRO_PRICE_LABEL=/month
```

---

## 3. PayPal 后台配置步骤

### 3.1 创建 PayPal 应用

1. 登录 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 点击 **Apps & Credentials**
3. 切换至 **Live**（或先用 **Sandbox** 测试）
4. 点击 **Create App**
5. 填写应用名称（如 "AnswerPulse"）
6. 获取 **Client ID** 和 **Client Secret**
7. 填入环境变量

### 3.2 启用必要的 API 功能

确保你的 PayPal 应用启用了以下功能：
- **Checkout** (Orders v2)
- **Capture Payment**

默认情况下，新创建的应用已启用这些功能。

### 3.3 沙箱测试（推荐先做）

1. 在 Sandbox 模式下创建应用，获取沙箱 Client ID / Secret
2. 设置 `NEXT_PUBLIC_PAYPAL_API_URL=https://api-m.sandbox.paypal.com`
3. 使用 PayPal 沙箱买家账户测试支付流程
4. 确认无误后切换到 Live 模式

---

## 4. 用户侧流程

### 4.1 已登录用户

1. 进入 `/pricing` 页面
2. 看到 Pro 计划卡片中的 PayPal 按钮
3. 点击按钮 → PayPal 结账弹窗
4. 用 PayPal 账户或信用卡完成支付
5. **Pro 即时激活** ✅（Header 显示 PRO 徽章，扫描限制解除）

### 4.2 未登录用户

- Pricing 页面的 PayPal 按钮会检测登录状态
- 未登录时点击会提示 "Please sign in to upgrade"
- 引导用户先登录/注册，再回来支付

### 4.3 降级路径

如果 PayPal 按钮无法加载，用户仍可通过下方的 "Pay via PayPal" 链接直接跳转 PayPal 付款页面（手动激活）。

---

## 5. 技术细节

### 5.1 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/paypal/create-order` | POST | 创建 PayPal 订单，返回 orderID |
| `/api/paypal/capture-order` | POST | 捕获订单 + 自动升级用户 |

### 5.2 安全机制

- **身份验证**: 两个端点均校验 Supabase 用户身份，未登录返回 401
- **金额校验**: capture 前通过 PayPal API 验证订单金额与配置价格一致
- **币种校验**: 仅接受 USD
- **幂等性**: 已捕获的订单重复调用不会重复扣款
- **防呆**: 已是 Pro 用户仍可调用，但数据库更新是幂等的

### 5.3 异常处理

| 场景 | 处理方式 |
|------|----------|
| 未登录 | 前端提示 "Please sign in"，后端返回 401 |
| 金额不匹配 | 拒绝 capture，返回 400 |
| PayPal API 故障 | 返回 500，前端提示重试 |
| 支付成功但 DB 更新失败 | 返回 200 + warning，提示联系客服 |
| 重复 capture | PayPal 返回 409/422，视为已成功 |

---

## 6. 从手动版迁移

### 6.1 迁移步骤

1. 在 PayPal Developer 创建应用，获取 Client ID / Secret
2. 将凭据填入 `.env.local`（开发）和 Vercel 环境变量（生产）
3. 部署新版代码
4. 测试支付流程
5. 保留 `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK` 作为降级方案

### 6.2 现有 Pro 用户

- 不受影响，`plan='pro'` 的记录仍然有效
- 无需任何操作

---

## 7. 常见问题

**Q: 用户付款后多久能开通？**
A: 即时开通。支付确认后 1-3 秒内自动升级为 Pro。

**Q: 用户付款后没开通怎么办？**
A: 可能是网络问题导致 profile-refresh 事件未触发。用户刷新页面即可。如仍未生效，检查 Supabase 中该用户的 plan 字段，或联系客服。

**Q: 可以用沙箱测试吗？**
A: 可以。设置 `NEXT_PUBLIC_PAYPAL_API_URL=https://api-m.sandbox.paypal.com` 并使用沙箱 Client ID / Secret。

**Q: 如果 PayPal 按钮加载失败？**
A: 自动降级为 PayPal 付款链接方式（手动激活），不影响用户支付。

**Q: 支持哪些支付方式？**
A: 取决于你的 PayPal 账户配置，通常支持 PayPal 余额、绑定的银行卡/信用卡。
