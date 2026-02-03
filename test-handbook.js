const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the handbook
  await page.goto('https://inquiryinstitute.github.io/handbook/');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'handbook-test.png', fullPage: true });
  
  // Check console logs
  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Check for errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  // Wait a bit more for initialization
  await page.waitForTimeout(2000);
  
  // Check how many pages are in the flipbook
  const pageCount = await page.evaluate(() => {
    const flipbook = document.getElementById('flipbook');
    if (!flipbook) return 0;
    
    const pages = flipbook.querySelectorAll('.page');
    console.log('Pages found:', pages.length);
    pages.forEach((p, i) => {
      console.log(`Page ${i}:`, {
        classes: p.className,
        hasContent: p.innerHTML.length > 0,
        visible: window.getComputedStyle(p).display !== 'none',
        innerHTML: p.innerHTML.substring(0, 100)
      });
    });
    
    // Check if stPageFlip is initialized
    if (window.St && window.St.PageFlip) {
      console.log('stPageFlip library loaded');
    } else {
      console.log('stPageFlip library NOT loaded');
    }
    
    return pages.length;
  });
  
  console.log(`Total pages found: ${pageCount}`);
  
  // Try clicking next button
  console.log('\nClicking next button...');
  await page.click('#next-btn');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'handbook-after-next.png', fullPage: true });
  
  // Check current page
  const currentPageInfo = await page.evaluate(() => {
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    return {
      current: currentPageSpan?.textContent,
      total: totalPagesSpan?.textContent
    };
  });
  
  console.log('Page info:', currentPageInfo);
  
  // Check page visibility
  const pageVisibility = await page.evaluate(() => {
    const flipbook = document.getElementById('flipbook');
    const pages = Array.from(flipbook.querySelectorAll('.page'));
    return pages.map((p, i) => ({
      index: i,
      classes: p.className,
      display: window.getComputedStyle(p).display,
      visibility: window.getComputedStyle(p).visibility,
      opacity: window.getComputedStyle(p).opacity,
      zIndex: window.getComputedStyle(p).zIndex,
      hasContent: p.innerHTML.trim().length > 0,
      contentPreview: p.innerHTML.substring(0, 150)
    }));
  });
  
  console.log('\nPage visibility:');
  pageVisibility.forEach(p => {
    console.log(`Page ${p.index}:`, {
      classes: p.classes,
      display: p.display,
      visibility: p.visibility,
      opacity: p.opacity,
      hasContent: p.hasContent
    });
  });
  
  await browser.close();
})();
