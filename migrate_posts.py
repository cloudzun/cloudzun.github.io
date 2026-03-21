#!/usr/bin/env python3
"""博客文章迁移脚本 - 从 blog.huaqloud.com 迁移到 Astro Paper"""

import requests
from bs4 import BeautifulSoup
from pathlib import Path
import re

BASE_URL = "https://blog.huaqloud.com"
POSTS_DIR = Path("src/data/blog-migrated")
POSTS_DIR.mkdir(exist_ok=True)

def get_article_urls():
    """获取所有文章 URL"""
    urls = []
    print("获取文章列表...")
    
    for page in range(1, 7):
        url = f"{BASE_URL}/posts/" if page == 1 else f"{BASE_URL}/posts/page/{page}/"
        try:
            resp = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # 找文章链接
            for link in soup.select('a.archive-item-link[href*="/posts/"]'):
                href = link['href']
                if href.startswith('/'):
                    href = BASE_URL + href
                urls.append(href.rstrip('/'))
            
            print(f"  第 {page} 页：找到链接")
        except Exception as e:
            print(f"  第 {page} 页失败：{e}")
            break
    
    # 去重
    urls = list(dict.fromkeys(urls))
    print(f"共找到 {len(urls)} 篇文章")
    return urls

def fetch_article(url):
    """抓取单篇文章"""
    try:
        resp = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
        return resp.text
    except Exception as e:
        print(f"  ✗ 抓取失败：{e}")
        return None

def extract_article_info(html, url):
    """提取文章信息"""
    soup = BeautifulSoup(html, 'html.parser')
    
    # 提取标题
    title_tag = soup.find('h1', class_='single-title')
    if not title_tag:
        print(f"  ✗ 找不到标题")
        return None
    title = title_tag.get_text(strip=True)
    
    # 提取日期（从 URL）
    date_match = re.search(r'/posts/(\d{4}-\d{2}-\d{2})-', url)
    pub_date = date_match.group(1) if date_match else "2026-03-21"
    
    # 提取描述（从 meta description）
    desc_tag = soup.find('meta', attrs={'name': 'description'})
    description = desc_tag['content'][:200] if desc_tag and desc_tag.get('content') else title[:150]
    
    # 提取标签（从 meta tags）
    tags = []
    for tag_meta in soup.select('meta[property="article:tag"]'):
        tag = tag_meta.get('content', '').lower().replace(' ', '-')
        if tag and len(tags) < 5:
            tags.append(tag)
    if not tags:
        tags = ['blog']
    
    # 提取正文（从 div class=content）
    content_div = soup.find('div', class_='content')
    if content_div:
        content = content_div.get_text('\n', strip=True)[:50000]
    else:
        # 尝试找 main 或 article
        main = soup.find('main') or soup.find('article')
        content = main.get_text('\n', strip=True)[:50000] if main else "内容提取失败"
    
    # 生成 slug
    slug = url.rstrip('/').split('/')[-1]
    
    return {
        'title': title,
        'pub_date': pub_date,
        'description': description.replace("'", "''"),
        'tags': tags,
        'content': content,
        'slug': slug
    }

def save_article(info):
    """保存为 Markdown"""
    output = POSTS_DIR / f"{info['slug']}.md"
    
    frontmatter = f"""---
title: '{info["title"].replace("'", "''")}'
description: '{info["description"]}'
pubDatetime: {info["pub_date"]}T00:00:00Z
tags: {info["tags"]}
---

"""
    
    with open(output, 'w', encoding='utf-8') as f:
        f.write(frontmatter)
        f.write(info['content'])
    
    print(f"  ✓ {info['title'][:50]}...")
    return output

def main():
    print("=" * 60)
    print("博客迁移工具：blog.huaqloud.com → Astro Paper")
    print("=" * 60)
    
    urls = get_article_urls()
    
    if not urls:
        print("未找到文章！")
        return
    
    print(f"\n开始抓取前 5 篇测试...")
    
    for i, url in enumerate(urls[:5], 1):
        print(f"\n[{i}/5] {url}")
        html = fetch_article(url)
        if not html:
            continue
        
        info = extract_article_info(html, url)
        if not info:
            continue
        
        save_article(info)
    
    print("\n" + "=" * 60)
    print("测试完成！检查 src/data/blog-migrated/ 目录")
    print("如需迁移全部 115 篇，运行：python3 migrate_posts.py --all")
    print("=" * 60)

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--all':
        print("完整迁移模式 - 将抓取所有 115 篇文章")
        urls = get_article_urls()
        for i, url in enumerate(urls, 1):
            print(f"\n[{i}/{len(urls)}] {url}")
            html = fetch_article(url)
            if not html:
                continue
            info = extract_article_info(html, url)
            if not info:
                continue
            save_article(info)
        print(f"\n完成！共迁移 {len(urls)} 篇文章")
    else:
        main()
