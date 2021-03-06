var simulationTime;
var workerThread = new Worker('js/model.js');
workerThread.onmessage = function(oEvent) {
        handleWorkerMessage(oEvent.data);
};

const workerFunctions = {
        'progress':      function(data) {updateProgressBar(data.statusMsg, 100 * (data.statusValue / simRunData.years));},
        'entireCDFData': function(data) {storeCDFData('entire', data.densities);},
        'localCDFData':  function(data) {storeCDFData('single', data.densities, data.id);},
        'offtakeData':   function(data) {storeOfftakeData(data.dataString);},
        'CPUEdata':      function(data) {storeCPUEdata(data.dataString);},
        'extentDebug':   function(data) {drawDebugBounds(data.data.points, data.data.color);},
        'circleDebug':   function(data) {drawDebugCircle(data.data.points, data.data.color);},
        'pointDebug':    function(data) {drawDebugPoint(data.data.point, data.data.color);},
        'singleCSV':     function(data) {saveSingleCSV(data.csvString, data.year);},
        'allYearsCSV':   function(data) {saveAllYearsCSV(data.csvString, data.year);},
        'posKUpdate':    function(data) {$('#mouseKText').html(data.text);},
        'storeGradient': function(data) {simRunData.gradient = data.gradient; createGradient();},
        'boundsCheck':   function(data) {fitMap(data.bounds[0], data.bounds[1]);}
};

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
        simData.opacity = 1.0;
        simData.boundryWidth = 10;
}

function readUserParameters(){
        simData.years = checkParam('paramYears', simData.years, false);
        simData.carryCapacity = checkParam('paramCarry', simData.carryCapacity, true);
        simData.animalDiffRate = checkParam('paramDifRate', simData.animalDiffRate, true);
        simData.animalGrowthRate = checkParam('paramGrowthRate', simData.animalGrowthRate, true);
        simData.encounterRate = checkParam('paramEncounterRate', simData.encounterRate, true);
        simData.killProb = checkParam('paramKillProb', simData.killProb, true);
        simData.HpHy = checkParam('paramHphy', simData.HpHy, false);
        simData.huntRange = checkParam('rangeHphy', simData.huntRange, false);

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
        } else {
                simData.threeColorMode = false;
        }

        var tempName = document.getElementById("paramName").value;
        if(tempName.length > 0){
                simData.simName = tempName;
        }

        simData.theta = checkParam('paramTheta', simData.theta, true);
        simData.diffusionSamples = checkParam('diffSamples', simData.diffusionSamples, false);
        simData.boundryWidth = checkParam('boundryWidth', simData.boundryWidth, false);
}

function checkParam(id, backup, isFloat){
        var parse;
        if(isFloat){
                parse = parseFloat(document.getElementById(id).value);
        } else {
                parse = parseInt(document.getElementById(id).value, 10);
        }

        return isNaN(parse) ? backup : parse;
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
                        } else {
                                nameString += ", " + village.name;
                        }
                }
        }

        if(nameString.length){
                const title = "Insufficient Population Data";
                let msg = "The specified simulation duration is longer than the amount of population data supplied. Population(s) <i>";
                msg += nameString + "</i> have less than <b>" + simData.years + "</b> years worth of data. </br></br>Please adjust the simulation duration or provide additional data.";
                modalDialog(title, msg);
                return false;
        } else {
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
        } else {
                data.killRate = simData.killProb;
        }

        if(data.HPHY && !isNaN(parseFloat(data.HPHY))){
                data.HPHY = parseFloat(data.HPHY);
        } else {
                data.HPHY = simData.HpHy;
        }

        return data;
}

function setupSimulation(){
        if(!checkSettings())
                return;
        
        setupSimDefaults();
        readUserParameters();

        let townData = setupTowns();
        if(!townData)
                return;
        
        resetWorkerCount();
        completedImgCount = 0;
        debugVector.setVisible(false);
        simulationTime = performance.now();
        $('#coverScreen').modal('open');
        debugSource.clear(true);

        heatMapImages = new Array(simData.years + 1);
        exploitImages = new Array(simData.years + 1);
        entireAreaData = [];
        localAreaData = [];
        simRunData = JSON.parse(JSON.stringify(simData));
        simRunData.townsByID = {};
        for(const settlement in uiData)
                if(uiData[settlement].valid)
                        simRunData.townsByID[uiData[settlement].id] = sanitizeTownData(uiData[settlement]);
        simRunData.towns = JSON.parse(JSON.stringify(townData));
        setupResultsPages();

        showProgressBar("Setting up simulation", 0);
        workerThread.postMessage({type:"newSim", params:simData, towns:townData});
}

function handleWorkerMessage(data){
        switch(data.type){
        case 'mapped':
                workerFunctions[data.fnc](data);
                break;
        case 'finished':
                simResults = data.paramData;
                simResults.visTime = performance.now();
                increaseWorkerCount();
                break;
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
        case 'imgData':
                processWork(data.params, data.data);
                break;
        }
}
