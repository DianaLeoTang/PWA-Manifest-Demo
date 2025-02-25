/**
 * 同步管理器
 * 处理离线数据存储和同步
 */
(function() {
    'use strict';
    
    // 存储表单提交数据
    function storeFormData(formData) {
      return idb.addItem(idb.STORES.OFFLINE_DATA, {
        type: 'form',
        data: formData,
        timestamp: new Date().toISOString()
      });
    }
    
    // 存储分析数据
    function storeAnalytics(action, data) {
      return idb.addItem(idb.STORES.ANALYTICS, {
        type: 'analytics',
        action,
        data,
        timestamp: new Date().toISOString()
      });
    }
    
    // 尝试同步数据
    function trySyncOfflineData() {
      // 检查是否在线
      if (!navigator.onLine) {
        console.log('离线状态，无法同步数据');
        return Promise.resolve(false);
      }
      
      // 检查是否支持后台同步
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        return navigator.serviceWorker.ready
          .then(registration => {
            return registration.sync.register('sync-data')
              .then(() => {
                console.log('已注册后台同步任务');
                return true;
              })
              .catch(error => {
                console.error('注册后台同步失败:', error);
                // 回退到即时同步
                return syncDataImmediately();
              });
          });
      } else {
        // 不支持后台同步，使用即时同步
        return syncDataImmediately();
      }
    }
    
    // 立即同步数据
    function syncDataImmediately() {
      console.log('开始即时同步数据');
      
      return idb.getAllItems(idb.STORES.OFFLINE_DATA)
        .then(items => {
          if (items.length === 0) {
            console.log('无离线数据需要同步');
            return { success: true, synced: 0 };
          }
          
          console.log(`发现${items.length}个待同步项`);
          
          return fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(items)
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('同步请求失败');
            }
            return response.json();
          })
          .then(result => {
            console.log('同步成功:', result);
            
            // 清除已同步的数据
            return idb.clearStore(idb.STORES.OFFLINE_DATA)
              .then(() => {
                return { success: true, synced: items.length };
              });
          });
        })
        .catch(error => {
          console.error('即时同步失败:', error);
          return { success: false, error: error.message };
        });
    }
    
    // 导出API
    window.syncManager = {
      storeFormData,
      storeAnalytics,
      trySyncOfflineData,
      syncDataImmediately
    };
  })();