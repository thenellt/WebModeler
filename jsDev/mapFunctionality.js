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

function generateCanvas(year, scale, imgArray, dest){
        console.log("generating canvas for year: " + year + " and scale: " + scale);
        console.log("data length: " + imgArray.length + " xSize: " + simResults.xSize);
        canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = simResults.xSize * scale;
        canvas.height = simResults.ySize * scale;

        let picData = new ImageData(imgArray, simResults.xSize, simResults.ySize);

        ctx.putImageData(picData, 0, 0);
        let canvasImage = new Image();
        canvasImage.id = 'image' + year;

        switch(dest){
        case 'mapViewer':
                canvasImage.onload = function(){drawCanvasToMap(canvasImage)};
                break;
        case 'save':
                break;
        case 'saveAll':
                break;
        }

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
                opacity: simData.opacity,
                source: new ol.source.ImageStatic({
                    url: canvasImage.src,
                    imageSize: [canvasImage.naturalWidth, canvasImage.naturalHeight],
                    projection: map.getView().getProjection(),
                    imageExtent: [simResults.geoGrid[0][0][1], tempPoint[0], tempPoint[1], simResults.geoGrid[0][0][0]]
                })
        });

        imageLayer.set('name', 'imgLayer');
        map.addLayer(imageLayer);
        setupOpacitySlider();
}

function toggleVillageLabels(element){
        let isChecked = element.checked;
        
}

function updateOutputOpacity(element){
        let val = element.value;
        document.getElementById("opacityLabel").innerHTML = "Overlay Opacity: " + val + "%";
       
        imageLayer.setOpacity(val/100);
}

function drawHeatmap(){

}

setupOlInputMap();
