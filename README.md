# Pages Blog

一个基于边缘计算的现代博客系统，支持腾讯云 EdgeOne Pages 和阿里云 ESA Pages 部署。内置 3D 模型展示、暗色/亮色主题切换、Markdown 编辑器、图片管理等功能。

## 一键部署

[![Deploy to EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?from=github&template=https://github.com/erxiansheng/pagesblog)

> 点击按钮后会自动 Fork 仓库并部署到 EdgeOne Pages，部署完成后需要在项目设置中创建 KV 命名空间。

## 预览

[[点击预览]](https://dasb.cn/)

## 功能特性

- 🎨 暗色/亮色双主题，毛玻璃 UI 风格
- 🧊 Three.js 3D 模型展示，支持多模型配置（最多 5 个，独立调节缩放/位置/远近）
- 📝 Markdown 文章编辑，代码语法高亮
- 🎬 文章内视频嵌入（支持 B站、YouTube 链接自动转播放器）
- 🔍 图片点击放大预览（Lightbox）
- 🖼️ 图片管理，支持上传/删除/引用检测
- 🏷️ 文章分类管理
- 💬 评论系统（含图形验证码 + 内容风控拦截）
- 🔗 自定义导航链接（macOS Dock 风格放大效果）
- 🔍 全部文章弹窗搜索（后端搜索 + 无限滚动分页加载）
- 🌐 SEO 配置（meta description、keywords、robots）
- 📋 备案号配置（页脚 + 首页左下角）
- ©️ 自定义版权信息
- 📦 一键备份与恢复（含图片/模型数据，分批传输，兼容平台限制）
- 🔒 后台管理系统（JWT 鉴权）
- 📱 响应式设计，适配移动端
- ⚡ 边缘计算 Serverless，无需服务器
- 🔄 双平台兼容（腾讯云 EdgeOne Pages + 阿里云 ESA Pages）
- 🔀 文章拖拽排序（后台管理支持拖拽 + 上下移动调整顺序）
- 🖼️ 封面图片点击放大预览

## 技术栈

| 类别 | 技术 |
| ---- | ---- |
| 前端框架 | Vue 3 + Vue Router |
| 构建工具 | Vite |
| 3D 渲染 | Three.js + DRACO 压缩 |
| 动画 | GSAP |
| Markdown | marked + highlight.js |
| 后端 | Pages Functions (Serverless) |
| 存储 | KV 键值存储 |
| 部署 | EdgeOne Pages / 阿里云 ESA Pages |

## 项目结构

```text
blog/
├── src/
│   ├── views/
│   │   ├── Home.vue          # 首页（3D 场景 + 文章卡片 + 导航 Dock）
│   │   ├── Post.vue          # 文章详情 + 评论 + 图片预览 + 视频嵌入
│   │   ├── About.vue         # 关于页面（Markdown 渲染）
│   │   ├── Category.vue      # 分类文章列表
│   │   └── admin/            # 后台管理
│   │       ├── Dashboard.vue # 仪表盘
│   │       ├── Editor.vue    # 文章编辑器
│   │       ├── Posts.vue     # 文章管理
│   │       ├── Categories.vue# 分类管理
│   │       ├── Comments.vue  # 评论管理
│   │       ├── Images.vue    # 图片管理
│   │       ├── NavLinks.vue  # 导航链接管理
│   │       └── Settings.vue  # 站点设置
│   ├── components/
│   │   ├── ThreeScene.vue    # Three.js 3D 场景（多模型支持）
│   │   ├── ThemeToggle.vue   # 主题切换
│   │   ├── PostCard.vue      # 文章卡片
│   │   ├── NavBar.vue        # 导航栏
│   │   └── Footer.vue        # 页脚（可配置版权信息）
│   ├── api/                  # API 请求封装
│   ├── composables/          # 组合式函数
│   ├── router/               # 路由配置
│   └── styles/               # 全局样式
├── functions/                # Serverless API
│   ├── index.js              # 阿里云 ESA 统一入口路由
│   ├── api/
│   │   ├── posts.js          # 文章公开接口
│   │   ├── categories.js     # 分类公开接口
│   │   ├── settings.js       # 设置公开接口
│   │   ├── navlinks.js       # 导航链接接口
│   │   ├── comments.js       # 评论接口
│   │   ├── captcha.js        # 验证码接口
│   │   ├── _helpers.js       # 公共工具（双平台 KV 适配、JWT 鉴权）
│   │   └── admin/            # 管理接口（需认证）
│   │       ├── backup.js     # 备份与恢复（分批导出/导入）
│   │       ├── upload.js     # 文件上传（大文件自动分块）
│   │       ├── images.js     # 图片管理
│   │       └── ...
│   └── uploads/
│       └── [filename].js     # 图片/模型文件服务
├── public/                   # 静态资源
│   └── draco/                # DRACO 解码器
├── edgeone-pages.json        # EdgeOne Pages 配置
├── esa.jsonc                 # 阿里云 ESA Pages 配置
└── package.json
```

## 部署指南

### EdgeOne Pages 部署

1. Fork 本仓库到你的 GitHub
2. 登录 [EdgeOne Pages 控制台](https://edgeone.ai/pages)
3. 创建新项目，关联你的 GitHub 仓库
4. 构建配置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
5. 在项目设置 → KV 存储中创建命名空间 `blog_data`，绑定变量名为 `blog_data`
6. 部署完成后访问分配的域名

### 阿里云 ESA Pages 部署

1. Fork 本仓库到你的 GitHub / Gitee
2. 登录阿里云 ESA 控制台，进入 Pages 功能
3. 创建新项目，关联代码仓库
4. 构建配置会自动读取 `esa.jsonc`（构建命令、输出目录、函数入口）
5. 创建 EdgeKV 命名空间 `blog_data`
6. 部署完成后访问分配的域名

> 项目已内置双平台 KV 适配层和路由适配，无需修改代码即可在两个平台运行。

## 本地开发

```bash
# 安装依赖
cd blog
npm install

# 启动开发服务器
npm run dev
```

> 本地开发时 API 需要配合 Pages Functions 运行环境，前端会通过 Vite proxy 代理 `/api` 请求。

## 后台管理

访问 `https://你的域名/admin/login`

默认密码：`admin123`（登录后请在设置中修改）

### 后台功能

- 文章管理：创建、编辑、删除文章，Markdown 编辑器，拖拽排序 / 上下移动调整顺序，分类筛选，分页浏览（每页 10 条）
- 分类管理：增删分类
- 评论管理：审核、删除评论
- 图片管理：上传图片/模型，查看引用状态，清理未使用图片
- 导航链接：配置首页右侧 Dock 导航卡片
- 站点设置：
  - 站点名称、副标题、描述
  - 浏览器标题配置
  - 版权信息自定义
  - Favicon SVG 配置
  - 关于页面内容（Markdown，支持编辑/预览切换）
  - 3D 模型配置（多模型，独立缩放/位置/远近调节）
  - 社交链接
  - SEO 配置（description、keywords、robots）
  - 备案号
  - 数据备份与恢复（分批传输，支持大文件）

### 文章内嵌入视频

在 Markdown 编辑器中，直接粘贴视频链接（单独一行），发布后会自动转换为嵌入播放器：

```markdown
https://www.bilibili.com/video/BVxxxxxxxxxx

https://www.youtube.com/watch?v=xxxxxxxxxxx
```

支持的平台：B站、YouTube。

### 首页文章展示

首页卡片区域只展示在后台编辑时勾选了「展示在首页」的文章。未勾选的文章不会出现在首页卡片中，但可以通过「查看全部文章」弹窗浏览。

全部文章弹窗支持：

- 后端搜索（按标题、摘要、分类匹配）
- 分类筛选
- 无限滚动分页（每次加载 10 篇，滚动到底部自动加载下一页）

### 评论风控

评论提交时会自动检测昵称和内容，拦截以下类型：

- 广告引流（加微信、QQ、推广链接等）
- URL 和联系方式（网址、邮箱、手机号）
- 辱骂不文明用语
- 政治敏感内容
- 重复刷屏字符（连续 10 个以上相同字符）
- 纯符号无意义内容

命中规则的评论会被直接拒绝，不会入库。

## 数据存储

所有数据存储在 KV 键值存储中，无需数据库：

| Key | 说明 |
| --- | ---- |
| `site:settings` | 站点设置 |
| `posts:index` | 文章索引 |
| `post:{id}` | 文章完整内容 |
| `categories` | 分类列表 |
| `images:index` | 图片索引 |
| `image:{filename}` | 图片 base64 数据 |
| `image_meta:{filename}` | 图片元信息 |
| `image:{filename}:chunk:{n}` | 大文件分块数据 |
| `nav:links` | 导航链接 |
| `comments:{postId}` | 文章评论 |

图片和 3D 模型以 base64 编码存储在 KV 中，大文件自动分块存储（每块 512KB）。备份导出/导入均采用分批传输，兼容各平台 KV 调用次数和请求体大小限制。

## License

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans) 协议。

- ✅ 允许：复制、分发、修改、二次创作
- ✅ 要求：标明原作者及来源
- ❌ 禁止：用于商业用途
