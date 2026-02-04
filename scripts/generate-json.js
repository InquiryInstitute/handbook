const fs = require('fs');
const path = require('path');

function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    let currentBlock = null;
    let inCodeBlock = false;
    let inList = false;
    let listItems = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines (but preserve them for spacing)
        if (!line && !inCodeBlock) {
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            continue;
        }
        
        // Code blocks
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                if (currentBlock) {
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
                const language = line.slice(3).trim();
                currentBlock = {
                    type: 'code',
                    language: language || null,
                    content: ''
                };
            }
            continue;
        }
        
        if (inCodeBlock && currentBlock) {
            currentBlock.content += line + '\n';
            continue;
        }
        
        // Headers
        if (line.startsWith('#')) {
            if (currentBlock) {
                blocks.push(currentBlock);
            }
            const level = line.match(/^#+/)[0].length;
            const text = line.replace(/^#+\s*/, '');
            currentBlock = {
                type: `h${level}`,
                text: text
            };
            continue;
        }
        
        // Horizontal rules
        if (line.match(/^---+$/)) {
            if (currentBlock) {
                blocks.push(currentBlock);
            }
            blocks.push({ type: 'hr' });
            currentBlock = null;
            continue;
        }
        
        // Blockquotes
        if (line.startsWith('>')) {
            if (currentBlock && currentBlock.type !== 'blockquote') {
                blocks.push(currentBlock);
            }
            const quoteText = line.replace(/^>\s*/, '');
            if (currentBlock && currentBlock.type === 'blockquote') {
                currentBlock.content += ' ' + quoteText;
            } else {
                currentBlock = {
                    type: 'blockquote',
                    content: quoteText
                };
            }
            continue;
        }
        
        // Lists
        if (line.match(/^[-*+]\s+|^\d+\.\s+/)) {
            if (currentBlock && currentBlock.type !== 'list') {
                if (currentBlock) blocks.push(currentBlock);
            }
            const isOrdered = /^\d+\./.test(line);
            const itemText = line.replace(/^[-*+]\s+|^\d+\.\s+/, '');
            
            if (currentBlock && currentBlock.type === 'list' && currentBlock.ordered === isOrdered) {
                currentBlock.items.push(parseInlineMarkdown(itemText));
            } else {
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = {
                    type: 'list',
                    ordered: isOrdered,
                    items: [parseInlineMarkdown(itemText)]
                };
            }
            continue;
        }
        
        // Regular paragraphs
        if (currentBlock && currentBlock.type === 'paragraph') {
            currentBlock.content += ' ' + line;
        } else {
            if (currentBlock) {
                blocks.push(currentBlock);
            }
            currentBlock = {
                type: 'paragraph',
                content: line
            };
        }
    }
    
    if (currentBlock) {
        blocks.push(currentBlock);
    }
    
    return blocks.map(block => {
        if (block.type === 'paragraph' || block.type === 'blockquote') {
            block.content = parseInlineMarkdown(block.content);
        }
        return block;
    });
}

function parseInlineMarkdown(text) {
    if (typeof text !== 'string') return text;
    
    const nodes = [];
    let currentIndex = 0;
    
    // Patterns: **bold**, *italic*, `code`, [link](url)
    const patterns = [
        { regex: /\*\*(.+?)\*\*/g, type: 'strong' },
        { regex: /\*(.+?)\*/g, type: 'em' },
        { regex: /`(.+?)`/g, type: 'code' },
        { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' }
    ];
    
    const matches = [];
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                type: pattern.type,
                content: match[1],
                url: match[2] || null
            });
        }
    });
    
    matches.sort((a, b) => a.start - b.start);
    
    let lastIndex = 0;
    matches.forEach(match => {
        if (match.start > lastIndex) {
            const textBefore = text.substring(lastIndex, match.start);
            if (textBefore) {
                nodes.push({ type: 'text', content: textBefore });
            }
        }
        
        const node = {
            type: match.type,
            content: match.content
        };
        if (match.url) {
            node.url = match.url;
        }
        nodes.push(node);
        
        lastIndex = match.end;
    });
    
    if (lastIndex < text.length) {
        const textAfter = text.substring(lastIndex);
        if (textAfter) {
            nodes.push({ type: 'text', content: textAfter });
        }
    }
    
    return nodes.length > 0 ? nodes : [{ type: 'text', content: text }];
}

function readChapters() {
    const chaptersDir = path.join(__dirname, '../chapters');
    const chapters = [];
    
    function readDir(dir, basePath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(basePath, entry.name);
            
            if (entry.isDirectory()) {
                readDir(fullPath, relPath);
            } else if (entry.name.endsWith('.md')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const parsed = parseMarkdown(content);
                chapters.push({
                    path: relPath,
                    filename: entry.name,
                    content: parsed
                });
            }
        }
    }
    
    readDir(chaptersDir);
    chapters.sort((a, b) => a.path.localeCompare(b.path));
    
    return chapters;
}

function generateJSON() {
    console.log('Generating handbook JSON...');
    
    const handbook = {
        metadata: {
            title: "Handbook for the Recently Deceased",
            subtitle: "A Practical Guide for Faculty of Inquiry Institute",
            version: "1.0.0",
            generated: new Date().toISOString(),
            tagline: "If you are reading this, you have already begun."
        },
        structure: {
            sections: [
                { id: "00", title: "Front Matter", chapters: [0] },
                { id: "01", title: "Jurisdiction & Authority", chapters: [1] },
                { id: "02", title: "Faculty Identity & Conduct", chapters: [2, 3] },
                { id: "03", title: "Teaching & Learning", chapters: [4, 5, 6] },
                { id: "04", title: "Writing & Publication", chapters: [7, 8] },
                { id: "05", title: "Research, Grants & Resources", chapters: [9] },
                { id: "06", title: "Rituals, Rhythms & Infrastructure", chapters: [] },
                { id: "07", title: "Tools & Systems", chapters: [] },
                { id: "08", title: "Ethics, Failure & Termination", chapters: [] },
                { id: "09", title: "Appendices", chapters: [] }
            ]
        },
        chapters: []
    };
    
    const chapters = readChapters();
    
    chapters.forEach((chapter, index) => {
        // Extract title from first h1
        const title = chapter.content.find(block => block.type === 'h1')?.text || chapter.filename;
        
        handbook.chapters.push({
            id: index,
            path: chapter.path,
            filename: chapter.filename,
            title: title,
            content: chapter.content
        });
    });
    
    // Generate table of contents
    handbook.tableOfContents = handbook.chapters.map((chapter, index) => ({
        id: index,
        title: chapter.title,
        path: chapter.path
    }));
    
    const outputPath = path.join(__dirname, '../docs/handbook.json');
    fs.writeFileSync(outputPath, JSON.stringify(handbook, null, 2));
    
    console.log(`Handbook JSON generated: ${outputPath}`);
    console.log(`Total chapters: ${handbook.chapters.length}`);
    
    return outputPath;
}

if (require.main === module) {
    generateJSON();
}

module.exports = { generateJSON, parseMarkdown, parseInlineMarkdown };
