function setup(){
        var tabs = document.getElementsByClassName("tablinks");
        for(i = 0; i < tabs.length; i++){
                if(!tabs[i].classList.contains("defaultOpen")){
                        console.log("found non-default tab: " + tabs[i].id);
                        tabs[i].disabled = true;
                }
                else{
                        var contentName = tabs[i].id;
                        console.log("Setup content name: " + contentName.substring(0, contentName.length - 3));
                        changeTab(contentName.substring(0, contentName.length - 3));
                }
        }
        
        map = new ol.Map({
        target: 'map',
        layers: [
                new ol.layer.Tile({
                        source: new ol.source.OSM()
                })
        ],
        view: new ol.View({
                center: ol.proj.fromLonLat([-123.269542, 44.568696]),
                zoom: 10
        })
});
}

function newSimulation(){
        console.log("new simulation run");
        document.getElementById("parameterSetupTab").disabled = false;
        document.getElementById("resetButton").classList.remove("hide");
        document.getElementById("newSimButton").innerHTML = "Continue";
        changeTab("parameterSetup");
}

function resetSimulationCheck(){
        console.log("reset simulation run");
        var title;
        var message;
        createFloatingDialog(title, message, 0, resetSimulation);
}

function resetSimulation(){

}

function showAdvancedSettings(){
        otherPopup = 1;
        var changeDiv = document.getElementById('advancedSettings');
        var hidepage = document.getElementById("hidepage");

        console.log("unhiding advanced settings");
        fadeIn(hidepage);
        changeDiv.classList.add('scale-in');
        changeDiv.classList.remove('scale-out');
}

function closeAdvancedSettings(clear){
        otherPopup = 0;
        if(!clear){ //user hit cancel
                //check parameters
        }

        var changeDiv = document.getElementById('advancedSettings');
        changeDiv.classList.remove('scale-in');
        changeDiv.classList.add('scale-out');
        var hidepage = document.getElementById("hidepage");
        fadeOut(hidepage);
}

function showPopEditor(position){
        if(typeof position !== 'undefined'){
                document.getElementById("floatLat").value = position[0];
                document.getElementById("floatLong").value = position[1];
        }
        
        otherPopup = 1;
        var changeDiv = document.getElementById('floatingPopEditor');
        var hidepage = document.getElementById("hidepage");

        console.log("unhiding advanced settings");
        fadeIn(hidepage);
        changeDiv.classList.add('scale-in');
        changeDiv.classList.remove('scale-out');
}

function closePopEditor(clear){
        otherPopup = 0;
        
        if(!clear){ //user hit cancel
                //check parameters
        }
        
        var changeDiv = document.getElementById('floatingPopEditor');
        changeDiv.classList.remove('scale-in');
        changeDiv.classList.add('scale-out');
        var hidepage = document.getElementById("hidepage");
        fadeOut(hidepage);
}

function changeToPopulations(){
        console.log("changed to population page");
        
        if(checkSettings()){
                document.getElementById("popSetupTab").disabled = false;
                changeTab('popSetup');
        }
}

function checkSettings(){
        //will check for valid numbers for all parameters
        return true;
}

setup();
