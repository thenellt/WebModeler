/* global ol features uiData simData simResults lowColorCode:true highColorCode:true*/

var workerThread;
var workerFunctions = {};

function town(long, lat, pop, killRate, name, growth, id){
        if(id === 0){
                let tempDate = new Date();
                this.id = tempDate.valueOf();
        }
        else{
                this.id = id;
        }
        this.long = long;
        this.lat = lat;
        this.growthRate = growth;
        this.population = pop;
        this.killRate = killRate;
        this.name = name;
        this.offtake = []; //new Array(years).fill(0.0);
}

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

function printOfftake(village){
        var text = ' ';
        for(var i = 0; i < simData.years; i++){
                text += village.offtake[i].toFixed(2) + " ";
        }
        console.log("Village: " + village.name + " offtake: ");
        console.log(text);
}

//debuging function. Draws every 1km x 1km cell
function drawgeoGrid(){
        let geoGrid = simResults.geoGrid;
        for(var y = 0; y < geoGrid.length - 1; y++){
                for(var x = 0; x < geoGrid[0].length - 1; x++){
                         var tempPolygon = new ol.geom.Polygon([[
                                [geoGrid[y][x][1], geoGrid[y][x][0]],
                                [geoGrid[y][x][1], geoGrid[y + 1][x][0]],
                                [geoGrid[y + 1][x + 1][1], geoGrid[y + 1][x + 1][0]],
                                [geoGrid[y][x + 1][1], geoGrid[y][x][0]],
                                [geoGrid[y][x][1], geoGrid[y][x][0]]
                        ]]);

                        var tempFeature = new ol.Feature({
                                name: ("pos" + x + "," + y),
                                geometry: tempPolygon
                        });

                        var teststyle = new ol.style.Style({
                                stroke: new ol.style.Stroke({width: 1 }),
                                //fill: new ol.style.Fill({ color: [255, 0, 0, (1 - (geoGrid[years][y][x] / carryCapacity))]})
                                //stroke: new ol.style.Stroke({color: [255, 0, 0, (1 - (geoGrid[years][y][x] / carryCapacity))], width: 1})
                        });
                        tempFeature.setStyle(teststyle);
                        features.addFeature(tempFeature);
                }
        }
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
        console.log("diff sample input: " + document.getElementById("diffSamples").value);
        simData.diffusionSamples = parseInt(document.getElementById("diffSamples").value, 10) || simData.diffusionSamples;
        simData.opacity = parseFloat(document.getElementById("imgOpacity").value) || simData.opacity;

        console.log("finished reading user input");
}

function setupSimulation(){
        console.log("----------------Starting sim setup-------------------");
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
                //TODO add error dialog
                console.log("no populations found - aborting run");
                return;
        }
        console.log("Found " + townData.length + " valid towns");

        showProgressBar("Setting up simulation", 0);
        setupSimDefaults();
        readUserParameters();

        //
        workerThread = new Worker('jsDev/model.js');
        workerThread.onmessage = function(oEvent) {
                handleWorkerMessage(oEvent.data);
        };
        workerThread.postMessage({type:"newSim", params:simData, towns:townData});
}

function mapWorkerFunctions(){
        workerFunctions = {
                'progress': function(data) {updateProgressBar(data.statusMsg, data.statusValue);},
                'updateCDFChart': function(data) {createCDFChart(data.densities);},
                'extentDebug': function(data) {drawDebugBounds(data.data);},
        };
}

function handleWorkerMessage(data){
        switch(data.type){
        case 'mapped':
                workerFunctions[data.fnc](data);
                break;
                /*
        case 'progress':
                updateProgressBar(data.statusMsg, data.statusValue);
                break;
                */
        case 'finished': {
                //TODO code for getting data back
                simResults = data.paramData;
                updateProgressBar("Visualizing Data", 100);
                //simResults.grid = new Array(simData.years + 1);
                //generateCanvas(simData.years - 1, 1);
                workerThread.postMessage({type:'genImage', dest:'mapViewer', year:simData.years - 1, scale:1});
                synchPersisObject();
                changeToOutput();
                setupOutputRanges();
                drawgeoGrid();
                workerThread.postMessage({type:'getCDFData', year:simData.years - 1})
                closeProgressBar();
                break;
        }
        case 'debug':
                console.log("--Worker: " + data.statusMsg);
                break;
        case 'error':
                //TODO fallback to setup, display error message as popup
                break;
        case 'imgData': {
                console.log("array print test: " + data.array[10] + " size: " + data.array.length);
                generateCanvas(data.year, data.scale, data.array, data.dest);
                break;
        }
        }
}

mapWorkerFunctions();
