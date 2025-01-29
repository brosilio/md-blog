require("dotenv").config();
const blogName = process.env.BLOG_NAME;
const footerContent = process.env.FOOTER_CONTENT;

const fs = require('fs/promises');
const path = require('path');

const express = require('express');
const router = express.Router();

async function getFileInfo(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return {
            fileSize: stats.size,
            timestamp: stats.mtime
        };
    } catch (error) {
        console.error(`Error getting file info for ${filePath}:`, error.message);
        return null;
    }
}

async function generateFileListHTML(directoryPath) {
    try {
        const files = (await fs.readdir(directoryPath)).filter((x) => x.endsWith('.md'));
        if (files.length === 0) return '<p>No files found.</p>';

        const listItems = [];
        listItems.push('<ul>');

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const fileInfo = await getFileInfo(filePath);
            const postName = file.substring(0, file.indexOf('.'));

            listItems.push('<li>');
            listItems.push(`<h3><a href="/post/${postName}">&quot;${postName}&quot;</a></h3>`);
            listItems.push(`last edited <em>${fileInfo.timestamp}</em>`);
            listItems.push('<br>');
            listItems.push(`${fileInfo.fileSize}b`);
            listItems.push('</li>');
        }

        listItems.push('</ul>');

        return listItems.join('');
    } catch (error) {
        console.error(`Error reading directory ${directoryPath}:`, error.message);
        return '<p>Error loading file list.</p>';
    }
}

router.get('/', async (req, res) => {
    const postList = await generateFileListHTML(process.env.POST_DIRECTORY);
  
    res.render('index', { blogName, footer: footerContent, title: 'Home', content: postList });
});

module.exports = router;