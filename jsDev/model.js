//simulation parameters
/*
var animalDiffRate;
var animalGrowthRate;
var killProb;
var HpHy;
var encounterRate;
var huntRange;
var theta;
var carryCapacity;
var years;
var diffusionSamples;
*/

self.importScripts('../js/proj4js.js');

var DEBUG;
const eaProjection = "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const viewProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs ";

proj4.defs('espg4326', viewProjection);
proj4.defs('mollweide', eaProjection);

var simData;

//model only vars
var xSize;
var ySize;

//model arrays
var grid;
var diffusionGrid;
var growth;
var effort;
var towns;
var eaPointSet = [];
var points = [];
var geoGrid = [[[]]];

onmessage = function(oEvent) {
        switch(oEvent.data.type){
        case 'newSim':
                startWork(oEvent.data);
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
        case 'getCDFData':
                generateCDFBins(oEvent.data.year);
                break;
        case 'getLocalCDFData':
                genLocalCDFBins(oEvent.data.year);
                break;
        }
};

function startWork(parameters){
        unpackParams(parameters);
        let bounds = generateBounds(15 + simData.huntRange);
        generategeoGrid(bounds);
        allocateMemory();
        placeLocations();
        runSimulation();
}

function unpackParams(data){
        //unpack towns and reproject them
        points = [];
        simData = data.params;
        towns = data.towns;
        for(var g = 0; g < towns.length; g++)
                points.push([towns[g].long, towns[g].lat]);

        eaPointSet = [];
        for(let i = 0; i < points.length; i++)
                eaPointSet.push(proj4(proj4('espg4326'), proj4('mollweide'), points[i]));
        
        if(data.debug){
                logMessage("unpackParams: debugMode set");
                DEBUG = true;  
        }
        else
                DEBUG = false;
}

function allocateMemory(){
        ySize = geoGrid.length;
        xSize = geoGrid[0].length;

        grid = new Array(simData.years + 1);

        diffusionGrid = new Array(ySize);
        growth = new Array(ySize);
        effort = new Array(ySize);

        for(var i = 0; i < simData.years + 1; i++){
                grid[i] = new Array(ySize);
                for(var j = 0; j < ySize; j++){
                        grid[i][j] = new Array(xSize).fill(simData.carryCapacity);
                }
        }

        for(var k = 0; k < ySize; k++){
                diffusionGrid[k] = new Array(xSize).fill(0.0);
                growth[k] = new Array(xSize).fill(0.0);
                effort[k] = new Array(xSize).fill(0.0);
        }
}

function generateBounds(range){
        var topLeft = eaPointSet[0].slice(0);
        var botRight = eaPointSet[0].slice(0);

        for(let i = 1; i < eaPointSet.length; i++){
                if(eaPointSet[i][0] < topLeft[0])
                        topLeft[0] = eaPointSet[i][0];
                else if(eaPointSet[i][0] > botRight[0])
                        botRight[0] = eaPointSet[i][0];

                if(eaPointSet[i][1] > topLeft[1])
                        topLeft[1] = eaPointSet[i][1];
                else if(eaPointSet[i][1] < botRight[1])
                        botRight[1] = eaPointSet[i][1];
        }

        var topOffset = [];
        topOffset[0] = topLeft[0] - (1000 * range);
        topOffset[1] = topLeft[1] + (1000 * range);
        var botOffset = [botRight[0] + 1000 * range, botRight[1] - 1000 * range];

        if(DEBUG){
                self.postMessage({type:'mapped', fnc:'pointDebug', data: {
                        point:proj4(proj4('mollweide'), proj4('espg4326'), topOffset), color: "#6bf442"
                }});
                self.postMessage({type:'mapped', fnc:'pointDebug', data: {
                        point:proj4(proj4('mollweide'), proj4('espg4326'), botOffset), color: "#e8f441"
                }});
        }

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

        if(DEBUG){
                self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                        points:[geoGrid[0][0], geoGrid[0][xSize], geoGrid[ySize][xSize], geoGrid[ySize][0]], color:[255, 0, 0, .2]
                }});
                self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                        points:[geoGrid[ySize - 2][xSize - 2], geoGrid[ySize - 2][xSize - 1], geoGrid[ySize - 1][xSize - 1], geoGrid[ySize - 1][xSize - 2]], color:[255, 0, 0, .5]
                }});
                self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                        points:[geoGrid[ySize - 1][xSize - 1], geoGrid[ySize - 1][xSize], geoGrid[ySize][xSize], geoGrid[ySize][xSize - 1]], color:[255, 0, 0, .5]
                }});
                self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                        points:[geoGrid[0][0], geoGrid[0][1], geoGrid[1][1], geoGrid[1][0]], color:[255, 0, 0, .5]
                }});
                self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                        points:[geoGrid[0][xSize - 1], geoGrid[0][xSize], geoGrid[1][xSize], geoGrid[1][xSize - 1]], color:[255, 0, 0, .5]
                }});
                self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                        points:[geoGrid[ySize - 1][0], geoGrid[ySize - 1][1], geoGrid[ySize][1], geoGrid[ySize][0]], color:[255, 0, 0, .5]
                }});
        }
}


function placeLocations(){
        //for each location we find best fitting 1km x 1km square
        for(var i = 0; i < eaPointSet.length; i++){
                let x = 0;
                let y = 0;
                while(geoGrid[0][x][0] < eaPointSet[i][0])
                        x++;

                while(geoGrid[y][0][1] > eaPointSet[i][1])
                        y++;

                y -= 1;
                x -= 1;

                if(DEBUG){
                        logMessage("placeLocations: place pop: " + eaPointSet[i] + " at: " + x + ", " + y);
                        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                                points:[geoGrid[y][x], geoGrid[y][x+1], geoGrid[y+1][x+1], geoGrid[y+1][x]], color:[66, 134, 244, .7]
                        }});

                        const loc = [geoGrid[y][x][0] + 500, geoGrid[y][x][1] - 500];
                        const coordinates = generateCircleCoords(loc, simData.huntRange);
                        self.postMessage({type:'mapped', fnc:'circleDebug', data: {points:coordinates, color: [0, 0, 255, .3]}});
                }

                towns[i].y = y;
                towns[i].x = x;
        }
}

function runSimulation(){
        logMessage("runSimulation: Starting run. Years: " + simData.years + " samples: " + simData.diffusionSamples);
        var top, bot, locationValue;
        var up, down, center, right, left;
        var x, y;

        for(let curYear = 0; curYear < simData.years; curYear++){
                //d*[i+1,j] + d*[i-1,j] + d*[i,j+1] + d*[i,j-1] + ([i,j] - 4*d*[i,j])
                //D*a       + D*b       + D*d       + D*e       + (c     - 4*D*c    )
                //TODO check diffusion sample calculation correctness
                for(var i = 0; i < simData.diffusionSamples; i++){
                        for(y = 1; y < ySize - 1; y++){
                                for(x = 1; x < xSize - 1; x++){
                                        if(i){
                                                //diffusionGrid[y][x] += (animalDiffRate*(a + b) + (1-4*animalDiffRate)*(c + animalDiffRate*(d + e)))/diffusionSamples;
                                                up     = grid[curYear][y+1][x] + diffusionGrid[y+1][x];
                                                down   = grid[curYear][y-1][x] + diffusionGrid[y-1][x];
                                                center = grid[curYear][y][x] + diffusionGrid[y][x];
                                                right  = grid[curYear][y][x+1] + diffusionGrid[y][x+1];
                                                left   = grid[curYear][y][x-1] + diffusionGrid[y][x-1];
                                                diffusionGrid[y][x] += (simData.animalDiffRate * (up + down + right + left - (4 * center))) / simData.diffusionSamples;
                                                //diffusionGrid[y][x] = (simData.animalDiffRate * (up + down + left + right - (4 * center))) / simData.diffusionSamples;
                                        }
                                        else{
                                                //diffusionGrid[y][x] = (animalDiffRate*(a + b) + (1-4*animalDiffRate)*(c + animalDiffRate*(d + e)))/diffusionSamples;
                                                up     = grid[curYear][y+1][x];
                                                down   = grid[curYear][y-1][x];
                                                center = grid[curYear][y][x];
                                                right  = grid[curYear][y][x+1];
                                                left   = grid[curYear][y][x-1];
                                                diffusionGrid[y][x] = (simData.animalDiffRate * (up + down + right + left - (4 * center))) / simData.diffusionSamples;
                                                //diffusionGrid[y][x] = (simData.animalDiffRate * (up + down + left + right - (4 * center))) / simData.diffusionSamples;
                                        }
                                }
                        }
                }

                for(y = 0; y < ySize; y++){
                        for(x = 0; x < xSize; x++){
                                if(y > 0 && y < ySize - 1){
                                        if(x > 0 && x < xSize - 1){
                                                for(var settleNum = 0; settleNum < towns.length; settleNum++){
                                                        //((comlocation[numb,0]-i)**2+(comlocation[numb,1]-j)**2))
                                                        //console.log("town info: " + towns[settleNum].x +  "," + towns[settleNum].y);
                                                        locationValue = Math.pow(towns[settleNum].x - x, 2) + Math.pow(towns[settleNum].y - y, 2);
                                                        //console.log(locationValue);
                                                        //math.exp(-1/(2*std**2)*locationValue)
                                                        top = Math.exp((-1)/(2*Math.pow(simData.huntRange, 2)) * locationValue);

                                                        //(2*math.pi*math.sqrt(locationValue+1)
                                                        bot = 2*Math.PI*Math.sqrt(locationValue + 1);
                                                        //console.log("Top: " + top + " bot: " + bot);
                                                        if(settleNum === 0){
                                                                effort[y][x] = (simData.HpHy*getTownPop(towns[settleNum], curYear)*top)/bot;
                                                        }
                                                        else{
                                                                effort[y][x] += (simData.HpHy*getTownPop(towns[settleNum], curYear)*top)/bot;
                                                        }
                                                        //console.log("effort at: " + x + "," + y + " is: " + effort[y][x]);
                                                        towns[settleNum].offtake[curYear] += simData.killProb * simData.encounterRate * ((simData.HpHy * getTownPop(towns[settleNum], curYear) * top)/bot) * grid[curYear][y][x];
                                                }
                                                //n[year,:,:]*lambdas-lambdas*n[year,:,:]*(n[year,:,:]/density)**theta
                                                //growth[y][x] = animalGrowthRate*grid[curYear][y][x] - animalGrowthRate*grid[curYear][y][x]*Math.pow((grid[curYear][y][x]/carryCapacity), theta);
                                                growth[y][x] = (simData.animalGrowthRate * grid[curYear][y][x]) * (1 - (grid[curYear][y][x]/simData.carryCapacity));
                                                grid[curYear + 1][y][x] = grid[curYear][y][x] + diffusionGrid[y][x] + growth[y][x] - simData.killProb * simData.encounterRate*effort[y][x]*grid[curYear][y][x];
                                        }
                                        else{
                                                grid[curYear + 1][y][x] = simData.carryCapacity;
                                        }
                                }
                                else{
                                        grid[curYear + 1][y][x] = simData.carryCapacity;
                                }
                        }
                }

                for(y = 0; y < ySize; y++)
                        for(x = 0; x < xSize; x++)
                                if(grid[curYear + 1][y][x] < 0)
                                        grid[curYear + 1][y][x] = 0;

                logMessage("runSimulation: finished year " + curYear);
                self.postMessage({type:'mapped', fnc:'progress', statusMsg:"Finished Year " + curYear, statusValue: 100 * (curYear / simData.years)});
        }

        self.postMessage({type:'finished', paramData:{xSize:xSize, ySize:ySize, geoGrid:geoGrid, townData:towns}});
}

function generateImageData(params){
        let scale = params.scale;
        var gradient = setupGradient();
        var gradientSteps = simData.carryCapacity - 1;

        var pos = 0;
        //simResults.xSize * scale, simResults.ySize * scale
        var imgData = new Uint8ClampedArray((xSize * scale) * (ySize * scale) * 4);
        for(var y = 0; y < ySize; y++) {
                for(var row = 0; row < scale; row++){
                        for(var x = 0; x < xSize; x++) {
                                //TODO talk about using floor vs ceiling
                                var gradientPosition = Math.ceil(gradientSteps * (1 - (grid[params.year][y][x] / simData.carryCapacity)));
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
                                                imgData[pos] = gradient[gradientPosition][0];           // some R value [0, 255]
                                                imgData[pos + 1] = gradient[gradientPosition][1];           // some G value
                                                imgData[pos + 2] = gradient[gradientPosition][2];           // some B value
                                                imgData[pos + 3] = gradient[gradientPosition][3];
                                                pos += 4;
                                        }
                                }
                        }
                }
        }

        const posArray = [geoGrid[ySize - 1][0][0], geoGrid[ySize - 1][0][1], geoGrid[0][xSize - 1][0], geoGrid[0][xSize - 1][1]];
        self.postMessage({type:'imgData', year:params.year, scale:params.scale, dest:params.dest, position:posArray, array:imgData}, [imgData.buffer]);
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

        var redRange = hotColor[0] - coolColor[0];
        var greenRange = hotColor[1] - coolColor[1];
        var blueRange = hotColor[2] - coolColor[2];

        var gradientSteps = simData.carryCapacity - 1;

        for(var i = 0; i <= gradientSteps; i++){
                var colorOffset = i / (gradientSteps);
                var tempColor = [];
                tempColor[0] = Math.round(redRange * colorOffset) + coolColor[0];
                tempColor[1] = Math.round(greenRange * colorOffset) + coolColor[1];
                tempColor[2] = Math.round(blueRange * colorOffset) + coolColor[2];
                tempColor[3] = 255;
                gradient.push(tempColor.slice());
        }

        gradient[0][3] = 0;
        gradient[1][3] = 50;
        gradient[2][3] = 100;
        gradient[3][3] = 150;
        gradient[4][3] = 200;

        return gradient;
}

function generateCDFBins(year){
        var numCells = 0;
        var dataValues = new Array(11);
        for(let i = 0; i < dataValues.length; i++)
                dataValues[i] = 0;

        grid[year].forEach(function(element){
                element.forEach(function(ele){
                        numCells++;
                        let temp = ele / (1.0 * simData.carryCapacity);
                        if(temp > .99)
                                dataValues[10]++;
                        else
                                dataValues[Math.floor(temp * 10)]++;
                });
        });

        for(let i = 0; i < dataValues.length; i++)
                dataValues[i] = parseFloat(dataValues[i] / (1.0 *numCells));

        self.postMessage({type:'mapped', fnc:'updateCDFChart', densities:dataValues});
}

function genLocalCDFBins(year){
        let pointMask = generateVillageMask();

        var numCells = 0;
        var dataValues = new Array(11);
        for(let i = 0; i < dataValues.length; i++){
                dataValues[i] = 0;
        }

        grid[year].forEach(function(element){
                element.forEach(function(ele){
                        numCells++;
                        let temp = ele / (1.0 * simData.carryCapacity);
                        if(temp > .99){
                                dataValues[10]++;
                        }
                        else{
                                dataValues[Math.floor(temp * 10)]++;
                        }
                });
        });
}

function generateCSV(requestYear, callbackType){
        var outputString = "";
        for(let i = 0; i < grid[requestYear].length; i++){
                outputString += grid[requestYear][i].join(", ");
                outputString += "\r\n";
        }

        self.postMessage({type:'mapped', fnc:callbackType, csvString:outputString, year:requestYear});
}

function getTownPop(town, year){
        if(town.type === "exp"){
                return town.population*Math.pow(1 + town.growthRate, year);
        }
        else if(town.type === "yearly"){
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
