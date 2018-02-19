/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* global imageLayer uiData:true map source addPopFunction otherPopup:true ol pointVector */

var popupEvntFunction;
var currentId;
var olmapLocation;
var simulationRun;
var advSettingsFnc;
var modalEventFnc;
var simData = {};
var simResults = {};

$(document).ready(function() {
        $('#projBackground').modal();
        $('#changelogPopup').modal();
        $('#popImportDialog').modal();
        $('#yearlyPopEditor').modal({dismissible: false});
        $('#fullScreenMap').modal({dismissible: false});
        $('#sysDialog').modal({dismissible: false});
        $('#advancedSettings').modal({
                dismissible: false,
                ready: showAdvancedSettings
        });
        $('#floatingPopEditor').modal({dismissible: false});
        
        setupTabs();
        setupPersistConfigs();
        populatePersistSaves();
        mapWorkerFunctions();
        checkCompatibility();
});

function setupTabs(){
        var tabs = document.getElementsByClassName("tablinks");
        for(let i = 0; i < tabs.length; i++){
                if(!tabs[i].classList.contains("defaultOpen")){
                        tabs[i].disabled = true;
                }
                else{
                        var contentName = tabs[i].id;
                        changeTab(contentName.substring(0, contentName.length - 3));
                }
        }

        olmapLocation = 0;
        simulationRun = 0;
}

function newSimulation(){
        var tempDate = new Date();
        simData.simID = tempDate.valueOf();
        addRow("popTable", -1);
        console.log("new simulation setup with ID: " + simData.simID);
        document.getElementById("parameterSetupTab").disabled = false;
        document.getElementById("popSetupTab").disabled = false;
        document.getElementById("resetButton").classList.remove("hide");
        document.getElementById("newSimButton").classList.add("hide");
        document.getElementById("quickSaveButton").classList.remove("hide");

        changeTab("parameterSetup");
}

function resetSimulationCheck(){
        var title = "Are you sure want to start over?";
        var message = "All unsaved work will be lost.";
        createFloatingDialog(title, message, 0, resetSimulation);
}

function resetSimulation(){
        simData.simID = -1;
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
        document.getElementById("paramLowColor").value = "#ffeda0";
        document.getElementById("paramHighColor").value = "#f03b20";
        document.getElementById("diffSamples").value = "";
        document.getElementById("imgOpacity").value = "";

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

        emptyTable();

        uiData = [];

        if(source){
                var features = source.getFeatures();

                for(var j = 0; j < features.length; j++){
                        source.removeFeature(features[j]);
                }
        }

        document.getElementById("statsPageTab").disabled = true;
        document.getElementById("parameterSetupTab").disabled = true;
        document.getElementById("popSetupTab").disabled = true;
        document.getElementById("resultsPageTab").disabled = true;
        document.getElementById("resetButton").classList.add("hide");
        document.getElementById("quickSaveButton").classList.add("hide");
        document.getElementById("newSimButton").classList.remove("hide");

        emptyTable();
}

function resetColorCode(isHighColor){
        if(isHighColor){
                document.getElementById("paramHighColor").value = "#f03b20";
        }
        else{
                document.getElementById("paramLowColor").value = "#ffeda0";
        }
}

function changeToPopulations(){
        if(olmapLocation){ //move the map from output page back to pop page
                document.getElementById("popMapRow").appendChild(document.getElementById("popMapDiv"));
                olmapLocation = 0;
                changeTab('popSetup');
                //var parentDiv = document.getElementById("popMapRow");
                //map.setSize([parentDiv.style.width, parentDiv.style.offsetHeight]);
                //map.updateSize();
                addPopFunction = map.on('click', placePopulation);
                imageLayer.setVisible(false);
                pointVector.setVisible(true);
                geoLayer.setVisible(false);
        }
        else{
                changeTab('popSetup');
        }
        map.updateSize();
}

function changeToGetStarted(){
        let contentDiv = document.getElementById("getStarted");
        if(contentDiv.style.display == "none"){
                //TODO only update saves when necessary
                console.log("updating persist display");
                var saveContainer = document.getElementById("persistSaveContainer");
                while (saveContainer.firstChild) {
                        saveContainer.removeChild(saveContainer.firstChild);
                }

                setupPersistConfigs();
                populatePersistSaves();
                changeTab('getStarted');
        }
}

function changeToOutput(){
        document.getElementById("resultMapDiv").appendChild(document.getElementById("popMapDiv"));
        olmapLocation = 1;
        document.getElementById("resultsPageTab").disabled = false;
        document.getElementById("statsPageTab").disabled = false;
        changeTab('resultsPage');
        ol.Observable.unByKey(addPopFunction);

        if(simulationRun){
                imageLayer.setVisible(true);
                //geoLayer.setVisible(true);
        }
        else{
                simulationRun = 1;
                var parentDiv = document.getElementById("resultMapDiv");
                console.log("resize map offsetHeight: " + parentDiv.offsetHeight);
                console.log("resize map clientHeight: " + parentDiv.clientHeight);

                map.setSize([parentDiv.style.width, parentDiv.style.offsetHeight]);
        }

        let labelCheckBox = document.getElementById('popLabelToggle');
        pointVector.setVisible(labelCheckBox.checked);
        setTimeout(function(){
                map.updateSize();
        }, 50);
}

function notifyMessage(text, time){
        document.getElementById("notificationText").innerHTML = text;
        let element = document.getElementById("notificationContainer");
        element.classList.add("scale-int")
        element.classList.remove("scale-out");
        window.setTimeout(closeNotifyMessage, time * 1000);
}

function closeNotifyMessage(){
        let element = document.getElementById("notificationContainer");
        element.classList.add("scale-out")
        element.classList.remove("scale-in");
}

function showProgressBar(message, value){
        console.log("showing progress bar");
        document.getElementById("progressText").innerHTML = message;
        document.getElementById("progressBar").style.width = value;

        let element = document.getElementById("prgressContainer");
        element.classList.add("scale-in")
        element.classList.remove("scale-out");
}

function updateProgressBar(message, value){
        console.log("updating progress bar: " + message + " val: " + value);
        document.getElementById("progressText").innerHTML = message;
        document.getElementById("progressBar").style.width = value + "%";
}

function closeProgressBar(){
        let element = document.getElementById("prgressContainer");
        element.classList.add("scale-out")
        element.classList.remove("scale-in");
}

function modalDialog(title, msg, callback){
        $('#sysCancel').css('display', 'none');
        $('#sysTitle').text(title);
        $('#sysContent').html(msg);
        
        modalEventFnc = function(e){
                e = e || window.event;
                if(e.keyCode == 13){
                        $('#sysConfirm').trigger('click');
                }
        }
        window.addEventListener('keyup', modalEventFnc);
        
        $('#sysConfirm').click(function(){
                window.removeEventListener('keyup', modalEventFnc);
                $('#sysDialog').modal('close');
                if(typeof callback !== 'undefined' && typeof callback === 'function'){
                        callback();
                }
                
                $('#sysConfirm').prop('onclick', null).off('click');
        });
        
        $('#sysDialog').modal('open');
}

function modalConfirmation(title, msg, confCallback, cancelCallback){
        $('#sysCancel').css('display', 'inline');
        $('#sysTitle').text(title);
        $('#sysContent').html(msg);
        
        $('#sysConfirm').click(function(){
                $('#sysDialog').modal('close');
                if(typeof confCallback !== 'undefined' && typeof confCallback === 'function'){
                        confCallback();
                }
                
                $('#sysConfirm').prop('onclick', null).off('click');
                $('#sysCancel').prop('onclick', null).off('click');
        });
        
        $('#sysCancel').click(function(){
                $('#sysDialog').modal('close');
                if(typeof cancelCallback !== 'undefined' && typeof cancelCallback === 'function'){
                        cancelCallback();
                }
                
                $('#sysConfirm').prop('onclick', null).off('click');
                $('#sysCancel').prop('onclick', null).off('click');
        });
        
        $('#sysDialog').modal('open');
}

function promptForReset(){
        let title = "Clear Simulation";
        let msg = "Upon confirmation all settings and population data will be erased from the current simulation. This does not impact any autosaves which may exist for <b>" + simData.simName + "</b>.";
        modalConfirmation(title, msg, resetSimulation);
}

function promptForDefaults(){
        let title = "Confirm Overwriting all Settings";
        let msg = "Selecting OK will result in all settings and advanced settings being overwritten with default values. This does not impact population data."
        modalConfirmation(title, msg, populateDefaultValues);
}

function populateDefaultValues(){
        document.getElementById("paramYears").value = "10";
        document.getElementById("paramCarry").value = "25";
        document.getElementById("paramDifRate").value = "0.1";
        document.getElementById("paramGrowthRate").value = "0.07";
        document.getElementById("paramEncounterRate").value = "0.02043";
        document.getElementById("paramKillProb").value = "0.1";
        document.getElementById("paramHphy").value = "40";
        document.getElementById("rangeHphy").value = "5";

        document.getElementById("paramTheta").value = "1";
        document.getElementById("paramLowColor").value = "#ffeda0";
        document.getElementById("paramHighColor").value = "#f03b20";
        document.getElementById("diffSamples").value = "1";
        document.getElementById("imgOpacity").value = "0.8";

        document.getElementById("paramName").focus();
}

function checkSettings(){
        if($('#paramName').val().length === 0){
                modalDialog("Settings Error", "One or more settings has an invalid value. Please fix it and try again.", function(){
                        changeTab('parameterSetup');
                        $('#paramName').focus();
                });
                return false;
        }
        //id, min value, max value, isAdvanced
        let intParams = [["paramYears", 0, 200, 0], ['paramCarry', 0, 1000, 0], ['diffSamples', 1, 365, 1]];
        let floatParams = [['imgOpacity', 0, 1, 1], ['paramTheta', 0, 100, 1], ['rangeHphy', 1, 1000, 0],
                           ['paramHphy', 0, 365, 0], ['paramKillProb', 0, 1, 0], ['paramEncounterRate', 0, 1, 0],
                           ['paramDifRate', 0, 1, 0], ['paramGrowthRate', 0, 1, 0]];
        
        for(let i = 0; i < intParams.length; i++){
                let tempValue = $('#' + intParams[i][0]).val();
                if(!checkInt(tempValue, intParams[i][1], intParams[i][2])){
                        modalDialog("Settings Error", "One or more settings has an invalid value. Please fix it and try again.", function(){
                                changeTab('parameterSetup');
                                if(intParams[i][3]){
                                        $('#advancedSettings').modal('open');
                                }
                                $('#'+intParams[i][0]).focus();
                        });
                        return false;
                }
        }
        for(let i = 0; i < intParams.length; i++){
                let tempValue = $('#' + floatParams[i][0]).val();
                if(!checkFloat(tempValue, floatParams[i][1], floatParams[i][2])){
                        modalDialog("Settings Error", "One or more settings has an invalid value. Please fix it and try again.", function(){
                                changeTab('parameterSetup');
                                if(floatParams[i][3]){
                                        $('#advancedSettings').modal('open');
                                }
                                $('#'+floatParams[i][0]).focus();
                        });
                        return false;
                }
        }

        return true;
}

function checkFloat(rawValue, min, max){
        if(!(/^\d*(\.\d+)?$/.test(rawValue))){
                return false;
        }
        let value = parseFloat(rawValue, 10);
        if(isNaN(value) || value < min || value > max){
                return false;
        }
        
        return true;
}

function checkInt(rawValue, min, max){
        if(!(/^\d*(\.\d+)?$/.test(rawValue))){
                return false;
        }
        let floatValue = parseFloat(rawValue);

        if(!isNaN(floatValue) && floatValue % 1 === 0){
                let value = parseInt(floatValue);
                if(value >= min || value <= max){
                        return true;
                }
        }
        
        return false;
}

