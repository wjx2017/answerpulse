# PayPal 手动收费版 — 完整操作手册

> **适用版本**: AnswerPulse v0.1.0+ (PayPal 手动收费模式)
> **最后更新**: 2026-04-18

---

## 1. 概述

本项目使用 **PayPal 付款链接 (Payment Link)** 作为收费入口，配合 **手动后台激活** 的方式实现 Pro 订阅。

### 整体架构

```
用户点击"Upgrade" → 跳转到 PayPal 付款页面 → 用户完成付款
  ↓
你收到 PayPal 收款通知（邮件 / PayPal 后台）
  ↓
你在 Supabase 后台手动将该用户的 plan 字段改为 'pro'
  ↓
用户刷新页面，享受 Pro 权益 ✅
```

**优点**：零开发成本、无需接入 webhook、5 分钟即可上线。
**缺点**：需要人工确认收款并手动激活，不适合大规模用户。

---

## 2. 环境变量配置

### 2.1 必须配置

在项目根目录 `.env.local`（本地开发）或 Vercel 项目设置（生产环境）中设置：

```env
NEXT_PUBLIC_PAYPAL_PAYMENT_LINK=https://www.paypal.com/your-payment-link-here
```

### 2.2 未配置时的行为

如果 `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK` 为空、为 `#` 或未设置，Upgrade 按钮会显示为 **"Upgrade Coming Soon"** 的禁用状态（灰色、不可点击），不会误导用户点击无效链接。

### 2.3 如何创建 PayPal 付款链接

1. 登录 [PayPal 商家中心](https://www.paypal.com/businessmanage)
2. 进入 **Pay & Get Paid → PayPal Buttons**
3. 选择 **Subscribe**（订阅）或 **Buy Now**（一次性付款）
   - 建议使用 **Subscribe**，设置月付 $9
4. 配置金额、货币、周期等
5. 生成后，找到 **Shareable link** 或 **Email link**，复制完整 URL
6. 将 URL 填入 `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK`

> 💡 也可以直接在 PayPal 后台创建 **Payment Link**：
> Pay & Get Paid → All payment tools → PayPal Payment Links → Create Link

---

## 3. 用户侧流程

### 3.1 用户看到什么

1. 未登录用户：Pro Banner 显示 "Sign Up Free" 和 "Sign In" 按钮
2. 已登录但未升级用户：显示 **"Upgrade to Pro via PayPal — $9/mo"** 按钮
3. 已升级 Pro 用户：显示 "Pro Plan Active" 横幅

### 3.2 用户付款流程

1. 用户点击 **"Upgrade to Pro via PayPal"** 按钮
2. 浏览器新标签页打开 PayPal 付款页面
3. 用户用 PayPal 账户或信用卡完成付款
4. 付款完成后，用户**需要通知你**（通过邮件 / 站内消息等）已付款
5. 你在 Supabase 手动激活后，用户刷新页面即可看到 Pro 状态

### 3.3 用户通知模板（可选）

你可以在 PayPal 付款页面的"付款说明"或确认邮件中加上：

> 付款完成后，请发送邮件至 [your-email] 告知你的注册邮箱，我们将在 24 小时内为你开通 Pro 服务。

---

## 4. 运营者操作手册（收到款后如何激活）

### 4.1 确认收款

1. 登录 [PayPal 后台](https://www.paypal.com/business)
2. 查看 **Activity** 页面，确认收到新付款
3. 记录付款人的 **姓名 / 邮箱**

### 4.2 找到用户

用户需要告诉你他在 AnswerPulse 的**注册邮箱**。根据这个邮箱在 Supabase 找到用户 ID：

#### 方法一：Supabase Dashboard（推荐，最简单）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入你的项目 → **Table Editor** → 选择 `profiles` 表
3. 搜索用户的 email 或名称，找到对应行
4. 复制该行的 `id` 值（UUID 格式，类似 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

#### 方法二：SQL 编辑器

1. 进入项目 → **SQL Editor**
2. 执行查询：
   ```sql
   SELECT id, email, plan, scans_used FROM profiles WHERE email = 'user@example.com';
   ```
3. 获取 `id`

### 4.3 激活 Pro

在 `profiles` 表中，将对应用户的 `plan` 字段改为 `pro`：

#### Dashboard 方式

1. 在 Table Editor 中找到该用户行
2. 双击 `plan` 单元格，将 `free` 改为 `pro`
3. 点击 **Save**

#### SQL 方式

```sql
UPDATE profiles 
SET plan = 'pro', 
    scans_used = 0, 
    scans_reset_at = NOW() 
WHERE id = '用户UUID';
```

### 4.4 确认激活

用户刷新 AnswerPulse 页面后：
- Header 应显示 **PRO** 徽章
- 扫描限制不再为 5 次/月
- Pro Banner 显示 "Pro Plan Active"

---

## 5. 注意事项

### 5.1 安全

- **不要在客户端暴露 `SUPABASE_SERVICE_ROLE_KEY`**，此密钥仅用于服务端操作
- PayPal 链接是公开 URL，任何人都可以访问——这不是问题，付款本身就验证了用户意图
- 建议保留付款截图/记录，以备争议时查证

### 5.2 时效性

- 建议收到款后 **24 小时内** 完成激活
- 可以在 PayPal 备注中记录激活日期，方便后续追踪

### 5.3 退款处理

如果用户要求退款：
1. 在 PayPal 后台操作退款
2. 同时在 Supabase 将该用户的 `plan` 改回 `free`：
   ```sql
   UPDATE profiles SET plan = 'free' WHERE id = '用户UUID';
   ```

### 5.4 续费提醒

- 如果是 PayPal 订阅（Subscribe），PayPal 会自动扣款
- 如果是一次性付款（Buy Now），需要手动提醒用户续费
- 建议在日历中设置续费提醒，在到期前 3 天通知用户

### 5.5 从 Lemon Squeezy 迁移

如果你的项目之前使用 Lemon Squeezy：
1. 本版本已移除 Lemon Squeezy 的环境变量依赖
2. `pages/api/webhook/lemon.ts` 仍保留但不再使用，可在确认无历史待处理后删除
3. 现有 Pro 用户不受影响（Supabase 中 `plan = 'pro'` 的记录仍然有效）

---

## 6. 快速参考卡片

| 操作 | 位置 | 动作 |
|------|------|------|
| 配置 PayPal 链接 | `.env.local` 或 Vercel Env | 设置 `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK` |
| 查看收款 | PayPal Dashboard → Activity | 确认付款人邮箱 |
| 查找用户 | Supabase → Table Editor → profiles | 按 email 搜索 |
| 激活 Pro | Supabase → profiles 表 | `plan` 改为 `pro` |
| 取消 Pro | Supabase → profiles 表 | `plan` 改为 `free` |
| 退款 | PayPal Dashboard | 操作退款 + Supabase 改 `plan` 为 `free` |

---

## 7. 常见问题

**Q: 用户付款后多久能开通？**
A: 手动模式，建议 24 小时内。你可以在 PayPal 付款说明里写明开通时效。

**Q: 可以用 API 自动激活吗？**
A: 可以。需要接入 PayPal Webhook + 后端验证签名后自动更新 Supabase。这是下一阶段的优化方向。

**Q: 用户不知道自己的注册邮箱怎么办？**
A: 让用户用注册邮箱登录 AnswerPulse，在 Header 中可以看到扫描次数（未 Pro 用户显示 `x/5 scans`），确认是同一个账号。

**Q: 忘记配置 PayPal 链接会怎样？**
A: Upgrade 按钮显示为 "Upgrade Coming Soon"（灰色禁用状态），用户无法点击，不会跳转到无效页面。
