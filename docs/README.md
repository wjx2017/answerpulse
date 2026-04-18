# AnswerPulse 文档

## 📋 运营手册

- **[PayPal 手动收费版 — 完整操作手册](./paypal-manual-flow.md)**
  - PayPal 付款链接配置方法
  - 用户侧付款流程
  - 收到款后在 Supabase 手动激活 Pro
  - 退款、续费、安全注意事项
  - 快速参考卡片 & FAQ

## 🏗️ 技术文档

- **数据库迁移**: `supabase-migrations/` 目录下
  - `001_profiles_and_scan_history.sql` — profiles 表与扫描历史
  - `002_increment_scan_count.sql` — 扫描计数自增函数
- **API 路由**: `pages/api/` 目录下
  - `analyze.ts` — AEO 分析接口
  - `analyze-html.ts` — HTML 内容分析接口
  - `webhook/lemon.ts` — Lemon Squeezy Webhook（已废弃，保留参考）

## ⚙️ 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（仅服务端） | ✅ |
| `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK` | PayPal 付款链接 | ✅（留空显示"Coming Soon"） |
| `NEXT_PUBLIC_APP_URL` | 应用 URL（用于 OAuth 回调等） | ✅ |

---

> 💡 新成员请先阅读 [PayPal 手动收费版操作手册](./paypal-manual-flow.md) 了解完整的收费流程。
