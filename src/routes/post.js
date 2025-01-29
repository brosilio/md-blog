require("dotenv").config();
const blogName = process.env.BLOG_NAME;

const fs = require('fs/promises');
const path = require('path');
const MarkdownIt = require('markdown-it');

const express = require('express');
const router = express.Router();
const md = new MarkdownIt();

router.get('/:slug', async (req, res) => {
    const slug = req.params.slug;
    const filePath = path.join(process.env.POST_DIRECTORY, `${slug}.md`);
  
    try {
        await fs.stat(filePath);
    } catch (error) {
        return res.status(404).send("404 post not found");
    }
  
    const markdown = await fs.readFile(filePath, 'utf-8');
    const html = md.render(markdown);
  
    res.render('post', { blogName, title: slug, content: html });
});

module.exports = router;