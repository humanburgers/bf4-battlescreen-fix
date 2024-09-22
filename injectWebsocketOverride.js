console.log("BF4 Battlescreen Fix")

function injectWebSocketOverride() {
    const originalWebSocket = window.WebSocket;
  
    // Define the URLs that should bypass the extension's WebSocket override
    const bypassUrls = ['wss://beaconpush.battlelog.com/'];
  
    // Overwrite the WebSocket constructor
    window.WebSocket = function(url, protocols) {
      // Check if the WebSocket URL matches one of the bypass URLs
      const shouldBypass = bypassUrls.some(bypassUrl => url.startsWith(bypassUrl));
  
      // If the WebSocket URL matches a bypass URL, use the normal WebSocket mechanism
      if (shouldBypass) {
        return new originalWebSocket(url, protocols);
      }
  
      // Otherwise, use the custom WebSocket mechanism to route through the extension
      const socketId = Math.random().toString(36).substr(2, 9);
  
      // Send a message to the content script via window.postMessage
      window.postMessage({ action: 'open', url: url, protocols: protocols, socketId: socketId }, '*');
  
      // Create a custom event system to store event listeners
      const eventListeners = {
        open: [],
        message: [],
        close: [],
        error: []
      };
  
      const ws = {
        // Event properties (page script can assign directly)
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
  
        send: function(data) {
          window.postMessage({ action: 'send', data: data, socketId: socketId }, '*');
        },
  
        close: function() {
          window.postMessage({ action: 'close', socketId: socketId }, '*');
        },
  
        // Support addEventListener for WebSocket events
        addEventListener: function(event, callback) {
          if (eventListeners[event]) {
            eventListeners[event].push(callback);
          }
        },
  
        // Support removeEventListener for WebSocket events
        removeEventListener: function(event, callback) {
          if (eventListeners[event]) {
            const index = eventListeners[event].indexOf(callback);
            if (index > -1) {
              eventListeners[event].splice(index, 1);
            }
          }
        },
  
        // Dispatch events and call event listeners
        _dispatchEvent: function(event, data) {
          // Call the event listeners registered via addEventListener
          if (eventListeners[event]) {
            eventListeners[event].forEach(function(callback) {
              callback(data);
            });
          }
  
          // Call the corresponding event handler property (e.g., ws.onopen)
          const handler = ws[`on${event}`];
          if (typeof handler === 'function') {
            handler(data);
          }
        }
      };
  
      // Listen for messages from the content script and dispatch events
      window.addEventListener('message', function(event) {
        if (event.data.socketId === socketId) {
          if (event.data.action === 'open') {
            ws._dispatchEvent('open');
          } else if (event.data.action === 'message') {
            ws._dispatchEvent('message', { data: event.data.data });
          } else if (event.data.action === 'close') {
            ws._dispatchEvent('close');
          } else if (event.data.action === 'error') {
            ws._dispatchEvent('error');
          }
        }
      });
  
      return ws;
    };
}
  
// Inject the script into the page's DOM
const script = document.createElement('script');
script.textContent = `(${injectWebSocketOverride.toString()})();`;
document.documentElement.appendChild(script);
console.log("websocket override injected")
// script.remove();
  