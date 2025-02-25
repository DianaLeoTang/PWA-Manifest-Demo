// 缓存版本标识符 - 更改此值将触发重新缓存
const CACHE_VERSION = 'v1.0.0';

// 缓存名称
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  pages: `pages-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`
};

// 预缓存资源列表
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles/main.css',
  '/styles/shell.css',
  '/scripts/app.js',
  '/scripts/idb.js',
  '/scripts/sync-manager.js',
  '/images/logo.svg',
  '/images/icon-192x192.png'
];

// 安装事件 - 预缓存关键资源
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装');
  
  // 跳过等待，立即激活
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => {
        console.log('[Service Worker] 预缓存资源');
        return cache.addAll(PRECACHE_RESOURCES);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活');
  
  // 立即控制页面
  event.waitUntil(self.clients.claim());
  
  // 清理旧版本缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 检查是否是当前版本的缓存
          const isCurrentCache = Object.values(CACHE_NAMES).includes(cacheName);
          if (!isCurrentCache) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        }).filter(Boolean)
      );
    })
  );
});

// 请求拦截 - 实现各种缓存策略
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 仅处理GET请求
  if (request.method !== 'GET') return;
  
  // 跳过不在同源的请求(除了字体等需要缓存的资源)
  const sameOrigin = url.origin === self.location.origin;
  
  // 根据URL模式应用不同的缓存策略
  if (request.mode === 'navigate') {
    // 导航请求的网络优先策略
    event.respondWith(networkFirstStrategy(request));
  } else if (request.url.match(/\.(jpe?g|png|gif|svg|webp)$/)) {
    // 图片缓存策略
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
  } else if (request.url.match(/\.(css|js)$/)) {
    // 静态资源缓存策略
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
  } else if (sameOrigin) {
    // 同源其他资源
    event.respondWith(networkFirstStrategy(request));
  }
});

// 网络优先策略 - 尝试从网络获取，失败时回退到缓存
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.pages);
  
  try {
    // 尝试从网络获取
    const networkResponse = await fetch(request);
    
    // 请求成功，更新缓存
    if (networkResponse.ok) {
      // 排除非安全URL，如带有身份验证信息的URL
      if (shouldCache(request)) {
        await cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 网络请求失败，使用缓存');
    
    // 从缓存中获取
    const cachedResponse = await cache.match(request);
    
    // 如果缓存中有，返回缓存
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果是导航请求且缓存中没有，返回离线页面
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // 其他情况返回404
    return new Response('Not found', { status: 404, statusText: 'Not found' });
  }
}

// 缓存优先策略 - 先从缓存获取，失败时使用网络
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  // 先尝试从缓存获取
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 缓存中没有，从网络获取
  try {
    const networkResponse = await fetch(request);
    
    // 请求成功，更新缓存
    if (networkResponse.ok && shouldCache(request)) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 网络请求失败，无缓存可用');
    
    // 对于图片，可以返回一个占位图
    if (request.url.match(/\.(jpe?g|png|gif|svg|webp)$/)) {
      return caches.match('/images/placeholder.svg');
    }
    
    // 其他情况返回404
    return new Response('Not found', { status: 404, statusText: 'Not found' });
  }
}

// 判断请求是否应该被缓存
function shouldCache(request) {
  const url = new URL(request.url);
  
  // 排除URL中带有认证信息的请求
  if (url.search.includes('token=') || url.search.includes('auth=')) {
    return false;
  }
  
  // 排除特定的API路径
  if (url.pathname.startsWith('/api/user/') || url.pathname.includes('/private/')) {
    return false;
  }
  
  return true;
}

// 后台同步事件处理
self.addEventListener('sync', event => {
  console.log('[Service Worker] 后台同步事件:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 数据同步函数
async function syncData() {
  try {
    // 从IndexedDB获取待同步数据
    const db = await openDB();
    const tx = db.transaction('offline-data', 'readonly');
    const store = tx.objectStore('offline-data');
    const items = await store.getAll();
    
    if (items.length === 0) {
      console.log('[Service Worker] 无待同步数据');
      return;
    }
    
    console.log('[Service Worker] 同步数据项:', items.length);
    
    // 发送数据到服务器
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(items)
    });
    
    if (!response.ok) {
      throw new Error('同步请求失败');
    }
    
    // 同步成功，清理已同步的数据
    const deleteTx = db.transaction('offline-data', 'readwrite');
    const deleteStore = deleteTx.objectStore('offline-data');
    await deleteStore.clear();
    await deleteTx.complete;
    
    console.log('[Service Worker] 数据同步成功');
    
    // 通知页面同步成功
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('[Service Worker] 同步失败:', error);
    return Promise.reject(error);
  }
}

// 推送通知事件处理
self.addEventListener('push', event => {
  console.log('[Service Worker] 推送消息收到');
  
  let data = {};
  
  try {
    data = event.data.json();
  } catch (error) {
    data = {
      title: '新通知',
      body: event.data ? event.data.text() : '无内容',
      icon: '/images/icon-192x192.png'
    };
  }
  
  const options = {
    body: data.body || '',
    icon: data.icon || '/images/icon-192x192.png',
    badge: '/images/badge-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件处理
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 通知点击:', event.notification.data);
  
  event.notification.close();
  
  // 处理通知操作
  if (event.action) {
    console.log('[Service Worker] 通知操作:', event.action);
    // 可以根据action执行不同操作
  }
  
  // 打开对应URL
  let url = '/';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }
  
  event.waitUntil(
    // 检查已打开的窗口并聚焦
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        // 尝试查找已经打开的窗口
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // 如果没有打开的窗口，则打开一个新窗口
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// 消息事件处理
self.addEventListener('message', event => {
  console.log('[Service Worker] 收到消息:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// IndexedDB辅助函数
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pwa-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}