/* global ol uiData API_KEYS simData simResults*/

var map;
var features;
var source = new ol.source.Vector({wrapX: false});
//var popLabelFeatures = [];
var pointVector;
var canvas;
var canvasImage;
var imageLayer;
var addPopFunction;

/*
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

        var gradientSteps = simData.carryCapacity - 1;

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
*/

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

//https://stackoverflow.com/questions/39006597/openlayers-3-add-text-label-to-feature
function styleFunction() {
        return [new ol.style.Style({
                        text: new ol.style.Text({
                                font: '12px Calibri,sans-serif',
                                fill: new ol.style.Fill({ color: '#FFFFFF' }),
                                stroke: new ol.style.Stroke({
                                        color: '#000000',
                                        width: 1
                                }),
                                text: this.get('name'),
                                offsetY: 13
                        }),
                        image: new ol.style.Circle({
                                radius: 6,
                                fill: new ol.style.Fill({ color: "#2196F3"}),//'rgba(255,0,0,1)'}),
                                stroke: new ol.style.Stroke({
                                        color: '#000000',
                                        width: 1
                                })
                        })
                })
        ];
}

/*
function drawHeatMap(matrix){
        console.log("starting drawHeatMap: ");

        var gradient = setupGradient();
        var gradientSteps = simData.carryCapacity - 1;

        for(var y = 0; y < simResults.ySize - 1; y++){
                console.log("starting row: " + y);
                for(var x = 0; x < simResults.xSize - 1; x++){
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

                        var gradientPosition = Math.ceil(gradientSteps * (1 - (simResults.grid[simData.years][y][x] / simData.carryCapacity)));
                        if(gradientPosition < 0 || !gradientPosition){
                                gradientPosition = 0;
                        }

                        var teststyle = new ol.style.Style({
                                fill: new ol.style.Fill({ color: [gradient[gradientPosition][0], gradient[gradientPosition][1], gradient[gradientPosition][2], 0.5]}) //color: [255, 0, 0, (1 - (grid[years][y][x] / carryCapacity))]
                        });
                        tempFeature.setStyle(teststyle);
                        features.addFeature(tempFeature);
                }
        }

        pointVector.setVisible(false);
}
*/

function setupOlInputMap(){
        var teststyle = new ol.style.Style({
                fill: new ol.style.Fill({ color: [0, 255, 0, 0.3]})
        });
        features = new ol.source.Vector();

        map = new ol.Map({
                target: 'popMapDiv', //'map_canvas',
                layers: [
                        /*
                        new ol.layer.Tile({
                                source: new ol.source.OSM({wrapX: false})
                        }),
                        */
                        new ol.layer.Tile({
                                source: new ol.source.BingMaps({
                                        imagerySet: 'Aerial',
                                        key: API_KEYS.bingMaps,
                                        projection: 'EPSG:4326',
                                        wrapX: false
                                })
                                /*new ol.source.TileWMS({
                                        url: 'https://ahocevar.com/geoserver/wms',
                                        //crossOrigin: '',

                                        params: {
                                                'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
                                                'TILED': true
                                        },
                                        projection: 'EPSG:4326',
                                        wrapX: false
                                })
                                */
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

function getExtent(){
        console.log("button clicked");
        console.log(ol.geom.Polygon.fromExtent(map.getView().calculateExtent(map.getSize())));
        var coords = map.getView().calculateExtent(map.getSize());
        console.log(coords[0] + ", " + coords[3]);
        //map.getView().setCenter(ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setCenter([coords[0],coords[3]]);
}

function generateCanvas(year, scale, data, dest){
        console.log("generating canvas for year: " + year + " and scale: " + scale);
        canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = simResults.xSize * scale;
        canvas.height = simResults.ySize * scale;
        
        ctx.putImageData(data, 0, 0);
        canvasImage = new Image();
        canvasImage.id = 'image' + year;

        switch()
        canvasImage.onload = function(){
                drawCanvasToMap()
        };
        
        canvasImage.src = canvas.toDataURL();
}

function drawCanvasToMap(canvasImage){
        console.log("picture: " + canvasImage.naturalHeight);
        console.log("picture: " + canvasImage.naturalWidth);
        document.getElementById("rawHeatmapContainer").appendChild(canvasImage);

        var tempLength = simResults.geoGrid.length - 1;
        var tempPoint = simResults.geoGrid[tempLength][simResults.geoGrid[tempLength].length - 1];

        console.log("top corner: " + simResults.geoGrid[0][0] + " bot corner: " + tempPoint);
        console.log("extent: " + [simResults.geoGrid[0][0][1], tempPoint[0], tempPoint[1], simResults.geoGrid[0][0][0]]);

        if(imageLayer){
                map.removeLayer(imageLayer);
        }

        imageLayer = new ol.layer.Image({
                opacity: 0.8,
                source: new ol.source.ImageStatic({
                    url: canvasImage.src,
                    imageSize: [canvasImage.naturalWidth, canvasImage.naturalHeight],
                    projection: map.getView().getProjection(),
                    imageExtent: [simResults.geoGrid[0][0][1], tempPoint[0], tempPoint[1], simResults.geoGrid[0][0][0]]
                })
        });

        imageLayer.set('name', 'imgLayer');
        map.addLayer(imageLayer);
}
        
function generateCanvas(curYear, scale){
        console.log("generating canvas for year: " + curYear + " and scale: " + scale);
        //towns[0].printOfftake();
        var gradient = setupGradient();
        var gradientSteps = simData.carryCapacity - 1;

        canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = simResults.xSize * scale;
        canvas.height = simResults.ySize * scale;

        var imgData=ctx.getImageData(0, 0, simResults.xSize * scale, simResults.ySize * scale);
        var data=imgData.data;

        var pos = 0;
        for(var y = 0; y < simResults.ySize; y++) {
                for(var row = 0; row < scale; row++){
                        for(var x = 0; x < simResults.xSize; x++) {
                                //TODO talk to Taal about using floor vs ceiling
                                var gradientPosition = Math.ceil(gradientSteps * (1 - (simResults.grid[curYear][y][x] / simData.carryCapacity)));
                                if(gradientPosition < 0 || !gradientPosition){
                                        for(let s = 0; s < scale; s++){
                                                data[pos] = gradient[0][0];
                                                data[pos + 1] = gradient[0][1];
                                                data[pos + 2] = gradient[0][2];
                                                data[pos + 3] = 255;
                                                pos += 4;
                                        }
                                }
                                else{
                                        for(let s = 0; s < scale; s++){
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

                var tempLength = simResults.geoGrid.length - 1;
                var tempPoint = simResults.geoGrid[tempLength][simResults.geoGrid[tempLength].length - 1];

                console.log("top corner: " + simResults.geoGrid[0][0] + " bot corner: " + tempPoint);
                console.log("extent: " + [simResults.geoGrid[0][0][1], tempPoint[0], tempPoint[1], simResults.geoGrid[0][0][0]]);

                if(imageLayer){
                        map.removeLayer(imageLayer);
                }

                imageLayer = new ol.layer.Image({
                        opacity: 0.8,
                        source: new ol.source.ImageStatic({
                            url: canvasImage.src,
                            imageSize: [canvasImage.naturalWidth, canvasImage.naturalHeight],
                            projection: map.getView().getProjection(),
                            imageExtent: [simResults.geoGrid[0][0][1], tempPoint[0], tempPoint[1], simResults.geoGrid[0][0][0]]
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
        };
}

function drawHeatmap(){

}

setupOlInputMap();
