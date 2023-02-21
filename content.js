// Normal chrome.tabs.onUpdated events don't see the updated title from a hashchange,
// so we send those over from the window.
var title = document.getElementsByTagName('title')[0];
if (title) {
    title.addEventListener('DOMSubtreeModified', function (e) {
        chrome.runtime.sendMessage({newTitle: document.title});
    }, false);
} else {
    console.log("no title found in the document");
}

// MutationObserver is the new way to get DOM update notification, but it's not working for me.
// var target = document.querySelector('head > title');
// var observer = new window.WebKitMutationObserver(function(mutations) {
//     mutations.forEach(function(mutation) {
//         chrome.runtime.sendMessage({newTitle: mutation.target.textContent});
//     });
// });
// observer.observe(target, {characterData: true });

// hashchange doesn't seem to be needed; tabs.onUpdated fires for this
//window.addEventListener('hashchange', function(a) {
//    chrome.runtime.sendMessage({newUrl: a.newURL});
//});
