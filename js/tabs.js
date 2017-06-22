//based on vertical tab tutorial from: https://www.w3schools.com/howto/howto_js_vertical_tabs.asp
function changeTab(tabName) {
    var i, tabcontent, tablinks;
    var tabButtonName = tabName + "Tab";
    console.log("tabButtonName: " + tabButtonName);

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabButtonName).className += " active";
    //evt.currentTarget.className += " active";
}
