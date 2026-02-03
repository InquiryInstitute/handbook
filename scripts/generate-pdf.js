const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function generatePDF() {
    console.log('Starting PDF generation...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Set viewport for PDF pages (800x1000 for each page, 1600x1000 for spread)
    await page.setViewportSize({ width: 1600, height: 1000 });
    
    // Load the handbook HTML
    const htmlPath = path.join(__dirname, '../docs/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Create a temporary HTML file with all content
    const tempHtml = await createFullHTML();
    const tempPath = path.join(__dirname, '../temp-handbook.html');
    fs.writeFileSync(tempPath, tempHtml);
    
    await page.goto(`file://${tempPath}`);
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Generate PDF
    const pdfPath = path.join(__dirname, '../docs/handbook.pdf');
    await page.pdf({
        path: pdfPath,
        width: '1600px',
        height: '1000px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    console.log(`PDF generated: ${pdfPath}`);
    
    await browser.close();
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    return pdfPath;
}

async function createFullHTML() {
    const chaptersDir = path.join(__dirname, '../chapters');
    const chapters = [];
    
    // Read all markdown files
    function readDir(dir, basePath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(basePath, entry.name);
            
            if (entry.isDirectory()) {
                readDir(fullPath, relPath);
            } else if (entry.name.endsWith('.md')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                chapters.push({ path: relPath, content });
            }
        }
    }
    
    readDir(chaptersDir);
    
    // Sort chapters by path
    chapters.sort((a, b) => a.path.localeCompare(b.path));
    
    // Convert markdown to HTML
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Handbook for the Recently Deceased</title>
    <style>
        @page {
            size: 1600px 1000px;
            margin: 0;
        }
        body {
            font-family: 'EB Garamond', serif;
            margin: 0;
            padding: 0;
        }
        .page {
            width: 1600px;
            height: 1000px;
            page-break-after: always;
            padding: 60px 80px;
            box-sizing: border-box;
        }
        .cover-page {
            background: #3d2817;
            color: #e8e6e1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            text-align: center;
        }
        h1 { font-size: 3rem; margin: 1rem 0; }
        h2 { font-size: 2rem; margin: 1.5rem 0 1rem 0; }
        h3 { font-size: 1.5rem; margin: 1rem 0 0.5rem 0; }
        p { margin: 1rem 0; line-height: 1.8; }
    </style>
</head>
<body>`;
    
    // Add cover
    html += `
    <div class="page cover-page">
        <div>
            <p style="font-size: 1.2rem; margin-bottom: 2rem;">Handbook for the</p>
            <h1 style="font-size: 6rem; line-height: 1.1; margin: 2rem 0;">Recently<br>Deceased</h1>
        </div>
        <div>
            <p style="font-size: 1rem; margin-top: 2rem;">A Practical Guide for Faculty</p>
            <p style="font-size: 0.9rem;">Inquiry Institute</p>
            <p style="font-size: 0.8rem; font-style: italic; margin-top: 2rem;">"If you are reading this,<br>you have already begun."</p>
        </div>
    </div>`;
    
    // Add chapters
    for (const chapter of chapters) {
        const lines = chapter.content.split('\n');
        let currentPage = '<div class="page">';
        let lineCount = 0;
        
        for (const line of lines) {
            // Simple markdown to HTML conversion
            let htmlLine = line
                .replace(/^### (.*)$/, '<h3>$1</h3>')
                .replace(/^## (.*)$/, '<h2>$1</h2>')
                .replace(/^# (.*)$/, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            if (htmlLine.trim() && !htmlLine.match(/^<[h]/)) {
                htmlLine = `<p>${htmlLine}</p>`;
            }
            
            currentPage += htmlLine;
            lineCount++;
            
            // Split into new page every ~40 lines
            if (lineCount > 40 && line.trim() === '') {
                currentPage += '</div>';
                html += currentPage;
                currentPage = '<div class="page">';
                lineCount = 0;
            }
        }
        
        if (currentPage !== '<div class="page">') {
            currentPage += '</div>';
            html += currentPage;
        }
    }
    
    html += `</body></html>`;
    
    return html;
}

if (require.main === module) {
    generatePDF().then(() => {
        console.log('PDF generation complete!');
        process.exit(0);
    }).catch(err => {
        console.error('Error generating PDF:', err);
        process.exit(1);
    });
}

module.exports = { generatePDF };
