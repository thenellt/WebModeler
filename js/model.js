self.importScripts('./proj4js.js');
self.importScripts('./osmtogeojson.js');
self.importScripts('./turf.min.js');
self.importScripts('./Queue.js');

const eaProjection = "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const viewProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs ";
proj4.defs('espg4326', viewProjection);
proj4.defs('mollweide', eaProjection);

var simData;
var xSize;
var ySize;
var grid;
var diffusionGrid;
var growth;
var offtake;
var towns;
var calcTimes;
var visStartTime;
var eaPointSet;
var points;
var geoGrid;
var spatialEffort;
var riverGrid;

onmessage = function(oEvent) {
        switch(oEvent.data.type){
        case 'newSim':
                setupSim(oEvent.data);
                break;
        case 'genImage':
                generateImageData(oEvent.data);
                break;
        case 'singleYearCSV':
                generateCSV(oEvent.data.year, 'singleCSV');
                break;
        case 'allYearsCSV':
                generateCSV(oEvent.data.year, 'allYearsCSV');
                break;
        case 'getSingleCDFPictures':
                generateCDFPictureData(oEvent.data.id, oEvent.data.range);
                break;
        case 'getSingleCDFData':
                generateSingleCDFData(oEvent.data.id, oEvent.data.range);
                break;
        case 'mouseKCheck':
                checkPositionInformation(oEvent.data.pos, oEvent.data.year);
                break;
        case 'requestBounds':
                self.postMessage({type:'mapped', fnc:'boundsCheck', bounds:
                        generateBounds(oEvent.data.range, oEvent.data.width, oEvent.data.towns)
                });
                break;
        }
};

function setupSim(parameters){
        unpackParams(parameters);
        let bounds = generateBounds(simData.huntRange, simData.boundryWidth);
        generategeoGrid(bounds);
        try{
                allocateMemory();
        } catch(err) {
                self.postMessage({type:'error', text: err.message});
                return;
        }
        placeLocations();
        if(simData.riverSim){
                runRiverSimulation(bounds);
        } else {
                runSimulation(bounds);
        }
}

function runRiverSimulation(bounds){
        self.postMessage({type:'mapped', fnc:'progress', statusMsg:"Tracing Rivers", statusValue: 100});
        if(riverGrid && simData.old && doParamsMatch()){
                for(let y = 0; y < ySize - 1; y++){
                        for(let x = 0; x < xSize - 1; x++){
                                if(riverGrid[y][x]){
                                        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                                                points:[geoGrid[y][x], geoGrid[y][x+1], geoGrid[y+1][x+1], geoGrid[y+1][x]], color:[255, 255, 0, .5]
                                        }});
                                }
                        }
                }

                calculateSpatialEffort();
                runSimulation(bounds);
        } else {
                let newBounds = generateBounds(simData.huntRange, simData.boundryWidth);
                generategeoGrid(newBounds);
                requestRiverFeatures(newBounds);
        }
}

function runSimulation(bounds){
        calculateModel();
        const posArray = [geoGrid[ySize - 1][0][0], geoGrid[ySize - 1][0][1], geoGrid[0][xSize - 1][0], geoGrid[0][xSize - 1][1]];
        self.postMessage({type:'finished', paramData:{name: simData.simName, duration:simData.years,
                xSize:xSize, ySize:ySize, townData:towns, bounds: bounds, simPosition:posArray, perfData:calcTimes}});
        self.postMessage({type:'mapped', fnc:'progress', statusMsg:"Visualizing Data", statusValue: 100});
        generateCDFBins();
        generateSingleCDFData(towns[0].id, simData.huntRange);
        generateCDFPictureData(towns[0].id, simData.huntRange);
        generateOfftakeData();
        generateCPUEdata();
}

function unpackParams(data){
        points = [];
        if(simData){
                let old = {
                        params:JSON.parse(JSON.stringify(simData)),
                        towns:JSON.parse(JSON.stringify(towns)),
                };
                simData = data.params;
                simData.old = old;
        } else {
                simData = data.params;
        }
        towns = data.towns;
        for(var g = 0; g < towns.length; g++)
                points.push([towns[g].long, towns[g].lat]);

        eaPointSet = [];
        for(let i = 0; i < points.length; i++)
                eaPointSet.push(proj4(proj4('espg4326'), proj4('mollweide'), points[i]));
}

function doParamsMatch(){
        if(simData.boundryWidth != simData.old.params.boundryWidth)
                return false;

        let oldTowns = simData.old.towns;
        if(towns.length != oldTowns.length)
                return false;

        for(let i = 0; i < towns.length; i++){
                let match = false;
                for(let j = 0; j < oldTowns.length; j++){
                        if(towns[i].id == oldTowns[j].id){
                                if(towns[i].long == oldTowns[j].long && towns[i].lat == oldTowns[j].lat){
                                        match = true;
                                } else {
                                        return false;
                                }
                        }
                }

                if(!match)
                        return false;
        }

        return true;
}

function allocateMemory(){
        ySize = geoGrid.length;
        xSize = geoGrid[0].length;
        calcTimes = new Float64Array(simData.years);

        grid = new Array(simData.years + 1);
        diffusionGrid = new Array(ySize);
        growth = new Array(ySize);
        offtake = new Array(ySize);

        for(let i = 0; i < simData.years + 1; i++){
                grid[i] = new Array(ySize);
                for(let j = 0; j < ySize; j++)
                        grid[i][j] = new Float64Array(xSize).fill(simData.carryCapacity);
        }

        for(let k = 0; k < ySize; k++){
                diffusionGrid[k] = new Float64Array(xSize).fill(0.0);
                growth[k] = new Float64Array(xSize).fill(0.0);
                offtake[k] = new Float64Array(xSize).fill(0.0);
        }

        for(let i = 0; i < towns.length; i++){
                towns[i].offtake = new Float64Array(simData.years).fill(0.0);
                towns[i].effort = new Float64Array(simData.years).fill(0.0);
        }
}

function generateBounds(huntRange, boundryWidth, newPoints){
        var pointSet;
        if(newPoints){
                pointSet = [];
                for(let i = 0; i < newPoints.length; i++)
                        pointSet.push(proj4(proj4('espg4326'), proj4('mollweide'), [newPoints[i].long, newPoints[i].lat]));
        } else {
                pointSet = eaPointSet;
        }
        var topLeft = pointSet[0].slice(0);
        var botRight = pointSet[0].slice(0);
        let range = huntRange * 2 + boundryWidth;

        for(let i = 1; i < pointSet.length; i++){
                if(pointSet[i][0] < topLeft[0])
                        topLeft[0] = pointSet[i][0];
                else if(pointSet[i][0] > botRight[0])
                        botRight[0] = pointSet[i][0];

                if(pointSet[i][1] > topLeft[1])
                        topLeft[1] = pointSet[i][1];
                else if(pointSet[i][1] < botRight[1])
                        botRight[1] = pointSet[i][1];
        }

        let topOffset = [topLeft[0] - (1000 * range), topLeft[1] + (1000 * range)];
        let botOffset = [botRight[0] + 1000 * range, botRight[1] - 1000 * range];

        return [topOffset, botOffset];
}

function generategeoGrid(extremePoints){
        geoGrid = [];

        const width = 1 + Math.abs(extremePoints[1][0] - extremePoints[0][0]) / 1000;
        const height = 1 + Math.abs(extremePoints[0][1] - extremePoints[1][1]) / 1000;
        logMessage("generategeoGrid: geoGrid size: " + width + " x " + height);

        for(let i = 0; i < height + 1; i++){
                geoGrid.push([]);
                for(let j = 0; j < width + 1; j++){
                        geoGrid[i].push([extremePoints[0][0] + 1000 * j, extremePoints[0][1] - 1000 * i]);
                }
        }

        const xSize = geoGrid[0].length - 1;
        const ySize = geoGrid.length - 1;

        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                points:[geoGrid[0][0], geoGrid[0][xSize], geoGrid[ySize][xSize], geoGrid[ySize][0]], color:[255, 0, 0, .05]
        }});
        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                points:[geoGrid[ySize - 1][xSize - 1], geoGrid[ySize - 1][xSize], geoGrid[ySize][xSize], geoGrid[ySize][xSize - 1]], color:[255, 0, 0, 1]
        }});
        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                points:[geoGrid[0][0], geoGrid[0][1], geoGrid[1][1], geoGrid[1][0]], color:[255, 0, 0, .5]
        }});
        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                points:[geoGrid[0][xSize - 1], geoGrid[0][xSize], geoGrid[1][xSize], geoGrid[1][xSize - 1]], color:[255, 0, 0, 1]
        }});
        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                points:[geoGrid[ySize - 1][0], geoGrid[ySize - 1][1], geoGrid[ySize][1], geoGrid[ySize][0]], color:[255, 0, 0, 1]
        }});
}


function placeLocations(){
        for(let i = 0; i < eaPointSet.length; i++){
                let x = 0;
                let y = 0;
                while(geoGrid[0][x][0] < eaPointSet[i][0])
                        x++;

                while(geoGrid[y][0][1] > eaPointSet[i][1])
                        y++;

                y -= 1;
                x -= 1;

                const coordinates = generateCircleCoords([geoGrid[y][x][0] + 500, geoGrid[y][x][1] - 500], simData.huntRange);
                self.postMessage({type:'mapped', fnc:'circleDebug', data: {points:coordinates, color: [0, 0, 255, .4]}});

                self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                        points:[geoGrid[y][x], geoGrid[y][x+1], geoGrid[y+1][x+1], geoGrid[y+1][x]], color:[66, 134, 244, 1]
                }});

                towns[i].y = y;
                towns[i].x = x;
        }
}

function calculateModel(){
        logMessage("calculateModel: Starting run. Years: " + simData.years + " samples: " + simData.diffusionSamples);
        let gradient = setupGradient();
        self.postMessage({type:'mapped', fnc:'storeGradient', gradient:gradient});
        let xEnd = xSize - 1;
        let yEnd = ySize - 1;
        var startTime, val, i, y, x, effortValue, offtakeValue, gridValue, settleNum;
        var effortFunc = simData.riverSim ? getDynamicEffort : getStaticTownEffort;

        for(let curYear = 0; curYear < simData.years; curYear++){
                startTime = performance.now();
                for(i = 0; i < simData.diffusionSamples; i++){
                        for(y = 1; y < yEnd; y++){
                                for(x = 1; x < xEnd; x++){
                                        if(i){
                                                val = grid[curYear][y+1][x] + diffusionGrid[y+1][x];
                                                val += grid[curYear][y-1][x] + diffusionGrid[y-1][x];
                                                val += grid[curYear][y][x+1] + diffusionGrid[y][x+1];
                                                val += grid[curYear][y][x-1] + diffusionGrid[y][x-1];
                                                diffusionGrid[y][x] += (simData.animalDiffRate * (val - (4 * (grid[curYear][y][x] + diffusionGrid[y][x])))) / simData.diffusionSamples;
                                        } else { 
                                                val = grid[curYear][y+1][x] + grid[curYear][y-1][x] + grid[curYear][y][x+1] + grid[curYear][y][x-1];
                                                diffusionGrid[y][x] = (simData.animalDiffRate * (val - (4 * grid[curYear][y][x]))) / simData.diffusionSamples;
                                        }
                                }
                        }
                }

                for(i = 0; i < ySize; i++){
                        grid[curYear + 1][i][0] = grid[curYear + 1][i][xEnd] = simData.carryCapacity;
                        grid[curYear + 1][i][xEnd] = simData.carryCapacity;
                }
                for(i = 0; i < xSize; i++){
                        grid[curYear + 1][0][i] = grid[curYear + 1][yEnd][i] = simData.carryCapacity;
                        grid[curYear + 1][yEnd][i] = simData.carryCapacity;
                }

                for(y = 1; y < yEnd; y++){
                        for(x = 1; x < xEnd; x++){
                                offtake[y][x] = 0.0;
                                for(settleNum = 0; settleNum < towns.length; settleNum++){
                                        effortValue = effortFunc(towns[settleNum], x, y, curYear);
                                        offtakeValue = towns[settleNum].killRate * simData.encounterRate * effortValue * grid[curYear][y][x];
                                        offtake[y][x] += offtakeValue;
                                        towns[settleNum].offtake[curYear] += offtakeValue;
                                        towns[settleNum].effort[curYear] += effortValue;
                                }
                                growth[y][x] = simData.animalGrowthRate * grid[curYear][y][x] * (1 - Math.pow(grid[curYear][y][x]/simData.carryCapacity, simData.theta));
                                gridValue = grid[curYear][y][x] + diffusionGrid[y][x] + growth[y][x] - offtake[y][x];
                                grid[curYear + 1][y][x] = gridValue > 0 ? gridValue : 0.0;
                        }
                }
                genHeatmapImg(3, curYear, gradient);
                genExploitationImg(curYear);
                self.postMessage({type:'mapped', fnc:'progress', statusMsg:"Simulating Year " + curYear, statusValue: 100 * (curYear / simData.years)});
                calcTimes[curYear] = performance.now() - startTime;
        }
        genHeatmapImg(3, simData.years, gradient);
        genExploitationImg(simData.years);
}

function getStaticTownEffort(town, x, y, year){
        const locationValue = Math.pow(town.x - x, 2) + Math.pow(town.y - y, 2);
        const top = Math.exp((-1)/(2 * Math.pow(simData.huntRange, 2)) * locationValue);
        const bot = (2 * Math.PI) * Math.sqrt(locationValue + 1);
        return (town.HPHY * getTownPop(town, year) * top) / bot;
}

function getDynamicEffort(town, x, y, year){
        const walkEffect = getStaticTownEffort(town, x, y, year);
        const riverEffect = town.HPHY * getTownPop(town, year) * spatialEffort[town.id][y][x];
        return (walkEffect * (simData.effortDist / 100)) + riverEffect; 
}

function calcNewSpatialEffort(){
        spatialEffort = {};
        for(let town of towns){
                spatialEffort[town.id] = new Array(ySize);
                for(let i = 0; i < ySize - 1; i++)
                        spatialEffort[town.id][i] = new Float32Array(xSize).fill(0.0);

                let cellRecord = findAdjRiverCells(town.x, town.y); 
                let cellList = new Array(simData.maxDistance);
                for(let lookupY in cellRecord){
                        for(let lookupX in cellRecord[lookupY]){
                                if(!cellList[cellRecord[lookupY][lookupX]]){
                                        cellList[cellRecord[lookupY][lookupX]] = new Array();
                                }
                                cellList[cellRecord[lookupY][lookupX]].push({x:lookupX, y:lookupY});
                        }
                }

                for(let dist in cellList){
                        const length = cellList[dist].length;
                        for(let item of cellList[dist]){
                                const distFactor = 1;
                                calcRiverEffect(item.x, item.y, distFactor, town);
                        }
                }
        }
}

function findAdjRiverCells(xStart, yStart){
        let cellRecord = new Map();
        let riverTileQueue = new Queue();
        riverTileQueue.enqueue({x:xStart, y:yStart, dist:0});
        
        while(riverTileQueue.getLength()){
                let cell = riverTileQueue.dequeue();
                for(let i = cell.y - 1; i < cell.y + 2; i++){
                        for(let j = cell.x - 1; j < cell.x + 2; j++){
                                if(i < 0 || i >= ySize || j < 0 || j >= xSize)
                                        continue;
                                if(i === cell.y && j === cell.x)
                                        continue;

                                const dist = cell.dist + 1;
                                if(riverGrid[i][j] && (dist < simData.maxDistance) && cellInsertion(cellRecord, j, i, dist)){
                                        riverTileQueue.enqueue({x:j, y:i, dist:cell.dist + 1});
                                }
                        }
                }
        }

        return cellRecord;
}

function calcRiverEffect(cellX, cellY, distFactor, town){
        let effortGrid = spatialEffort[town.id];
        let fakeTown = {
                x:cellX,
                y:cellY,
                HPHY:town.HPHY,
        };
        for(y = 1; y < ySize - 1; y++){
                for(x = 1; x < xSize - 1; x++){

                }
        }
}

function cellInsertion(cellRecord, x, y, dist){
        let lookupY = cellRecord.get(y);
        if(lookupY){
                let lookupX = lookupY.get(x);
                if(lookupX && lookupX.dist <= dist){
                        return false;
                } else {
                        lookupY.set(x, dist);
                }
        } else {
                cellRecord.set(y, new Map());
                let temp = cellRecord.get(y);
                temp.set(x, 1);
        }

        return true;
}

function calculateSpatialEffort(){
        spatialEffort = {};
        for(let town of towns){
                spatialEffort[town.id] = new Array(ySize);
                for(let i = 0; i < ySize - 1; i++)
                        spatialEffort[town.id][i] = new Float32Array(xSize).fill(0.0);

                let effortTotal = 0.0;
                for(y = 1; y < ySize - 1; y++){
                        for(x = 1; x < xSize - 1; x++){
                                const locationValue = Math.pow(town.x - x, 2) + Math.pow(town.y - y, 2);
                                const top = Math.exp((-1)/(2 * Math.pow(simData.huntRange, 2)) * locationValue);
                                const bot = (2 * Math.PI) * Math.sqrt(locationValue + 1);
                                effortTotal += top / bot;
                        }
                }

                let riverTileQueue = new Queue();
                let riverEffortTotal = processSquare(1.0, town.x, town.y, spatialEffort[town.id], riverTileQueue);
                
                while(!riverTileQueue.isEmpty()){
                        let temp = riverTileQueue.dequeue();
                        riverEffortTotal += processSquare(temp.strength, temp.x, temp.y, spatialEffort[town.id], riverTileQueue);
                }
                
                town.effortNormalizer = effortTotal / riverEffortTotal;
        }
}

function processSquare(strength, x, y, effortGrid, workQueue){
        if(strength < 0.05 || strength < (effortGrid[y][x] * 0.9)){
                return 0.0;
        }

        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                points:[geoGrid[y][x], geoGrid[y][x+1], geoGrid[y+1][x+1], geoGrid[y+1][x]], color:[255, 0, 0, .6]
        }});

        let totalEffort = 0.0;
        const rStrength = strength - (simData.riverSim / 100);
        for(let i = y - 1; i < y + 2; i++){
                for(let j = x - 1; j < x + 2; j++){
                        if(i < 0 || i >=ySize || j < 0 || j >= xSize)
                                continue;
                        if(i === y && j === x)
                                continue;

                        if(riverGrid[i][j] && rStrength > effortGrid[i][j]){
                                totalEffort += rStrength;
                                effortGrid[i][j] = rStrength;
                                workQueue.enqueue({x:j, y:i, strength:rStrength});
                        }
                }
        }

        let r = Math.ceil(simData.huntRange * (1.8 * strength));
        for (let i = y-r; i < y+r; i++) {
                if(i < 0 || i >= ySize)
                        continue;
                let condition = Math.pow(r, 2);
                for (let j = x; Math.pow(j - x, 2) + Math.pow(i - y, 2) <= condition; j--) {
                        if(j < 0 || j >= xSize)
                                continue;
                        let val = getCDFValue(x, y, j, i) * strength;
                        if(riverGrid[i][j] && val >= effortGrid[i][j]){
                                workQueue.enqueue({x:j, y:i, strength:val})
                        }
                        
                        if(val > effortGrid[i][j]){
                                effortGrid[i][j] = val;
                                totalEffort += val;
                        }
                }
                for (let j = x + 1; (j - x) * (j - x) + (i - y) * (i - y) <= condition; j++) {
                        if(j < 0 || j >= xSize)
                                continue;
                        let val = getCDFValue(x, y, j, i) * strength;
                        if(riverGrid[i][j] && val >= effortGrid[i][j]){
                                workQueue.enqueue({x:j, y:i, strength:val})
                        } 
                        
                        if(val > effortGrid[i][j]){ //effortGrid[i][j] = val > effortGrid[i][j] ? val : effortGrid[i][j];
                                effortGrid[i][j] = val;
                                totalEffort += val;
                        }
                }
        }

        return totalEffort;
}

function getCDFValue(tx, ty, x, y){
        const locationValue = Math.pow(tx - x, 2) + Math.pow(ty - y, 2);
        const top = Math.exp((-1)/(2 * Math.pow(simData.huntRange, 2)) * locationValue);
        const bot = (2 * Math.PI) * Math.sqrt(locationValue + 1);
        return top / bot;
}

function genHeatmapImg(scale, year, gradient){
        const gradientSteps = Math.floor(simData.carryCapacity) - 1;
        let imgData = new Uint8ClampedArray(((xSize - 1) * scale) * ((ySize - 1) * scale) * 4);
        for(let y = 0; y < ySize - 1; y++){
                for(let x = 0; x < xSize - 1; x++){
                        let gradientPosition = Math.ceil(gradientSteps * (1 - (grid[year][y][x] / simData.carryCapacity)));
                        if(gradientPosition < 0 || !gradientPosition){
                                fillPixel(imgData, x, y, gradient[0], scale);
                        } else {
                                fillPixel(imgData, x, y, gradient[gradientPosition], scale);
                        }
                }
        }

        const params = {width:(xSize - 1) * scale, height:(ySize - 1) * scale, year:year, dest:'heatmapImages'};
        self.postMessage({type:'imgData', params:params, data:imgData}, [imgData.buffer]);
}

function requestRiverFeatures(bounds){
        const simPosition = [geoGrid[ySize - 1][0][0], geoGrid[ySize - 1][0][1], geoGrid[0][xSize - 1][0], geoGrid[0][xSize - 1][1]];
        let riverRequest = new XMLHttpRequest();
        riverRequest.addEventListener('load', function() {
                let bbox = [simPosition[0], simPosition[1], simPosition[2], simPosition[3]];
                let jsonResult = osmtogeojson(JSON.parse(riverRequest.responseText));
                let reprojectResult = [];
                for(let feature of jsonResult.features){
                        let temp = [];
                        turf.meta.coordEach(feature, function(cord){
                                temp.push(proj4(proj4('espg4326'), proj4('mollweide'), cord));
                        });
                        let clippedFeature = turf.bboxClip(turf.helpers.lineString(temp), bbox);
                        if(clippedFeature.geometry.type == "MultiLineString" && clippedFeature.geometry.coordinates.length){
                                for(let line of clippedFeature.geometry.coordinates){
                                        if(line.length > 1)
                                                reprojectResult.push(turf.helpers.lineString(line));
                                }
                        }
                        else if(clippedFeature.geometry.coordinates.length){
                                reprojectResult.push(clippedFeature);
                        }
                }
                findRiverCells(turf.helpers.featureCollection(reprojectResult));
                calculateSpatialEffort();
                runSimulation(bounds);
        });
        riverRequest.open('POST', 'https://overpass.kumi.systems/api/interpreter');
        let leftCorner = proj4(proj4('mollweide'), proj4('espg4326'), [simPosition[0], simPosition[3]]);
        let rightCorner = proj4(proj4('mollweide'), proj4('espg4326'), [simPosition[2], simPosition[1]]);
        let posString = '(' + rightCorner[1] + ',' + leftCorner[0] + ',' + leftCorner[1] + ',' + rightCorner[0] + ');'
        let query = '[out:json][timeout:25];' + '(node["waterway"="river"]' + posString +
                    'way["waterway"="river"]' + posString + 'relation["waterway"="river"]' + 
                    posString + ');out body;>;out skel qt;';
        logMessage("Overpass query string: " + query);
        riverRequest.send(query);
}

function findRiverCells(riverJSON){
        riverGrid = new Array(ySize);
        for(let i = 0; i < ySize; i++)
                riverGrid[i] = new Uint8Array(xSize).fill(0);

       let cell = turf.helpers.polygon([[
                [0,0],
                [0,0],
                [0,0],
                [0,0],
                [0,0]
        ]]);
        for(let y = 0; y < ySize - 1; y++){
                for(let x = 0; x < xSize - 1; x++){
                        if(riverGrid[y][x])
                                continue;
                        
                        cell.geometry.coordinates[0][0] = geoGrid[y][x];
                        cell.geometry.coordinates[0][1] = geoGrid[y][x+1];
                        cell.geometry.coordinates[0][2] = geoGrid[y+1][x+1];
                        cell.geometry.coordinates[0][3] = geoGrid[y+1][x];
                        cell.geometry.coordinates[0][4] = geoGrid[y][x];

                        for(let feature of riverJSON.features){        
                                if(turf.booleanCrosses(cell, feature)){
                                        riverGrid[y][x] = 1;
                                        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                                                points:[geoGrid[y][x], geoGrid[y][x+1], geoGrid[y+1][x+1], geoGrid[y+1][x]], color:[255, 255, 0, .5]
                                        }});
                                        break;
                                }

                        }
                }
        }
}

function setupGradient(){
        var gradient = [];
        var hotColor = [];
        hotColor[0] = parseInt(simData.highColorCode.substring(1, 3) , 16);
        hotColor[1] = parseInt(simData.highColorCode.substring(3, 5) , 16);
        hotColor[2] = parseInt(simData.highColorCode.substring(5, 7) , 16);

        var coolColor = [];
        coolColor[0] = parseInt(simData.lowColorCode.substring(1, 3) , 16);
        coolColor[1] = parseInt(simData.lowColorCode.substring(3, 5) , 16);
        coolColor[2] = parseInt(simData.lowColorCode.substring(5, 7) , 16);

        var midColor = [];
        if(simData.threeColorMode){
                midColor[0] = parseInt(simData.midColorCode.substring(1, 3) , 16);
                midColor[1] = parseInt(simData.midColorCode.substring(3, 5) , 16);
                midColor[2] = parseInt(simData.midColorCode.substring(5, 7) , 16);
        }

        var gradientSteps = Math.floor(simData.carryCapacity) - 1;
        if(simData.threeColorMode === false){
                var redRange = hotColor[0] - coolColor[0];
                var greenRange = hotColor[1] - coolColor[1];
                var blueRange = hotColor[2] - coolColor[2];
                for(var i = 0; i <= gradientSteps; i++){
                        var colorOffset = i / (gradientSteps);
                        var tempColor = [];
                        tempColor[0] = Math.round(redRange * colorOffset) + coolColor[0];
                        tempColor[1] = Math.round(greenRange * colorOffset) + coolColor[1];
                        tempColor[2] = Math.round(blueRange * colorOffset) + coolColor[2];
                        tempColor[3] = 255;
                        gradient.push(tempColor.slice());
                }
        } else {
                var redRange = midColor[0] - coolColor[0];
                var greenRange = midColor[1] - coolColor[1];
                var blueRange = midColor[2] - coolColor[2];
                let range = gradientSteps / 2;
                for(let i = 0; i < range; i++){
                        let colorOffset = i / range;
                        let tempColor = [];
                        tempColor[0] = Math.round(redRange * colorOffset) + coolColor[0];
                        tempColor[1] = Math.round(greenRange * colorOffset) + coolColor[1];
                        tempColor[2] = Math.round(blueRange * colorOffset) + coolColor[2];
                        tempColor[3] = 255;
                        gradient.push(tempColor.slice());
                }

                redRange = hotColor[0] - midColor[0];
                greenRange = hotColor[1] - midColor[1];
                blueRange = hotColor[2] - midColor[2];
                for(let i = range; i <= range * 2; i++){
                        let colorOffset = (i - range) / range;
                        let tempColor = [];
                        tempColor[0] = Math.round(redRange * colorOffset) + midColor[0];
                        tempColor[1] = Math.round(greenRange * colorOffset) + midColor[1];
                        tempColor[2] = Math.round(blueRange * colorOffset) + midColor[2];
                        tempColor[3] = 255;
                        gradient.push(tempColor.slice());
                }
        }

        gradient[0][3] = 0;
        gradient[1][3] = 10;
        gradient[2][3] = 50;
        gradient[3][3] = 120;
        gradient[4][3] = 210;
        gradient[5][3] = 255;

        return gradient;
}

function generateCDFPictureData(id, range){
        for(elmnt in towns)
                if(towns[elmnt].id === id){
                        var selectedTown = towns[elmnt];
                }

        let gradient = setupGradient();
        let gradientSteps = Math.floor(simData.carryCapacity) - 1;
        let xStart = selectedTown.x - range;
        let yStart = selectedTown.y - range;
        let xSize = 2 * range + 1;
        let ySize = 2 * range + 1;
        let xEnd = xStart + xSize;
        let yEnd = yStart + ySize;
        let scale = 6;

        for(let year = 0; year <= simData.years; year++){
                let pos = 0;
                let imgData = new Uint8ClampedArray((xSize * scale) * (ySize * scale) * 4);
                for(var y = yStart; y < yEnd; y++) {
                        for(var row = 0; row < scale; row++){
                                for(var x = xStart; x < xEnd; x++) {
                                        let gradientPosition = Math.ceil(gradientSteps * (1 - (grid[year][y][x] / simData.carryCapacity)));
                                        if(gradientPosition < 0 || !gradientPosition){
                                                for(let s = 0; s < scale; s++){
                                                        imgData[pos] = gradient[0][0];
                                                        imgData[pos + 1] = gradient[0][1];
                                                        imgData[pos + 2] = gradient[0][2];
                                                        imgData[pos + 3] = gradient[0][3];
                                                        pos += 4;
                                                }
                                        }
                                        else{
                                                for(let s = 0; s < scale; s++){
                                                        imgData[pos] = gradient[gradientPosition][0];
                                                        imgData[pos + 1] = gradient[gradientPosition][1];
                                                        imgData[pos + 2] = gradient[gradientPosition][2];
                                                        imgData[pos + 3] = gradient[gradientPosition][3];
                                                        pos += 4;
                                                }
                                        }
                                }
                        }
                }
                const params = {width:(xSize) * scale, height:(ySize) * scale, year:year, dest:'localCDFimg'};
                self.postMessage({type:'imgData', params:params, data:imgData}, [imgData.buffer]);
        }
}

//alg based on https://stackoverflow.com/questions/40779343/java-loop-through-all-pixels-in-a-2d-circle-with-center-x-y-and-radius
function generateSingleCDFData(settlementID, range){
        for(elmnt in towns)
                if(towns[elmnt].id === settlementID){
                        var selectedTown = towns[elmnt];
                }

        let r = range;
        let x = selectedTown.x;
        let y = selectedTown.y;
        var dataValues = [];
        for(let i = 0; i <= simData.years; i++){
                dataValues.push(new Array(10));
                for(let j = 0; j < 10; j++)
                        dataValues[i][j] = 0;
        }

        for(let year = 0; year <= simData.years; year++){
                let numCells = 0;
                for (let i = y-r; i < y+r; i++) {
                        let condition = Math.pow(r, 2);
                        for (let j = x; Math.pow(j - x, 2) + Math.pow(i - y, 2) <= condition; j--) {
                                let ele = grid[year][i][j];
                                numCells++;
                                let temp = ele == simData.carryCapacity ? 9 : Math.floor((ele / simData.carryCapacity) * 10);
                                dataValues[year][temp]++;
                        }
                        for (let j = x + 1; (j - x) * (j - x) + (i - y) * (i - y) <= condition; j++) {
                                let ele = grid[year][i][j];
                                numCells++;
                                let temp = ele == simData.carryCapacity ? 9 : Math.floor((ele / simData.carryCapacity) * 10);
                                dataValues[year][temp]++;
                        }
                }

                for(let i = 0; i < 10; i++)
                        dataValues[year][i] = parseFloat(dataValues[year][i] / (1.0 *numCells)) * 100;
        }

        self.postMessage({type:'mapped', fnc:'localCDFData', densities:dataValues, id:settlementID});
}

function generateCDFBins(){
        const numCells = (ySize - 2) * (xSize - 2);
        var dataValues = new Array(simData.years + 1);
        for(let i = 0; i <= simData.years; i++)
                dataValues[i] = new Array(10).fill(0);

        for(let year = 0; year <= simData.years; year++){
                for(let y = 1; y < ySize - 1; y++){
                        for(let x = 1; x < xSize - 1; x++){
                                const ele = grid[year][y][x];
                                let temp = ele == simData.carryCapacity ? 9 : Math.floor((ele / simData.carryCapacity) * 10);
                                dataValues[year][temp] += 1;
                        }
                }

                for(let i = 0; i < 10; i++)
                        dataValues[year][i] = parseFloat(dataValues[year][i] / (1.0 * numCells)) * 100;
        }

        self.postMessage({type:'mapped', fnc:'entireCDFData', densities:dataValues});
}

function generateOfftakeData(){
        let dataValues = {};
        for(let town of towns)
                dataValues[town.id] = town.offtake;
        self.postMessage({type:'mapped', fnc:'offtakeData', dataString:JSON.stringify(dataValues)});
}

function generateCPUEdata(){
        let dataValues = {};
        for(let town of towns){
                dataValues[town.id] = [];
                for(let i = 0; i < simData.years; i++)
                        dataValues[town.id].push(town.offtake[i] / town.effort[i]);
        }
        self.postMessage({type:'mapped', fnc:'CPUEdata', dataString:JSON.stringify(dataValues)});
}

function generateCSV(requestYear, callbackType){
        var outputString = "";
        for(let i = 0, length = grid[requestYear].length; i < length; i++){
                outputString += grid[requestYear][i].join(",");
                outputString += "\r\n";
        }

        self.postMessage({type:'mapped', fnc:callbackType, csvString:outputString, year:requestYear});
}

function checkPositionInformation(pos, year){
        let mPos = proj4(proj4('espg4326'), proj4('mollweide'), pos);
        let xMin = geoGrid[0][0][0];
        let xMax = geoGrid[ySize - 1][xSize - 1][0];
        let yMax = geoGrid[0][0][1];
        let yMin = geoGrid[ySize - 1][xSize - 1][1];
        if(mPos[0] > xMin && mPos[0] < xMax && mPos[1] > yMin && mPos[1] < yMax){
                let mouseX = Math.floor(Math.abs(mPos[0] - xMin) / 1000);
                let mouseY = Math.floor(Math.abs(yMax - mPos[1]) / 1000);
                self.postMessage({type:'mapped', fnc:'posKUpdate', text:'Pop: ' + grid[year][mouseY][mouseX].toFixed(2)});
        } else{
                self.postMessage({type:'mapped', fnc:'posKUpdate', text:'-'});
        }
}

function getTownPop(town, year){
        if(town.type === "exp"){
                const tmpValue = town.population*Math.pow(1 + town.growthRate, year);
                return tmpValue >= 0.0 ? tmpValue : 0.0;
        } else if(town.type === "yearly") {
                return town.population[year];
        }
}

function logMessage(msgString){
        let message = {type:'debug', statusMsg: msgString};
        self.postMessage(message);
}

function generateCircleCoords(center, radius){
        var coordinates = [];
        var angle = 0;
        for(let i = 0; i < 36; i++, angle += (Math.PI * 2)/36){
                const xMod = Math.cos(angle) * (radius * 1000);
                const yMod = Math.sin(angle) * (radius * 1000);
                coordinates.push([center[0] + xMod, center[1] + yMod]);
        }

        coordinates.push([coordinates[0][0], coordinates[0][1]]);

        let translatedCoordinates = [];
        for(let i = 0; i < coordinates.length; i++)
                translatedCoordinates.push(proj4(proj4('mollweide'), proj4('espg4326'), coordinates[i]));

        return translatedCoordinates;
}

function genExploitationImg(curYear){
        const overexploitedColor = [255, 255, 0, 255];
        const collapsedColor = [255, 0, 0, 255];
        const extirpatedColor = [128, 0, 0, 255];
        const scale = 6;

        let dataGrid = new Array(ySize);
        for(let y = 0; y < ySize - 1; y++){
                dataGrid[y] = new Array(xSize);
                for(let x = 0; x < xSize - 1; x++){
                        if(grid[curYear][y][x] < 0.01 * simData.carryCapacity){
                                dataGrid[y][x] = 3;
                        } else if(grid[curYear][y][x] < 0.1 * simData.carryCapacity){
                                dataGrid[y][x] = 2;
                        } else if(grid[curYear][y][x] < 0.5 * simData.carryCapacity){
                                dataGrid[y][x] = 1;
                        } else {
                                dataGrid[y][x] = 0;
                        }
                }
        }

        let imgData = new Uint8ClampedArray(((xSize - 1) * scale) * ((ySize - 1)  * scale) * 4);
        for(let y = 0; y < ySize - 1; y++){
                for(let x = 0; x < xSize - 1; x++){
                        switch(dataGrid[y][x]){
                        case 1: outlinePixel(imgData, x, y, overexploitedColor, scale);
                                break;
                        case 2: outlinePixel(imgData, x, y, collapsedColor, scale);
                                break;
                        case 3: outlinePixel(imgData, x, y, extirpatedColor, scale);
                                break;
                        }
                }
        }
        const params = {width:(xSize - 1) * scale, height:(ySize - 1) * scale, year:curYear, dest:'expImages'};
        self.postMessage({type:'imgData', params:params, data:imgData}, [imgData.buffer]);
}

function outlinePixel(array, xPos, yPos, color1, scale){
        const rowWidth = (xSize - 1) * scale * 4;
        const offset = (yPos * scale) * rowWidth;
        const xStart = (xPos * scale) * 4;

        for(let y = 0; y < scale; y++){
                let start = offset + xStart + (y * rowWidth);
                for(let x = 0; x < scale; x++){
                        if(y === 0 || y === (scale - 1) || x === 0 || x === (scale - 1)){
                                array[start++] = color1[0];
                                array[start++] = color1[1];
                                array[start++] = color1[2];
                                array[start++] = color1[3];
                        } else {
                                start += 4;
                        }
                }
        }
}

function fillPixel(array, xPos, yPos, color, scale){
        const rowWidth = (xSize - 1) * scale * 4;
        const offset = (yPos * scale) * rowWidth;
        const xStart = (xPos * scale) * 4;

        for(let y = 0; y < scale; y++){
                let start = offset + xStart + (y * rowWidth);
                for(let x = 0; x < scale; x++){
                        array[start++] = color[0];
                        array[start++] = color[1];
                        array[start++] = color[2];
                        array[start++] = color[3];
                }
        }
}