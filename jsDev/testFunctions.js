var workerThread;
var workerFunctions = {};

function setupSimDefaults(){
        simData.animalDiffRate = 0.1;
        simData.animalGrowthRate = 0.07;
        simData.killProb = 0.1;
        simData.HpHy = 40;
        simData.encounterRate = 0.02043;
        simData.carryCapacity = 25.0;
        simData.theta = 1;
        simData.years = 10;
        simData.diffusionSamples = 1;
        simData.huntRange = 5;
        simData.lowColorCode = "ffeda0";
        simData.highColorCode = "f03b20";
        simData.simName = "defaultName";
        simData.opacity = 0.8;
        simData.boundryWidth = 10;
}

function readUserParameters(){
        simData.years = parseInt(document.getElementById("paramYears").value, 10) || simData.years;
        simData.carryCapacity = parseFloat(document.getElementById("paramCarry").value) || simData.carryCapacity;
        simData.animalDiffRate = parseFloat(document.getElementById("paramDifRate").value) || simData.animalDiffRate;
        simData.animalGrowthRate = parseFloat(document.getElementById("paramGrowthRate").value) || simData.animalGrowthRate;
        simData.encounterRate = parseFloat(document.getElementById("paramEncounterRate").value) || simData.encounterRate;
        simData.killProb = parseFloat(document.getElementById("paramKillProb").value) || simData.killProb;
        simData.HpHy = parseInt(document.getElementById("paramHphy").value, 10) || simData.HpHy;
        simData.huntRange = parseInt(document.getElementById("rangeHphy").value, 10) || 10;

        var tempLow = document.getElementById("paramLowColor").value;
        if(tempLow.length > 0){
                simData.lowColorCode = tempLow;
        }

        var tempHigh = document.getElementById("paramHighColor").value;
        if(tempHigh.length > 0){
                simData.highColorCode = tempHigh;
        }

        let colorMode = document.getElementById("enable3ColorMode").checked;
        if(colorMode){
                console.log("readUserParameters::detected 3 color mode");
                simData.threeColorMode = true;
                simData.midColorCode = document.getElementById("paramMidColor").value;
        }
        else{
                simData.threeColorMode = false;
        }

        var tempName = document.getElementById("paramName").value;
        if(tempName.length > 0){
                simData.simName = tempName;
        }

        simData.theta = parseFloat(document.getElementById("paramTheta").value) || simData.theta;
        simData.diffusionSamples = parseInt(document.getElementById("diffSamples").value, 10) || simData.diffusionSamples;
        simData.opacity = parseFloat(document.getElementById("imgOpacity").value) || simData.opacity;
        simData.boundryWidth = parseInt(document.getElementById("boundryWidth").value, 10) || simData.boundryWidth;

        console.log("readUserParameters::finished reading user input");
}

function setupTowns(){
        var townArray = [];

        if(!checkYearlyPopDuration())
                return false;

        for(const settlement in uiData)
                if(uiData[settlement].valid)
                        townArray.push(sanitizeTownData(uiData[settlement]));

        if(!townArray.length){
                const title = "No Valid Populations Found";
                const msg = "Please enter at least one population before running the simulation.";
                modalDialog(title, msg);
                return false;
        } else {
                return townArray;
        }
}

function checkYearlyPopDuration(){
        var nameString = ""
        for(settlement in uiData){
                let village = uiData[settlement];
                if(village.type === "yearly" && village.population.length < simData.years){
                        if(!nameString.length){
                                nameString = village.name;
                        }
                        else{
                                nameString += ", " + village.name;
                        }
                }
        }

        if(nameString.length){
                //TODO add the option to hold populations steady.
                const title = "Insufficient Population Data";
                let msg = "The specified simulation duration is longer than the amount of population data supplied. Population(s) <i>";
                msg += nameString + "</i> have less than <b>" + simData.years + "</b> years worth of data. </br></br>Please adjust the simulation duration or provide additional data.";
                modalDialog(title, msg);
                return false;
        }
        else{
                return true;
        }
}

function sanitizeTownData(uiTown){
        let data = jQuery.extend(true, {}, uiTown);
        data.offtake = [];
        data.long = parseFloat(data.long);
        data.lat = parseFloat(data.lat);

        if(data.type === 'exp'){
                data.population = parseInt(data.population);
                data.growthRate = parseFloat(data.growthRate);
        }

        if(data.killRate && !isNaN(parseFloat(data.killRate))){
                data.killRate = parseFloat(data.killRate);
        }
        else{
                data.killRate = simData.killProb;
        }

        if(data.HPHY && !isNaN(parseFloat(data.HPHY))){
                data.HPHY = parseFloat(data.HPHY);
        }
        else{
                data.HPHY = simData.HpHy;
        }

        return data;
}

function setupWorker(){
        workerThread = new Worker('jsDev/model.js');
        workerThread.onmessage = function(oEvent) {
                handleWorkerMessage(oEvent.data);
        };
}

function setupSimulation(){
        if(!checkSettings())
                return;

        console.log("----------------Starting sim setup-------------------");
        //maybe move this to output display setup
        var cleanup = document.getElementById("rawHeatmapContainer");
        while (cleanup.firstChild) {
                cleanup.removeChild(cleanup.firstChild);
        }
        
        setupSimDefaults();
        readUserParameters();
        const debugMode = document.getElementById("debugModeToggle").checked;

        let townData = setupTowns();
        if(!townData)
                return;
        
        $('#coverScreen').modal('open');
        geoGridFeatures.clear(true);
        debugSource.clear(true);

        heatMapImages = {images:new Array(simData.years + 1), pos:false};
        entireAreaData = [];
        localAreaData = [];

        showProgressBar("Setting up simulation", 0);
        workerThread.postMessage({type:"newSim", params:simData, towns:townData, debug:debugMode});
}

function mapWorkerFunctions(){
        workerFunctions = {
                'progress': function(data) {updateProgressBar(data.statusMsg, data.statusValue);},
                'entireCDFData': function(data) {storeCDFData('entire', data.year, data.densities);},
                'localCDFData': function(data) {storeCDFData('single', data.year, data.densities, data.id);},
                'extentDebug': function(data) {drawDebugBounds(data.data.points, data.data.color);},
                'circleDebug': function(data) {drawDebugCircle(data.data.points, data.data.color);},
                'pointDebug': function(data) {drawDebugPoint(data.data.point, data.data.color);},
                'singleCSV': function(data) {saveSingleCSV(data.csvString, data.year);},
                'allYearsCSV': function(data) {saveAllYearsCSV(data.csvString, data.year);},
        };
}

function handleWorkerMessage(data){
        switch(data.type){
        case 'mapped':
                workerFunctions[data.fnc](data);
                break;
        case 'finished': {
                simResults = data.paramData;
                synchPersisObject();
                changeToOutput();
                setupOutputRanges();
                rawHWScaleInput(100);
                populateCDFSelection('CDFSetSelection');
                workerThread.postMessage({type:'getCDFData', year:simData.years});
                //workerThread.postMessage({type:'getLocalCDFData', year:simData.years});
                closeProgressBar();
                $('#coverScreen').modal('close');
                break;
                }
        case 'debug':
                console.log("Worker::" + data.statusMsg);
                break;
        case 'error':
                let title = "An Error Occured";
                let msg = "An error prevented the simulation from running. Please verify parameters and populations and try again. </br>";
                msg += "If you would like to report this error: return to the Get Started page -> Save -> Download the config -> email it to the developer. </br>";
                msg += "<b>Error Contents: </b>" + data.text;
                $('#coverScreen').modal('close');
                modalDialog(title, msg, changeToPopulations);
                break;
        case 'imgData': {
                generateCanvas(data);
                break;
                }
        }
}
