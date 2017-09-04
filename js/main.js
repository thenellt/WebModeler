var popupEvntFunction;
var oldName;

function setupTabs(){
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

        
        /*
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
        })});
        */
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
                document.getElementById("floatLat").value = position[1];
                document.getElementById("floatLong").value = position[0];
        }
        
        otherPopup = 1;
        var changeDiv = document.getElementById('floatingPopEditor');
        var hidepage = document.getElementById("hidepage");
        
        fadeIn(hidepage);
        changeDiv.classList.add('scale-in');
        changeDiv.classList.remove('scale-out');
        
        popupEvntFunction = function(e){
                e = e || window.event;
                if(e.keyCode == 27){ //cancel and close if escape key
                        closePopEditor(1);
                }
        };
        
        window.addEventListener('keyup', popupEvntFunction);
        
        document.getElementById("floatPopName").focus();
}

function showPopUpdater(index){
        otherPopup = 1;
        var changeDiv = document.getElementById('floatingPopUpdater');
        var hidepage = document.getElementById("hidepage");
        var village = towns[index];
        
        document.getElementById("floatULat").value = village.lat;
        document.getElementById("floatULong").value = village.long;
        document.getElementById("floatPopUName").value = village.name;
        document.getElementById("floatUPop").value = village.population;
        document.getElementById("floatUKill").value = village.killRate;
        document.getElementById("floatUGrowth").value = village.growthRate;
        
        oldName = village.name;
        
        fadeIn(hidepage);
        changeDiv.classList.add('scale-in');
        changeDiv.classList.remove('scale-out');
        
        popupEvntFunction = function(e){
                e = e || window.event;
                if(e.keyCode == 27){ //cancel and close if escape key
                        closePopEditor(1);
                }
        };
        
        window.addEventListener('keyup', popupEvntFunction);
        
        document.getElementById("floatPopUName").focus();
}

function closePopUpdater(input){
        otherPopup = 0;
        window.removeEventListener('keyup', popupEvntFunction);
        popupEvntFunction = 0;
        
        if(input == 2){
                var tempLat = document.getElementById("floatULat").value;
                var tempLong = document.getElementById("floatULong").value;
                var tempName = document.getElementById("floatPopUName").value;
                var tempPop = document.getElementById("floatUPop").value;
                var tempKill = document.getElementById("floatUKill").value;
                var tempGrowth =  document.getElementById("floatUGrowth").value;
                console.log(tempName);
                
                var townData;
                for(var i = 0; i < towns.length; i++){
                        if(towns[i].name == oldName){
                                townData = towns[i];
                                break;
                        }
                }
                
                townData.lat = parseFloat(tempLat);
                townData.long = parseFloat(tempLong);
                townData.name = tempName;
                townData.population = tempPop;
                townData.killRate = tempKill;
                townData.growthRate = tempGrowth;
                
                updateTableRow(oldName, tempName);
                
                if(tempName != oldName){
                        var features = source.getFeatures();
        
                        for(var x = 0; x < features.length; x++){
                                console.log(features[x].get('description'));
                                if(features[x].get('description') == oldName){
                                        features[x].set('description', tempName);
                                        break;
                                }
                        }
                }
        }
        else if(!input){ //delete village
                var delName = oldName;
                for(var k = 0; k < towns.length; k++){
                        if(towns[k].name == delName){
                                towns.splice(k, 1);
                                break;
                        }
                }
                
                var features = source.getFeatures();
        
                for(var j = 0; j < features.length; j++){
                        console.log(features[j].get('description'));
                        if(features[j].get('description') == delName){
                                source.removeFeature(features[j]);
                                break;
                        }
                }
                
                deleteRowByName(delName);
        }
        
        //clear dialog
        document.getElementById("floatULat").value = "";
        document.getElementById("floatULong").value = "";
        document.getElementById("floatPopUName").value = "";
        document.getElementById("floatUPop").value = "";
        document.getElementById("floatUKill").value = "";
        document.getElementById("floatUGrowth").value = "";
        
        var changeDiv = document.getElementById('floatingPopUpdater');
        changeDiv.classList.remove('scale-in');
        changeDiv.classList.add('scale-out');
        var hidepage = document.getElementById("hidepage");
        fadeOut(hidepage);
        oldName = "";
}

function closePopEditor(clear){
        otherPopup = 0;
        
        window.removeEventListener('keyup', popupEvntFunction);
        popupEvntFunction = 0;
        
        if(!clear){ //user hit cancel
                //check parameters
                var tempLat = document.getElementById("floatLat").value;
                var tempLong = document.getElementById("floatLong").value;
                var tempName = document.getElementById("floatPopName").value;
                var tempPop = document.getElementById("floatPop").value;
                var tempKill = document.getElementById("floatKill").value;
                var tempGrowth =  document.getElementById("floatGrowth").value;
                console.log(tempName + " and growth: " + tempGrowth);
                //add the pop
                addVillage(tempLong, tempLat, tempPop, tempKill, tempName, tempGrowth);
                addEntry(tempName, tempLong, tempLat, tempPop, tempGrowth, tempKill);
                
        }
        
        //clear dialog
        document.getElementById("floatLat").value = "";
        document.getElementById("floatLong").value = "";
        document.getElementById("floatPopName").value = "";
        document.getElementById("floatPop").value = "";
        document.getElementById("floatKill").value = "";
        document.getElementById("floatGrowth").value = "";
        
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

setupTabs();