const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to a reasonable size
  await page.setViewportSize({ width: 1400, height: 900 });
  
  // Navigate to the handbook
  const url = 'https://inquiryinstitute.github.io/handbook/';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait a bit for any animations or dynamic content
  await page.waitForTimeout(2000);
  
  // Take screenshot of the full page
  const screenshotPath = 'handbook-screenshot.png';
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  
  console.log(`Screenshot saved to ${screenshotPath}`);
  
  // Also take a screenshot of just the viewport
  const viewportPath = 'handbook-viewport.png';
  await page.screenshot({ 
    path: viewportPath,
    fullPage: false 
  });
  
  console.log(`Viewport screenshot saved to ${viewportPath}`);
  
  await browser.close();
})();
