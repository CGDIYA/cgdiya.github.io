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

站名和作者为 CGDIYA，头像位于 `source/img/avatar-cgdiya.jpg`。当前两篇文章仍为可替换的示例内容。

首页采用全屏封面，点击底部箭头进入文章列表。封面存放在 `source/img/home-city.jpg`，来源为参考博客 https://blog.unbalancedcat.cn/ 当时展示的 Bing 壁纸；替换该文件即可更换封面。

## 手机端

手机与电脑使用同一网址和文章。768px 及以下宽度使用半屏首页封面、底部「首页 / 标签 / 归档 / 关于」导航、16px 正文字号和更大的触控按钮；手机侧栏仅保留作者简介及文章目录，减少重复信息。底栏为全面屏安全区域留出空间，浮动按钮和文章目录显示在底栏上方。

手机标签页优先显示可搜索和排序的标签目录，关系图通过「展开关系图」查看；电脑仍默认展示关系图。展开后可通过 ＋ / − 缩放和点击标签进入文章。

`scripts/mobile-ui.cjs` 为页面注入带版本号的导航与资源，`source/css/mobile.css` 管理手机样式，`source/js/mobile-ui.js` 标记当前导航入口并增强顶部按钮的键盘操作。

源码仓库是公开的，提交前检查文件内容。不要上传密码、密钥、订阅链接或其他私密配置。

## 标签关系图

`/tags/` 由 `scripts/tag-explorer.cjs` 在构建时生成，无需手动维护标签清单。节点大小表示文章数；两个标签只有共同出现在一篇公开文章中，才会生成连线。草稿、未来文章不会进入关系图。

搜索会同步筛选图中的标签和下方目录。目录可按名称或最近文章的发布时间排序。电脑可拖动节点、拖动画布、滚轮缩放，也可聚焦画布后使用方向键、加减号和 `0`（重置）。手机保留页面的上下滑动，通过按钮缩放和重置。

相关文件：`tools/tag-graph.cjs` 处理真实数据，`source/js/tag-explorer.js` 负责交互，`source/css/tag-explorer.css` 负责样式。无 JavaScript 时仍可通过目录访问标签文章。`pnpm test:tags` 可验证共现统计与草稿过滤规则。

拖动一个节点会弹性牵引同组的关联节点，松手后逐渐稳定。小节点的名称随缩放显示，单篇文章的标签默认在 150% 起显示；悬停、键盘聚焦或搜索匹配时可提前查看名称。悬停时突出当前节点、直接邻居和相连边。

## 版权

Hexo 与 Butterfly 分别遵循其上游许可证，页脚保留框架和主题署名。本站新建 SVG 图片为本项目原创。默认文章版权声明为 CC BY-NC-SA 4.0，可在主题配置中按需要修改；该声明不改变第三方素材的许可。
