import { NextResponse } from 'next/server';

/**
 * 简易流量追踪 API
 * 接收客户端 sendBeacon 发送的访问数据，写入 Supabase
 * 零依赖、不阻塞、不影响性能
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 优先使用客户端传的数据，否则从请求头获取
    const page_path = body.page_path || '/';
    const referrer = body.referrer || request.headers.get('referer') || undefined;
    const user_agent = body.user_agent || request.headers.get('user-agent') || undefined;
    const utm_source = body.utm_source || undefined;
    const utm_medium = body.utm_medium || undefined;
    const utm_campaign = body.utm_campaign || undefined;
    // Cloudflare 注入的国家代码 header
    const ip_country = body.ip_country || request.headers.get('cf-ipcountry') || undefined;
    const session_id = body.session_id || undefined;

    // 使用 Supabase REST API 写入数据
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      // 开发环境可能没配 service key，降级到 anon key 写入
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const insertData: Record<string, unknown> = { page_path };
    if (referrer) insertData.referrer = referrer;
    if (user_agent) insertData.user_agent = user_agent;
    if (utm_source) insertData.utm_source = utm_source;
    if (utm_medium) insertData.utm_medium = utm_medium;
    if (utm_campaign) insertData.utm_campaign = utm_campaign;
    if (ip_country) insertData.ip_country = ip_country;
    if (session_id) insertData.session_id = session_id;

    const res = await fetch(`${supabaseUrl}/rest/v1/page_visits`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(insertData),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[track] Supabase write failed:', res.status, errText);
      return NextResponse.json({ error: 'Write failed' }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[track] Error:', e);
    // 即使出错也返回 200，不影响用户体验
    return NextResponse.json({ ok: true, error: 'logged' });
  }
}

// GET 请求返回统计概览（可选，方便调试）
export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ count: 0 });
  }

  // 获取最近 100 条记录
  const res = await fetch(
    `${supabaseUrl}/rest/v1/page_visits?select=page_path,utm_source,ip_country,created_at&order=created_at.desc&limit=100`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ count: data.length, recent: data });
}
