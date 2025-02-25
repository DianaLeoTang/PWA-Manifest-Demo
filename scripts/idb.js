/**
 * IndexedDB工具库
 * 简化IndexedDB操作的Promise封装
 */
(function() {
    'use strict';
    
    const DB_NAME = 'pwa-db';
    const DB_VERSION = 1;
    
    // 存储对象
    const STORES = {
      OFFLINE_DATA: 'offline-data',
      ANALYTICS: 'analytics',
      CACHE_METADATA: 'cache-metadata'
    };
    
    // 打开数据库
    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = event => {
          const db = event.target.result;
          
          // 创建存储对象
          if (!db.objectStoreNames.contains(STORES.OFFLINE_DATA)) {
            db.createObjectStore(STORES.OFFLINE_DATA, { keyPath: 'id', autoIncrement: true });
          }
          
          if (!db.objectStoreNames.contains(STORES.ANALYTICS)) {
            db.createObjectStore(STORES.ANALYTICS, { keyPath: 'id', autoIncrement: true });
          }
          
          if (!db.objectStoreNames.contains(STORES.CACHE_METADATA)) {
            db.createObjectStore(STORES.CACHE_METADATA, { keyPath: 'url' });
          }
        };
      });
    }
    
    // 基本CRUD操作
    
    // 添加数据
    function addItem(storeName, item) {
      return openDB().then(db => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.add(item);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          
          // 完成事务
          transaction.oncomplete = () => db.close();
        });
      });
    }
    
    // 获取所有数据
    function getAllItems(storeName) {
      return openDB().then(db => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          
          // 完成事务
          transaction.oncomplete = () => db.close();
        });
      });
    }
    
    // 根据ID获取数据
    function getItem(storeName, id) {
      return openDB().then(db => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(id);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          
          // 完成事务
          transaction.oncomplete = () => db.close();
        });
      });
    }
    
    // 更新数据
    function updateItem(storeName, item) {
      return openDB().then(db => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(item);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          
          // 完成事务
          transaction.oncomplete = () => db.close();
        });
      });
    }
    
    // 删除数据
    function deleteItem(storeName, id) {
      return openDB().then(db => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(id);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          
          // 完成事务
          transaction.oncomplete = () => db.close();
        });
      });
    }
    
    // 清空存储对象
    function clearStore(storeName) {
      return openDB().then(db => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          
          // 完成事务
          transaction.oncomplete = () => db.close();
        });
      });
    }
    
    // 导出API
    window.idb = {
      STORES,
      addItem,
      getAllItems,
      getItem,
      updateItem,
      deleteItem,
      clearStore
    };
  })();