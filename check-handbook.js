const { chromium } = require('playwright');

async function checkHandbook() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Set viewport to see the full spread
    await page.setViewportSize({ width: 1920, height: 1200 });
    
    // Navigate to GitHub Pages
    const url = process.argv[2] || 'https://inquiryinstitute.github.io/handbook/';
    
    console.log(`Checking handbook at: ${url}`);
    
    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for PDF to load
        await page.waitForTimeout(3000);
        
        // Take screenshot
        await page.screenshot({ 
            path: 'handbook-check.png', 
            fullPage: true 
        });
        
        console.log('Screenshot saved to handbook-check.png');
        
        // Check for errors in console
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        // Check page dimensions
        const flipbookDimensions = await page.evaluate(() => {
            const flipbook = document.getElementById('flipbook');
            if (!flipbook) return null;
            return {
                width: flipbook.offsetWidth,
                height: flipbook.offsetHeight,
                computedStyle: window.getComputedStyle(flipbook)
            };
        });
        
        console.log('\nFlipbook dimensions:', flipbookDimensions);
        
        // Check PDF page count
        const pageInfo = await page.evaluate(() => {
            const currentPage = document.getElementById('current-page');
            const totalPages = document.getElementById('total-pages');
            return {
                current: currentPage?.textContent,
                total: totalPages?.textContent
            };
        });
        
        console.log('Page info:', pageInfo);
        
        // Check canvas dimensions
        const canvasInfo = await page.evaluate(() => {
            const canvases = document.querySelectorAll('#flipbook canvas');
            return Array.from(canvases).map(canvas => ({
                width: canvas.width,
                height: canvas.height,
                styleWidth: canvas.style.width,
                styleHeight: canvas.style.height
            }));
        });
        
        console.log('Canvas info:', canvasInfo);
        
        if (errors.length > 0) {
            console.log('\nErrors found:', errors);
        } else {
            console.log('\nNo console errors detected');
        }
        
        await browser.close();
        
    } catch (error) {
        console.error('Error checking handbook:', error);
        await browser.close();
        process.exit(1);
    }
}

checkHandbook();
