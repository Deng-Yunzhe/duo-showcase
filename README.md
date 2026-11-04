# Duo

一个以 iPhone Duo 为主题的静态产品展示页。页面包含产品亮点、机身配色、使用场景轮播、影像展示和常见问题，适配桌面、平板和手机。

## 本地查看

直接打开 `index.html` 即可浏览。也可以在项目目录启动本地服务：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。项目不需要安装依赖或执行构建。

## 文件结构

```text
duo-showcase/
├── index.html                 页面内容
├── styles.css                 布局、动画和响应式样式
├── script.js                  首屏视频、导航、轮播、配色和搜索
├── assets/
│   ├── favicon.svg
│   ├── image-sources.json     图片来源记录
│   ├── icons/                本地 SVG 图标、来源及许可证
│   ├── images/
│   └── videos/                首屏手机展开视频
├── .gitignore
└── .nojekyll
```

## 交互

- 首屏顺序为标题、说明、展开视频，操作按钮叠在视频底部、手机下方的空白处；首屏到视频底边为止，直接接下一块。视频打开后自动播放一次，约 3 秒后停住；Safari 限制自动播放时显示播放按钮。减少动态效果或加载失败时显示静态图，没有 JavaScript 时保留轻量封面。
- 导航随当前阅读章节更新；手机菜单带展开、收起和淡入淡出过渡。
- 配色按钮切换图片，使用透明度过渡。
- 场景轮播支持箭头、进度按钮、键盘和触摸滑动；圆点长度跟着滑动位置连续变化。进度条每 5 秒走完一次，然后切换下一项；按钮和自动切换会等目标图片解码完成，等待期间保留当前内容并暂停进度。
- 鼠标停留在轮播内容上、页面进入后台或轮播离开视口时暂停。手动操作后可通过播放按钮恢复。
- FAQ 使用原生 `details` / `summary`，搜索在停止输入 250ms 后筛选，并处理中文输入法组词。
- 系统开启“减少动态效果”时，页面关闭入场过渡，轮播默认暂停。

## 实现

使用 HTML、CSS 和原生 JavaScript。布局以 Grid、Flex 和媒体查询为主，入场动画使用 `IntersectionObserver`，轮播滚动使用 CSS Scroll Snap。

首屏使用原生 `video`，由 `initHeroVideo` 启动一次播放，不需要动画库。使用约 240 KiB 的 H.264 视频和约 22 KiB 的 WebP 封面，保留 MP4 的 faststart。封面在 HTML 中优先加载，普通播放不再先请求原来的大图再更换封面。

图片保留宽高占位，距视口约 1200px 时通过 `IntersectionObserver` 提前准备，解码后短暂淡入。文字进入视口后播放一次 24px 上浮和淡入动画；图片容器保持原位，图片解码后再淡入。配色图提供压缩后的高分辨率版本，人像图改为响应式 WebP。没有 JavaScript 时仍使用浏览器原生懒加载。

刷新时清除当前章节锚点并回到顶部；平时点击章节和首次打开带锚点的链接仍可跳转。样式和脚本引用包含内容版本号，避免加载上一版缓存。图片、视频和样式均使用相对路径，支持站点子目录。

## GitHub Pages

将本目录内容放在仓库根目录，打开 `Settings → Pages`，选择 `Deploy from a branch`，分支选 `main`，目录选 `/(root)`，保存后从 `Visit site` 打开网站。

这个项目可以直接发布静态文件，`.nojekyll` 用于跳过 Jekyll 处理。详见 [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 图标

界面图标来自 [Lucide](https://lucide.dev/icons/)，以本地 SVG 图片加载。播放、暂停、菜单和问答展开状态通过切换图片显示，来源与许可证保存在 `assets/icons/`。

## 图片来源

产品图片来自 [Apple 产品页面](https://www.apple.com.cn/iphone-duo/)，逐张来源记录在 `assets/image-sources.json`。部分图片保留原图，部分按页面需要缩小为 WebP。

这是独立的前端展示作品，与 Apple 无关联。图片和商标权利归各自权利人所有，产品功能、规格和购买信息以 Apple 官网为准。
