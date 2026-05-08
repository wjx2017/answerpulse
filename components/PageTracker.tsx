'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * 简易流量追踪组件
 * 使用 navigator.sendBeacon 在页面加载时异步发送访问数据
 * 不阻塞渲染、不影响性能、无需 cookie
 */
export function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 提取 UTM 参数
    const utm_source = searchParams?.get('utm_source') || undefined;
    const utm_medium = searchParams?.get('utm_medium') || undefined;
    const utm_campaign = searchParams?.get('utm_campaign') || undefined;

    const payload = {
      page_path: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      utm_source,
      utm_medium,
      utm_campaign,
    };

    // 使用 sendBeacon：异步发送，不阻塞页面，即使页面关闭也能送达
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
    } else {
      // 降级方案：普通 fetch（fire-and-forget）
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, searchParams]);

  return null; // 不渲染任何 UI
}
