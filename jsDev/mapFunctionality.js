/* global ol uiData API_KEYS simData simResults*/

const eaProjection = "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const viewProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs ";

proj4.defs('espg4326', viewProjection);
proj4.defs('mollweide', eaProjection);

var map;
var bingLayers = [];
var features;
var geoGridFeatures;
var source = new ol.source.Vector({wrapX: false});
var debugSource = new ol.source.Vector({wrapX: false});
var scaleLineControl = new ol.control.ScaleLine();
var debugVector;
var pointVector;
var canvas;
var canvasImage;
var imageLayer;
var addPopFunction;

function placePopulation(e){
        var tempFeatures = [];
        map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
                tempFeatures.push(feature);

        }, {hitTolerance: 3});

        if(!tempFeatures.length){
                showPopEditor(e.coordinate);
        }
        else{
                var tempId = tempFeatures[0].get('description');
                console.log("existing feature clicked. Id: " + tempId);
                for(var t = 0; t < uiData.length; t++){
                        if(uiData[t].id === tempId){
                                showPopUpdater(t);
                                break;
                        }
                }
        }
}

function removePopFromMapById(popId){
        var features = source.getFeatures();
        for(var j = 0; j < features.length; j++){
                if(features[j].get('description') == popId){
                        source.removeFeature(features[j]);
                        break;
                }
        }
}

function addPopToMap(popId, popName, long, lat, isYearly){
        var tempPoint = new ol.geom.Point(
                [long, lat]
        );

        var tempFeature = new ol.Feature(tempPoint);
        tempFeature.set('description', popId);
        tempFeature.set('name', popName);
        if(isYearly){
                tempFeature.setStyle(styleYearly);
        }
        else{
                tempFeature.setStyle(styleFunction);
        }
        source.addFeature(tempFeature);
}

function centerGridTest(points){
        let distance = Math.sqrt(2)/2;
        for(let i = 0; i < points.length; i++){
                console.log("point location: " + points[i].lat);
                let topLeft  = destEllipse(points[i].lat, points[i].long, 315, distance);
                let topRight = destEllipse(points[i].lat, points[i].long, 45,  distance);
                let botLeft  = destEllipse(points[i].lat, points[i].long, 225, distance);
                let botRight = destEllipse(points[i].lat, points[i].long, 135, distance);
                
                console.log("topLeft: " + topLeft[0] + ", " + topLeft[1]);
                
                let tempPolygon = new ol.geom.Polygon([[
                        [topLeft[1], topLeft[0]],
                        [topRight[1], topRight[0]],
                        [botRight[1], botRight[0]],
                        [botLeft[1], botLeft[0]],
                        [topLeft[1], topLeft[0]]
                ]]);

                let tempFeature = new ol.Feature({
                        name: ("test1"),
                        geometry: tempPolygon
                });
                
                let testStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({width: 2, color: [255, 0, 0, 1]}),
                        fill: new ol.style.Fill({ color: [255, 0, 0, .5],})
                });
                
                tempFeature.setStyle(testStyle);
                geoGridFeatures.addFeature(tempFeature);
        }
        
        console.log("finished geo test function");
}

function drawgeoGrid(){
        let towns = simResults.townData;
        for(var y = 0; y < simResults.geoGrid.length - 1; y++){
                for(var x = 0; x < simResults.geoGrid[y].length - 2; x++){
                        var tempPolygon = new ol.geom.Polygon([[
                                [simResults.geoGrid[y][x][1], simResults.geoGrid[y][x][0]],
                                [simResults.geoGrid[y][x][1], simResults.geoGrid[y + 1][x][0]],
                                [simResults.geoGrid[y + 1][x + 1][1], simResults.geoGrid[y + 1][x + 1][0]],
                                [simResults.geoGrid[y][x + 1][1], simResults.geoGrid[y][x][0]],
                                [simResults.geoGrid[y][x][1], simResults.geoGrid[y][x][0]]
                        ]]);

                        var tempFeature = new ol.Feature({
                                name: ("pos" + x + "," + y),
                                geometry: tempPolygon
                        });

                        let i;
                        var testStyle;
                        for(i = 0; i < towns.length; i++){
                                if(towns[i].y === y && towns[i].x === x){
                                        testStyle = new ol.style.Style({
                                                stroke: new ol.style.Stroke({width: 1 }),
                                                fill: new ol.style.Fill({ color: [244, 66, 203, 255]})
                                                //stroke: new ol.style.Stroke({color: [255, 0, 0, (1 - (geoGrid[years][y][x] / carryCapacity))], width: 1})
                                        });
                                }
                        }
                        if(i === towns.length){
                                testStyle = new ol.style.Style({
                                        stroke: new ol.style.Stroke({width: 1 }),
                                        //fill: new ol.style.Fill({ color: [255, 0, 0, (1 - (geoGrid[years][y][x] / carryCapacity))]})
                                        //stroke: new ol.style.Stroke({color: [255, 0, 0, (1 - (geoGrid[years][y][x] / carryCapacity))], width: 1})
                                });
                        }

                        tempFeature.setStyle(testStyle);
                        geoGridFeatures.addFeature(tempFeature);
                }
        }
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

function styleYearly() { //e57373
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
                                fill: new ol.style.Fill({ color: "#e57373"}),//'rgba(255,0,0,1)'}),
                                stroke: new ol.style.Stroke({
                                        color: '#000000',
                                        width: 1
                                })
                        })
                })
        ];
}

function setupOlInputMap(){
        var teststyle = new ol.style.Style({
                fill: new ol.style.Fill({ color: [0, 255, 0, 0.3]})
        });
        features = new ol.source.Vector();
        geoGridFeatures = new ol.source.Vector();

        var projection = new ol.proj.Projection({
                code: 'EPSG:4326',
                // The extent is used to determine zoom level 0. Recommended values for a
                // projection's validity extent can be found at http://epsg.io/.
                extent: [-180.0, -90.0, 180.0, 90.0],
                units: 'm'
        });
        ol.proj.addProjection(projection);

        bingLayers[0] = new ol.layer.Tile({
                source: new ol.source.BingMaps({
                        imagerySet: 'Road',
                        key: API_KEYS.bingMaps,
                        projection: 'EPSG:4326',
                        wrapX: false
                })
        });
        bingLayers[1] = new ol.layer.Tile({
                source: new ol.source.BingMaps({
                        imagerySet: 'Aerial',
                        key: API_KEYS.bingMaps,
                        projection: 'EPSG:4326',
                        wrapX: false
                })
        });

        map = new ol.Map({
                target: 'popMapDiv', 
                layers: [
                        bingLayers[0],
                        bingLayers[1],
                        new ol.layer.Vector({
                                source: features,
                                style: teststyle
                        })
                ],
                view: new ol.View({
                        projection: 'EPSG:4326', //9835', 3410
                        center: [37.41, 8.82],
                        zoom: 2
                }),
                /*
                controls: ol.control.defaults({
                        attributionOptions: {
                                collapsible: false
                        }
                }).extend([new ol.control.ScaleLine()])
                */
        });

        map.addControl(new ol.control.ScaleLine());

        pointVector = new ol.layer.Vector({
                source: source,
                style: new ol.style.Style({
                        fill: new ol.style.Fill({color: 'rgba(255, 255, 255, 0.2)'}),
                        stroke: new ol.style.Stroke({color: '#ffcc33', width: 2}),
                        image: new ol.style.Circle({radius: 7, fill: new ol.style.Fill({color: '#ffcc33'})})
                }),
                projection: 'EPSG:4326',
        });
        pointVector.setZIndex(10);
        map.addLayer(pointVector);

        debugVector = new ol.layer.Vector({
                source: debugSource,
                projection: 'EPSG:4326',
        });
        debugVector.setZIndex(5);
        map.addLayer(debugVector);

        addPopFunction = map.on('click', placePopulation);
        map.updateSize();
        bingLayers[0].setVisible(true);
        bingLayers[1].setVisible(false);
}

function drawDebugPoint(location, colorCode){
        let tempPoint = new ol.geom.Point(
                [location[0], location[1]]
        );
        let tempFeature = new ol.Feature(tempPoint);

        tempFeature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({ color: colorCode}),
                        stroke: new ol.style.Stroke({
                                color: '#000000',
                                width: 1
                        })
                })
        }));

        debugSource.addFeature(tempFeature);
}

function drawDebugBounds(bounds, colorCode){
        var newBounds = [];
        for(let i = 0; i < bounds.length; i++){
                let reproject = proj4(proj4('mollweide'), proj4('espg4326'), bounds[i])
                newBounds.push(reproject);

        }

        var tempPolygon1 = new ol.geom.Polygon([[
                newBounds[0],
                newBounds[1],
                newBounds[2],
                newBounds[3],
                newBounds[0]
        ]]);

        var tempFeature1 = new ol.Feature({
                name: ("debugSquare"),
                geometry: tempPolygon1
        });

        var teststyle1 = new ol.style.Style({
                stroke: new ol.style.Stroke({width: 1 }),
                fill: new ol.style.Fill({ color: colorCode})
        });
        tempFeature1.setStyle(teststyle1);
        debugSource.addFeature(tempFeature1);
}

function drawDebugCircle(points, colorCode){
        let circleGeom = new ol.geom.Polygon([points]);
        let tempFeature1 = new ol.Feature({
                name: "debugCircle",
                geometry: circleGeom
        });

        let teststyle1 = new ol.style.Style({
                stroke: new ol.style.Stroke({width: 1 }),
                fill: new ol.style.Fill({ color: colorCode})
        });
        tempFeature1.setStyle(teststyle1);
        debugSource.addFeature(tempFeature1);
}

function generateCanvas(year, scale, imgArray, dest, position){
        console.log("generateCanvas:: year: " + year + " scale: " + scale + " mode: " + dest);
        console.log("data length: " + imgArray.length + " xSize: " + simResults.xSize);
        canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = simResults.xSize * scale;
        canvas.height = simResults.ySize * scale;

        let picData = new ImageData(imgArray, simResults.xSize * scale, simResults.ySize * scale);

        ctx.putImageData(picData, 0, 0);
        let canvasImage = new Image();
        canvasImage.id = 'image' + year;

        switch(dest){
        case 'mapViewer':
                canvasImage.onload = function(){
                        drawCanvasToMap(canvasImage, position);
                        document.getElementById('rawHeatmapContainer').appendChild(canvasImage);
                        rawHWScaleInput(100);
                };
                break;
        case 'mapViewerUpdate':
                canvasImage.onload = function(){
                        drawCanvasToMap(canvasImage, position);
                        $('#overlayYear').prop('disabled', false);
                        $('#overlayYear').blur();
                };
                break;
        case 'save':
                canvas.toBlob(function(blob) {
                        saveAs(blob, simData.simName + '_year' + year + '_heatmap.png');
                });
                break;
        case 'saveAll':
                break;
        }

        canvasImage.src = canvas.toDataURL();
}

function drawCanvasToMap(canvasImage, location){
        console.log("drawCanvasToMap: height: " + canvasImage.naturalHeight + " width: " + canvasImage.naturalWidth); //1059340.815974956
        if(imageLayer)
                map.removeLayer(imageLayer);

        imageLayer = new ol.layer.Image({
                opacity: simData.opacity,
                source: new ol.source.ImageStatic({
                    url: canvasImage.src,
                    imageSize: [canvasImage.naturalWidth, canvasImage.naturalHeight],
                    projection: 'mollweide',
                    imageExtent: location
                })
        });
        imageLayer.setZIndex(2);

        imageLayer.set('name', 'imgLayer');
        map.addLayer(imageLayer);
        setupOpacitySlider();
}

function toggleVillageLabels(element){
        pointVector.setVisible(element.checked);
}

function toggleDebugLayer(element){
        debugVector.setVisible(element.checked);
        $('#debugViewToggle').prop('checked', element.checked);
        $('#debugViewToggleF').prop('checked', element.checked);
}

function updateOutputOpacity(element){
        let val = element.value;
        document.getElementById("opacityLabel").innerHTML = "Overlay Opacity: " + val + "%";

        imageLayer.setOpacity(val/100);
}