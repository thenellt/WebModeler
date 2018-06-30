const eaProjection = "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const viewProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs ";

var map;
var bingLayers;
var features;
var geoGridFeatures;
var source;
var debugSource;
var debugVector;
var pointVector;
var canvas;
var canvasImage;
var imageLayer;
var addPopFunction;
var isMenuOpen;
var isPopMoving;
var popStorageMap = {};
var settlementStatsOpen;
var statsCircleFeature;
var mousePosControl;
var mouseKControl;
var mouseKListner;
var mouseLastPosition;

function setupMapping(){
        proj4.defs('espg4326', viewProjection);
        proj4.defs('mollweide', eaProjection);
        source = new ol.source.Vector({wrapX: false});
        debugSource = new ol.source.Vector({wrapX: false});

        var teststyle = new ol.style.Style({
                fill: new ol.style.Fill({ color: [0, 255, 0, 0.3]})
        });
        features = new ol.source.Vector();
        geoGridFeatures = new ol.source.Vector();

        var projection = new ol.proj.Projection({
                code: 'EPSG:4326',
                // basedon entry from http://epsg.io/
                extent: [-180.0, -90.0, 180.0, 90.0],
                units: 'm'
        });
        ol.proj.addProjection(projection);

        bingLayers = [];
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
        debugVector = new ol.layer.Vector({
                source: debugSource,
                projection: 'EPSG:4326',
        });
        debugVector.setZIndex(5);
        
        map = new ol.Map({
                target: 'popMapDiv', 
                layers: [
                        bingLayers[0],
                        bingLayers[1],
                        new ol.layer.Vector({
                                source: features,
                                style: teststyle
                        }),
                        pointVector,
                        debugVector
                ],
                view: new ol.View({
                        projection: 'EPSG:4326', //9835', 3410
                        center: [37.41, 8.82],
                        zoom: 2
                }),
        });

        map.addControl(new ol.control.ScaleLine());
        mousePosControl = new ol.control.MousePosition({
                undefinedHTML: '-',
                className: 'ol-mouse-position',
                projection: 'EPSG:4326',
                coordinateFormat: function(coordinate) {
                    return ol.coordinate.format(coordinate, '{x}, {y}', 4);
                }
        });
        setupCustomMouseControl();
        mouseKControl = new app.CustomMouseControl();
        map.addControl(mousePosControl);

        addPopFunction = map.on('click', placePopulation);
        map.updateSize();
        bingLayers[0].setVisible(true);
        bingLayers[1].setVisible(false);
        isPopMoving = false;
        settlementStatsOpen = false;
        makeDraggable(document.getElementById('popInfoCard'));
}

function setupCustomMouseControl(){
        window.app = {};
        var app = window.app;

        app.CustomMouseControl = function(opt_options) {
                var options = opt_options || {};

                var textDiv = document.createElement('div');
                textDiv.id = 'mouseKText';
                textDiv.innerHTML = '-';
                
                var this_ = this;

                var element = document.createElement('div');
                element.className = 'ol-unselectable ol-mouse-position';
                element.setAttribute('style', 'top: 46px;');
                element.appendChild(textDiv);

                ol.control.Control.call(this, {
                        element: element,
                        target: options.target
                });

        };
        ol.inherits(app.CustomMouseControl, ol.control.Control);
}

function requestUpdateKControl(e){
        if(e){
                mouseLastPosition = e.coordinate;
                workerThread.postMessage({type:"mouseKCheck", pos:e.coordinate, year:heatMapYear});
        }
        else{
                mouseLastPosition = false;
                updateKControl('-');
        }
}

function updateKControl(text){
        document.getElementById('mouseKText').innerHTML = text;
}

function placePopulation(e){
        if(isPopMoving){
                console.log(e.coordinate);
                endPopMove(e.coordinate);
                return;
        }

        let tempFeatures = [];
        map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
                tempFeatures.push(feature);
        }, {hitTolerance: 3});
        let dropdownActive = document.getElementById('dropdown1').classList.contains('active');

        if(isMenuOpen && dropdownActive){
                isMenuOpen = false;
                if(tempFeatures.length){
                        setTimeout(function(){
                                placePopulation(e);
                        }, 50);
                }
        } else if(!tempFeatures.length && !dropdownActive){
                showPopEditor(e.coordinate);
        } else {
                isMenuOpen = true;
                let tempId = tempFeatures[0].get('description');
                $('#dropDownTest').css({ 
                        top: e.originalEvent.clientY, 
                        left: (e.originalEvent.clientX - 27)
                });
                setTimeout(function(){
                        $('#dropEditOption').off('click').click(function(){
                                showPopUpdater(tempId);   
                        });
                        $('#dropMoveOption').off('click').click(function(){
                                startPopMove(tempId);
                        });
                        $('#dropDeleteOption').off('click').click(function(){
                                removeRow('popTable', tempId);
                        });
                        $('#dropDownTest').dropdown('open');
                }, 200);
        }
}

function startPopMove(id){
        document.body.style.cursor = "crosshair";
        isPopMoving = id;
        removePopFromMapById(id);
}

function endPopMove(location, isCanceled){
        let entry = uiData[isPopMoving];
        let isYearly = entry.type === "yearly";
        if(isCanceled){
                addPopToMap(entry.id, entry.name, entry.long, entry.lat, isYearly);
        } else {
                entry.long = location[0];
                entry.lat = location[1];
                addPopToMap(entry.id, entry.name, entry.long, entry.lat, isYearly);
                updateTableRow(entry.id);
        }
        document.body.style.cursor = "auto";
        isPopMoving = false;
}

function resultsMapClick(e){
        var tempFeatures = [];
        map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
                tempFeatures.push(feature);
        }, {hitTolerance: 3});

        if(tempFeatures.length){
                /*
                if(statsCircleFeature){
                        debugSource.removeFeature(statsCircleFeature);
                        statsCircleFeature = false;
                }
                */
                displaySettlementStats(tempFeatures[0], e.originalEvent);

        } else if(settlementStatsOpen){
                settlementStatsOpen = false;
                debugSource.removeFeature(statsCircleFeature);
                statsCircleFeature = false;
                $('#popInfoCard').addClass('scale-out');
                $('#popInfoCard').removeClass('scale-in');
        }
}

function closePopInfoCard(){
        $('#popInfoCard').addClass('scale-out');
        $('#popInfoCard').removeClass('scale-in');
        debugSource.removeFeature(statsCircleFeature);
        statsCircleFeature = false;
        settlementStatsOpen = false;
}

function displaySettlementStats(feature, event){
        map.getView().setCenter(feature.getGeometry().getCoordinates());
        map.getView().setZoom(11);
        /*
        let settlementID = feature.get('description');
        console.log("settlementID: " + settlementID);
        console.log("position: " + feature.getGeometry().getCoordinates());
        let circleCoords = generateCircleCoords(feature.getGeometry().getCoordinates(), simData.huntRange);
        statsCircleFeature = drawDebugCircle(circleCoords, [255, 255, 255, .1]);
        document.getElementById('infoCardName').innerHTML = '<i>' + uiData[settlementID].name + '</i>';
        $('#popInfoCard').addClass('scale-in');
        $('#popInfoCard').removeClass('scale-out');
        settlementStatsOpen = true;
        */
}

function removePopFromMapById(popId){
        if(popId in popStorageMap){
                source.removeFeature(popStorageMap[popId]);
                delete popStorageMap[popId];
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
        popStorageMap[popId] = tempFeature;
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
        return tempFeature1;
}

function generateCircleCoords(origCenter, radius){
        var center = proj4(proj4('espg4326'), proj4('mollweide'), origCenter);
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

function generateCanvas(data){
        let canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = data.x * data.scale;
        canvas.height = data.y * data.scale;

        let picData = new ImageData(data.array, data.x * data.scale, data.y * data.scale);

        ctx.putImageData(picData, 0, 0);
        let canvasImage = new Image();
        canvasImage.id = 'image' + data.year;

        switch(data.dest){
        case 'animationFrame':
                canvasImage.onload = function(){
                        heatMapImages.pos = data.position;
                        heatMapImages.images[data.year] = canvasImage;
                }
                break;
        case 'finalFrame':
                canvasImage.onload = function(){
                        heatMapImages.pos = data.position;
                        heatMapImages.images[data.year] = canvasImage;
                        drawCanvasToMap(data.year);
                        canvasImage.classList.add('rawHeatmapImage');
                        document.getElementById('rawHeatmapContainer').appendChild(canvasImage);
                }
                break;
        case 'save':
                canvas.toBlob(function(blob) {
                        saveAs(blob, simData.simName + '_year' + data.year + '_heatmap.png');
                });
                break;
        }

        canvasImage.src = canvas.toDataURL();
}

function drawCanvasToMap(year){
        let canvasImage = heatMapImages.images[year];
        let location = heatMapImages.pos;
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