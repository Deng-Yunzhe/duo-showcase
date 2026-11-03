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
├── script.js                  导航、轮播、配色和搜索
├── assets/
│   ├── favicon.svg
│   ├── image-sources.json     图片来源记录
│   └── images/
├── .gitignore
└── .nojekyll
```

## 交互

- 导航随当前阅读章节更新；手机端可以展开菜单。
- 配色按钮切换图片，使用透明度过渡。
- 场景轮播支持箭头、进度按钮、键盘和触摸滑动。进度条每 5 秒走完一次，然后切换下一项。
- 鼠标停留在轮播内容上、页面进入后台或轮播离开视口时暂停。手动操作后可通过播放按钮恢复。
- FAQ 使用原生 `details` / `summary`，搜索在停止输入 250ms 后筛选，并处理中文输入法组词。
- 系统开启“减少动态效果”时，页面关闭入场过渡，轮播默认暂停。

## 实现

使用 HTML、CSS 和原生 JavaScript。布局以 Grid、Flex 和媒体查询为主，入场动画使用 `IntersectionObserver`，轮播滚动使用 CSS Scroll Snap。

首屏图片设置较高加载优先级，其他内容图片按需加载；部分图片通过 `srcset` 提供不同尺寸。图片和样式均使用相对路径，支持放在站点子目录中。

## GitHub Pages

将本目录内容放在仓库根目录，打开 `Settings → Pages`，选择 `Deploy from a branch`，分支选 `main`，目录选 `/(root)`，保存后从 `Visit site` 打开网站。

这个项目可以直接发布静态文件，`.nojekyll` 用于跳过 Jekyll 处理。详见 [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 图片来源

产品图片来自 [Apple 产品页面](https://www.apple.com.cn/iphone-duo/)，逐张来源记录在 `assets/image-sources.json`。部分图片保留原图，部分按页面需要缩小为 WebP。

这是独立的前端展示作品，与 Apple 无关联。图片和商标权利归各自权利人所有，产品功能、规格和购买信息以 Apple 官网为准。
