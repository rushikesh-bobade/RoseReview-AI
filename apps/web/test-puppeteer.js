import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot.png' });
  
  const bodyStyles = await page.evaluate(() => {
    const body = document.body;
    return {
      background: window.getComputedStyle(body).backgroundColor,
      display: window.getComputedStyle(body).display,
      html: body.innerHTML.substring(0, 200)
    };
  });
  console.log('Body Styles:', bodyStyles);

  await browser.close();
})();
