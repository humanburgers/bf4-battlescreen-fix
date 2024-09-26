
const keepAlivePort = browser.runtime.connect({ name:'keep-alive' })
// Periodically send message to background script to prevent it from getting terminated
setInterval(() => {
  keepAlivePort.postMessage('ping')
}, 1000)



// Listen for messages from the page script
window.addEventListener('message', (event) => {
    if (event.source !== window) {
      return; // Ignore messages not from the same window
    }
  
    if (event.data.action === 'open') {
      const port = browser.runtime.connect({ name: "websocket-relay" });
      port.postMessage({ action: 'open', url: event.data.url, protocols: event.data.protocols, socketId: event.data.socketId });
  
      // Relay messages between the background script and the page
      port.onMessage.addListener((msg) => {
        window.postMessage({ action: msg.action, data: msg.data, socketId: msg.socketId }, '*');
      });
    } else if (event.data.action === 'send') {
      const port = browser.runtime.connect({ name: "websocket-relay" });
      port.postMessage({ action: 'send', data: event.data.data, socketId: event.data.socketId });
    } else if (event.data.action === 'close') {
      const port = browser.runtime.connect({ name: "websocket-relay" });
      port.postMessage({ action: 'close', socketId: event.data.socketId });
    }
  });
  