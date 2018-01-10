/* global ol uiData API_KEYS simData simResults*/

var map;
var features;
var geoLayer;
var geoGridFeatures;
var source = new ol.source.Vector({wrapX: false});
//var popLabelFeatures = [];
var pointVector;
var canvas;
var canvasImage;
var imageLayer;
var addPopFunction;
var geoDebugMode = 0;

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

        map = new ol.Map({
                target: 'popMapDiv', //'map_canvas',
                layers: [
                        /*
                        new ol.layer.Tile({
                                source: new ol.source.OSM({
                                        projection: 'EPSG:4326',
                                        wrapX: false,
                                })
                        }),
                        */
                        
                        new ol.layer.Tile({
                                source: new ol.source.BingMaps({
                                        imagerySet: 'Aerial',
                                        key: API_KEYS.bingMaps,
                                        projection: 'EPSG:4326',
                                        wrapX: false
                                })
                        }),
                        
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
                controls: []
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
        map.addLayer(pointVector);
        
        geoLayer = new ol.layer.Vector({
                source: geoGridFeatures,
                projection: 'EPSG:4326'
        });
        map.addLayer(geoLayer);

        addPopFunction = map.on('click', placePopulation);
        map.updateSize();
}

function drawDebugBounds(bounds){
        let topOffset = bounds[0];
        let botOffset = bounds[1];

        var tempPolygon1 = new ol.geom.Polygon([[
                                [topOffset[1], topOffset[0]],
                                [topOffset[1], botOffset[0]],
                                [botOffset[1], botOffset[0]],
                                [botOffset[1], topOffset[0]],
                                [topOffset[1], topOffset[0]]
                        ]]);

        var tempFeature1 = new ol.Feature({
                name: ("debugSquare"),
                geometry: tempPolygon1
        });

        var teststyle1 = new ol.style.Style({ stroke: new ol.style.Stroke({width: 1 })});
        tempFeature1.setStyle(teststyle1);
        features.addFeature(tempFeature1);
}


function getExtent(){
        console.log("button clicked");
        console.log(ol.geom.Polygon.fromExtent(map.getView().calculateExtent(map.getSize())));
        var coords = map.getView().calculateExtent(map.getSize());
        console.log(coords[0] + ", " + coords[3]);
        //map.getView().setCenter(ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setCenter([coords[0],coords[3]]);
}

function generateCanvas(year, scale, imgArray, dest){
        console.log("generating canvas for year: " + year + " and scale: " + scale);
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
                        drawCanvasToMap(canvasImage);
                        document.getElementById('rawHeatmapContainer').appendChild(canvasImage);
                        rawHWScaleInput(100);
                };
                break;
        case 'mapViewerUpdate':
                canvasImage.onload = function(){
                        drawCanvasToMap(canvasImage);
                        $('#overlayYear').prop('disabled', false);
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

function drawCanvasToMap(canvasImage){
        console.log("picture: " + canvasImage.naturalHeight);
        console.log("picture: " + canvasImage.naturalWidth);

        var tempLength = simResults.geoGrid.length - 1;
        var tempPoint = simResults.geoGrid[tempLength][simResults.geoGrid[tempLength].length - 1];
        console.log("calculating extent lengths: " + tempLength + ", " + simResults.geoGrid[tempLength].length - 1);

        console.log("top corner: " + simResults.geoGrid[0][0] + " bot corner: " + tempPoint);
        console.log("extent: " + [simResults.geoGrid[0][0][1], tempPoint[0], tempPoint[1], simResults.geoGrid[0][0][0]]);

        if(imageLayer){
                map.removeLayer(imageLayer);
        }

        imageLayer = new ol.layer.Image({
                opacity: simData.opacity,
                source: new ol.source.ImageStatic({
                    url: canvasImage.src,
                    //imageSize: [canvasImage.naturalWidth, canvasImage.naturalHeight],
                    projection: map.getView().getProjection(),
                    imageExtent: [simResults.geoGrid[0][0][1], tempPoint[0], tempPoint[1], simResults.geoGrid[0][0][0]]
                })
        });

        imageLayer.set('name', 'imgLayer');
        map.addLayer(imageLayer);
        setupOpacitySlider();
}

function toggleVillageLabels(element){
        pointVector.setVisible(element.checked);
}

function updateOutputOpacity(element){
        let val = element.value;
        document.getElementById("opacityLabel").innerHTML = "Overlay Opacity: " + val + "%";

        imageLayer.setOpacity(val/100);
}

function drawHeatmap(){

}

setupOlInputMap();
