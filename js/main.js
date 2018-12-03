var popupEvntFunction;
var olmapLocation;
var simulationRun;
var modalEventFnc;
var simData = {};
var simRunData;
var simResults = {};
var progBarDet;
var workerPool;
var completedImgCount;

$(document).ready(function() {
        $('#projBackground, #changelogPopup, #popImportDialog, #presetDialog').modal();
        $('#yearlyPopEditor, #coverScreen, #fullScreenMap, #sysDialog').modal({dismissible: false});
        $('#advancedSettings').modal({dismissible: false, ready: showAdvancedSettings});
        $('#popDropDown').dropdown({inDuration: 75, outDuration: 25,});
        $('#graphTypeSelector').material_select();
        $('#graphTypeSelector').change(function(){ChartMgr.changeChart();});
        $("#graphSettlementSelect").change(function() {ChartMgr.changeSelected();}); 
        $('#floatingPopEditor').modal({dismissible: false});
        $('#offtakeLegendToggle, #exploitationToggle, #streetmapToggle, #debugViewToggle').prop('checked', false);
        $('#tabFillerButton').addClass('disabled');
        $(window).focus(function() {refreshCanvas();});
        window.addEventListener('online',  function(){updateOnlineStatus(true);});
        window.addEventListener('offline', function(){updateOnlineStatus(false);});
        setupTabSystem();
        checkCompatibility();
        setupWorkers();
        populatePresets();
});

function initApp(fullSupport){
        document.getElementById("javascriptError").style.display = "none";
        document.getElementById('getStarted').classList.remove("hide");
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        setupPersistConfigs();
        populatePersistSaves();
        document.getElementById('getStarted').classList.add('scale-in');
        setTimeout(function(){
                let errorTab = document.getElementById('javascriptError');
                let parent = errorTab.parentNode;
                parent.removeChild(errorTab);
        }, 1000);
        if(!fullSupport){
                let title = "Partially Supported Browser";
                let msg = "Your browser lacks supports for offline caching. <br>";
                msg += "The application will function normally but will not avaliable without an internet connection."
                modalDialog(title, msg);
        }
}

function newSimulation(){
        var tempDate = new Date();
        simData.simID = tempDate.valueOf();
        console.log("new simulation setup with ID: " + simData.simID);
        $('#tabFillerButton').removeClass('disabled');
        document.getElementById("resetButton").classList.remove("hide");
        document.getElementById("newSimButton").classList.add("hide");
        document.getElementById("quickSaveButton").classList.remove("hide");
        document.getElementById("startSimText").innerHTML = "Current simulation:";

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
        document.getElementById("boundryWidth").value = "10";
        document.getElementById("enableRiverSim").checked = false;
        $('#riverFalloffContainer, #effortDistContainer').addClass("hide");
        document.getElementById("riverSimRange").value = 6;
        document.getElementById('effortDistSlider').value = 50;

        if(simulationRun){
                simulationRun = 0;
                setMapSetupMode();
                if(olmapLocation){ //move the map from output page back to pop page
                        document.getElementById("popMapRow").appendChild(document.getElementById("popMapDiv"));
                        olmapLocation = 0;
                        ol.Observable.unByKey(addPopFunction);
                        ol.Observable.unByKey(mouseKListner);
                        addPopFunction = map.on('click', placePopulation);
                        map.removeControl(mouseKControl);
                        debugVector.getSource().clear();
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
        tabManager.disableTab(pageTabs.INFO);
        $('#tabFillerButton').addClass('disabled');
        document.getElementById("resetButton").classList.add("hide");
        document.getElementById("quickSaveButton").classList.add("hide");
        document.getElementById("newSimButton").classList.remove("hide");
        document.getElementById("startSimText").innerHTML = "Start new simulation:";

        map.getView().animate({zoom: 2}, {center: [0, 0]});
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
                setMapSetupMode();
        }

        map.updateSize();
        console.log("refreshed canvas");
}

function changeToGetStarted(){    
        setupPersistConfigs();             
        populatePersistSaves();
}

function changeToOutput(){
        document.getElementById("resultMapDiv").appendChild(document.getElementById("popMapDiv"));
        olmapLocation = 1;
        tabManager.enableTab(pageTabs.MAPS);
        tabManager.enableTab(pageTabs.STATS);
        tabManager.enableTab(pageTabs.INFO);
        ol.Observable.unByKey(addPopFunction);
        addPopFunction = map.on('click', resultsMapClick);
        map.addControl(mouseKControl);
        mouseKListner = map.on('pointermove', requestUpdateKControl);

        setMapResultsMode(!simulationRun);
        if(!simulationRun){
                simulationRun = 1;
                var parentDiv = document.getElementById("resultMapDiv");
                map.setSize([parentDiv.style.width, parentDiv.style.offsetHeight]);
        }

        setTimeout(function(){
                map.updateSize();
        }, 50);
}

function toggleRiverSim(isEnabled){
        if(isEnabled){
                $('#riverFalloffContainer, #effortDistContainer, #riverSpeedContainer').removeClass("hide");
        } else {
                simData.maxRDist = false;
                $('#riverFalloffContainer, #effortDistContainer, #riverSpeedContainer').addClass("hide");
        }
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
        if(isRoadMap){
                bingLayers[1].setVisible(false);
                bingLayers[0].setVisible(true);
        } else if(!isRoadMap && navigator.onLine) {
                bingLayers[0].setVisible(false);
                bingLayers[1].setVisible(true);
        } else {
                $('#mapTypeToggle').prop('checked', true);
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

function promptForPreset(config){
        const title = "Overwrite Simulation Parameters";
        const msg = "Upon confirmation all parameters will be overwritten. This does not impact populations.";
        modalConfirmation(title, msg, function(){populateDefaultValues(config)});
}

function populateDefaultValues(config){
        document.getElementById("paramYears").value = "10";
        document.getElementById("paramLowColor").value = "#ffeda0";
        document.getElementById("paramHighColor").value = "#f03b20";
        document.getElementById("diffSamples").value = "1";
        document.getElementById("boundryWidth").value = "10";
        document.getElementById("paramName").focus();
        document.getElementById("riverSimRange").value ="6";
        document.getElementById("effortDistSlider").value = 50;
        document.getElementById("enableRiverSim").checked = false;
        toggleRiverSim(false);

        for(let param of Object.keys(config)){
                document.getElementById(param).value = config[param];
        }

        $('#presetDialog').modal('close');
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
        let floatParams = [['paramTheta', 0, 100, 1], ['rangeHphy', 1, 1000, 0],
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

function updateOnlineStatus(isOnline){
        if(isOnline){
                $("#satMapContainer").removeClass("hide");
                if(tabManager.currentPage === pageTabs.MAPS)
                        bingLayers[1].setVisible(true);
                bingLayers[1].getSource().refresh();
        } else {
                $("#satMapContainer").addClass("hide");
                $('#mapTypeToggle').prop('checked', true);
                bingLayers[1].setVisible(false);
                bingLayers[0].setVisible(true);
        }
}

function setupWorkers(){
        const coreCount = navigator.hardwareConcurrency;
        if(coreCount > 1){
                var threadCount = coreCount - 1;
        } else {
                var threadCount = 1;
        }
        workerPool = {
                workers: [],
                active: [],
                cores: coreCount,
                threads: threadCount,
                workQueue: new Queue(),
        };
        for (let i = 0; i < coreCount; i++) {
                workerPool.workers.push(new Worker('js/imgWorker.js'));
                workerPool.workers[i].postMessage({type:'setNum', number:i});
                workerPool.workers[i].onmessage = function(oEvent) {receiveWork(oEvent.data);};
                workerPool.active.push(false);
        }
}

function increaseWorkerCount(){
        if(workerPool.threads < workerPool.cores){
                if(!workerPool.workQueue.isEmpty())
                        dispatchWork(workerPool.threads, workerPool.workQueue.dequeue());
                
                workerPool.threads++;
        }
}

function resetWorkerCount(){
        if(workerPool.cores > 1){
                workerPool.threads = workerPool.cores - 1;
        } else {
                workerPool.threads = 1;
        }
}

function dispatchWork(thread, work){
        workerPool.active[thread] = true;
        workerPool.workers[thread].postMessage({type:'genImg', params:work.data, array:work.imgData}, [work.imgData.buffer]);
}

function processWork(data, imgData){
        let nextCore = 0;
        while(workerPool.active[nextCore] && nextCore < workerPool.threads)
                nextCore++;

        if(nextCore < workerPool.threads){
                dispatchWork(nextCore, {data:data, imgData:imgData});
        } else {
                workerPool.workQueue.enqueue({data:data, imgData:imgData});
        }
}

function receiveWork(data){
        if(!workerPool.workQueue.isEmpty()){
                dispatchWork(data.threadNum, workerPool.workQueue.dequeue());
        } else {
                workerPool.active[data.threadNum] = false;
        }
        storeImgURL(data);
        completedImgCount++;
        if(completedImgCount === ((simRunData.years + 1) * 3)){
                tabManager.changeTab(pageTabs.MAPS);
                closeProgressBar();
                $('#coverScreen').modal('close');
                synchPersisObject();
                simulationTime = performance.now() - simulationTime;
                simResults.visTime = performance.now() - simResults.visTime;
                populateOtherInfo();
                ChartMgr._currentYear = simRunData.years;
                $("#graphRangeLabel").html("Radius: " + simRunData.huntRange + " km");
                ChartMgr.changeChart('Local CDF');
                setTimeout(function(){
                        $('#activeLegendTab').click();
                        fitMap(simResults.bounds[0], simResults.bounds[1]);
                }, 200);
        }
}