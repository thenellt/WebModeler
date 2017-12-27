/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* global map */
var populationView = 1;

//based on vertical tab tutorial from: https://www.w3schools.com/howto/howto_js_vertical_tabs.asp
function changeTab(tabName) {
    var i, tabcontent, tablinks;
    var tabButtonName = tabName + "Tab";

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
    document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function togglePopulationView(mode){
        if(mode == populationView){
                return;
        }

        populationView = mode;
        if(populationView){
                document.getElementById("popMapContent").classList.add("hide");
                document.getElementById("popTableContent").classList.remove("hide");
        }
        else{
                document.getElementById("popMapContent").classList.remove("hide");
                document.getElementById("popTableContent").classList.add("hide");
                map.updateSize();
        }
}
