# Pages Blog

一个基于边缘计算的现代博客系统，支持腾讯云 EdgeOne Pages 和阿里云 ESA Pages 部署。内置 3D 模型展示、暗色/亮色主题切换、Markdown 编辑器、图片管理等功能。

## 一键部署（国内站）

[![Deploy to EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?from=github&template=https://github.com/erxiansheng/pagesblog)

> 点击按钮后会自动 Fork 仓库并部署到 EdgeOne Pages，部署完成后需要在项目设置中创建 KV 命名空间。

## 预览

[[点击预览]](https://dasb.cn/)

## 功能特性

- 🎨 暗色/亮色双主题，毛玻璃 UI 风格
- 🧊 Three.js 3D 模型展示，支持多模型配置（最多 5 个）
- 📝 Markdown 文章编辑，代码高亮
- 🖼️ 图片管理，支持上传/删除/引用检测
- 🏷️ 文章分类管理
- 💬 评论系统（含验证码）
- 🔗 自定义导航链接（macOS Dock 风格放大效果）
- 🔍 文章搜索
- 🌐 SEO 配置（meta 标签、robots）
- 📋 备案号配置
- 📦 一键备份与恢复（含图片/模型数据）
- 🔒 后台管理系统
- 📱 响应式设计，适配移动端
- ⚡ 边缘计算 Serverless，无需服务器

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Vue Router （可自行打包小程序、app） |
| 构建工具 | Vite |
| 3D 渲染 | Three.js + DRACO 压缩 |
| 动画 | GSAP |
| Markdown | marked + highlight.js |
| 后端 | Pages Functions (Serverless) |
| 存储 | KV 键值存储 |
| 部署 | EdgeOne Pages / 阿里云 ESA Pages |

## 项目结构

```
blog/
├── src/
│   ├── views/
│   │   ├── Home.vue          # 首页（3D 场景 + 文章卡片 + 导航 Dock）
│   │   ├── Post.vue          # 文章详情 + 评论
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
│   │   ├── ThreeScene.vue    # Three.js 3D 场景
│   │   ├── ThemeToggle.vue   # 主题切换
│   │   ├── PostCard.vue      # 文章卡片
│   │   ├── NavBar.vue        # 导航栏
│   │   └── Footer.vue        # 页脚
│   ├── api/                  # API 请求封装
│   ├── composables/          # 组合式函数
│   ├── router/               # 路由配置
│   └── styles/               # 全局样式
├── functions/                # Serverless API
│   ├── api/
│   │   ├── posts.js          # 文章公开接口
│   │   ├── categories.js     # 分类公开接口
│   │   ├── settings.js       # 设置公开接口
│   │   ├── navlinks.js       # 导航链接接口
│   │   ├── comments.js       # 评论接口
│   │   ├── captcha.js        # 验证码接口
│   │   ├── _helpers.js       # 公共工具（KV 适配、鉴权）
│   │   └── admin/            # 管理接口（需认证）
│   │       ├── backup.js     # 备份与恢复
│   │       ├── upload.js     # 文件上传
│   │       ├── images.js     # 图片管理
│   │       └── ...
│   └── uploads/
│       └── [filename].js     # 图片/模型文件服务
├── public/                   # 静态资源
│   └── draco/                # DRACO 解码器
├── edgeone-pages.json        # EdgeOne Pages 配置
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
4. 构建配置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
5. 创建 EdgeKV 命名空间 `blog_data`
6. 部署完成后访问分配的域名

> 项目已内置双平台 KV 适配层，无需修改代码即可在两个平台运行。

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

- 文章管理：创建、编辑、删除文章，Markdown 编辑器
- 分类管理：增删分类
- 评论管理：审核、删除评论
- 图片管理：上传图片/模型，查看引用状态，清理未使用图片
- 导航链接：配置首页右侧 Dock 导航卡片
- 站点设置：
  - 站点名称、副标题、描述
  - 浏览器标题配置
  - Favicon SVG 配置
  - 关于页面内容（Markdown，支持实时预览）
  - 3D 模型配置（多模型，独立缩放/位置/远近调节）
  - 社交链接
  - SEO 配置（description、keywords、robots）
  - 备案号
  - 数据备份与恢复

## 数据存储

所有数据存储在 KV 键值存储中，无需数据库：

| Key | 说明 |
|-----|------|
| `site:settings` | 站点设置 |
| `posts:index` | 文章索引 |
| `post:{id}` | 文章完整内容 |
| `categories` | 分类列表 |
| `images:index` | 图片索引 |
| `image:{filename}` | 图片 base64 数据 |
| `image_meta:{filename}` | 图片元信息 |
| `navlinks` | 导航链接 |
| `comments:index` | 评论索引 |

图片和 3D 模型以 base64 编码存储在 KV 中，大文件自动分块存储（每块 512KB）。

## License

MIT
