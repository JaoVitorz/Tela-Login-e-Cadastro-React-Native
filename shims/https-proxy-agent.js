// Minimal shim for `https-proxy-agent` to satisfy Metro bundler in React Native.
// This module is only a noop replacement — axios's HTTP adapter will not use
// proxy support in React Native runtime.

function HttpsProxyAgent() {
  // noop
}

module.exports = HttpsProxyAgent;
