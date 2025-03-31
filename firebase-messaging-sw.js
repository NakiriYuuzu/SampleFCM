// Firebase Messaging Service Worker (最新版本)
// 此文件必須放在網站根目錄，或者與 HTML 文件相同目錄，取決於註冊方式

// 導入所需的 Firebase 庫 (使用兼容版，以便在 Service Worker 中使用)
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// 記錄日誌函數
function logSW(message) {
    console.log(`[Firebase SW] ${message}`);
}

logSW('Service Worker 正在初始化...');

// Firebase 設定檔
const firebaseConfig = {
    apiKey: "AIzaSyAlLoT-3L_cDiqgnTjWKy_5KpgqXM2BAM0",
    authDomain: "gsweb-app.firebaseapp.com",
    projectId: "gsweb-app",
    storageBucket: "gsweb-app.firebasestorage.app",
    messagingSenderId: "975280210572",
    appId: "1:975280210572:web:911dc6c4cafe25a6d5f1a9"
};

try {
    // 初始化 Firebase
    firebase.initializeApp(firebaseConfig);
    logSW('Firebase 初始化成功');

    // 獲取 Messaging 實例
    const messaging = firebase.messaging();
    logSW('Firebase Messaging 設置完成');

    // 處理後台通知
    messaging.onBackgroundMessage((payload) => {
        logSW('收到背景消息: ' + (payload.notification?.title || '未命名消息'));

        // 提取通知數據
        const notificationTitle = payload.notification?.title || '新通知';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: '/favicon.ico',  // 可替換為您的應用圖標
            badge: '/badge-icon.png',  // 可選的通知標記圖標
            data: payload.data || {},
            // 添加震動模式
            vibrate: [200, 100, 200],
            // 設置通知的優先級 (需由 FCM payload 控制)
            // 添加操作按鈕 (如果需要)
            actions: [
                {
                    action: 'view',
                    title: '查看'
                },
                {
                    action: 'close',
                    title: '關閉'
                }
            ]
        };

        // 顯示通知
        self.registration.showNotification(notificationTitle, notificationOptions);
    });

    logSW('背景消息處理器設置完成');
} catch (error) {
    logSW('Firebase 初始化失敗: ' + error.message);
}

// 處理通知點擊事件
self.addEventListener('notificationclick', (event) => {
    logSW('用戶點擊了通知: ' + event.notification.title);

    // 關閉通知
    event.notification.close();

    // 獲取操作 ID (如果有點擊操作按鈕)
    const action = event.action;
    if (action) {
        logSW('用戶執行的操作: ' + action);
    }

    // 獲取通知中的自定義數據 (如果有)
    const customData = event.notification.data;

    // 默認導航目標為網站根目錄
    let targetUrl = self.location.origin;

    // 如果自定義數據中包含目標 URL，則使用該 URL
    if (customData && customData.url) {
        targetUrl = customData.url;
    }

    // 點擊通知后執行的操作
    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    })
        .then((windowClients) => {
            // 檢查是否已經有打開的窗口
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];

                // 如果找到匹配的窗口，則聚焦它
                if (client.url === targetUrl && 'focus' in client) {
                    logSW('找到現有窗口，進行聚焦');
                    return client.focus();
                }
            }

            // 如果沒有匹配的窗口，則打開新窗口
            if (clients.openWindow) {
                logSW('打開新窗口: ' + targetUrl);
                return clients.openWindow(targetUrl);
            }
        })
        .catch(error => {
            logSW('處理通知點擊時出錯: ' + error.message);
        });

    event.waitUntil(promiseChain);
});

// 安裝事件處理
self.addEventListener('install', (event) => {
    logSW('Service Worker 正在安裝');
    self.skipWaiting();
});

// 激活事件處理
self.addEventListener('activate', (event) => {
    logSW('Service Worker 已激活');
    return self.clients.claim();
});

// 推送事件處理 (這是一個備用機制，當 onBackgroundMessage 未觸發時)
self.addEventListener('push', (event) => {
    logSW('接收到推送事件');

    // 嘗試解析推送數據
    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = {
            notification: {
                title: '新推送通知',
                body: event.data ? event.data.text() : '無內容'
            }
        };
    }

    // 提取通知數據
    const title = payload.notification?.title || '新通知';
    const options = {
        body: payload.notification?.body || '',
        icon: '/favicon.ico',
        data: payload.data || {}
    };

    // 顯示通知
    const promiseChain = self.registration.showNotification(title, options);
    event.waitUntil(promiseChain);
});

logSW('Service Worker 初始化完成');