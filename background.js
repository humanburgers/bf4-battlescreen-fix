let sockets = {};

browser.runtime.onConnect.addListener(function(port) {
  if (port.name === "websocket-relay") {
    port.onMessage.addListener(function(msg) {
      if (msg.action === 'open') {
        const socket = new WebSocket(msg.url, msg.protocols || []);
        sockets[msg.socketId] = socket;

        socket.onopen = function() {
          port.postMessage({ action: 'open', socketId: msg.socketId });
        };

        socket.onmessage = function(event) {
          port.postMessage({ action: 'message', data: event.data, socketId: msg.socketId });
        };

        socket.onerror = function() {
          port.postMessage({ action: 'error', socketId: msg.socketId });
        };

        socket.onclose = function() {
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
  }
});
