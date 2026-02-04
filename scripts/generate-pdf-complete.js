const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function generatePDF() {
    console.log('Generating complete PDF from all content...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Set viewport for US Letter portrait pages (8.5" x 11" at 96 DPI = 816x1056)
    await page.setViewportSize({ width: 816, height: 1056 });
    
    // Create HTML with all content
    const html = await createFullHTML();
    const tempPath = path.join(__dirname, '../docs/temp-handbook.html');
    fs.writeFileSync(tempPath, html);
    
    await page.goto(`file://${tempPath}`);
    await page.waitForTimeout(3000); // Wait for fonts and images to load
    
    // Generate PDF - US Letter portrait (8.5" x 11")
    const pdfPath = path.join(__dirname, '../docs/handbook.pdf');
    await page.pdf({
        path: pdfPath,
        width: '8.5in',
        height: '11in',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true
    });
    
    console.log(`PDF generated: ${pdfPath}`);
    
    await browser.close();
    fs.unlinkSync(tempPath);
    
    return pdfPath;
}

function markdownToHTML(markdown) {
    let html = markdown
        // Headers
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        // Horizontal rules
        .replace(/^---$/gm, '<hr>')
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Blockquotes
        .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    
    // Split into paragraphs
    const paragraphs = html.split(/\n\n+/).filter(p => p.trim());
    html = paragraphs.map(para => {
        para = para.trim();
        if (!para) return '';
        // Don't wrap headers, blockquotes, or horizontal rules
        if (para.match(/^<(h[1-6]|blockquote|hr)/)) {
            return para;
        }
        // Convert single newlines to <br> within paragraphs
        para = para.replace(/\n/g, '<br>');
        return `<p>${para}</p>`;
    }).join('\n');
    
    return html;
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
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Cinzel+Decorative:wght@400&family=Spectral+SC:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
    <style>
        @page {
            size: 8.5in 11in;
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
            color: #2c2c2c;
        }
        
        /* Cover Page */
        .cover-page {
            width: 8.5in;
            height: 11in;
            page-break-after: always;
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
            padding: 80px 60px;
            box-sizing: border-box;
        }
        .cover-title-section {
            margin-top: 2rem;
        }
        .cover-prefix {
            font-family: 'Spectral SC', serif;
            font-size: 1.4rem;
            letter-spacing: 0.15em;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .cover-page h1 {
            font-family: 'Cinzel Decorative', serif;
            font-size: 9rem;
            line-height: 1.1;
            margin: 1rem 0;
            font-weight: 400;
        }
        .cover-image {
            margin: 3rem 0;
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
            font-size: 0.85rem;
            font-style: italic;
            margin-top: 1.5rem;
            line-height: 1.6;
        }
        
        /* Content Pages */
        .page {
            width: 8.5in;
            height: 11in;
            page-break-after: always;
            background: #faf8f3;
            color: #2c2c2c;
            padding: 0.5in 0.4in;
            box-sizing: border-box;
            position: relative;
        }
        
        /* Three-column layout for content (stereo instructions style) */
        .page-content {
            column-count: 3;
            column-gap: 0.25in;
            column-rule: 1px solid #d0ccc0;
            height: 100%;
            overflow: hidden;
            font-size: 0.75rem;
            line-height: 1.4;
        }
        
        /* Typography - compact technical manual style */
        h1 {
            font-family: 'Spectral SC', serif;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
            padding-bottom: 0.25rem;
            border-bottom: 1px solid #8b4513;
            column-span: all;
            break-after: avoid;
        }
        h2 {
            font-family: 'Spectral SC', serif;
            font-size: 0.9rem;
            font-weight: 600;
            margin: 0.8rem 0 0.4rem 0;
            color: #5a3a1f;
            break-after: avoid;
        }
        h3 {
            font-family: 'Spectral SC', serif;
            font-size: 0.8rem;
            font-weight: 600;
            margin: 0.6rem 0 0.3rem 0;
            color: #6b4a2f;
            break-after: avoid;
        }
        p {
            margin: 0 0 0.5rem 0;
            line-height: 1.4;
            text-align: justify;
            hyphens: auto;
            orphans: 2;
            widows: 2;
            font-size: 0.75rem;
        }
        
        /* Alchemical illustrations */
        .alchemical-symbol {
            display: inline-block;
            width: 0.8em;
            height: 0.8em;
            margin: 0 0.2em;
            vertical-align: middle;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="%238b4513" stroke-width="2"/><path d="M50 10 L50 90 M10 50 L90 50" stroke="%238b4513" stroke-width="1.5"/><circle cx="50" cy="50" r="15" fill="none" stroke="%238b4513" stroke-width="1"/></svg>') no-repeat center;
            background-size: contain;
        }
        
        .marginal-note {
            font-size: 0.65rem;
            color: #6b5a4a;
            font-style: italic;
            margin-left: 0.5em;
            border-left: 1px solid #d0ccc0;
            padding-left: 0.3em;
        }
        blockquote {
            border-left: 3px solid #8b4513;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: #4a3a2a;
            break-inside: avoid;
        }
        hr {
            border: none;
            border-top: 1px solid #d0ccc0;
            margin: 2rem 0;
            column-span: all;
        }
        strong {
            font-weight: 600;
            color: #3a2a1a;
        }
        em {
            font-style: italic;
        }
        code {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.9em;
            background: #f0ede5;
            padding: 2px 4px;
            border-radius: 2px;
        }
        a {
            color: #8b4513;
            text-decoration: none;
            border-bottom: 1px dotted #8b4513;
        }
        a:hover {
            border-bottom: 1px solid #8b4513;
        }
        
        /* Lists */
        ul, ol {
            margin: 1rem 0;
            padding-left: 2rem;
            break-inside: avoid;
        }
        li {
            margin: 0.5rem 0;
            line-height: 1.75;
        }
        
        /* Table of Contents */
        .toc-page {
            width: 8.5in;
            height: 11in;
            page-break-after: always;
            background: #faf8f3;
            padding: 0.5in 0.4in;
            box-sizing: border-box;
        }
        .toc-page h1 {
            border-bottom: 3px solid #8b4513;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
        }
        .toc-list {
            list-style: none;
            padding: 0;
        }
        .toc-list li {
            margin: 0.8rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        .toc-list li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #8b4513;
            font-weight: bold;
        }
        .toc-list a {
            color: #2c2c2c;
            text-decoration: none;
            border-bottom: none;
        }
        .toc-list a:hover {
            color: #8b4513;
        }
        
        /* Page numbers and headers */
        .page-number {
            position: absolute;
            bottom: 0.2in;
            right: 0.3in;
            font-size: 0.65rem;
            color: #8b6f47;
            font-family: 'Spectral SC', serif;
        }
        
        /* Avoid breaking */
        h1, h2, h3, blockquote, pre {
            break-inside: avoid;
        }
        p {
            break-inside: avoid;
        }
    </style>
</head>
<body>`;
    
    // Add cover (single page, will be positioned on right)
    html += `
    <div class="cover-page">
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
    </div>`;
    
    // Add TOC if available
    if (tocHtml) {
        // Extract TOC content
        const tocMatch = tocHtml.match(/<div[^>]*class="page"[^>]*>([\s\S]*?)<\/div>/);
        if (tocMatch) {
            html += `<div class="toc-page">
                <h1>Table of Contents</h1>
                ${tocMatch[1]}
            </div>`;
        }
    }
    
    // Add chapters with proper page breaks
    let pageCount = 2; // Cover + TOC
    
    for (const chapter of chapters) {
        const htmlContent = markdownToHTML(chapter.content);
        
        // Split content into pages
        const words = htmlContent.split(/\s+/);
        const wordsPerPage = 450; // Approximate words per page in two columns
        const pages = [];
        
        let currentPage = [];
        let currentWordCount = 0;
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const wordLength = word.replace(/<[^>]+>/g, '').split(/\s+/).length;
            
            // Check if adding this word would exceed page limit
            if (currentWordCount + wordLength > wordsPerPage && currentPage.length > 0) {
                pages.push(currentPage.join(' '));
                currentPage = [word];
                currentWordCount = wordLength;
            } else {
                currentPage.push(word);
                currentWordCount += wordLength;
            }
        }
        
        if (currentPage.length > 0) {
            pages.push(currentPage.join(' '));
        }
        
        // Render each page
        for (let i = 0; i < pages.length; i++) {
            const isFirstPage = i === 0;
            html += `<div class="page">`;
            if (isFirstPage) {
                // First page of chapter gets full-width header
                html += `<div class="page-content">${pages[i]}</div>`;
            } else {
                html += `<div class="page-content">${pages[i]}</div>`;
            }
            html += `<div class="page-number">${pageCount++}</div>`;
            html += `</div>`;
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
