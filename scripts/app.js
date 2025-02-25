/**
 * 原生PWA示例应用主脚本
 */
(function() {
    'use strict';
    
    // DOM元素
    const contentElement = document.getElementById('content');
    const offlineNotification = document.getElementById('offline-notification');
    const updateNotification = document.getElementById('update-notification');
    const updateButton = document.getElementById('update-button');
    const installButton = document.getElementById('install-button');
    const syncButton = document.getElementById('sync-button');
    const notificationButton = document.getElementById('notification-button');
    const menuButton = document.querySelector('.menu-button');
    const sideNav = document.querySelector('.side-nav');
    const navItems = document.querySelectorAll('.nav-item');
    
    // PWA安装事件
    let deferredPrompt;
    
    // 应用状态
    let isOnline = navigator.onLine;
    let currentPage = 'home';
    let newWorker = null;
    
    // 初始化应用
    function init() {
      // 注册事件监听器
      registerEventListeners();
      
      // 更新在线状态
      updateOnlineStatus();
      
      // 加载默认页面
      loadPage(currentPage);
      
      // 监听Service Worker更新
      listenForServiceWorkerUpdates();
      
      console.log('PWA应用初始化完成');
    }
    
    // 注册事件监听器
    function registerEventListeners() {
      // 在线状态变化
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      
      // 安装按钮
      installButton.addEventListener('click', installApp);
      
      // 更新按钮
      updateButton.addEventListener('click', updateServiceWorker);
      
      // 同步按钮
      syncButton.addEventListener('click', syncData);
      
      // 通知按钮
      notificationButton.addEventListener('click', requestNotificationPermission);
      
      // 菜单按钮
      menuButton.addEventListener('click', toggleMenu);
      
      // 导航项点击
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          // 获取页面名称
          const pageName = item.dataset.page;
          
          // 更新选中状态
          navItems.forEach(navItem => {
            navItem.classList.remove('active');
          });
          item.classList.add('active');
          
          // 加载页面
          loadPage(pageName);
          
          // 在移动设备上关闭菜单
          if (window.innerWidth < 768) {
            sideNav.classList.remove('open');
          }
        });
      });
      
      // 监听Service Worker消息
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('从Service Worker收到消息:', event.data);
        
        if (event.data.type === 'SYNC_COMPLETED') {
          showToast('数据同步成功', 'success');
        }
      });
      
      // 捕获应用安装事件
      window.addEventListener('beforeinstallprompt', event => {
        // 阻止Chrome自动显示安装提示
        event.preventDefault();
        
        // 保存事件，以便稍后触发
        deferredPrompt = event;
        
        // 显示安装按钮
        installButton.style.display = 'block';
      });
      
      // 安装完成事件
      window.addEventListener('appinstalled', () => {
        // 隐藏安装按钮
        installButton.style.display = 'none';
        
        // 清除延迟的提示
        deferredPrompt = null;
        
        console.log('PWA已安装');
        
        // 可以发送安装完成的分析数据
        sendAnalytics('pwa-installed');
      });
    }
    
    // 切换菜单显示
    function toggleMenu() {
      sideNav.classList.toggle('open');
    }
    
    // 更新在线状态
    function updateOnlineStatus() {
      isOnline = navigator.onLine;
      
      if (isOnline) {
        offlineNotification.style.display = 'none';
        syncButton.disabled = false;
        
        // 尝试同步离线数据
        syncManager.trySyncOfflineData();
      } else {
        offlineNotification.style.display = 'block';
        syncButton.disabled = true;
      }
      
      console.log('在线状态:', isOnline ? '在线' : '离线');
    }
    
    // 加载页面内容
    async function loadPage(pageName) {
      currentPage = pageName;
      
      // 显示加载指示器
      contentElement.innerHTML = '<div class="loader">加载中...</div>';
      
      try {
        // 尝试从缓存或网络获取页面内容
        const response = await fetch(`/pages/${pageName}.html`);
        
        if (response.ok) {
          const html = await response.text();
          contentElement.innerHTML = html;
          
          // 执行页面特定的初始化
          if (window[`init${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page`]) {
            window[`init${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page`]();
          }
        } else {
          throw new Error(`无法加载页面: ${pageName}`);
        }
      } catch (error) {
        console.error('加载页面失败:', error);
        
        // 显示错误消息
        contentElement.innerHTML = `
          <div class="error-container">
            <h2>无法加载页面</h2>
            <p>${isOnline ? '请稍后重试。' : '您当前处于离线状态。'}</p>
            <button onclick="loadPage('${pageName}')">重试</button>
          </div>
        `;
      }
    }
    
    // 监听Service Worker更新
    function listenForServiceWorkerUpdates() {
      if ('serviceWorker' in navigator) {
        // 监听控制器变化事件
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker控制器已更改');
        });
        
        // 检查更新
        navigator.serviceWorker.ready.then(registration => {
          // 定期检查更新
        setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // 每小时检查一次
          
          registration.addEventListener('updatefound', () => {
            console.log('发现Service Worker更新');
            
            // 获取安装中的Service Worker
            newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              // 当新的Service Worker安装完成并等待激活时
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('新版本已准备就绪');
                // 显示更新通知
                updateNotification.style.display = 'block';
              }
            });
          });
        });
      }
    }
    
    // 更新Service Worker
    function updateServiceWorker() {
      if (newWorker) {
        // 通知Service Worker跳过等待
        newWorker.postMessage({ type: 'SKIP_WAITING' });
      }
      // 隐藏更新通知
      updateNotification.style.display = 'none';
    }
    
    // 安装PWA应用
    function installApp() {
      if (!deferredPrompt) {
        console.log('未捕获到安装事件');
        return;
      }
      
      // 显示安装提示
      deferredPrompt.prompt();
      
      // 等待用户响应
      deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('用户接受安装');
        } else {
          console.log('用户拒绝安装');
        }
        
        // 清除延迟提示
        deferredPrompt = null;
      });
    }
    
    // 同步数据
    function syncData() {
      if (!isOnline) {
        showToast('离线状态无法同步数据', 'error');
        return;
      }
      
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          // 注册同步任务
          registration.sync.register('sync-data')
            .then(() => {
              console.log('后台同步已注册');
              showToast('同步已开始', 'info');
            })
            .catch(error => {
              console.error('注册同步失败:', error);
              showToast('同步注册失败', 'error');
            });
        });
      } else {
        // 不支持后台同步，使用普通同步
        syncManager.syncDataImmediately()
          .then(() => {
            showToast('数据同步成功', 'success');
          })
          .catch(error => {
            console.error('同步失败:', error);
            showToast('同步失败', 'error');
          });
      }
    }
    
    // 请求通知权限
    function requestNotificationPermission() {
      if (!('Notification' in window)) {
        showToast('您的浏览器不支持通知功能', 'error');
        return;
      }
      
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('通知权限已授予');
          showToast('通知已启用', 'success');
          
          // 订阅推送服务
          subscribeToPushManager();
        } else {
          console.log('通知权限被拒绝');
          showToast('通知权限被拒绝', 'error');
        }
      });
    }
    
    // 订阅推送服务
    function subscribeToPushManager() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('推送通知不受支持');
        return;
      }
      
      navigator.serviceWorker.ready.then(registration => {
        // 检查现有订阅
        registration.pushManager.getSubscription()
          .then(subscription => {
            if (subscription) {
              console.log('已有推送订阅');
              return subscription;
            }
            
            // 获取服务器公钥
            return fetch('/api/push/public-key')
              .then(response => response.json())
              .then(data => {
                // 转换公钥
                const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
                
                // 创建新订阅
                return registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: applicationServerKey
                });
              });
          })
          .then(subscription => {
            // 将订阅信息发送到服务器
            return fetch('/api/push/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ subscription })
            });
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('订阅推送服务失败');
            }
            
            console.log('推送服务订阅成功');
            showToast('推送通知已启用', 'success');
            
            // 显示测试通知
            showNotification('通知测试', '您已成功启用推送通知！');
          })
          .catch(error => {
            console.error('订阅推送服务失败:', error);
            showToast('订阅推送服务失败', 'error');
          });
      });
    }
    
    // 显示通知
    function showNotification(title, body) {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body: body,
            icon: '/images/icon-192x192.png',
            badge: '/images/badge-icon.png',
            vibrate: [100, 50, 100]
          });
        });
      }
    }
    
    // 显示toast消息
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      // 显示动画
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      // 自动消失
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }
    
    // 将base64字符串转换为Uint8Array (用于Web Push)
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
        
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      return outputArray;
    }
    
    // 发送分析数据
    function sendAnalytics(action, data = {}) {
      if (!isOnline) {
        // 离线时将分析数据存储到IndexedDB
        syncManager.storeAnalytics(action, data);
        return;
      }
      
      // 发送分析数据到服务器
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          data,
          timestamp: new Date().toISOString()
        })
      }).catch(error => {
        console.error('发送分析数据失败:', error);
        // 发送失败时存储到IndexedDB
        syncManager.storeAnalytics(action, data);
      });
    }
    
    // 初始化应用
    init();
    
    // 导出公共API
    window.app = {
      loadPage,
      showToast,
      showNotification,
      syncData
    };
  })();
     