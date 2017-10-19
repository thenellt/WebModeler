var popupEvntFunction;
var oldName;
var olmapLocation;
var simulationRun;
var simID;

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
        
        olmapLocation = 0;
        simulationRun = 0;
}


function newSimulation(){
        var tempDate = new Date();
        simID = tempDate.valueOf();
        console.log("new simulation run. ID: " + simID);
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
        simID = -1;
        document.getElementById("paramYears").value = "";
        document.getElementById("paramCarry").value = "";
        document.getElementById("paramDifRate").value = "";
        document.getElementById("paramGrowthRate").value = "";
        document.getElementById("paramEncounterRate").value = "";
        document.getElementById("paramKillProb").value = "";
        document.getElementById("paramHphy").value = "";
        document.getElementById("rangeHphy").value = "";
        document.getElementById("paramName").value = "";
        
        document.getElementById("paramTheta").value = "";
        document.getElementById("paramLowColor").value = "";
        document.getElementById("paramHighColor").value = "";
        document.getElementById("diffSamples").value = "";
        
        if(simulationRun){
                simulationRun = 0;
                if(olmapLocation){ //move the map from output page back to pop page
                        document.getElementById("popMapRow").appendChild(document.getElementById("popMapDiv"));
                        olmapLocation = 0;
                        //var parentDiv = document.getElementById("popMapRow");
                        //map.setSize([parentDiv.style.width, parentDiv.style.offsetHeight]);
                        //map.updateSize();
                        addPopFunction = map.on('click', placePopulation);
                        imageLayer.setVisible(false);
                }
                
                var cleanup = document.getElementById("rawHeatmapContainer");
                while (cleanup.firstChild) {
                        cleanup.removeChild(cleanup.firstChild);
                }
        }
        
        for(var k = 0; k < towns.length; k++){
                deleteRowByName(towns[k].name);
        }
        
        towns = [];
        points = [];
        
        var features = source.getFeatures();

        for(var j = 0; j < features.length; j++){
                source.removeFeature(features[j]);
        }
        
        document.getElementById("parameterSetupTab").disabled = true;
        document.getElementById("popSetupTab").disabled = true;
        document.getElementById("resultsPageTab").disabled = true;
        document.getElementById("resetButton").classList.add("hide");
        document.getElementById("newSimButton").innerHTML = "New Simulation";
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
                else if(e.keyCode == 13){
                        if(checkPopEditor()){
                                closePopEditor(0);
                        }
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
                
                else if(e.keyCode == 13){
                        if(checkPopUpdater()){
                                closePopUpdater(2);
                        }
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
        if(document.getElementById("popSetupTab").disabled){
                if(checkSettings()){
                        document.getElementById("popSetupTab").disabled = false;
                        changeTab('popSetup');
                }
                
                return;
        }
        
        if(olmapLocation){ //move the map from output page back to pop page
                document.getElementById("popMapRow").appendChild(document.getElementById("popMapDiv"));
                olmapLocation = 0;
                changeTab('popSetup');
                //var parentDiv = document.getElementById("popMapRow");
                //map.setSize([parentDiv.style.width, parentDiv.style.offsetHeight]);
                //map.updateSize();
                addPopFunction = map.on('click', placePopulation);
                imageLayer.setVisible(false);
        }
        else{
                changeTab('popSetup');
        }
}

function changeToOutput(){
        document.getElementById("resultMapDiv").appendChild(document.getElementById("popMapDiv"));
        olmapLocation = 1;
        document.getElementById("resultsPageTab").disabled = false;
        changeTab('resultsPage');
        ol.Observable.unByKey(addPopFunction);
        
        if(simulationRun){
                imageLayer.setVisible(true);
        }
        else{
                simulationRun = 1;
                var parentDiv = document.getElementById("resultMapDiv");
                console.log("resize map offsetHeight: " + parentDiv.offsetHeight);
                console.log("resize map clientHeight: " + parentDiv.clientHeight);
        
                map.setSize([parentDiv.style.width, parentDiv.style.offsetHeight]);
                map.updateSize();
        }
}

function populateDefaultValues(){
        document.getElementById("paramYears").value = "10";
        document.getElementById("paramCarry").value = "25";
        document.getElementById("paramDifRate").value = "0.1";
        document.getElementById("paramGrowthRate").value = "0.07";
        document.getElementById("paramEncounterRate").value = "0.02043";
        document.getElementById("paramKillProb").value = "0.1";
        document.getElementById("paramHphy").value = "40";
        document.getElementById("rangeHphy").value = "10";
        
        document.getElementById("paramTheta").value = "1";
        document.getElementById("paramLowColor").value = "ffeda0";
        document.getElementById("paramHighColor").value = "f03b20";
        document.getElementById("diffSamples").value = "1";
}

function checkPopEditor(){
        if(isNaN(parseFloat(document.getElementById("floatLat").value, 10)))
                return false;
                
        if(isNaN(parseFloat(document.getElementById("floatLong").value, 10)))
                return false;
        
        if(document.getElementById("floatPopName").value.length === 0)
                return false;
                
        if(isNaN(parseInt(document.getElementById("floatPop").value)))
                return false;
        
        if(isNaN(parseFloat(document.getElementById("floatKill").value, 10)))
                return false;
        
        if(isNaN(parseFloat(document.getElementById("floatGrowth").value, 10)))
                return false;
        
        return true;
}

function checkPopUpdater(){
        if(isNaN(parseFloat(document.getElementById("floatULat").value, 10)))
                return false;
                
        if(isNaN(parseFloat(document.getElementById("floatULong").value, 10)))
                return false;
        
        if(document.getElementById("floatPopUName").value.length === 0)
                return false;
                
        if(isNaN(parseInt(document.getElementById("floatUPop").value)))
                return false;
        
        if(isNaN(parseFloat(document.getElementById("floatUKill").value, 10)))
                return false;
        
        if(isNaN(parseFloat(document.getElementById("floatUGrowth").value, 10)))
                return false;
        
        return true;
}

function checkSettings(){
        //will check for valid numbers for all parameters
        return true;
}

setupTabs();

