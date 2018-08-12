self.importScripts('./proj4js.js', './turf_subset.min.js');

const eaProjection = "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const viewProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs ";
proj4.defs('espg4326', viewProjection);
proj4.defs('mollweide', eaProjection);

var simData;
var xSize;
var ySize;
//model arrays
var grid;
var diffusionGrid;
var growth;
var offtake;
var towns;
var calcTimes;
var eaPointSet = [];
var points = [];
var geoGrid = [[[]]];

onmessage = function(oEvent) {
        switch(oEvent.data.type){
        case 'newSim':
                runSimulation(oEvent.data);
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
        }
};

function runSimulation(parameters){
        unpackParams(parameters);
        let bounds = generateBounds();
        generategeoGrid(bounds);
        try{
                allocateMemory();
        } catch(err) {
                self.postMessage({type:'error', text: err.message});
                return;
        }
        const posArray = [geoGrid[ySize - 1][0][0], geoGrid[ySize - 1][0][1], geoGrid[0][xSize - 1][0], geoGrid[0][xSize - 1][1]];
        self.postMessage({type:'mapped', fnc:'storeMapPos', pos:posArray});
        placeLocations();
        calculateModel();
        let visStartTime = performance.now();
        generateOfftakeImages();
        genExploitationImgData();
        generateEntireCDFData();
        generateSingleCDFData(towns[0].id, simData.huntRange);
        generateCDFPictureData(towns[0].id, simData.huntRange);
        generateOfftakeData();
        let visTime = performance.now() - visStartTime;
        self.postMessage({type:'finished', paramData:{name: simData.simName, duration:simData.years,
                          xSize:xSize, ySize:ySize, geoGrid:geoGrid, townData:towns, bounds: bounds,
                          perfData:calcTimes, visTime:visTime}});
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
}

function allocateMemory(){
        ySize = geoGrid.length;
        xSize = geoGrid[0].length;

        grid = new Array(simData.years + 1);

        diffusionGrid = new Array(ySize);
        growth = new Array(ySize);
        offtake = new Array(ySize);

        for(let i = 0; i < simData.years + 1; i++){
                grid[i] = new Array(ySize);
                for(let j = 0; j < ySize; j++){
                        grid[i][j] = new Array(xSize).fill(simData.carryCapacity);
                }
        }

        for(let k = 0; k < ySize; k++){
                diffusionGrid[k] = new Array(xSize).fill(0.0);
                growth[k] = new Array(xSize).fill(0.0);
                offtake[k] = new Array(xSize).fill(0.0);
        }

        for(let i = 0; i < towns.length; i++){
                towns[i].offtake = [];
                towns[i].effort = [];
                for(let j = 0; j < simData.years; j++){
                        towns[i].offtake.push(0.0);
                        towns[i].effort.push(0.0);
                }
        }
}

function generateBounds(){
        var topLeft = eaPointSet[0].slice(0);
        var botRight = eaPointSet[0].slice(0);
        let range = simData.huntRange * 2 + simData.boundryWidth;

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

        self.postMessage({type:'mapped', fnc:'pointDebug', data: {
                point:proj4(proj4('mollweide'), proj4('espg4326'), topOffset), color: "#6bf442"
        }});
        self.postMessage({type:'mapped', fnc:'pointDebug', data: {
                point:proj4(proj4('mollweide'), proj4('espg4326'), botOffset), color: "#e8f441"
        }});

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
                points:[geoGrid[0][0], geoGrid[0][xSize], geoGrid[ySize][xSize], geoGrid[ySize][0]], color:[255, 0, 0, .5]
        }});
        self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                points:[geoGrid[ySize - 2][xSize - 2], geoGrid[ySize - 2][xSize - 1], geoGrid[ySize - 1][xSize - 1], geoGrid[ySize - 1][xSize - 2]], color:[255, 0, 0, 1]
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


                const loc = [geoGrid[y][x][0] + 500, geoGrid[y][x][1] - 500];
                const coordinates = generateCircleCoords(loc, simData.huntRange);
                self.postMessage({type:'mapped', fnc:'circleDebug', data: {points:coordinates, color: [0, 0, 255, 1]}});

                self.postMessage({type:'mapped', fnc:'extentDebug', data:{
                        points:[geoGrid[y][x], geoGrid[y][x+1], geoGrid[y+1][x+1], geoGrid[y+1][x]], color:[66, 134, 244, 1]
                }});

                towns[i].y = y;
                towns[i].x = x;
        }
}

function calculateModel(){
        logMessage("calculateModel: Starting run. Years: " + simData.years + " samples: " + simData.diffusionSamples);
        var top, bot, locationValue, x, y;
        calcTimes = new Array(simData.years);

        for(let curYear = 0; curYear < simData.years; curYear++){
                //d*[i+1,j] + d*[i-1,j] + d*[i,j+1] + d*[i,j-1] + ([i,j] - 4*d*[i,j])
                //D*a       + D*b       + D*d       + D*e       + (c     - 4*D*c    )
                let startTime = performance.now();
                let xEnd = xSize - 1;
                let yEnd = ySize - 1;
                for(let i = 0; i < simData.diffusionSamples; i++){
                        for(y = 1; y < yEnd; y++){
                                for(x = 1; x < xEnd; x++){
                                        if(i){
                                                let val = grid[curYear][y+1][x] + diffusionGrid[y+1][x];
                                                val    += grid[curYear][y-1][x] + diffusionGrid[y-1][x];
                                                val    += grid[curYear][y][x+1] + diffusionGrid[y][x+1];
                                                val    += grid[curYear][y][x-1] + diffusionGrid[y][x-1];
                                                diffusionGrid[y][x] += (simData.animalDiffRate * (val - (4 * (grid[curYear][y][x] + diffusionGrid[y][x])))) / simData.diffusionSamples;
                                        } else { 
                                                let val = grid[curYear][y+1][x];
                                                val    += grid[curYear][y-1][x];
                                                val    += grid[curYear][y][x+1];
                                                val    += grid[curYear][y][x-1];
                                                diffusionGrid[y][x] = (simData.animalDiffRate * (val - (4 * grid[curYear][y][x]))) / simData.diffusionSamples;
                                        }
                                }
                        }
                }

                for(let i = 0; i < ySize; i++){
                        grid[curYear + 1][i][0] = simData.carryCapacity;
                        grid[curYear + 1][i][xEnd] = simData.carryCapacity;
                }
                for(let i = 0; i < xSize; i++){
                        grid[curYear + 1][0][i] = simData.carryCapacity;
                        grid[curYear + 1][yEnd][i] = simData.carryCapacity;
                }

                for(y = 1; y < yEnd; y++){
                        for(x = 1; x < xEnd; x++){
                                for(let settleNum = 0, length = towns.length; settleNum < length; settleNum++){
                                        locationValue = Math.pow(towns[settleNum].x - x, 2) + Math.pow(towns[settleNum].y - y, 2);
                                        top = Math.exp((-1)/(2*Math.pow(simData.huntRange, 2)) * locationValue);
                                        bot = 2*Math.PI*Math.sqrt(locationValue + 1);
                                        const effortValue = (towns[settleNum].HPHY*getTownPop(towns[settleNum], curYear)*top)/bot;
                                        const offtakeValue = towns[settleNum].killRate * simData.encounterRate * effortValue * grid[curYear][y][x];
                                        offtake[y][x] = settleNum ? offtake[y][x] + offtakeValue : offtakeValue;
                                        towns[settleNum].offtake[curYear] += offtakeValue;
                                        towns[settleNum].effort[curYear] += effortValue;
                                }
                                //n[year,:,:]*lambdas-lambdas*n[year,:,:]*(n[year,:,:]/density)**theta
                                //growth[y][x] = animalGrowthRate*grid[curYear][y][x] - animalGrowthRate*grid[curYear][y][x]*Math.pow((grid[curYear][y][x]/carryCapacity), theta);
                                growth[y][x] = simData.animalGrowthRate * grid[curYear][y][x] * (1 - Math.pow((grid[curYear][y][x]/simData.carryCapacity), simData.theta));
                                let gridValue = grid[curYear][y][x] + diffusionGrid[y][x] + growth[y][x] - offtake[y][x];
                                grid[curYear + 1][y][x] = gridValue > 0.0 ? gridValue : 0.0;
                        }
                }

                self.postMessage({type:'mapped', fnc:'progress', statusMsg:"Finished Year " + curYear, statusValue: 100 * (curYear / simData.years)});
                calcTimes[curYear] = performance.now() - startTime;
        }
}

function generateOfftakeImages(){
        self.postMessage({type:'mapped', fnc:'progress', statusMsg:"Visualizing Data", statusValue: 100});
        let gradient = setupGradient();
        for(let curYear = 0; curYear <= simData.years; curYear++){
                generateImageData({'scale': 4, 'year': curYear, 'dest': 'animationFrame'}, gradient);
        }
}

function generateImageData(params, gradient){
        if(!gradient)
                gradient = setupGradient();
        const gradientSteps = Math.floor(simData.carryCapacity) - 1;
        const scale = params.scale;

        var imgData = new Uint8ClampedArray(((xSize - 1) * scale) * ((ySize - 1) * scale) * 4);
        for(let y = 0; y < ySize - 1; y++){
                for(let x = 0; x < xSize - 1; x++){
                        let gradientPosition = Math.ceil(gradientSteps * (1 - (grid[params.year][y][x] / simData.carryCapacity)));
                        if(gradientPosition < 0 || !gradientPosition){
                                placePixel(imgData, x, y, gradient[0], scale);
                        } else {
                                placePixel(imgData, x, y, gradient[gradientPosition], scale);
                        }
                }
        }

        self.postMessage({type:'imgData', year:params.year, scale:scale, dest:params.dest,
                          x:(xSize - 1), y:(ySize - 1), array:imgData}, [imgData.buffer]);
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

        //should really look into replacing this with a formula
        gradient[0][3] = 0;
        gradient[1][3] = 10;
        gradient[2][3] = 50;
        gradient[3][3] = 90;
        gradient[4][3] = 145;
        gradient[5][3] = 190;
        gradient[6][3] = 230;
        gradient[7][3] = 245;

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
        let scale = 5;

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
                self.postMessage({type:'singleCDFImages', year:year, x:xSize, y:ySize,
                                  array:imgData}, [imgData.buffer]);
        }
}

function generateEntireCDFData(){
        for(let i = 0; i <= simData.years; i++)
                generateCDFBins(i);
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

        self.postMessage({type:'mapped', fnc:'localCDFData', densities:dataValues, year:simData.years, id:settlementID});
}

function generateCDFBins(year){
        var numCells = 0;
        var dataValues = new Array(10);
        for(let i = 0; i < dataValues.length; i++)
                dataValues[i] = 0;

        grid[year].forEach(function(element){
                element.forEach(function(ele){
                        numCells++;
                        let temp = ele == simData.carryCapacity ? 9 : Math.floor((ele / simData.carryCapacity) * 10);
                        dataValues[temp]++;
                });
        });

        for(let i = 0; i < dataValues.length; i++)
                dataValues[i] = parseFloat(dataValues[i] / (1.0 *numCells)) * 100;

        self.postMessage({type:'mapped', fnc:'entireCDFData', densities:dataValues, year:year});
}

function generateOfftakeData(){
        let dataValues = {};
        for(let i = 0, length = towns.length; i < length; i++)
                dataValues[towns[i].id] = towns[i].offtake;
        self.postMessage({type:'mapped', fnc:'offtakeData', dataString:JSON.stringify(dataValues)});
}

function generateCSV(requestYear, callbackType){
        var outputString = "";
        for(let i = 0, length = grid[requestYear].length; i < length; i++){
                outputString += grid[requestYear][i].join(", ");
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

function genExploitationImgData(){
        const overexploitedColor = [255, 255, 0, 255];
        const collapsedColor = [255, 0, 0, 255];
        const extirpatedColor = [128, 0, 0, 255];
        const popColor = [128, 0, 0, 255];
        const gradientSteps = Math.floor(simData.carryCapacity) - 1;
        const scale = 7;
        const xNewSize = xSize - 1;
        const yNewSize = ySize - 1;
        const width = xSize * scale;
        const height = ySize * scale;
        const gradient = setupGradient();

        for(let curYear = 0; curYear <= simData.years; curYear++){
                let dataGrid = new Array(ySize);
                for(let y = 0; y < ySize - 1; y++){
                        dataGrid[y] = new Array(xSize);
                        for(let x = 0; x < xSize - 1; x++){
                                dataGrid[y][x] = [];
                                if(grid[curYear][y][x] < 0.01 * simData.carryCapacity){
                                        dataGrid[y][x].push(3);
                                } else if(grid[curYear][y][x] < 0.1 * simData.carryCapacity){
                                        dataGrid[y][x].push(2);
                                } else if(grid[curYear][y][x] < 0.5 * simData.carryCapacity){
                                        dataGrid[y][x].push(1);
                                } else {
                                        dataGrid[y][x].push(0);
                                }
                                const gradPos = Math.ceil(gradientSteps * (1 - (grid[curYear][y][x] / simData.carryCapacity)));
                                dataGrid[y][x].push(gradPos);
                        }
                }

                //traceBoundries(dataGrid);
                let imgData = new Uint8ClampedArray(((xSize - 1) * scale) * ((ySize - 1)  * scale) * 4);
                for(let y = 0; y < ySize - 1; y++){
                        for(let x = 0; x < xSize - 1; x++){
                                switch(dataGrid[y][x][0]){
                                case 0: //outlinePixel(imgData, x, y, [244, 66, 232, 255], scale);
                                        break;
                                case 1: outlinePixel(imgData, x, y, overexploitedColor, scale);
                                        break;
                                case 2: outlinePixel(imgData, x, y, collapsedColor, scale);
                                        break;
                                case 3: outlinePixel(imgData, x, y, extirpatedColor, scale);
                                        break;
                                }
                        }
                }

                self.postMessage({type:'imgData', year:curYear, scale:scale, dest:'expImages',
                                x:xSize - 1, y:ySize - 1, array:imgData}, [imgData.buffer]);
        }
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

function placePixel(array, xPos, yPos, color, scale){
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

function traceBoundries(array){
        let clone = JSON.parse(JSON.stringify(array));
        for(let i = 0; i < towns.length; i++){

        }
}