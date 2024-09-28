if (typeof browser === 'undefined') {
    globalThis.browser = chrome
}

console.log("BF4 Battlescreen Fix")

// Inject the script into the page's DOM
const script = document.createElement('script');
script.src = browser.runtime.getURL("websocketOverride.js")
document.documentElement.appendChild(script);
