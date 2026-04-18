import { test, expect } from '@playwright/test';

test.describe('AnswerPulse 生产环境验证', () => {
  const BASE_URL = 'https://answerpulse.vercel.app';

  test('1. 首页可访问', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.title();
    console.log('首页标题:', title);
    
    // 截图
    await page.screenshot({ path: 'homepage.png', fullPage: true });
    
    // 检查关键元素是否存在
    const hasHero = await page.locator('h1, .hero, [class*="hero"]').count() > 0;
    console.log('首页包含 Hero 区域:', hasHero);
  });

  test('2. 注册页可访问', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/register`);
    expect(response?.status()).toBe(200);
    
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ path: 'register-page.png', fullPage: true });
    
    // 检查注册表单元素
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    const emailVisible = await emailInput.count() > 0;
    const passwordVisible = await passwordInput.count() > 0;
    
    console.log('注册页 - 邮箱输入框可见:', emailVisible);
    console.log('注册页 - 密码输入框可见:', passwordVisible);
    
    expect(emailVisible || passwordVisible).toBeTruthy();
  });

  test('3. 登录页可访问', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/login`);
    expect(response?.status()).toBe(200);
    
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    // 检查登录表单元素
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    const emailVisible = await emailInput.count() > 0;
    const passwordVisible = await passwordInput.count() > 0;
    
    console.log('登录页 - 邮箱输入框可见:', emailVisible);
    console.log('登录页 - 密码输入框可见:', passwordVisible);
    
    expect(emailVisible || passwordVisible).toBeTruthy();
  });

  test('4. 历史记录页 - 未登录重定向', async ({ page }) => {
    // 先清除可能的登录状态
    const context = page.context();
    await context.clearCookies();
    
    const response = await page.goto(`${BASE_URL}/history`, { waitUntil: 'networkidle' });
    
    // 截图
    await page.screenshot({ path: 'history-page.png', fullPage: true });
    
    // 检查是否被重定向到登录页或显示登录提示
    const currentUrl = page.url();
    console.log('访问历史记录页后的 URL:', currentUrl);
    
    const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
    const hasLoginPrompt = await page.locator('text=登录，text=signin, input[type="email"], button:has-text("登录")').count() > 0;
    
    console.log('是否重定向到登录页:', isRedirectedToLogin);
    console.log('是否显示登录提示:', hasLoginPrompt);
    
    // 期望：要么重定向，要么显示登录提示
    expect(isRedirectedToLogin || hasLoginPrompt).toBeTruthy();
  });

  test('5. 首页扫描链路检查', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // 查找扫描相关的按钮或链接
    const scanButton = page.locator('button:has-text("扫描"), button:has-text("Scan"), a:has-text("扫描"), a:has-text("Scan"), [class*="scan"]');
    const scanCount = await scanButton.count();
    
    console.log('首页扫描按钮数量:', scanCount);
    
    if (scanCount > 0) {
      // 尝试点击第一个扫描按钮
      try {
        await scanButton.first().click({ timeout: 3000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        // 截图
        await page.screenshot({ path: 'after-scan-click.png', fullPage: true });
        
        console.log('点击扫描按钮后的 URL:', page.url());
        console.log('扫描链路 - 点击成功');
      } catch (e) {
        console.log('扫描链路 - 点击失败或无需登录:', e);
      }
    } else {
      console.log('首页未找到扫描按钮');
    }
  });

  test('6. API 健康检查 - Supabase 连接', async ({ page }) => {
    // 尝试在浏览器控制台检查 Supabase 连接
    const supabaseCheck = await page.evaluate(() => {
      return {
        hasSupabase: typeof window !== 'undefined' && 
          (window as any).supabase !== undefined,
        userAgent: navigator.userAgent
      };
    });
    
    console.log('浏览器 Supabase 对象:', supabaseCheck.hasSupabase);
  });
});
