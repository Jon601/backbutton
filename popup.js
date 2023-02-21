document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true, windowType: "normal"},
                      function(tabs) {
                          displayLinksForTab(tabs[0]);
                          setStyling();
                      });
});

function displayLinksForTab(tab) {
    var items = JSON.parse(localStorage["history"])[tab.id];

    // Clean up the list a bit.
    items = items.filter(function(item) {
        return item.url != tab.url;            // don't include the current URL
    });

    var displayProtocol = localStorage["show_protocol"] == "yes";
    var style = localStorage["list_style"];

    var $links = $("<div/>", {class: style.indexOf("inline_") == 0 ? "links_inline" : "links"});
    for(var i = 0; i < items.length && i < localStorage["link_num"]; i++) {
        var title = items[i].title ? items[i].title : items[i].url;
        var url = displayProtocol ? items[i].url : items[i].url.replace(/^\w+\:\/\//, "");

        //remove trailing slash
        if(url.charAt(url.length-1) == "/") {
            url = url.substr(0, url.length-1);
        }
        
        var $details = $("<div/>", {class:"details", tabIndex: 0})
            .data("url", items[i].url)
            .click(function(e) {
                // pass through right click
                if (e.button == 2) {
                    return;
                }

                e.preventDefault();

                var clickedUrl = $(this).data("url");
                var newTab = e.button == 1 || (e.button == 0 && e.ctrlKey); // middle click opens in a new tab
                navigateAndClose(clickedUrl, newTab);
            });

        var numText = i <= 8 ? i + 1 : i == 9 ? 0 : "";
        var $num = $("<div/>", {class: "num_selector", text: numText});
        $details.append($num);
        
        var $icon = $("<img/>", {class:"icon", src:"chrome://favicon/"+items[i].url});
        $details.append($icon);
        
        var $info = $("<div/>", {class:"info"});

        if(style == "double_title_url") {
            var $title = $("<div/>", {class:"title", text: title});
            var $subtitle = $("<div/>", {class:"subtitle", text: url});
            
            $info.append($title);
            $info.append($subtitle);
        } else if(style == "double_url_title") {
            var $title = $("<div/>", {class:"title", text: url});
            var $subtitle = $("<div/>", {class:"subtitle", text: title});
            
            $info.append($title);
            $info.append($subtitle);
        } else if(style == "inline_title_url") {
            var $title = $("<div/>", {class:"title", text: title + " –"});
            var $subtitle = $("<div/>", {class:"subtitle", text: url});
            
            $info.append($title);
            $info.append($subtitle);
        } else if(style == "inline_url_title") {
            var $title = $("<div/>", {class:"title", text: url});
            var $subtitle = $("<div/>", {class:"subtitle", text: "– " + title});
            
            $info.append($title);
            $info.append($subtitle);
        } else if(style == "inline_title") {
            var $title = $("<div/>", {class:"title", text: title});
            $info.attr("title", url);
            
            $info.append($title);
        } else if(style == "inline_url") {
            var $title = $("<div/>", {class:"title", text: url});
            $info.attr("title", title);
            
            $info.append($title);
        }
        
        $details.append($info);	
        $links.append($details);
    }

    $("body").append($links);
    
    $('body').keypress(function (event) {
        // ENTER checks if a template row is active and invokes its protocol.
        // Shift+Enter creates a new tab.
        if (event.which == 13) {
            var $this = $(event.target);
            var url = $this.data("url");
            if (url) {
                event.preventDefault();
                navigateAndClose(url, event.shiftKey);
                return;
            }
        }
        console.log("key: " + event.which + " shift: " + event.shiftKey);

        // Typed digits select the URL list by 1-based index.
        // First convert shift key digits to the unshifted number.
        // Then convert from digit charCodes to 0-based indexes.
        var keyCode = event.shiftKey ? shiftMap[event.keyCode] : event.keyCode;
        var index0 = keyCode - 49;

        // charCode 48, digit 0 is a special case and selects the tenth item.
        if (index0 == -1)
            index0 = 9;

        if (0 <= index0 && index0 < items.length) {
            var item = items[index0];
            navigateAndClose(item.url, event.shiftKey);
            event.preventDefault();
            return;
        }
    });
}		

// Shifted digit entry mapped to digits. ! -> 1, @ -> 2, ... ) -> 0
var shiftMap = {
    33: 49,
    64: 50,
    35: 51,
    36: 52,
    37: 53,
    94: 54,
    38: 55,
    42: 56,
    40: 57,
    41: 48
};

function setStyling() {
    $("body").width(localStorage["width"]);
    $("body").css("background-color", localStorage["background_color"]);
    $(".num_selector").css("color", localStorage["secondary_color"]);
    $(".title").css("color", localStorage["primary_color"]);
    $(".subtitle").css("color", localStorage["secondary_color"]);
    $(".links .details").css("border-bottom", "1px solid "+ localStorage["border_color"]);
    $(".links .details:last-child").css("border-bottom", "none");

    $(".details").hover(function () {
        $(this).css("background-color", localStorage["hover_color"]);
    }, function () {
        $(this).css("background-color", localStorage["background_color"]);
    });
}

// Navigates to the url using, either redirecting the current tab or opening a
// new one, and closes the popup.
function navigateAndClose(url, newTab) {
     if (newTab) {
        chrome.tabs.create({url:url, selected: localStorage["middle"] == "foreground"});
    } else {
        chrome.tabs.getSelected(null, function(tab){
            chrome.tabs.update(tab.id, {url:url});
            window.close();
        });
    }
}
