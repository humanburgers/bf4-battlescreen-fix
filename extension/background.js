if (typeof browser === 'undefined') {
  globalThis.browser = chrome
}

let sockets = {};

browser.runtime.onConnect.addListener((port) => {
  if (port.name === "websocket-relay") {
    port.onMessage.addListener((msg) => {
      if (msg.action === 'open') {
        const socket = new WebSocket(msg.url, msg.protocols || []);
        sockets[msg.socketId] = socket;

        socket.onopen = () => {
          port.postMessage({ action: 'open', socketId: msg.socketId });
        };

        socket.onmessage = (event) => {
          port.postMessage({ action: 'message', data: event.data, socketId: msg.socketId });
        };

        socket.onerror = () => {
          port.postMessage({ action: 'error', socketId: msg.socketId });
        };

        socket.onclose = () => {
          port.postMessage({ action: 'close', socketId: msg.socketId });
          delete sockets[msg.socketId];
        };
      } else if (msg.action === 'send' && sockets[msg.socketId]) {
        sockets[msg.socketId].send(msg.data);
      } else if (msg.action === 'close' && sockets[msg.socketId]) {
        sockets[msg.socketId].close();
        delete sockets[msg.socketId];
      }
    });
  } else if (port.name === "keep-alive") {
    port.onMessage.addListener((msg) => {
      port.postMessage('pong')
    })
  } 
});
