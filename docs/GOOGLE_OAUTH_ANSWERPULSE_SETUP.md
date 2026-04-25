# Google OAuth 登录接入 - AnswerPulse（星答）

> **项目**: AnswerPulse — AEO 检测工具  
> **技术栈**: Next.js 14 + Supabase Auth + Cloudflare Workers  
> **线上地址**: https://answerpulse.answerpulse-cf.workers.dev  
> **日期**: 2026-04-25

---

## 📋 实施清单

- [x] 数据库迁移：`auth_providers` 表 + 增强触发器（`005_google_oauth.sql`）
- [x] 后端：`lib/actions/auth.ts` Server Actions（`signInWithGoogle` / `signUpWithGoogle` / `signOut`）
- [x] 前端：`components/auth/GoogleSignInButton.tsx` 组件
- [x] 前端：`app/login/page.tsx` 整合 Google 按钮 + 分隔线
- [x] 前端：`app/register/page.tsx` 整合 Google 按钮 + 分隔线
- [x] **Cloudflare 兼容回调路由**（`app/api/auth/callback/route.ts`，edge runtime）
- [x] `lib/supabase/server.ts` 适配 async/await
- [x] `.env.example` 添加 `NEXT_PUBLIC_APP_URL`
- [ ] Google Cloud Console 配置（需手动操作）
- [ ] Supabase Dashboard 配置（需手动操作）
- [ ] Cloudflare 环境变量配置（需手动操作）
- [ ] 部署 & 测试验证

---

## 📁 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `supabase-migrations/005_google_oauth.sql` | **新增** | 建 `auth_providers` 表 + 增强 `handle_new_user()` 触发器 + OAuth 记录触发器 |
| `lib/actions/auth.ts` | **新增** | Google OAuth Server Actions |
| `components/auth/GoogleSignInButton.tsx` | **新增** | Google Sign-In 按钮（内联 SVG，无外部依赖） |
| `app/api/auth/callback/route.ts` | **新增** | Cloudflare 兼容的 OAuth 回调路由（edge runtime） |
| `app/login/page.tsx` | **修改** | 添加 Google 按钮 + 分隔线 |
| `app/register/page.tsx` | **修改** | 添加 Google 按钮 + 分隔线 |
| `lib/supabase/server.ts` | **修改** | `createClient()` 改为 `async` |
| `.env.example` | **修改** | 添加 `NEXT_PUBLIC_APP_URL` |

---

## 一、Google Cloud Console 配置（~15 分钟）

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部项目选择器 → **New Project**
3. 项目名：`answerpulse`
4. 点击 **Create**

### 2. 配置 OAuth Consent Screen

1. 左侧菜单：**APIs & Services** → **OAuth consent screen**
2. User Type 选择 **External** → **Create**
3. 填写：
   - **App name**: AnswerPulse
   - **User support email**: 你的邮箱
   - **Developer contact email**: 你的邮箱
4. 点击 **Save and Continue**
5. **Scopes** 页面：添加以下 scopes
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/openid`
6. 点击 **Save and Continue**
7. **Test users** 页面：暂时添加你的测试邮箱
8. 点击 **Save and Continue** → **Back to Dashboard**

### 3. 创建 OAuth 2.0 Client ID

1. 左侧菜单：**APIs & Services** → **Credentials**
2. 点击 **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `answerpulse-web`
5. **Authorized JavaScript origins**：
   ```
   http://localhost:3000
   https://answerpulse.answerpulse-cf.workers.dev
   ```
6. **Authorized redirect URIs**：
   ```
   http://localhost:3000/api/auth/callback
   https://answerpulse.answerpulse-cf.workers.dev/api/auth/callback
   ```
7. 点击 **Create**
8. 保存 **Client ID** 和 **Client Secret**

---

## 二、Supabase Dashboard 配置（~5 分钟）

### 1. 启用 Google 登录

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择 **AnswerPulse** 的 Supabase 项目
3. 左侧菜单：**Authentication** → **Providers**
4. 找到 **Google**，点击开关启用
5. 填写：
   - **Client ID**: 从 Google Cloud Console 获取
   - **Client Secret**: 从 Google Cloud Console 获取
6. 点击 **Save**

### 2. 配置 Site URL 和 Redirect URLs

1. **Authentication** → **URL Configuration**
2. **Site URL**：设置为 `https://answerpulse.answerpulse-cf.workers.dev`
3. **Redirect URLs** 添加：
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/api/auth/callback
   https://answerpulse.answerpulse-cf.workers.dev/auth/callback
   https://answerpulse.answerpulse-cf.workers.dev/api/auth/callback
   ```

---

## 三、数据库迁移

在 Supabase Dashboard → **SQL Editor** 中执行 `supabase-migrations/005_google_oauth.sql` 的内容。

或使用 Supabase CLI：
```bash
cd answerpulse
supabase db push
```

---

## 四、Cloudflare 环境变量配置

### 本地开发（`.env.local`）

```env
# 已有的变量
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 新增（Google OAuth 回调需要）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 生产环境（Cloudflare Dashboard）

在 Cloudflare Pages/Dashboard 中添加环境变量：
```
NEXT_PUBLIC_APP_URL=https://answerpulse.answerpulse-cf.workers.dev
```

---

## 五、部署

```bash
cd answerpulse

# 本地开发测试
npm run dev
# 访问 http://localhost:3000/login

# Cloudflare Workers 构建
npx opennextjs-cloudflare build

# 本地预览
npx opennextjs-cloudflare dev

# 部署
npx opennextjs-cloudflare deploy
```

---

## 六、测试验证

### 测试场景

| # | 场景 | 预期结果 |
|---|------|----------|
| 1 | 新用户使用 Google 登录 | ✅ 自动创建账号和 profile，`auth_providers` 记录创建，跳转到首页 |
| 2 | 已绑定 Google 的用户再次登录 | ✅ 自动登录，跳转到首页 |
| 3 | Google 登录失败（网络错误等） | ✅ 跳转到 login 并显示错误信息 |
| 4 | 登录状态下访问 /login | ✅ 仍然显示登录页，但 Header 显示用户信息 |
| 5 | 注册页点击 Google 按钮 | ✅ 与登录页行为一致（Supabase 自动处理新用户创建） |
| 6 | Google 登录后 profile 自动创建 | ✅ profiles 表有对应记录，`full_name` 来自 Google 数据 |

---

## 七、架构说明

### 登录流程图

```
用户点击 "Sign in with Google"
    ↓
Server Action: signInWithGoogle()
    ↓
supabase.auth.signInWithOAuth({ provider: 'google' })
    ↓
浏览器重定向到 Google 授权页面
    ↓
用户同意授权
    ↓
Google 重定向到 {SUPABASE_URL}/auth/v1/callback
    ↓
Supabase 处理 OAuth 握手，创建/更新 auth.users 记录
    ↓
触发器 handle_new_user() 自动创建 profiles 记录
    ↓
触发器 handle_oauth_user() 记录 auth_providers
    ↓
Supabase 重定向到 /api/auth/callback?code=xxx
    ↓
Cloudflare 兼容回调路由 exchangeCodeForSession()
    ↓
浏览器重定向到 /（首页）
```

### 与 AnswerPulse 现有架构的兼容性

- **邮箱注册仍保留**：用户可以选择邮箱注册或 Google 登录
- **现有 profiles 表兼容**：迁移仅新增 `avatar_url` 列和 `auth_providers` 表
- **现有 auth/callback 页面不受影响**：`/auth/callback/page.tsx`（客户端）仍处理邮箱验证等 PKCE 流程
- **新增 /api/auth/callback 路由**：专门处理 Server Action 触发的 OAuth 回调
- **middleware 不受影响**：现有的 session 刷新逻辑仍然工作

---

## 八、⚠️ 注意事项

### 1. 同一邮箱的双账号问题
邮箱注册的用户和 Google 登录的用户（同一邮箱）会创建两个独立账号。
这是 Supabase 的默认行为。后续可通过邮箱匹配 + 二次验证实现账号绑定。

### 2. `handle_new_user()` 触发器覆盖
迁移 `005_google_oauth.sql` 会**覆盖**现有的 `handle_new_user()` 触发器。
新的触发器兼容 AnswerPulse 的 profiles 表结构（plan, scans_used 等字段）。

### 3. Cloudflare Workers 编译
`/api/auth/callback/route.ts` 使用 `export const runtime = 'edge'` 和原生 Supabase 客户端，
避免 `@supabase/ssr` 在 Cloudflare Workers 下的 0B 编译问题。

---

*星码 · 2026-04-25*
