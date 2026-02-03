const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1400, height: 900 });
  
  // Navigate to the handbook
  const url = 'https://inquiryinstitute.github.io/handbook/';
  console.log(`Navigating to ${url}...`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for content
    await page.waitForTimeout(3000);
    
    // Check for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Check page structure
    const coverVisible = await page.evaluate(() => {
      const cover = document.getElementById('cover-page');
      if (!cover) return { exists: false };
      
      const styles = window.getComputedStyle(cover);
      return {
        exists: true,
        display: styles.display,
        opacity: styles.opacity,
        visibility: styles.visibility,
        zIndex: styles.zIndex,
        transform: styles.transform,
        width: cover.offsetWidth,
        height: cover.offsetHeight,
        innerHTML: cover.innerHTML.substring(0, 200)
      };
    });
    
    console.log('\n=== Cover Page Status ===');
    console.log(JSON.stringify(coverVisible, null, 2));
    
    // Check if fonts loaded
    const fontsLoaded = await page.evaluate(() => {
      return document.fonts.check('1em "Cinzel Decorative"');
    });
    console.log('\n=== Fonts Loaded ===');
    console.log('Cinzel Decorative:', fontsLoaded);
    
    // Check CSS
    const cssLoaded = await page.evaluate(() => {
      const link = document.querySelector('link[rel="stylesheet"]');
      return link ? link.href : 'No stylesheet found';
    });
    console.log('\n=== CSS ===');
    console.log('Stylesheet:', cssLoaded);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'handbook-diagnostic.png',
      fullPage: true 
    });
    console.log('\nScreenshot saved to handbook-diagnostic.png');
    
    if (errors.length > 0) {
      console.log('\n=== Console Errors ===');
      errors.forEach(err => console.log(err));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Keep browser open for a moment to see
  await page.waitForTimeout(2000);
  await browser.close();
})();
