# PWA-Manifest-Demo

这是一个使用纯原生Web技术（HTML、CSS和JavaScript）构建的渐进式Web应用(PWA)示例项目，不依赖任何前端框架或库。本项目展示了PWA的核心特性和最佳实践实现方法。

## 项目特性

- ✅ **离线工作能力**：使用Service Worker缓存策略实现完整的离线体验
- ✅ **可安装性**：通过Web App Manifest使应用可安装到主屏幕
- ✅ **响应式设计**：适配各种屏幕尺寸的设备
- ✅ **App Shell架构**：实现快速加载和即时交互的应用骨架
- ✅ **后台同步**：在网络恢复时自动同步离线数据
- ✅ **推送通知**：支持推送通知以提高用户参与度
- ✅ **IndexedDB存储**：用于离线数据持久化
- ✅ **应用更新机制**：检测和应用Service Worker更新

## 项目结构

```
native-pwa/
├── index.html                # 主页面
├── offline.html              # 离线页面
├── manifest.json             # Web App Manifest
├── sw.js                     # Service Worker
├── scripts/
│   ├── app.js                # 主应用脚本
│   ├── idb.js                # IndexedDB 工具
│   └── sync-manager.js       # 同步管理器
├── styles/
│   ├── main.css              # 主样式
│   └── shell.css             # App Shell 样式
├── images/
│   ├── icon-192x192.png      # PWA 图标 (192x192)
│   ├── icon-512x512.png      # PWA 图标 (512x512)
│   ├── maskable-icon.png     # 可遮罩图标
│   └── ...                   # 其他图片资源
└── pages/
    ├── home.html             # 主页内容片段
    ├── about.html            # 关于页内容片段
    └── settings.html         # 设置页内容片段
```

## 核心技术实现

### 1. Service Worker

`sw.js`实现了PWA的核心离线功能，包括：

- 精细的缓存策略（缓存优先、网络优先）
- 资源预缓存
- 离线页面回退
- 推送通知处理
- 后台同步

### 2. 离线数据存储

使用IndexedDB实现离线数据持久化，在`idb.js`中提供了简洁的Promise包装：

- 表单数据离线提交
- 分析数据离线收集
- 应用状态持久化

### 3. 应用架构

项目采用App Shell架构，将应用核心UI（导航、标题栏、页脚）与内容分离：

- 快速初始加载
- 内容动态注入
- 页面间无刷新导航

### 4. 响应式设计

使用现代CSS技术实现响应式布局：

- CSS Grid布局
- 媒体查询适配不同屏幕
- 移动端侧边栏导航

## 如何使用

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/native-pwa.git
   cd native-pwa
   ```

2. **本地开发**
   
   使用任何支持HTTPS的本地服务器。例如，使用Node.js的http-server：
   ```bash
   npm install -g http-server
   http-server -S -C cert.pem
   ```
   
   PWA需要HTTPS环境才能完全运行（localhost除外）。

3. **构建生产版本**
   
   可以使用任何静态网站构建工具，如：
   ```bash
   # 使用workbox-cli优化Service Worker
   npm install -g workbox-cli
   workbox generateSW workbox-config.js
   ```

4. **部署**
   
   部署到任何支持HTTPS的静态网站托管服务：
   - Netlify
   - Vercel
   - GitHub Pages (开启HTTPS)
   - Firebase Hosting

## 浏览器兼容性

本项目使用的原生PWA技术在以下浏览器中得到较好支持：

- Chrome (桌面和移动版)
- Edge (Chromium版)
- Firefox
- Safari (iOS 11.3+和macOS)
- Samsung Internet

某些高级功能（如后台同步、推送通知）在Safari中可能受限。

## 扩展开发

本项目设计为基础模板，可以轻松扩展：

1. **添加新页面**：在`pages/`目录添加新HTML文件，并在导航中添加链接

2. **扩展缓存策略**：修改`sw.js`中的缓存规则以适应特定资源需求

3. **添加新API支持**：例如，集成支付请求API、地理位置等

## 性能优化

本项目已实施的性能优化：

- 关键CSS内联
- 资源预加载
- 懒加载非关键资源
- 高效缓存策略
- 应用Shell架构

## 学习资源

如果您想深入了解PWA技术的实现细节，请参考：

- [MDN Web Docs上的PWA文档](https://developer.mozilla.org/zh-CN/docs/Web/Progressive_web_apps)
- [Google的PWA培训](https://web.dev/learn/pwa/)
- [Service Worker说明](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Web App Manifest规范](https://w3c.github.io/manifest/)

## 贡献

欢迎提交问题和改进建议！请先fork项目，然后提交拉取请求。

## 许可

本项目采用MIT许可证。详情请见LICENSE文件。