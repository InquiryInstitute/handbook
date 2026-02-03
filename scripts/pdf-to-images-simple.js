const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function convertPDFToImages() {
    console.log('Converting PDF to images using Playwright...');
    
    const pdfPath = path.join(__dirname, '../docs/handbook.pdf');
    const outputDir = path.join(__dirname, '../docs/pages/pdf');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Set viewport for 1600x1000 (two-page spread)
    await page.setViewportSize({ width: 1600, height: 1000 });
    
    // Create HTML page with PDF.js to render PDF
    const html = `<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <style>
        body { margin: 0; padding: 0; background: #1a1a1a; }
        #pdf-canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="pdf-canvas"></canvas>
    <script>
        let currentPage = 1;
        let totalPages = 0;
        let pdfDoc = null;
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        pdfjsLib.getDocument('handbook.pdf').promise.then(pdf => {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            window.pdfReady = true;
            window.totalPages = totalPages;
            renderPage(1);
        });
        
        function renderPage(pageNum) {
            pdfDoc.getPage(pageNum).then(page => {
                const viewport = page.getViewport({ scale: 1 });
                const canvas = document.getElementById('pdf-canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise.then(() => {
                    window.pageRendered = pageNum;
                });
            });
        }
        
        window.renderPage = renderPage;
    </script>
</body>
</html>`;
    
    const tempHtmlPath = path.join(__dirname, '../docs/temp-pdf-viewer.html');
    fs.writeFileSync(tempHtmlPath, html);
    
    // Copy PDF to same directory as HTML for relative path
    const pdfInDocs = path.join(__dirname, '../docs/handbook.pdf');
    if (!fs.existsSync(pdfInDocs)) {
        throw new Error('PDF not found at ' + pdfInDocs);
    }
    
    await page.goto(`file://${tempHtmlPath}`);
    
    // Wait for PDF to load
    await page.waitForFunction(() => window.pdfReady === true, { timeout: 10000 });
    const totalPages = await page.evaluate(() => window.totalPages);
    console.log(`PDF has ${totalPages} pages`);
    
    // Render each page
    for (let i = 1; i <= totalPages; i++) {
        console.log(`Rendering page ${i}/${totalPages}...`);
        
        // Render the page
        await page.evaluate((pageNum) => {
            return window.renderPage(pageNum);
        }, i);
        
        // Wait for render to complete
        await page.waitForFunction((pageNum) => window.pageRendered === pageNum, { timeout: 5000 }, i);
        await page.waitForTimeout(500);
        
        // Take screenshot
        const imagePath = path.join(outputDir, `page-${i.toString().padStart(3, '0')}.png`);
        await page.screenshot({ 
            path: imagePath, 
            fullPage: false,
            clip: { x: 0, y: 0, width: 1600, height: 1000 }
        });
    }
    
    await browser.close();
    fs.unlinkSync(tempHtmlPath);
    
    console.log(`Successfully converted ${totalPages} pages to images in ${outputDir}`);
    return { totalPages, outputDir };
}

if (require.main === module) {
    convertPDFToImages().then(({ totalPages, outputDir }) => {
        console.log(`\n✓ PDF to images conversion complete!`);
        console.log(`  ${totalPages} pages converted`);
        console.log(`  Images saved to: ${outputDir}`);
        process.exit(0);
    }).catch(err => {
        console.error('Error converting PDF to images:', err);
        process.exit(1);
    });
}

module.exports = { convertPDFToImages };
