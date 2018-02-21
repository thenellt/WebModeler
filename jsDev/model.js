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
                olTestFunction();
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

function olTestFunction(){
        var data = [];
        var startingPoint = proj4(proj4('espg4326'), proj4('mollweide'), [-121, 44]);
        for(let i = 0; i < 11; i++){
                data.push([]);
                for(let j = 0; j < 11; j++){
                        data[i].push([startingPoint[0] + 1000 * i, startingPoint[1] - 1000 * j]);
                }
        }

        self.postMessage({type:'mapped', fnc:'projTest', coordinates:data});
}

function startWork(data){
        unpackParams(data);
        let bounds = generateBounds(15 + simData.huntRange);
        //self.postMessage({type:'mapped', fnc:'extentDebug', data:bounds});
        generategeoGrid(bounds);
        allocateMemory();
        placeLocations(geoGrid, eaPointSet);
        runSimulation();
}

function unpackParams(data){
        //unpack towns
        simData = data.params;
        towns = data.towns;
        for(var g = 0; g < towns.length; g++){
                points.push([towns[g].long, towns[g].lat]);
        }
}

//dependent on readUserParameters
function allocateMemory(){
        ySize = geoGrid.length;
        xSize = geoGrid[ySize - 1].length;

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

        //console.log("Successfully allocated memory");
}

function generateBounds(range){
        eaPointSet = [];
        for(let i = 0; i < points.length; i++)
                eaPointSet.push(proj4(proj4('espg4326'), proj4('mollweide'), points[i]));

        var topLeft = eaPointSet[0].slice(0);
        var botRight = eaPointSet[0].slice(0);

        for(let i = 1; i < eaPointSet.length; i++){

                //console.log("array point: " + points[i][0] +  ", " + points[i][1]);
                //console.log("top Left: " + topLeft[0] +  ", " + topLeft[1]);

                if(eaPointSet[i][0] < topLeft[0]){
                        //console.log("type of orig: " + (typeof topLeft[0]) + " type of new: " + (typeof points[i][0]));
                        //console.log("replacing " + topLeft[0] +  " with " + points[i][0]);
                        topLeft[0] = eaPointSet[i][0];
                }
                else if(eaPointSet[i][0] > botRight[0]){
                        botRight[0] = eaPointSet[i][0];
                }

                if(eaPointSet[i][1] > topLeft[1]){
                        topLeft[1] = eaPointSet[i][1];
                }
                else if(eaPointSet[i][1] < botRight[1]){
                        botRight[1] = eaPointSet[i][1];
                }
                console.log("");
        }

        var topOffset = [topLeft[0] - 1000 * range, topLeft[1] + 1000 * range];
        var botOffset = [botRight[0] + 1000 * range, botRight[1] - 1000 * range];

        logMessage("***********offsets**************");
        logMessage("topLeft: " + topOffset[0] + ", " + topOffset[1]);
        logMessage("botRight: " + botOffset[0] + ", " + botOffset[1]);

        /*
        var tempPolygon1 = new ol.geom.Polygon([[
                                [topOffset[1], topOffset[0]],
                                [topOffset[1], botOffset[0]],
                                [botOffset[1], botOffset[0]],
                                [botOffset[1], topOffset[0]],
                                [topOffset[1], topOffset[0]]
                        ]]);

        var tempFeature1 = new ol.Feature({
                name: ("pos" + counter++),
                geometry: tempPolygon1
        });

        var teststyle1 = new ol.style.Style({ stroke: new ol.style.Stroke({width: 1 })});
        tempFeature1.setStyle(teststyle1);
        features.addFeature(tempFeature1);
        */
        return [topOffset, botOffset];
}

function generategeoGrid(extremePoints){
        geoGrid = [];

        const width = 1 + Math.abs(extremePoints[1][0] - extremePoints[0][0]) / 1000;
        const height = 1 + Math.abs(extremePoints[0][1] - extremePoints[1][1]) / 1000;
        logMessage("geoGrid size: " + width + " x " + height);

        for(let i = 0; i < height + 1; i++){
                geoGrid.push([]);
                for(let j = 0; j < width + 1; j++){
                        geoGrid[i].push([extremePoints[0][0] + 1000 * j, extremePoints[0][1] + 1000 * i]);
                }
        }
}


function placeLocations(matrix, pointSet){
        //console.log("first point: " + pointSet[0]);
        //console.log("corner: " + matrix[0][0]);
        //for each location we find best fitting 1km x 1km square
        for(var i = 0; i < pointSet.length; i++){
                let x = 0;
                let y = 0;
                while(matrix[y][0][0] > pointSet[i][1]){
                        y++;
                }

                while(matrix[y][x][1] < pointSet[i][0]){
                        x++;
                }

                //console.log("placing point " + pointSet[i] + " at: " + x + ", " + y);
                pointSet[i].push(y - 1);
                towns[i].y = (y - 1);
                pointSet[i].push(x - 1);
                towns[i].x = (x - 1);
        }
}

function destEllipse(lat1, lon1, bearing, distance) {
        var point = [0.0, 0.0, 0.0, 0.0];
        var brg = new Array(0, 180, 0);
        brg[0] = bearing;
        var j=0;
        if (lat1 == 90) {
                lat1 = 89.999999999;
                j=1;
        }
        if (lat1 == -90) {
                lat1 = -89.999999999;
                j=2;
        }
        lat1 = rad(lat1);
        lon1 = rad(lon1);
        brg[j] = rad(brg[j]);
        var s = distance;
        var a = 6378137;
        var b = a - (a/298.257223563);

        s *= 1000;
        var cs1, ds1, ss1, cs1m;
        var f = 1/298.257223563;
        var sb=Math.sin(brg[j]);
        var cb=Math.cos(brg[j]);
        var tu1=(1-f)*Math.tan(lat1);
        var cu1=1/Math.sqrt((1+tu1*tu1));
        var su1=tu1*cu1;
        var s2=Math.atan2(tu1, cb);
        var sa = cu1*sb;
        var csa=1-sa*sa;
        var us=csa*(a*a - b*b)/(b*b);
        var A=1+us/16384*(4096+us*(-768+us*(320-175*us)));
        var B = us/1024*(256+us*(-128+us*(74-47*us)));
        var s1=s/(b*A);
        var s1p = 2*Math.PI;
        while (Math.abs(s1-s1p) > 1e-12) {
                cs1m=Math.cos(2*s2+s1);
                ss1=Math.sin(s1);
                cs1=Math.cos(s1);
                ds1=B*ss1*(cs1m+B/4*(cs1*(-1+2*cs1m*cs1m)- B/6*cs1m*(-3+4*ss1*ss1)*(-3+4*cs1m*cs1m)));
                s1p=s1;
                s1=s/(b*A)+ds1;
        }
        var t=su1*ss1-cu1*cs1*cb;
        var lat2=Math.atan2(su1*cs1+cu1*ss1*cb, (1-f)*Math.sqrt(sa*sa + t*t));
        var l2=Math.atan2(ss1*sb, cu1*cs1-su1*ss1*cb);
        var c=f/16*csa*(4+f*(4-3*csa));
        var l=l2-(1-c)*f*sa* (s1+c*ss1*(cs1m+c*cs1*(-1+2*cs1m*cs1m)));
        //var d=Math.atan2(sa, -t);
        //point[2] = d+2*Math.PI;
        //point[3] = d+Math.PI;
        point[0] = deg(lat2);
        point[1] = deg(normalizeLongitude(lon1+l));

        return point;
}

function runSimulation(){
        logMessage("Starting " + simData.years + " year(s) model with " + simData.diffusionSamples + " samples");
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
                                        if(i !== 0){
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

                for(y = 0; y < ySize; y++){
                        for(x = 0; x < xSize; x++){
                                if(grid[curYear + 1][y][x] < 0){
                                        grid[curYear + 1][y][x] = 0;
                                }
                        }
                }

                let message = {type:'mapped', fnc:'progress', statusMsg:"Finished Year " + curYear, statusValue: 100 * (curYear / simData.years)};
                self.postMessage(message);
        }

        //Send finished, send back data
        let finishedData = {xSize:xSize, ySize:ySize, geoGrid:geoGrid, townData:towns};

        let message = {type:'finished', paramData:finishedData};
        self.postMessage(message);
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
                                //TODO talk to Taal about using floor vs ceiling
                                var gradientPosition = Math.ceil(gradientSteps * (1 - (grid[params.year][y][x] / simData.carryCapacity)));
                                if(gradientPosition < 0 || !gradientPosition){
                                        for(let s = 0; s < scale; s++){
                                                imgData[pos] = gradient[0][0];
                                                imgData[pos + 1] = gradient[0][1];
                                                imgData[pos + 2] = gradient[0][2];
                                                imgData[pos + 3] = 255;
                                                pos += 4;
                                        }
                                }
                                else{
                                        for(let s = 0; s < scale; s++){
                                                imgData[pos] = gradient[gradientPosition][0];           // some R value [0, 255]
                                                imgData[pos + 1] = gradient[gradientPosition][1];           // some G value
                                                imgData[pos + 2] = gradient[gradientPosition][2];           // some B value
                                                imgData[pos + 3] = 255;
                                                pos += 4;
                                        }
                                }
                        }
                }
        }
        logMessage("imgdata test: " + imgData.length + " correct length: " + (xSize * scale) * (ySize * scale) * 4);

        self.postMessage({type:'imgData', year:params.year, scale:params.scale, dest:params.dest, array:imgData}, [imgData.buffer]);
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

        //console.log("hot color: " + hotColor + " and cool color: " + coolColor);

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
                gradient.push(tempColor.slice());
        }

        //console.log(gradient);
        return gradient;
}

function generateCDFBins(year){
        var numCells = 0;
        var dataValues = new Array(11);
        for(let i = 0; i < dataValues.length; i++){
                dataValues[i] = 0;
        }

        //console.log("dataValues starting: " + dataValues);

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

        //console.log("num cells counted: " + numCells);
        //console.log("cell values: " + dataValues);
        for(let i = 0; i < dataValues.length; i++){
                dataValues[i] = parseFloat(dataValues[i] / (1.0 *numCells));
        }

        //console.log("cell post normalize: " + dataValues);

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

/******** Helper Functions **********/

function getTownPop(town, year){
        if(town.type === "exp"){
                return town.population*Math.pow(1 + town.growthRate, year);
        }
        else if(town.type === "yearly"){
                return town.population[year];
        }
}

function deg(rd) {
        return (rd* 180 / Math.PI);
}

function rad(dg) {
        return (dg* Math.PI / 180);
}

function normalizeLongitude(lon) {
        var n=Math.PI;
        if (lon > n) {
                lon = lon - 2*n;
        } else if (lon < -n) {
                lon = lon + 2*n;
        }
        return lon;
}

function logMessage(msgString){
        let message = {type:'debug', statusMsg: msgString};
        self.postMessage(message);
}
