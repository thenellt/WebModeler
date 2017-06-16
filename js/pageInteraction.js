var visibilityToggle = 0;

var changelogButton = document.getElementById("changelogButton");
changelogButton.addEventListener('click', function() {
        var changeDiv = document.getElementById("changelog");
        var hidepage = document.getElementById("hidepage");
        if(visibilityToggle == 0){
                console.log("unhiding");
                visibilityToggle = 1;
                changeDiv.style.visibility = "visible";
                hidepage.style.visibility = "visible";
        }
        else{
                console.log("hiding");
                visibilityToggle = 0;
                changeDiv.style.visibility = "hidden";
                hidepage.style.visibility = "hidden";
        }
});

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
        var title = document.getElementById("changelogTitle");
        var content = document.getElementById("changelogContent");
        title.innerHTML = "Project Change Log";
        content.innerHTML = responseText;
        console.log("This is the content you got: " + responseText);
});
