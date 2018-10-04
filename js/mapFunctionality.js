const eaProjection = "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const viewProjection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs ";

var map;
var bingLayers;
var features;
var source;
var debugSource;
var debugVector;
var pointVector;
var canvas;
var canvasImage;
var heatmapLayer;
var exploitLayer;
var addPopFunction;
var isMenuOpen;
var isPopMoving;
var popStorageMap = {};
var mouseKControl;
var mouseKListner;
var mouseLastPosition;
var heatmap;
var heatmapSource;

function setupMapping(){
        proj4.defs('espg4326', viewProjection);
        proj4.defs('mollweide', eaProjection);
        source = new ol.source.Vector({wrapX: false});
        debugSource = new ol.source.Vector({wrapX: false});

        var teststyle = new ol.style.Style({
                fill: new ol.style.Fill({ color: [0, 255, 0, 0.3]})
        });
        features = new ol.source.Vector();

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
                        projection: 'EPSG:4326',
                        center: [37.41, 8.82],
                        zoom: 2
                }),
        });

        heatmapLayer = new ol.layer.Image();
        heatmapLayer.setZIndex(2);
        heatmapLayer.set('name', 'imgLayer');
        heatmapLayer.on('precompose', function(event) {
                var ctx = event.context;
                ctx.mozImageSmoothingEnabled = 
                ctx.webkitImageSmoothingEnabled = 
                ctx.msImageSmoothingEnabled = 
                ctx.imageSmoothingEnabled = false;
        });
        map.addLayer(heatmapLayer);

        exploitLayer = new ol.layer.Image();
        exploitLayer.setZIndex(3);
        exploitLayer.set('name', 'exploitLayer');
        map.addLayer(exploitLayer);

        map.addControl(new ol.control.ScaleLine());
        let mousePosControl = new ol.control.MousePosition({
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

        /*
        map.on('precompose', function(evt) {
                evt.context.imageSmoothingEnabled = false;
                evt.context.webkitImageSmoothingEnabled = false;
                evt.context.mozImageSmoothingEnabled = false;
                evt.context.msImageSmoothingEnabled = false;
                evt.context.oImageSmoothingEnabled = false;
        });
        */
}

function setupCustomMouseControl(){
        window.app = {};
        var app = window.app;

        app.CustomMouseControl = function(opt_options) {
                var options = opt_options || {};

                var textDiv = document.createElement('div');
                textDiv.id = 'mouseKText';
                textDiv.innerHTML = '-';
                
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
                workerThread.postMessage({type:"mouseKCheck", pos:e.coordinate, year:overlayYear});
        } else {
                mouseLastPosition = false;
                document.getElementById('mouseKText').innerHTML = '-';
        }
}

function placePopulation(e){
        if(isPopMoving){
                endPopMove(e.coordinate);
                return;
        }

        let tempFeatures = [];
        map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
                tempFeatures.push(feature);
        }, {hitTolerance: 3});
        let dropdownActive = document.getElementById('mapDropdown').classList.contains('active');

        if(isMenuOpen && dropdownActive){
                isMenuOpen = false;
                if(tempFeatures.length){
                        setTimeout(function(){
                                placePopulation(e);
                        }, 50);
                }
        } else if(!tempFeatures.length && !dropdownActive) {
                showPopEditor(e.coordinate);
        } else {
                isMenuOpen = true;
                let tempId = tempFeatures[0].get('description');
                $('#popDropDown').css({ 
                        top: e.originalEvent.clientY, 
                        left: (e.originalEvent.clientX - 27)
                });
                setTimeout(function(){
                        $('#dropEditOption').off('click')
                                .click(function(){showPopEditor(false, tempId);});
                        $('#dropMoveOption').off('click').click(function(){
                                document.body.style.cursor = "crosshair";
                                isPopMoving = tempId;
                                removePopFromMapById(tempId);
                        });
                        $('#dropDeleteOption').off('click')
                                .click(function(){removeRow('popTable', tempId);});
                        $('#popDropDown').dropdown('open');
                }, 200);
        }
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
                map.getView().animate({center:tempFeatures[0].getGeometry().getCoordinates(), zoom: 11, duration:500});
        }
}

function removePopFromMapById(popId){
        if(popId in popStorageMap){
                source.removeFeature(popStorageMap[popId]);
                delete popStorageMap[popId];
        }
}

function addPopToMap(popId, popName, long, lat, isYearly){
        let tempPoint = new ol.geom.Point(
                [long, lat]
        );

        var tempFeature = new ol.Feature(tempPoint);
        tempFeature.set('description', popId);
        tempFeature.set('name', popName);
        if(isYearly){
                tempFeature.setStyle(yearlyStyleFunction);
        } else {
                tempFeature.setStyle(expStyleFunction);
        }
        popStorageMap[popId] = tempFeature;
        source.addFeature(tempFeature);
}

//based on https://stackoverflow.com/questions/39006597/openlayers-3-add-text-label-to-feature
function expStyleFunction() {
        return [new ol.style.Style({
                        text: new ol.style.Text({
                                font: '12px Calibri,sans-serif',
                                fill: new ol.style.Fill({ color: '#FFFFFF' }),
                                stroke: new ol.style.Stroke({color: '#000000', width: 1}),
                                text: this.get('name'),
                                offsetY: 13
                        }),
                        image: new ol.style.Circle({
                                radius: 6,
                                fill: new ol.style.Fill({ color: '#2196F3'}),
                                stroke: new ol.style.Stroke({color: '#000000', width: 1})
                        })
                })
        ];
}

function yearlyStyleFunction() {
        return [new ol.style.Style({
                        text: new ol.style.Text({
                                font: '12px Calibri,sans-serif',
                                fill: new ol.style.Fill({ color: '#FFFFFF' }),
                                stroke: new ol.style.Stroke({color: '#000000', width: 1}),
                                text: this.get('name'),
                                offsetY: 13
                        }),
                        image: new ol.style.Circle({
                                radius: 6,
                                fill: new ol.style.Fill({ color: '#e57373'}),
                                stroke: new ol.style.Stroke({color: '#000000', width: 1})
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

        var debugFeature = new ol.Feature({
                name: ("debugSquare"),
                geometry: tempPolygon1
        });

        var debugStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({width: 1 }),
                fill: new ol.style.Fill({ color: colorCode})
        });
        debugFeature.setStyle(debugStyle);
        debugSource.addFeature(debugFeature);
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

function generateHeatmap(){
        heatmapSource = new ol.source.Vector({

        });
        heatmap = new ol.layer.Heatmap({
                source: heatmapSource,
        });
        map.addLayer(heatmap);
}

function storeImgURL(data){
        switch(data.dest){
        case 'heatmapImages':
                heatMapImages[data.year] = data.url;
                if(data.year === simRunData.years)
                        drawCanvasToMap(heatMapImages[data.year], heatmapLayer);
                break;
        case 'expImages':
                exploitImages[data.year] = data.url;
                if(data.year === simRunData.years)
                        drawCanvasToMap(exploitImages[data.year], exploitLayer);
                break;
        case 'localCDFimg':
                localAreaPictures[data.year] = data.url;
                if(ChartMgr.getYear() > -1)
                        setLocalCDFPicture(ChartMgr.getYear());
                break;
        }
}

function drawCanvasToMap(imageURL, target){
        /*
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        ctx.mozImageSmoothingEnabled = 
        ctx.webkitImageSmoothingEnabled = 
        ctx.msImageSmoothingEnabled = 
        ctx.imageSmoothingEnabled = false;
        var canvasCopy = document.createElement("canvas");
        var copyContext = canvasCopy.getContext("2d");
        copyContext.mozImageSmoothingEnabled = 
        copyContext.webkitImageSmoothingEnabled = 
        copyContext.msImageSmoothingEnabled = 
        copyContext.imageSmoothingEnabled = false;
        var img = new Image();
        img.onload = function(){
                console.log("width and height: " + img.width + ", " + img.height);
                canvasCopy.width = img.width;
                canvasCopy.height = img.height;
                copyContext.drawImage(img, 0, 0);
                console.log("canvas copy: " + canvasCopy.toDataURL());
                canvas.width = img.width * 3;
                canvas.height = img.height * 3;
                ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);
                let newurl = canvas.toDataURL();
                let img2 = new Image();
                img2.onload = function(){
                        document.body.appendChild(img2);
                };
                img2.src = newurl;
                console.log("new url: " + newurl);
                target.setSource(
                        new ol.source.ImageStatic({
                                url: newurl,
                                projection: 'mollweide',
                                imageExtent: simResults.simPosition
                        })
                );
        };
        img.src = imageURL;
        */
        target.setSource(
                new ol.source.ImageStatic({
                        url: imageURL,
                        projection: 'mollweide',
                        imageExtent: simResults.simPosition
                })
        );
}

function toggleLayerVisibility(layer, toggle){
        const isChecked = toggle.checked;
        layer.setVisible(isChecked);
        const id = toggle.id.slice(0, toggle.id.length - 6) + 'Container';
        if(isChecked){
                $('#' + id).removeClass('hide');
        } else {
                $('#' + id).addClass('hide');
        }
}

function updateLayerOpacity(layer, value){
        layer.setOpacity(value/100);
}

function debugDrawLayer(dataURL){
        let canvasImage = new Image();
        canvasImage.onload = function(){
                document.body.appendChild(canvasImage);
        };

        canvasImage.src = dataURL;
}

function setMapSetupMode(){
        pointVector.setVisible(true);
        updateLayerOpacity(bingLayers[1], 100);
        updateLayerOpacity(bingLayers[0], 100);

        let isRoadMap = document.getElementById("mapTypeToggle").checked;
        if(isRoadMap || !navigator.onLine){
                bingLayers[0].setVisible(true);
                bingLayers[1].setVisible(false);
        } else {
                bingLayers[0].setVisible(false);
                bingLayers[1].setVisible(true);
        }

        let resultLayers = [debugVector, heatmapLayer, exploitLayer];
        for(let i = 0; i < resultLayers.length; i++)
                resultLayers[i].setVisible(false);
}

function setMapResultsMode(isFirstRun){
        if(isFirstRun){
                let isRoadMap = document.getElementById("mapTypeToggle").checked;
                if(isRoadMap || !navigator.onLine){
                        document.getElementById('streetmapOpacitySlider').value = 100;
                        document.getElementById('satelliteOpacitySlider').value = 0;
                        updateLayerOpacity(bingLayers[1], 0);
                        updateLayerOpacity(bingLayers[0], 100);
                } else {
                        document.getElementById('streetmapOpacitySlider').value = 0;
                        document.getElementById('satelliteOpacitySlider').value = 100;
                        updateLayerOpacity(bingLayers[1], 100);
                        updateLayerOpacity(bingLayers[0], 0);
                }
        }
        bingLayers[0].setVisible(true);
        bingLayers[1].setVisible(true);
        updateLayerOpacity(bingLayers[1], document.getElementById('satelliteOpacitySlider').value);
        updateLayerOpacity(bingLayers[0], document.getElementById('streetmapOpacitySlider').value);

        updateLayerOpacity(debugVector, document.getElementById('debugOpacitySlider').value);
        updateLayerOpacity(heatmapLayer, document.getElementById('heatmapOpacitySlider').value);
        updateLayerOpacity(exploitLayer, document.getElementById('exploitationSlider').value);
        toggleLayerVisibility(heatmapLayer, document.getElementById('heatmapToggle'));
        toggleLayerVisibility(debugVector, document.getElementById('debugViewToggle'));
        toggleLayerVisibility(exploitLayer, document.getElementById('exploitationToggle'));
        toggleLayerVisibility(pointVector, document.getElementById('popLabelToggle'));
}

function requestFitMap(){
        if(!uiData && uiData.length)
                return;
        
        let townData = setupTowns();
        if(!townData)
                return;
        const range = checkParam('rangeHphy', 5, false);
        const width = checkParam('boundryWidth', 10, false);
        workerThread.postMessage({type:"requestBounds", towns:townData, range:range, width:width});
}

function fitMap(p1, p2){
        if(!p1 && !p2){
                var topLeft = proj4(proj4('mollweide'), proj4('espg4326'), simResults.bounds[0]);
                var botRight = proj4(proj4('mollweide'), proj4('espg4326'), simResults.bounds[1]);
        } else {
                var topLeft = proj4(proj4('mollweide'), proj4('espg4326'), p1);
                var botRight = proj4(proj4('mollweide'), proj4('espg4326'), p2);
        }

        let testExtent = [topLeft[0], botRight[1], botRight[0], topLeft[1]];
        map.getView().fit(testExtent, {duration: 750});
}