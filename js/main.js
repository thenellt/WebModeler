var popupEvntFunction;
var currentId;
var olmapLocation;
var simulationRun;
var advSettingsFnc;
var modalEventFnc;
var simData = {};
var simRunData;
var simResults = {};
var progBarDet;

$(document).ready(function() {
        $('#projBackground, #changelogPopup, #popImportDialog').modal();
        $('#yearlyPopEditor, #coverScreen, #fullScreenMap, #sysDialog').modal({dismissible: false});
        $('#advancedSettings').modal({dismissible: false, ready: showAdvancedSettings});
        $('#dropDownTest').dropdown({inDuration: 75, outDuration: 25,});
        $("#CDFSetSelection").change(function() {changeCDFSettlement();}); 
        $("#offtakeSetSelection").change(function() {changeOfftakeSettlement();});
        $('#floatingPopEditor').modal({dismissible: false});
        $('#debugModeToggle').prop('checked', false);
        $('#offtakeLegendToggle').prop('checked', false);
        $('#tabFillerButton').addClass('disabled');
        $(window).focus(function() {refreshCanvas();});
        setupPersistConfigs();
        populatePersistSaves();
        setupMapping();
        setupTabSystem();
});

function newSimulation(){
        var tempDate = new Date();
        simData.simID = tempDate.valueOf();
        console.log("new simulation setup with ID: " + simData.simID);
        $('#tabFillerButton').removeClass('disabled');
        document.getElementById("resetButton").classList.remove("hide");
        document.getElementById("newSimButton").classList.add("hide");
        document.getElementById("quickSaveButton").classList.remove("hide");

        tabManager.enableTab(pageTabs.PARAMS);
        tabManager.enableTab(pageTabs.POPS);
        tabManager.changeTab(pageTabs.PARAMS);
}

function resetSimulationCheck(){
        const title = "Are you sure want to start over?";
        const message = "All unsaved work will be lost.";
        createFloatingDialog(title, message, 0, resetSimulation);
}

function resetSimulation(){
        simData.simID = -1;
        $('#paramYears, #paramCarry, #paramDifRate, #paramGrowthRate, #paramEncounterRate, \
           #paramKillProb, #paramHphy, #rangeHphy, #paramName').val('');

        document.getElementById("paramTheta").value = "1";
        document.getElementById("paramLowColor").value = "#ffeda0";
        document.getElementById("paramHighColor").value = "#f03b20";
        document.getElementById("diffSamples").value = "1";
        document.getElementById("imgOpacity").value = "0.8";
        document.getElementById("boundryWidth").value = "10";
        document.getElementById("debugModeToggle").checked = false;

        if(simulationRun){
                simulationRun = 0;
                if(olmapLocation){ //move the map from output page back to pop page
                        document.getElementById("popMapRow").appendChild(document.getElementById("popMapDiv"));
                        olmapLocation = 0;
                        ol.Observable.unByKey(addPopFunction);
                        ol.Observable.unByKey(mouseKListner);
                        addPopFunction = map.on('click', placePopulation);
                        map.removeControl(mouseKControl);
                        imageLayer.setVisible(false);
                        debugVector.getSource().clear();
                }

                let cleanup = document.getElementById("rawHeatmapContainer");
                while (cleanup.firstChild) {
                        cleanup.removeChild(cleanup.firstChild);
                }
        }

        uiData = {};

        if(source){
                var features = source.getFeatures();
                for(var j = 0; j < features.length; j++){
                        source.removeFeature(features[j]);
                }
        }

        tabManager.disableTab(pageTabs.STATS);
        tabManager.disableTab(pageTabs.PARAMS);
        tabManager.disableTab(pageTabs.POPS);
        tabManager.disableTab(pageTabs.MAPS);
        $('#tabFillerButton').addClass('disabled');
        document.getElementById("resetButton").classList.add("hide");
        document.getElementById("quickSaveButton").classList.add("hide");
        document.getElementById("newSimButton").classList.remove("hide");

        emptyTable();
}

function resetColorCode(whichColor){
        if(whichColor === 'low'){
                document.getElementById("paramLowColor").value = "#ffeda0";
        } else if(whichColor === 'mid') {
                document.getElementById("enable3ColorMode").checked = false;
                document.getElementById("paramMidColor").disabled = true;
                document.getElementById("midColorReset").classList.add("disabled");
        } else if(whichColor === 'high') {
                document.getElementById("paramHighColor").value = "#f03b20";
        }
}

function changeToPopulations(){
        if(olmapLocation){
                document.getElementById("popMapRow").appendChild(document.getElementById("popMapDiv"));
                olmapLocation = 0;
                ol.Observable.unByKey(addPopFunction);
                ol.Observable.unByKey(mouseKListner);
                addPopFunction = map.on('click', placePopulation);
                map.removeControl(mouseKControl);
                imageLayer.setVisible(false);
                debugVector.setVisible(false);
                pointVector.setVisible(true);
                changeMapView(document.getElementById("mapTypeToggle").checked);
                map.updateSize();
        }
}

function changeToGetStarted(){
        let contentDiv = document.getElementById("getStarted");
        if(contentDiv.style.display == "none"){
                var saveContainer = document.getElementById("persistSaveContainer");
                while (saveContainer.firstChild) {
                        saveContainer.removeChild(saveContainer.firstChild);
                }

                setupPersistConfigs();
                populatePersistSaves();
        }
}

function changeToOutput(){
        document.getElementById("resultMapDiv").appendChild(document.getElementById("popMapDiv"));
        olmapLocation = 1;
        tabManager.enableTab(pageTabs.MAPS);
        tabManager.enableTab(pageTabs.STATS);
        ol.Observable.unByKey(addPopFunction);
        addPopFunction = map.on('click', resultsMapClick);
        map.addControl(mouseKControl);
        mouseKListner = map.on('pointermove', requestUpdateKControl);
        
        if(simulationRun){
                imageLayer.setVisible(true);
                if(document.getElementById("debugModeToggle").checked){
                        debugVector.setVisible(true);
                        $('#debugViewToggle').prop('checked', true);
                        $('#debugViewToggleF').prop('checked', true);        
                }
        } else {
                simulationRun = 1;
                var parentDiv = document.getElementById("resultMapDiv");
                map.setSize([parentDiv.style.width, parentDiv.style.offsetHeight]);
        }

        let labelCheckBox = document.getElementById('popLabelToggle');
        pointVector.setVisible(labelCheckBox.checked);
        changeMapView(false);
        setTimeout(function(){
                map.updateSize();
        }, 50);
}

function toggleThirdColorMode(isEnabled){
        if(isEnabled){
                document.getElementById("paramMidColor").disabled = false;
                document.getElementById("midColorReset").classList.remove("disabled");
        } else {
                document.getElementById("paramMidColor").disabled = true;
                document.getElementById("midColorReset").classList.add("disabled");
        }
}

function changeMapView(isRoadMap){
        if(isRoadMap && !bingLayers[0].getVisible()){
                bingLayers[1].setVisible(false);
                bingLayers[0].setVisible(true);
        } else if(!isRoadMap && !bingLayers[1].getVisible()) {
                bingLayers[0].setVisible(false);
                bingLayers[1].setVisible(true);
        }
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
        document.getElementById("progressText").innerHTML = message;
        if(value === 100){
                progBarDet = false;
                $('#progressBar').css({'width': ""}).removeClass('determinate').addClass('indeterminate');
        } else {
                progBarDet = true;
                $('#progressBar').removeClass('indeterminate').addClass('determinate').css({'width': value + '%'});
        }

        let element = document.getElementById("progressContainer");
        element.classList.add("scale-in")
        element.classList.remove("scale-out");
}

function updateProgressBar(message, value){
        document.getElementById("progressText").innerHTML = message;
        document.getElementById("progressBar").style.width = value + "%";
        if(value === 100 && progBarDet){
                progBarDet = false;
                $('#progressBar').css({'width': ""}).removeClass('determinate').addClass('indeterminate');
        } else if(!progBarDet) {
                $('#progressBar').removeClass('indeterminate').addClass('determinate').css({'width': value  + '%'});
        } else {
                $('#progressBar').css({'width': value  + '%'});
        }
}

function closeProgressBar(){
        $('#progressContainer').addClass("scale-out").removeClass("scale-in");
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
        const title = "Clear Simulation";
        const msg = "Upon confirmation all settings and population data will be erased from the current simulation. This does not impact any autosaves which may exist for <b>" + simData.simName + "</b>.";
        modalConfirmation(title, msg, resetSimulation);
}

function promptForDefaults(){
        const title = "Confirm Overwriting all Settings";
        const msg = "Selecting OK will result in all settings and advanced settings being overwritten with default values. This does not impact population data."
        modalConfirmation(title, msg, populateDefaultValues);
}

function populateDefaultValues(){
        document.getElementById("paramYears").value = "10";
        document.getElementById("paramCarry").value = "25.0";
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
        document.getElementById("boundryWidth").value = "10";
        document.getElementById("debugModeToggle").checked = false;

        document.getElementById("paramName").focus();
}

function checkSettings(){
        if($('#paramName').val().length === 0){
                modalDialog("Settings Error", "One or more settings has an invalid value. Please fix it and try again.", function(){
                        tabManager.changeTab(pageTabs.PARAMS, true);
                        $('#paramName').focus();
                });
                return false;
        }
        //id, min value, max value, isAdvanced
        let intParams = [["paramYears", 0, 200, 0], ['diffSamples', 1, 365, 1], ['boundryWidth', 0, 100, 1]];
        let floatParams = [['imgOpacity', 0, 1, 1], ['paramTheta', 0, 100, 1], ['rangeHphy', 1, 1000, 0],
                           ['paramHphy', 0, 365, 0], ['paramKillProb', 0, 1, 0], ['paramEncounterRate', 0, 1, 0],
                           ['paramDifRate', 0, 1, 0], ['paramGrowthRate', 0, 1, 0], ['paramCarry', 0, 1000, 0]];
        
        for(let i = 0; i < intParams.length; i++){
                let tempValue = $('#' + intParams[i][0]).val();
                if(!checkInt(tempValue, intParams[i][1], intParams[i][2])){
                        modalDialog("Settings Error", "One or more settings has an invalid value. Please fix it and try again.", function(){
                                tabManager.changeTab(pageTabs.PARAMS, true);
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
                                tabManager.changeTab(pageTabs.PARAMS, true);
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
        if(!(/^-?\d*(\.\d+)?$/.test(rawValue))){
                return false;
        }
        let value = parseFloat(rawValue, 10);
        if(isNaN(value) || value < min || value > max){
                return false;
        }
        
        return true;
}

function checkAnyFloat(rawValue){
        if(!(/^-?\d*(\.\d+)?$/.test(rawValue)))
                return false;

        let value = parseFloat(rawValue, 10);
        if(isNaN(value)){
                return false;
        }
        
        return true;
}

function checkInt(rawValue, min, max){
        if(!(/^-?\d*(\.\d+)?$/.test(rawValue)))
                return false;
        
        let floatValue = parseFloat(rawValue);
        if(!isNaN(floatValue) && floatValue % 1 === 0){
                let value = parseInt(floatValue);
                if(value >= min || value <= max){
                        return true;
                }
        }
        
        return false;
}

function toggleDebugControl(element){
        if(element.checked){
                $("#debugVisControlBox, #debugVisFControlBox").css('visibility', 'visible');
        } else {
                $("#debugVisControlBox, #debugVisFControlBox").css('visibility', 'hidden');
        }
}