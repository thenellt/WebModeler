var workerThread;

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
        this.getPop = function (year) {
                return this.population*Math.pow(1 + this.growthRate, year);
        };

        this.printOfftake = function(){
                var text = ' ';
                for(var i = 0; i < years; i++){
                        text += this.offtake[i].toFixed(2) + " ";
                }
                console.log("Village: " + name + " offtake: ");
                console.log(text);
        };
}

function drawgeoGrid(){
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
        years = parseInt(document.getElementById("paramYears").value, 10) || years;
        carryCapacity = parseInt(document.getElementById("paramCarry").value, 10) || carryCapacity;
        animalDiffRate = parseFloat(document.getElementById("paramDifRate").value) || animalDiffRate;
        animalGrowthRate = parseFloat(document.getElementById("paramGrowthRate").value) || animalGrowthRate;
        encounterRate = parseFloat(document.getElementById("paramEncounterRate").value) || encounterRate;
        killProb = parseFloat(document.getElementById("paramKillProb").value) || killProb;
        HpHy = parseInt(document.getElementById("paramHphy").value, 10) || HpHy;
        huntRange = parseInt(document.getElementById("rangeHphy").value, 10) || 10;

        var tempLow = document.getElementById("paramLowColor").value;
        if(tempLow.length > 0){
                lowColorCode = tempLow;
        }

        var tempHigh = document.getElementById("paramHighColor").value;
        if(tempHigh.length > 0){
                highColorCode = tempHigh;
        }

        var tempName = document.getElementById("paramName").value;
        if(tempName.length > 0){
                simName = tempName;
        }

        theta = parseFloat(document.getElementById("paramTheta").value) || theta;
        console.log("diff sample input: " + document.getElementById("diffSamples").value);
        diffusionSamples = parseInt(document.getElementById("diffSamples").value, 10) || diffusionSamples;

        console.log("finished reading user input");
}

function setupSimulation(){
        console.log("----------------starting a new run-------------------");
        var cleanup = document.getElementById("rawHeatmapContainer");
        while (cleanup.firstChild) {
                cleanup.removeChild(cleanup.firstChild);
        }

        towns = [];
        for(let i = 0; i < uiData.length; i++){
                if(uiData[i].valid){
                        towns.push(buildTownFromData(i));
                }
        }
        if(!towns.length){
                //TODO add error dialog
                console.log("no populations found");
                return;
        }
        console.log("towns: " + towns.length);

        progressInc = 1.0 / years;

        showProgressBar("Setting up simulation", 0);
        setTimeout(startSimulation, 100);
}

function startSimulation(){
        points = [];
        for(var g = 0; g < towns.length; g++){
                points.push([towns[g].long, towns[g].lat]);
        }

        setupSimDefaults();
        readUserParameters();
        
        //
        workerThread = new Worker('model.js');
        
        workerThread.onmessage = function(oEvent) {
                console.log("Worker message recieved");
                handleWorkerMessage(oEvent.data);
        };
}

function handleWorkerMessage(msg){
        switch(msg.type){
        case 'progress':
                updateProgressBar(msg.statusMsg, msg.statusValue);
                break;
        case 'finished':
                //TODO code for getting data back
                updateProgressBar("Visualizing Data", 100);
                generateCanvas(curYear, 1);
                synchPersisObject();
                changeToOutput();
                setupOutputRanges();
                createCDFChart();
                closeProgressBar();
                break;
        case 'error':
                //TODO fallback to setup, display error message as popup
                break;
        }
}
