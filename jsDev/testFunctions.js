/* global ol features uiData simData simResults lowColorCode:true highColorCode:true*/

var workerThread;
var workerFunctions = {};

const eaProjection = "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const viewProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs ";

function setupSimDefaults(){
        simData.animalDiffRate = 0.1;
        simData.animalGrowthRate = 0.07;
        simData.killProb = 0.1;
        simData.HpHy = 40;
        simData.encounterRate = 0.02043;
        simData.carryCapacity = 25;
        simData.theta = 1;
        simData.years = 10;
        simData.diffusionSamples = 1;
        simData.huntRange = 5;
        simData.lowColorCode = "ffeda0";
        simData.highColorCode = "f03b20";
        simData.simName = "defaultName";
        simData.opacity = 0.8;
}

function readUserParameters(){
        simData.years = parseInt(document.getElementById("paramYears").value, 10) || simData.years;
        simData.carryCapacity = parseInt(document.getElementById("paramCarry").value, 10) || simData.carryCapacity;
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

        var tempName = document.getElementById("paramName").value;
        if(tempName.length > 0){
                simData.simName = tempName;
        }

        simData.theta = parseFloat(document.getElementById("paramTheta").value) || simData.theta;
        simData.diffusionSamples = parseInt(document.getElementById("diffSamples").value, 10) || simData.diffusionSamples;
        simData.opacity = parseFloat(document.getElementById("imgOpacity").value) || simData.opacity;

        console.log("readUserParameters::finished reading user input");
}

function setupTowns(){
        var townArray = [];

        if(!checkYearlyPopDuration()){
                return false;
        }

        for(let i = 0; i < uiData.length; i++){
                if(uiData[i].valid){
                        townArray.push(sanitizeTownData(uiData[i]));
                }
        }

        if(!townArray.length){
                const title = "No Valid Populations Found";
                const msg = "Please enter at least one population before running the simulation.";
                modalDialog(title, msg);
                return false;
        }
        else{
                return townArray;
        }
}

function checkYearlyPopDuration(){
        var nameString = ""
        for(let i = 0; i < uiData.length; i++){
                if(uiData[i].type === "yearly" && uiData[i].population.length < simData.years){
                        if(!nameString.length){
                                nameString = uiData[i].name;
                        }
                        else{
                                nameString += ", " + uiData[i].name;
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

        return data;
}

function setupSimulation(){
        if(!checkSettings()){
                return;
        }
        if(geoDebugMode){
                debugSetupSimulation();
                return;
        }
        console.log("----------------Starting sim setup-------------------");
        //maybe move this to output display setup
        var cleanup = document.getElementById("rawHeatmapContainer");
        while (cleanup.firstChild) {
                cleanup.removeChild(cleanup.firstChild);
        }
        
        setupSimDefaults();
        readUserParameters();

        let townData = setupTowns();
        if(!townData){
                return;
        }
        
        if(geoGridFeatures){
                while(geoGridFeatures.length){
                        geoGridFeatures.removeFeature(geoGridFeatures[geoGridFeatures.length - 1]);
                }
        }

        showProgressBar("Setting up simulation", 0);

        //
        workerThread = new Worker('jsDev/model.js');
        workerThread.onmessage = function(oEvent) {
                handleWorkerMessage(oEvent.data);
        };
        workerThread.postMessage({type:"newSim", params:simData, towns:townData});
}

function debugSetupSimulation(){
        console.log("----------------Starting sim setup");
        //maybe move this to output display setup
        var cleanup = document.getElementById("rawHeatmapContainer");
        while (cleanup.firstChild) {
                cleanup.removeChild(cleanup.firstChild);
        }

        let townData = [];
        for(let i = 0; i < uiData.length; i++){
                if(uiData[i].valid){
                        townData.push(buildTownFromData(i));
                }
        }
        
        if(!townData.length){
                let title = "No Populations Found";
                let msg = "Please enter at least one population before running the simulation.";
                modalDialog(title, msg);
                console.log("no populations found - aborting run");
                return;
        }

        if(source && geoGridFeatures){
                console.log("Geogrid has " + geoGridFeatures.length + " squares before cleanup");
                while(geoGridFeatures.length){
                        geoGridFeatures.removeFeature(geoGridFeatures[geoGridFeatures.length - 1]);
                }
        }

        setupSimDefaults();
        readUserParameters();
        centerGridTest(townData);
        synchPersisObject();
        changeToOutput();
}

function projectionTest(data){
        proj4.defs('espg4326', viewProjection);
        proj4.defs('mollweide', eaProjection);
        for(let i = 0; i < data.length; i++){
                for(let j = 0; j < data[0].length; j++){
                        data[i][j] = proj4(proj4('mollweide'), proj4('espg4326'), data[i][j]);
                }
        }

        //drawDebugBounds([data[0][0], data[0][1], data[1][1], data[1][0]]);
        
        for(let i = 0; i < data.length - 1; i++){
                for(let j = 0; j < data[0].length - 1; j++){
                        drawDebugBounds([data[i][j], data[i][j+1], data[i+1][j+1], data[i+1][j]]);
                }
        }
        

        /*
        var geometry = [
                tl,
                [br[0], tl[1]],
                br,
                [tl[0], br[1]],
                tl
        ];
        */
        /*
        var current_projection = new ol.proj.Projection({code: "EPSG:4326"});
        var sphere = new ol.Sphere(6378137);
        var area_m = sphere.geodesicArea(geometry, current_projection);
        var area_km = area_m / 1000 / 1000;
        console.log('area: ', area_km, 'km²');  

        console.log("Projection test: " + tl + " and " + br);
        drawDebugBounds([[tl], [br]]);
        */
}

function mapWorkerFunctions(){
        workerFunctions = {
                'progress': function(data) {updateProgressBar(data.statusMsg, data.statusValue);},
                'updateCDFChart': function(data) {createCDFChart(data.densities);},
                'extentDebug': function(data) {drawDebugBounds(data.data);},
                'singleCSV': function(data) {saveSingleCSV(data.csvString, data.year);},
                'allYearsCSV': function(data) {saveAllYearsCSV(data.csvString, data.year);},
                'projTest' : function(data) {projectionTest(data.coordinates);},
        };
}

function handleWorkerMessage(data){
        switch(data.type){
        case 'mapped':
                workerFunctions[data.fnc](data);
                break;
        case 'finished': {
                //TODO code for getting data back
                simResults = data.paramData;
                updateProgressBar("Visualizing Data", 100);
                //simResults.grid = new Array(simData.years + 1);
                workerThread.postMessage({type:'genImage', dest:'mapViewer', year:simData.years, scale:1});
                synchPersisObject();
                changeToOutput();
                setupOutputRanges();
                workerThread.postMessage({type:'getCDFData', year:simData.years});
                //workerThread.postMessage({type:'getLocalCDFData', year:simData.years});
                closeProgressBar();
                break;
                }
        case 'debug':
                console.log("--Worker: " + data.statusMsg);
                break;
        case 'error':
                let title = "An Error Occured";
                let msg = "An error prevented the simulation from running. Please verify parameters and populations and try again. </br>";
                msg += "If you would like to report this error: return to the Get Started page -> Quicksave -> Download that config -> email it to the developer.";
                modalDialog(title, msg, changeToPopulations);
                break;
        case 'imgData': {
                console.log("array print test: " + data.array[10] + " size: " + data.array.length);
                generateCanvas(data.year, data.scale, data.array, data.dest);
                break;
                }
        }
}
