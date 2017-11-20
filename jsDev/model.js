//simulation parameters
var xSize;
var ySize;
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
var lowColorCode = "";
var highColorCode = "";
var simName = "";
var simID;

//model arrays
var grid;
var diffusionGrid;
var growth;
var effort;
var towns = [];

var curImage;

//ol maps variables
var map;
var features;
var source = new ol.source.Vector({wrapX: false});
var popLabelFeatures = [];
var pointVector;
var canvas;
var canvasImage;
var imageLayer;
var addPopFunction;


function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
}

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

//https://stackoverflow.com/questions/39006597/openlayers-3-add-text-label-to-feature
function styleFunction() {
        return [
                new ol.style.Style({
                        fill: new ol.style.Fill({
                                color: 'rgba(255,255,255,0.4)'
                        }),
                        stroke: new ol.style.Stroke({
                                color: '#3399CC',
                                width: 1.25
                        }),
                        text: new ol.style.Text({
                                font: '12px Calibri,sans-serif',
                                fill: new ol.style.Fill({ color: '#000' }),
                                stroke: new ol.style.Stroke({
                                        color: '#fff', width: 2
                                }),
                                text: this.get('name'),
                                offsetY: 13
                        }),
                        image: new ol.style.Circle({
                                radius: 6,
                                fill: new ol.style.Fill({ color: 'rgba(255,0,0,1)'}),
                                stroke: new ol.style.Stroke({
                                        color: 'rgba(38,166,154,1)',
                                        width: 1
                                })
                        })
                })
        ];
}

function removePopFromMapById(popId){
        if(!source){
                return;
        }

        var features = source.getFeatures();
        for(var j = 0; j < features.length; j++){
                if(features[j].get('description') == popId){
                        source.removeFeature(features[j]);
                        break;
                }
        }
}

function addPopToMap(popId, popName, long, lat){
        if(!source){
                return;
        }
        var tempPoint = new ol.geom.Point(
                [long, lat]
        );

        var tempFeature = new ol.Feature(tempPoint);
        tempFeature.set('description', popId);
        tempFeature.set('name', popName);
        tempFeature.setStyle(styleFunction);
        source.addFeature(tempFeature);
}

function setupSimDefaults(){
        curImage = 0;
        animalDiffRate = 0.1;
        animalGrowthRate = 0.07;
        killProb = 0.1;
        HpHy = 40;
        encounterRate = 0.02043;
        carryCapacity = 25;
        theta = 1;
        years = 10;
        diffusionSamples = 1;
        huntRange = 5;
        lowColorCode = "ffeda0";
        highColorCode = "f03b20";
        simName = "defaultName";
}

function runSimulation(curYear){
        console.log("modeling year number: " + curYear + " with " + diffusionSamples + " samples");
        var top, bot, locationValue;
        var up, down, center, right, left;
        var x, y;
        for(var j = 0; j < ySize; j++){
                diffusionGrid[j].fill(0.0);
        }

        //d*[i+1,j] + d*[i-1,j] + d*[i,j+1] + d*[i,j-1] + ([i,j] - 4*d*[i,j])
        //D*a       + D*b       + D*d       + D*e       + (c     - 4*D*c    )
        //TODO check diffusion sample calculation correctness
        for(var i = 0; i < diffusionSamples; i++){
                console.log("running diff sample: " + i);
                for(y = 1; y < ySize - 1; y++){
                        for(x = 1; x < xSize - 1; x++){
                                if(i !== 0){
                                        //diffusionGrid[y][x] += (animalDiffRate*(a + b) + (1-4*animalDiffRate)*(c + animalDiffRate*(d + e)))/diffusionSamples;
                                        up     = grid[curYear][y+1][x] + diffusionGrid[y+1][x];
                                        down   = grid[curYear][y-1][x] + diffusionGrid[y-1][x];
                                        center = grid[curYear][y][x] + diffusionGrid[y][x];
                                        right  = grid[curYear][y][x+1] + diffusionGrid[y][x+1];
                                        left   = grid[curYear][y][x-1] + diffusionGrid[y][x-1];
                                        //diffusionGrid[y][x] += (animalDiffRate * (up + down + right + left) + (center - 4 * animalDiffRate * center)) / diffusionSamples;
                                        diffusionGrid[y][x] = (animalDiffRate * (up + down + left + right - (4 * center))) / diffusionSamples;
                                }
                                else{
                                        //diffusionGrid[y][x] = (animalDiffRate*(a + b) + (1-4*animalDiffRate)*(c + animalDiffRate*(d + e)))/diffusionSamples;
                                        up     = grid[curYear][y+1][x];
                                        down   = grid[curYear][y-1][x];
                                        center = grid[curYear][y][x];
                                        right  = grid[curYear][y][x+1];
                                        left   = grid[curYear][y][x-1];
                                        //diffusionGrid[y][x] = (animalDiffRate * (up + down + right + left) + (center - 4 * animalDiffRate * center)) / diffusionSamples;
                                        diffusionGrid[y][x] = (animalDiffRate * (up + down + left + right - (4 * center))) / diffusionSamples;
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
                                                top = Math.exp((-1)/(2*Math.pow(huntRange, 2)) * locationValue);

                                                //(2*math.pi*math.sqrt(locationValue+1)
                                                bot = 2*Math.PI*Math.sqrt(locationValue + 1);
                                                //console.log("Top: " + top + " bot: " + bot);
                                                if(settleNum === 0){
                                                        effort[y][x] = (HpHy*towns[settleNum].getPop(curYear)*top)/bot;
                                                }
                                                else{
                                                        effort[y][x] += (HpHy*towns[settleNum].getPop(curYear)*top)/bot;
                                                }
                                                //console.log("effort at: " + x + "," + y + " is: " + effort[y][x]);
                                                towns[settleNum].offtake[curYear] += killProb * encounterRate * ((HpHy * towns[settleNum].getPop(curYear) * top)/bot) * grid[curYear][y][x];
                                        }
                                        //n[year,:,:]*lambdas-lambdas*n[year,:,:]*(n[year,:,:]/density)**theta
                                        //growth[y][x] = animalGrowthRate*grid[curYear][y][x] - animalGrowthRate*grid[curYear][y][x]*Math.pow((grid[curYear][y][x]/carryCapacity), theta);
                                        growth[y][x] = (animalGrowthRate * grid[curYear][y][x]) * (1 - (grid[curYear][y][x]/carryCapacity));
                                        grid[curYear + 1][y][x] = grid[curYear][y][x] + diffusionGrid[y][x] + growth[y][x] - killProb*encounterRate*effort[y][x]*grid[curYear][y][x];
                                }
                                else{
                                        grid[curYear + 1][y][x] = carryCapacity;
                                }
                        }
                        else{
                                grid[curYear + 1][y][x] = carryCapacity;
                        }
                }
        }

        for(var y = 0; y < ySize; y++){
                for(var x = 0; x < xSize; x++){
                        if(grid[curYear + 1][y][x] < 0){
                                grid[curYear + 1][y][x] = 0;
                        }
                }
        }

        if(curYear + 1 < years){
                //runSimulation(curYear + 1);
                //generateCanvas(curYear);
                setTimeout(runSimulation, 10, curYear + 1);
                updateProgressBar("Finished Year " + curYear, progressInc);
        }
        else{
                //setVisibleImage(0);
                updateProgressBar("Cleaning up...", 100);
                generateCanvas(curYear, 1);
                synchPersisObject();
                changeToOutput();
                setupOutputRanges();
                createCDFChart();
                closeProgressBar();
        }
}

function printArray(array){
        var arrText = '';
        for (var i = 0; i < array.length; i++) {
            for (var j = 0; j < array[i].length; j++) {
                arrText+=(array[i][j]).toFixed(2) + ' ';
            }
            console.log(arrText);
            arrText='';
        }
}

function setupGradient(){
        var gradient = [];
        var hotColor = [];
        hotColor[0] = parseInt(highColorCode.substring(1, 3) , 16);
        hotColor[1] = parseInt(highColorCode.substring(3, 5) , 16);
        hotColor[2] = parseInt(highColorCode.substring(5, 7) , 16);

        var coolColor = [];
        coolColor[0] = parseInt(lowColorCode.substring(1, 3) , 16);
        coolColor[1] = parseInt(lowColorCode.substring(3, 5) , 16);
        coolColor[2] = parseInt(lowColorCode.substring(5, 7) , 16);

        console.log("hot color: " + hotColor + " and cool color: " + coolColor);

        var redRange = hotColor[0] - coolColor[0];
        var greenRange = hotColor[1] - coolColor[1];
        var blueRange = hotColor[2] - coolColor[2];

        var gradientSteps = carryCapacity - 1;

        for(var i = 0; i <= gradientSteps; i++){
                var colorOffset = i / (gradientSteps);
                var tempColor = [];
                tempColor[0] = Math.round(redRange * colorOffset) + coolColor[0];
                tempColor[1] = Math.round(greenRange * colorOffset) + coolColor[1];
                tempColor[2] = Math.round(blueRange * colorOffset) + coolColor[2];
                gradient.push(tempColor.slice());
        }

        console.log(gradient);
        return gradient;
}

function placePopulation(e){
        var tempFeatures = [];
        map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
                tempFeatures.push(feature);

        }, {hitTolerance: 5});

        if(!tempFeatures.length){
                showPopEditor(e.coordinate);
        }
        else{
                var tempId = tempFeatures[0].get('description');
                console.log("existing feature clicked. Id: " + tempId);
                for(var t = 0; t < uiData.length; t++){
                        if(uiData[t].id == tempId){
                                showPopUpdater(t);
                                break;
                        }
                }
        }
}

function setupOlInputMap(){
        var drawControls;
        var teststyle = new ol.style.Style({
                fill: new ol.style.Fill({ color: [0, 255, 0, 0.3]})
        });
        features = new ol.source.Vector();

        map = new ol.Map({
                target: 'popMapDiv', //'map_canvas',
                layers: [
                        new ol.layer.Tile({
                                source: new ol.source.OSM({wrapX: false})
                        }),
                        new ol.layer.Vector({
                                source: features,
                                style: teststyle
                        })
                ],
                view: new ol.View({
                        projection: 'EPSG:4326',
                        center: [37.41, 8.82],
                        zoom: 2
                }),
                controls: []
        });

        pointVector = new ol.layer.Vector({
                source: source,
                style: new ol.style.Style({
                        fill: new ol.style.Fill({color: 'rgba(255, 255, 255, 0.2)'}),
                        stroke: new ol.style.Stroke({color: '#ffcc33', width: 2}),
                        image: new ol.style.Circle({radius: 7, fill: new ol.style.Fill({color: '#ffcc33'})})
                })
        });
        map.addLayer(pointVector);

        addPopFunction = map.on('click', placePopulation);
        map.updateSize();
}

function drawHeatMap(matrix){
        console.log("starting drawHeatMap: ");

        var gradient = setupGradient();
        var gradientSteps = carryCapacity - 1;

        for(var y = 0; y < ySize - 1; y++){
                console.log("starting row: " + y);
                for(var x = 0; x < xSize - 1; x++){
                        var tempPolygon = new ol.geom.Polygon([[
                                [matrix[y][x][1], matrix[y][x][0]],
                                [matrix[y][x][1], matrix[y + 1][x][0]],
                                [matrix[y + 1][x + 1][1], matrix[y + 1][x + 1][0]],
                                [matrix[y][x + 1][1], matrix[y][x][0]],
                                [matrix[y][x][1], matrix[y][x][0]]
                        ]]);

                        var tempFeature = new ol.Feature({
                                name: ("pos" + x + "," + y),
                                geometry: tempPolygon
                        });

                        var gradientPosition = Math.ceil(gradientSteps * (1 - (grid[years][y][x] / carryCapacity)));
                        if(gradientPosition < 0 || !gradientPosition){
                                gradientPosition = 0;
                        }

                        var teststyle = new ol.style.Style({
                                fill: new ol.style.Fill({ color: [gradient[gradientPosition][0], gradient[gradientPosition][1], gradient[gradientPosition][2], .5]}) //color: [255, 0, 0, (1 - (grid[years][y][x] / carryCapacity))]
                        });
                        tempFeature.setStyle(teststyle);
                        features.addFeature(tempFeature);
                }
        }

        pointVector.setVisible(false);
}

function getExtent(){
        console.log("button clicked");
        console.log(ol.geom.Polygon.fromExtent(map.getView().calculateExtent(map.getSize())));
        var coords = map.getView().calculateExtent(map.getSize());
        console.log(coords[0] + ", " + coords[3]);
        //map.getView().setCenter(ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setCenter([coords[0],coords[3]]);
}


function generateCanvas(curYear, scale){
        console.log("generating canvas for year: " + curYear + " and scale: " + scale);
        //towns[0].printOfftake();
        var gradient = setupGradient();
        var gradientSteps = carryCapacity - 1;

        canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = xSize * scale;
        canvas.height = ySize * scale;

        var imgData=ctx.getImageData(0,0,xSize * scale,ySize * scale);
        var data=imgData.data;

        var pos = 0;
        for(var y = 0; y < ySize; y++) {
                for(var row = 0; row < scale; row++){
                        for(var x = 0; x < xSize; x++) {
                                //TODO talk to Taal about using floor vs ceiling
                                var gradientPosition = Math.ceil(gradientSteps * (1 - (grid[curYear][y][x] / carryCapacity)));
                                if(gradientPosition < 0 || !gradientPosition){
                                        for(var s = 0; s < scale; s++){
                                                data[pos] = gradient[0][0];
                                                data[pos + 1] = gradient[0][1];
                                                data[pos + 2] = gradient[0][2];
                                                data[pos + 3] = 255;
                                                pos += 4;
                                        }
                                }
                                else{
                                        for(var s = 0; s < scale; s++){
                                                data[pos] = gradient[gradientPosition][0];           // some R value [0, 255]
                                                data[pos + 1] = gradient[gradientPosition][1];           // some G value
                                                data[pos + 2] = gradient[gradientPosition][2];           // some B value
                                                data[pos + 3] = 255;
                                                pos += 4;
                                        }
                                }
                        }
                }
        }

        ctx.putImageData(imgData, 0, 0);
        canvasImage = new Image();
        canvasImage.id = 'image' + curYear;

        canvasImage.src = canvas.toDataURL();

        canvasImage.onload = function(){
                console.log("picture: " + canvasImage.naturalHeight);
                console.log("picture: " + canvasImage.naturalWidth);
                document.getElementById("rawHeatmapContainer").appendChild(canvasImage);

                var tempLength = geoGrid.length - 1;
                var tempPoint = geoGrid[tempLength][geoGrid[tempLength].length - 1]

                console.log("top corner: " + geoGrid[0][0] + " bot corner: " + tempPoint);
                console.log("extent: " + [geoGrid[0][0][1], tempPoint[0], tempPoint[1], geoGrid[0][0][0]]);

                if(imageLayer){
                        map.removeLayer(imageLayer);
                }

                imageLayer = new ol.layer.Image({
                        opacity: 0.8,
                        source: new ol.source.ImageStatic({
                            url: canvasImage.src,
                            imageSize: [canvasImage.naturalWidth, canvasImage.naturalHeight],
                            projection: map.getView().getProjection(),
                            imageExtent: [geoGrid[0][0][1], tempPoint[0], tempPoint[1], geoGrid[0][0][0]]
                        })
                });

                imageLayer.set('name', 'imgLayer');

                /*
                var projection = new ol.proj.Projection({
                        projection: 'EPSG:4326'
                });

                var map2 = new ol.Map({
                        layers: [
                          new ol.layer.Image({
                            source: new ol.source.ImageStatic({
                              url: canvasImage.src,
                              projection: projection,
                              imageExtent: [geoGrid[0][0][1], tempPoint[0], tempPoint[1], geoGrid[0][0][0]]
                            })
                          })
                        ],
                        target: 'testMap2',
                        view: new ol.View({
                          projection: projection,
                          zoom: 2,
                          maxZoom: 8
                        })
                });
                */
                //var tempLayers = map.getLayers();
                //for(var c = 0; c < tempLayers.getLength(); c++){
                //        tempLayers.item(c).setVisible(false);
                //}
                map.addLayer(imageLayer);
        }
}

function toggleImgLayer(){
        if(imageLayer.getVisible()){
                imageLayer.setVisible(false);
        }
        else{
                imageLayer.setVisible(true);
        }
}

setupOlInputMap();
