const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function renderHTMLPages() {
    console.log('Rendering HTML pages to images...');
    
    const outputDir = path.join(__dirname, '../docs/pages/images');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Set viewport for single page (800x1000)
    await page.setViewportSize({ width: 800, height: 1000 });
    
    // Load chapters
    const chaptersDir = path.join(__dirname, '../chapters');
    const htmlPagesDir = path.join(__dirname, '../docs/pages/chapters');
    
    // Read all HTML files
    function getAllHTMLFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                getAllHTMLFiles(filePath, fileList);
            } else if (file.endsWith('.html')) {
                fileList.push(filePath);
            }
        });
        return fileList;
    }
    
    const htmlFiles = getAllHTMLFiles(htmlPagesDir);
    htmlFiles.sort();
    
    console.log(`Found ${htmlFiles.length} HTML files to render`);
    
    // Render cover first
    const coverPath = path.join(__dirname, '../docs/index.html');
    if (fs.existsSync(coverPath)) {
        console.log('Rendering cover...');
        await page.goto(`file://${coverPath}`);
        await page.waitForSelector('#cover-page', { timeout: 5000 });
        await page.waitForTimeout(1000);
        
        const coverElement = await page.$('#cover-page');
        if (coverElement) {
            const coverImagePath = path.join(outputDir, 'page-000.png');
            await coverElement.screenshot({ path: coverImagePath });
            console.log('Cover rendered');
        }
    }
    
    // Render TOC
    const tocPath = path.join(__dirname, '../docs/pages/toc.html');
    if (fs.existsSync(tocPath)) {
        console.log('Rendering TOC...');
        await page.goto(`file://${tocPath}`);
        await page.waitForTimeout(1000);
        const tocImagePath = path.join(outputDir, 'page-001.png');
        await page.screenshot({ path: tocImagePath, fullPage: false });
        console.log('TOC rendered');
    }
    
    // Render chapter pages
    let pageNum = 2;
    for (const htmlFile of htmlFiles) {
        console.log(`Rendering ${path.basename(htmlFile)}...`);
        await page.goto(`file://${htmlFile}`);
        await page.waitForTimeout(1000);
        
        const pageElement = await page.$('.page');
        if (pageElement) {
            const imagePath = path.join(outputDir, `page-${pageNum.toString().padStart(3, '0')}.png`);
            await pageElement.screenshot({ path: imagePath });
            pageNum++;
        }
    }
    
    await browser.close();
    
    console.log(`\n✓ Rendered ${pageNum} pages to images in ${outputDir}`);
    return { totalPages: pageNum, outputDir };
}

if (require.main === module) {
    renderHTMLPages().then(({ totalPages, outputDir }) => {
        console.log(`\n✓ HTML to images conversion complete!`);
        console.log(`  ${totalPages} pages rendered`);
        console.log(`  Images saved to: ${outputDir}`);
        process.exit(0);
    }).catch(err => {
        console.error('Error rendering HTML pages:', err);
        process.exit(1);
    });
}

module.exports = { renderHTMLPages };
