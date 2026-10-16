# 我的博客

使用 Hexo 8.1.2 与 Butterfly 5.7.0，托管在 GitHub Pages。

- 博客地址：https://cgdiya.github.io/
- 源码仓库：https://github.com/CGDIYA/cgdiya.github.io
- 首页、文章目录、归档、分类、标签、关于、站内搜索、深浅色模式。
- 不需要数据库，不占用 Azure 虚拟机。

## 在电脑上预览

需要 Node.js 24 与 pnpm 11.25.0。常规 Node 安装自带 npm，可通过 `npm install --global pnpm@11.25.0` 安装 pnpm。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://127.0.0.1:4000/。预览窗口关闭后，线上博客不受影响。

## 写一篇文章

```sh
pnpm new "文章标题"
```

文章位于 `source/_posts/`。编辑 Markdown 文件并补充头部信息：

```yaml
---
title: 文章标题
date: 2026-10-16 12:00:00
tags: [技术, 笔记]
categories: [技术笔记]
description: 一两句话，介绍这篇文章的内容。
cover: /img/cover-code.svg
---
```

正文写在第二个 `---` 后面。图片放入 `source/img/`，在文章中用 `![图片说明](/img/文件名.png)` 引用。不要把大视频放进仓库。

默认不会发布未来日期的文章。草稿放在 `source/_drafts/`；它们不会被构建，也被 Git 忽略。

## 发布更新

先本地构建，确认无误后提交推送：

```sh
pnpm build
git add .
git commit -m "更新文章"
git push
```

GitHub Actions 自动构建并发布 `public/`。到仓库的 Actions 页面查看进度。构建依赖由 `pnpm-lock.yaml` 固定；`public/` 与 `node_modules/` 无需上传。

仓库 Settings → Pages 的 Source 应为 **GitHub Actions**。

## 修改站名、头像和样式

| 内容 | 文件 |
| --- | --- |
| 站名、描述、作者、网站地址 | `_config.yml` |
| 菜单、头像、公告、主题颜色、搜索 | `_config.butterfly.yml` |
| 关于我 | `source/about/index.md` |
| 文章 | `source/_posts/` |
| 图片 | `source/img/` |
| 额外样式 | `source/css/custom.css` |

当前“我的博客”“博主”、头像及两篇文章为可替换的占位或示例内容。第一次使用时可直接修改，不需要重新搭站。

源码仓库是公开的，提交前检查文件内容。不要上传密码、密钥、订阅链接或其他私密配置。

## 版权

Hexo 与 Butterfly 分别遵循其上游许可证，页脚保留框架和主题署名。本站新建 SVG 图片为本项目原创。默认文章版权声明为 CC BY-NC-SA 4.0，可在主题配置中按需要修改；该声明不改变第三方素材的许可。
