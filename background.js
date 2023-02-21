//default options
if(!localStorage["list_style"]) {
  localStorage["list_style"] = "inline_title";
}

if(!localStorage["show_protocol"]) {
  localStorage["show_protocol"] = "no";
}

if(!localStorage["typed_only"]) {
  localStorage["typed_only"] = "no";
}

if(!localStorage["link_num"]) {
  localStorage["link_num"] = "12";
}

if(!localStorage["primary_color"]) {
  localStorage["primary_color"] = "#858586";
}

if(!localStorage["secondary_color"]) {
  localStorage["secondary_color"] = "#A5B7A5";
}

if(!localStorage["hover_color"]) {
  localStorage["hover_color"] = "#CDE5FF";
}

if(!localStorage["border_color"]) {
  localStorage["border_color"] = "#F1F8FF";
}

if(!localStorage["background_color"]) {
  localStorage["background_color"] = "#FFFFFF";
}

if(!localStorage["middle"]) {
  localStorage["middle"] = "foreground";
}

if(!localStorage["width"]) {
  localStorage["width"] = "400";
}

if (!localStorage["history"]) {
    localStorage["history"] = "{}";
}

// On extension startup, seed each tab's history with the current URL.
chrome.tabs.query({}, function(tabs) {
    for(var i = 0; i < tabs.length; i++) {
        pushCurrentUrl(tabs[i]);
    }
});

// Anytime a tab loads a page, add the URL.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == "loading" ||  // first access to the new URL; title==url here
        changeInfo.status == "complete") { // access to updated title
        console.log("tab " + tabId + " updated" +
                    "\nstatus: " + changeInfo.status +
                    "\nurl:     " + changeInfo.url +
                    "\ntab url: " + tab.url +
                    "\ntab title: " + tab.title);
        pushCurrentUrl(tab);
    }
});

// New tab: if opened by another tab, copy the opener's history.
// Unfortunately it's kind of buggy because the opener is set even if you
// click the new tab button or type Ctrl+T and don't necessarily use the page
// to create the tab (e.g. Ctrl+Click).
chrome.tabs.onCreated.addListener(function(tab) {
    if (tab.openerTabId) {
        console.log("tab " + tab.id + " created, copying history from " + tab.openerTabId);

        var history = JSON.parse(localStorage["history"]);
        history[tab.id] = history[tab.openerTabId] || [];
        localStorage["history"] = JSON.stringify(history);
    }
});

// When a tab is closed, we're done with it. Delete its history entry.
chrome.tabs.onRemoved.addListener(function(tabId) {
    console.log("tab " + tabId + " removed, deleting history");

    var history = JSON.parse(localStorage["history"]);
    delete history[tabId];
    localStorage["history"] = JSON.stringify(history);
});

// Listen for title changes from the tabs
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("processing request from tab " + sender.tab.id +
                "\ntab url:\t" + sender.tab.url +
                "\nnewTitle: \t" + request.newTitle +
                "\ntab title:\t" + sender.tab.title);
    pushCurrentUrl(sender.tab);
});

function pushCurrentUrl(tab) {
    var history = JSON.parse(localStorage["history"]);
    var items = history[tab.id] || [];

    if (tab.url != "chrome://newtab/") {
        // Remove previous instances of the same url.
        items = items.filter(function(i) { return i.url != tab.url; });

        // Add the current item as a custom url/title object.
        items.unshift({url: tab.url, title: tab.title});

        history[tab.id] = items;
        localStorage["history"] = JSON.stringify(history);
    }

    // 1 item is the current URL, which we don't show in the popup. Only
    // enable if there are additional items.
    if (items.length > 1)
        chrome.browserAction.enable(tab.id);
    else
        chrome.browserAction.disable(tab.id);
}
