const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function generatePDF() {
    console.log('Generating complete PDF from all content...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Set viewport for two-page spread (1600x1000)
    await page.setViewportSize({ width: 1600, height: 1000 });
    
    // Create HTML with all content
    const html = await createFullHTML();
    const tempPath = path.join(__dirname, '../docs/temp-handbook.html');
    fs.writeFileSync(tempPath, html);
    
    await page.goto(`file://${tempPath}`);
    await page.waitForTimeout(3000); // Wait for fonts and images to load
    
    // Generate PDF
    const pdfPath = path.join(__dirname, '../docs/handbook.pdf');
    await page.pdf({
        path: pdfPath,
        width: '1600px',
        height: '1000px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: false
    });
    
    console.log(`PDF generated: ${pdfPath}`);
    
    await browser.close();
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
                chapters.push({ path: relPath, content, name: entry.name });
            }
        }
    }
    
    readDir(chaptersDir);
    chapters.sort((a, b) => a.path.localeCompare(b.path));
    
    // Load TOC HTML if it exists
    let tocHtml = '';
    const tocPath = path.join(__dirname, '../docs/pages/toc.html');
    if (fs.existsSync(tocPath)) {
        tocHtml = fs.readFileSync(tocPath, 'utf-8');
    }
    
    // Load cover image path
    const coverImagePath = path.join(__dirname, '../docs/covergraphic.png');
    const coverImageExists = fs.existsSync(coverImagePath);
    
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Handbook for the Recently Deceased</title>
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Cinzel+Decorative:wght@400&family=Spectral+SC:wght@400;600&display=swap" rel="stylesheet">
    <style>
        @page {
            size: 1600px 1000px;
            margin: 0;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'EB Garamond', serif;
            margin: 0;
            padding: 0;
            background: #1a1a1a;
        }
        .page {
            width: 1600px;
            height: 1000px;
            page-break-after: always;
            padding: 60px 80px;
            box-sizing: border-box;
            background: #faf8f3;
            color: #2c2c2c;
            font-size: 18px;
            line-height: 1.8;
        }
        .cover-page {
            background: #3d2817;
            background-image: 
                radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(101, 67, 33, 0.2) 0%, transparent 50%);
            color: #e8e6e1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            text-align: center;
            padding: 0;
        }
        .cover-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 60px 80px;
        }
        .cover-title-section {
            margin-top: 2rem;
        }
        .cover-prefix {
            font-family: 'Spectral SC', serif;
            font-size: 1.2rem;
            letter-spacing: 0.15em;
            margin-bottom: 1rem;
        }
        .cover-page h1 {
            font-family: 'Cinzel Decorative', serif;
            font-size: 9rem;
            line-height: 1.1;
            margin: 1rem 0;
            font-weight: 400;
        }
        .cover-image {
            margin: 2rem 0;
        }
        .cover-image img {
            max-width: 450px;
            height: auto;
        }
        .cover-footer {
            margin-bottom: 2rem;
        }
        .subtitle, .institute-name {
            font-family: 'Spectral SC', serif;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            margin: 0.5rem 0;
        }
        .tagline {
            font-size: 0.8rem;
            font-style: italic;
            margin-top: 1rem;
        }
        h1 { 
            font-size: 3rem; 
            margin: 1.5rem 0 1rem 0; 
            font-family: 'Spectral SC', serif;
            font-weight: 600;
        }
        h2 { 
            font-size: 2rem; 
            margin: 1.5rem 0 1rem 0; 
            font-family: 'Spectral SC', serif;
            font-weight: 600;
        }
        h3 { 
            font-size: 1.5rem; 
            margin: 1rem 0 0.5rem 0; 
        }
        p { 
            margin: 1rem 0; 
            line-height: 1.8; 
        }
        blockquote {
            border-left: 4px solid #8b4513;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            font-style: italic;
        }
        strong {
            font-weight: 600;
        }
        em {
            font-style: italic;
        }
    </style>
</head>
<body>`;
    
    // Add cover
    html += `
    <div class="page cover-page">
        <div class="cover-content">
            <div class="cover-title-section">
                <p class="cover-prefix">Handbook for the</p>
                <h1>Recently<br>Deceased</h1>
            </div>`;
    
    if (coverImageExists) {
        html += `
            <div class="cover-image">
                <img src="file://${coverImagePath}" alt="Inquiry Institute" />
            </div>`;
    }
    
    html += `
            <div class="cover-footer">
                <p class="subtitle">A Practical Guide for Faculty</p>
                <p class="institute-name">Inquiry Institute</p>
                <p class="tagline">"If you are reading this,<br>you have already begun."</p>
            </div>
        </div>
    </div>`;
    
    // Add TOC if available
    if (tocHtml) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = tocHtml;
        const tocContent = tempDiv.querySelector('.page') || tempDiv;
        html += `<div class="page">${tocContent.innerHTML}</div>`;
    }
    
    // Add chapters
    for (const chapter of chapters) {
        const lines = chapter.content.split('\n');
        let currentPage = '<div class="page">';
        let hasTitle = false;
        let lineCount = 0;
        
        for (const line of lines) {
            if (!line.trim()) {
                currentPage += '<br>';
                lineCount++;
                continue;
            }
            
            // Simple markdown to HTML
            let htmlLine = line
                .replace(/^### (.*)$/, '<h3>$1</h3>')
                .replace(/^## (.*)$/, '<h2>$1</h2>')
                .replace(/^# (.*)$/, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^> (.*)$/, '<blockquote>$1</blockquote>');
            
            if (line.match(/^#/)) {
                hasTitle = true;
            }
            
            if (htmlLine.trim() && !htmlLine.match(/^<[h]/) && !htmlLine.match(/^<blockquote/)) {
                htmlLine = `<p>${htmlLine}</p>`;
            }
            
            currentPage += htmlLine;
            lineCount++;
            
            // Split pages approximately every 35-40 lines
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
