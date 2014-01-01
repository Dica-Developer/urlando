/*global chrome*/
chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create('view/main.html', {
    'state': 'maximized'
  }, function () {
  });
});