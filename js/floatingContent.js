var logVisibility = 0;
var backgroundVisibility = 0;
var otherPopup = 0;

//fade and unfade from: https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
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
        }, 10);
}

function fadeIn(element) {
        var op = 0.1;  // initial opacity
        element.style.opacity = op;
        element.style.visibility = "visible";
        var timer = setInterval(function () {
                if (op >= 0.8){
                        clearInterval(timer);
                }
                element.style.opacity = op;
                element.style.filter = 'alpha(opacity=' + op * 100 + ")";
                op += op * 0.1;
        }, 10);
}

function toggleChangelog() {
        console.log("toggleChangelog called");
        var changeDiv = document.getElementById('changelogContent');
        var hidepage = document.getElementById("hidepage");
        if(backgroundVisibility){
                var backgroundDiv = document.getElementById("backgroundContent");
                backgroundVisibility = 0;
                logVisibility = 1;
                backgroundDiv.classList.add('scale-out');
                backgroundDiv.classList.remove('scale-in');
                changeDiv.classList.add('scale-in');
                changeDiv.classList.remove('scale-out');
        }
        else if(logVisibility === 0){
                console.log("unhiding");
                logVisibility = 1;
                if(!otherPopup){
                        fadeIn(hidepage);
                }
                changeDiv.classList.add('scale-in');
                changeDiv.classList.remove('scale-out');
        }
        else{
                console.log("hiding");
                logVisibility = 0;
                changeDiv.classList.add('scale-out');
                changeDiv.classList.remove('scale-in');
                if(!otherPopup){
                        fadeOut(hidepage);
                }
        }
}

function toggleBackground() {
        console.log("toggleBackground called");
        var backgroundDiv = document.getElementById("backgroundContent");
        var hidepage = document.getElementById("hidepage");
        if(logVisibility){
                var changeDiv = document.getElementById("changelogContent");
                backgroundVisibility = 1;
                logVisibility = 0;
                backgroundDiv.classList.add('scale-in');
                backgroundDiv.classList.remove('scale-out');
                changeDiv.classList.add('scale-out');
                changeDiv.classList.remove('scale-in');
        }
        else if(backgroundVisibility === 0){
                console.log("unhiding");
                backgroundVisibility = 1;
                backgroundDiv.classList.add('scale-in');
                backgroundDiv.classList.remove('scale-out');
                if(!otherPopup){
                        fadeIn(hidepage);
                }
        }
        else{
                console.log("hiding");
                backgroundVisibility = 0;
                backgroundDiv.classList.add('scale-out');
                backgroundDiv.classList.remove('scale-in');
                if(!otherPopup){
                        fadeOut(hidepage);
                }
        }
}

//taken from a handy stack overflow: https://stackoverflow.com/questions/27840222/how-can-i-load-the-contents-of-a-small-text-file-into-a-javascript-var-wo-jquery
function readLocalFile(url, type, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
                callback(this.responseText);
        };
        xhr.open(type, url);
        xhr.send();
}

readLocalFile("./changelog.txt", 'GET', function(responseText) {
        var splitLog = responseText.split("\n");

        var list = document.createElement('ul');
        list.className = "collection";

        for(let i = 0; i < splitLog.length - 1; i++){
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
        document.getElementById('changeLogEntries').appendChild(list);
});

function createFloatingDialog(title, message, type, response){ //0 - ok/cancel. 1 - ok
        var hidepage = document.getElementById("hidepage");
        var dialogBox = document.createElement('div');
        dialogBox.classList.add("hide floatingDialog card blue-grey lighten-4 scale-transition scale-in");


        document.body.appendChild(dialogBox);
}
