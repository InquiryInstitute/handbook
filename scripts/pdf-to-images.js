const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const pdf = require('pdf-poppler');

async function convertPDFToImages() {
    console.log('Converting PDF to images...');
    
    const pdfPath = path.join(__dirname, '../docs/handbook.pdf');
    const outputDir = path.join(__dirname, '../docs/pages/pdf');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Use Playwright to render PDF pages as images
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Load PDF
    await page.goto(`file://${pdfPath}`);
    
    // Get total pages (this is a workaround - we'll use a different approach)
    // Actually, let's use pdf-poppler or pdf2pic
    
    await browser.close();
    
    // Alternative: Use pdf.js or render each page
    console.log('Using Playwright to render PDF pages...');
    
    const browser2 = await chromium.launch();
    const context = await browser2.newContext();
    
    // Read PDF and render each page
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // Use a simpler approach: render PDF in browser and screenshot each page
    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 1600, height: 1000 });
    
    // Create an HTML page that loads the PDF
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    </head>
    <body>
        <canvas id="pdf-canvas"></canvas>
        <script>
            const url = 'handbook.pdf';
            pdfjsLib.getDocument(url).promise.then(pdf => {
                window.totalPages = pdf.numPages;
                window.pdfLoaded = true;
            });
        </script>
    </body>
    </html>
    `;
    
    const tempHtmlPath = path.join(__dirname, '../docs/temp-pdf-viewer.html');
    fs.writeFileSync(tempHtmlPath, html);
    
    await page2.goto(`file://${tempHtmlPath}`);
    await page2.waitForTimeout(2000);
    
    // Get total pages from the page
    const totalPages = await page2.evaluate(() => window.totalPages || 0);
    console.log(`Total PDF pages: ${totalPages}`);
    
    // Render each page
    for (let i = 1; i <= totalPages; i++) {
        await page2.evaluate((pageNum) => {
            return pdfjsLib.getDocument('handbook.pdf').promise.then(pdf => {
                return pdf.getPage(pageNum).then(page => {
                    const viewport = page.getViewport({ scale: 1 });
                    const canvas = document.getElementById('pdf-canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const context = canvas.getContext('2d');
                    return page.render({ canvasContext: context, viewport: viewport }).promise;
                });
            });
        }, i);
        
        await page2.waitForTimeout(500);
        
        const imagePath = path.join(outputDir, `page-${i.toString().padStart(3, '0')}.png`);
        await page2.screenshot({ path: imagePath, fullPage: false });
        console.log(`Rendered page ${i}/${totalPages}`);
    }
    
    await browser2.close();
    fs.unlinkSync(tempHtmlPath);
    
    console.log(`Converted ${totalPages} pages to images in ${outputDir}`);
    return totalPages;
}

if (require.main === module) {
    convertPDFToImages().then((totalPages) => {
        console.log(`PDF to images conversion complete! ${totalPages} pages`);
        process.exit(0);
    }).catch(err => {
        console.error('Error converting PDF to images:', err);
        process.exit(1);
    });
}

module.exports = { convertPDFToImages };
