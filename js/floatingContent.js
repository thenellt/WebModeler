var logVisibility = 0;
var backgroundVisibility = 0;

var changelogButton = document.getElementById("changelogButton");
changelogButton.addEventListener('click', function() {
        var changeDiv = document.getElementById("changelog");
        var hidepage = document.getElementById("hidepage");
        if(backgroundVisibility){
                var backgroundDiv = document.getElementById("projBackground");
                backgroundVisibility = 0;
                logVisibility = 1;
                fadeOut(backgroundDiv);
                fadeIn(changeDiv);
        }
        else if(logVisibility == 0){
                console.log("unhiding");
                logVisibility = 1;
                fadeIn(changeDiv);
                fadeIn(hidepage);
        }
        else{
                console.log("hiding");
                logVisibility = 0;
                fadeOut(changeDiv);
                fadeOut(hidepage);
        }
});

var changelogButton = document.getElementById("backgroundButton");
changelogButton.addEventListener('click', function() {
        var backgroundDiv = document.getElementById("projBackground");
        var hidepage = document.getElementById("hidepage");
        if(logVisibility){
                var changeDiv = document.getElementById("changelog");
                backgroundVisibility = 1;
                logVisibility = 0;
                fadeOut(changeDiv);
                fadeIn(backgroundDiv);
        }
        else if(backgroundVisibility == 0){
                console.log("unhiding");
                backgroundVisibility = 1;
                fadeIn(backgroundDiv);
                fadeIn(hidepage);
        }
        else{
                console.log("hiding");
                backgroundVisibility = 0;
                fadeOut(backgroundDiv);
                fadeOut(hidepage);
        }
});

//pure javascript fade and unfade from: https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
function fadeOut(element) {
        var op = 1;  // initial opacity
        var timer = setInterval(function () {
                if (op <= 0.1){
                        clearInterval(timer);
                        element.style.visibility = "hidden";
                }
                element.style.opacity = op;
                element.style.filter = 'alpha(opacity=' + op * 100 + ")";
                op -= op * 0.1;
        }, 20);
}

function fadeIn(element) {
        var op = 0.1;  // initial opacity
        element.style.opacity = op;
        element.style.visibility = "visible";
        var timer = setInterval(function () {
                if (op >= 1){
                        clearInterval(timer);
                }
                element.style.opacity = op;
                element.style.filter = 'alpha(opacity=' + op * 100 + ")";
                op += op * 0.1;
        }, 20);
}

//taken from a handy stack overflow: https://stackoverflow.com/questions/27840222/how-can-i-load-the-contents-of-a-small-text-file-into-a-javascript-var-wo-jquery
var readLocalFile = function (url, type, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
                callback(this.responseText);
        };
        xhr.open(type, url);
        xhr.send();
};

readLocalFile("./changelog.txt", 'GET', function(responseText) {
        var splitLog = responseText.split("\n");

        var list = document.createElement('ul');
        list.className = "collection";

        for(i = 0; i < splitLog.length - 1; i++){
                var content = splitLog[i].split('-');

                var item = document.createElement('li');
                item.className = "collection-item";

                var title = document.createElement('span');
                title.className = "title";
                title.appendChild(document.createTextNode(content[0].slice(0, -1)));

                var innerText = document.createElement('p');
                innerText.appendChild(document.createTextNode(content[1].slice(0, -3)));

                item.appendChild(title);
                item.appendChild(innerText);

                list.appendChild(item);
        }
        
        document.getElementById("changelogTitle").appendChild(document.createTextNode("Project Change Log:"));
        document.getElementById('changelogContent').appendChild(list);
});
