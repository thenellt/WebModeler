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

var towns;


var buffer;
var grid;

var yearlyGrid;
var growth;
var effort;
var grid;

var curImage;

var map;
var features;

var source = new ol.source.Vector({wrapX: false});

function town(x, y, pop, killRate, name){
        this.x = x;
        this.y = y;
        this.population = pop;
        this.killRate = killRate;
        this.name = name;
        this.offtake = new Array(years).fill(0.0);
        this.getPop = function (year) {
                //if(year > 10){
                        //console.log("returned 0");
                //        return 0;
                //}
                return this.population;
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

function setupSim(){
        curImage = 0;
        xSize = geoGrid[0].length;
        ySize = geoGrid[1].length;
        animalDiffRate = 0.1;
        animalGrowthRate = 0.07;
        killProb = .1;
        HpHy = 40;
        encounterRate = .02043;
        carryCapacity = 25;
        theta = 1;
        years = 10;
        diffusionSamples = 1;
        huntRange = 10;
        towns = [];
        for(var g = 0; g < points.length; g++){
                towns.push(new town(points[g][3], points[g][2], 10, .2, "test" + g));
        }
        //towns[0] = new town(15, 15, 20, .1, "test");
        //towns[1] = new town(85, 85, 100, .2, "test1");

        grid = new Array(years + 1);

        yearlyGrid = new Array(ySize);
        growth = new Array(ySize);
        effort = new Array(ySize);

        for(var i = 0; i < years + 1; i++){
                grid[i] = new Array(ySize);
                for(var j = 0; j < ySize; j++){
                        grid[i][j] = new Array(xSize).fill(carryCapacity);
                }
        }

        for(var k = 0; k < ySize; k++){
                yearlyGrid[k] = new Array(xSize).fill(0.0);
                growth[k] = new Array(xSize).fill(0.0);
                effort[k] = new Array(xSize).fill(0.0);
        }
}

function runSimulation(curYear){
        //var count;
        var top, bot, locationValue;

        for(var j = 0; j < ySize; j++){
                yearlyGrid[j].fill(0.0);
        }

        //for(var curYear = 0; curYear < years; curYear++){ //10 is years
        console.log("starting year number: " + curYear);
        //count = 0;
        var a, b, c, d, e;
        var x, y;
        //d*(n[year,i+1,j]+n[year,i-1,j])+(1-4*d)*n[year,i,j]+d*(n[year,i,j+1]+n[year,i,j-1])
        for(var i = 0; i < diffusionSamples; i++){
                console.log("running diff sample: " + i);
                for(y = 0; y < ySize; y++){
                        for(x = 0; x < xSize; x++){
                                if(y > 0 && y < ySize - 1){
                                        if(x > 0 && x < xSize - 1){
                                                /*
                                                a = yearlyGrid[y+1][x] + grid[curYear][y+1][x];
                                                b = yearlyGrid[y-1][x] + grid[curYear][y-1][x];
                                                c = yearlyGrid[y][x] + grid[curYear][y][x];
                                                d = yearlyGrid[y][x+1] + grid[curYear][y][x+1];
                                                e = yearlyGrid[y][x-1] + grid[curYear][y+1][x-1];
                                                */
                                                a = grid[curYear][y+1][x];
                                                b = grid[curYear][y-1][x];
                                                c = grid[curYear][y][x];
                                                d = grid[curYear][y][x+1];
                                                e = grid[curYear][y+1][x-1];
                                                if(i !== 0){
                                                        yearlyGrid[y][x] += animalDiffRate * (a + b + d + e - (4 * c));
                                                        //yearlyGrid[y][x] += (animalDiffRate*(a + b) + (1-4*animalDiffRate)*(c + animalDiffRate*(d + e)))/diffusionSamples;
                                                }
                                                else{
                                                        yearlyGrid[y][x] = animalDiffRate * (a + b + d + e - (4 * c));
                                                        //yearlyGrid[y][x] = (animalDiffRate*(a + b) + (1-4*animalDiffRate)*(c + animalDiffRate*(d + e)))/diffusionSamples;
                                                }
                                        }
                                        else{
                                                yearlyGrid[y][x] = carryCapacity;
                                        }
                                }
                                else{
                                        yearlyGrid[y][x] = carryCapacity;
                                }
                        }
                }
        }

        for(y = 0; y < ySize; y++){
                for(x = 0; x < xSize; x++){
                        for(var settleNum = 0; settleNum < towns.length; settleNum++){
                                //((comlocation[numb,0]-i)**2+(comlocation[numb,1]-j)**2))
                                //console.log("town info: " + towns[settleNum].x +  "," + towns[settleNum].y);
                                locationValue = Math.pow(towns[settleNum].x - x, 2) + Math.pow(towns[settleNum].y - y, 2);
                                //console.log(locationValue);
                                //math.exp(-1/(2*std**2)*locationValue)
                                top = Math.exp((-1)/(2*Math.pow(huntRange, 2)) * locationValue);

                                //(2*math.pi*math.sqrt(locationValue+1)
                                bot = 2*Math.PI*Math.sqrt(locationValue + 1);
                                //cout << "top: " << top << " bot: " << bot << endl;
                                //console.log("Top: " + top + " bot: " + bot);
                                if(settleNum === 0){
                                        effort[y][x] = (HpHy*towns[settleNum].getPop(curYear)*top)/bot;
                                }
                                else{
                                        effort[y][x] += (HpHy*towns[settleNum].getPop(curYear)*top)/bot;
                                }
                                //cout << "effort at: " << x << " " << y << " " << effort[y][x] << endl;
                                //console.log("effort at: " + x + "," + y + " is: " + effort[y][x]);
                                towns[settleNum].offtake[curYear] += killProb * encounterRate * ((HpHy * towns[settleNum].getPop(curYear) * top)/bot) * grid[curYear][y][x];
                        }
                        //n[year,:,:]*lambdas-lambdas*n[year,:,:]*(n[year,:,:]/density)**theta
                        //growth[y][x] = animalGrowthRate*grid[curYear][y][x] - animalGrowthRate*grid[curYear][y][x]*Math.pow((grid[curYear][y][x]/carryCapacity), theta);
                        growth[y][x] = (animalGrowthRate * grid[curYear][y][x]) * (1 - (grid[curYear][y][x]/carryCapacity));
                        //cout << "yearly grid - stuff + growth" << endl;
                        //cout << "yearly grid: " << yearlyGrid[y][x] << " stuff: " << killProb*encounterRate*effort[y][x]*grid[curYear][y][x] << " growth: " << growth[y][x] << endl;

                        grid[curYear + 1][y][x] = grid[curYear][y][x] + yearlyGrid[y][x] + growth[y][x] - killProb*encounterRate*effort[y][x]*grid[curYear][y][x];
                }
        }

        for(var y = 0; y < ySize; y++){
                for(var x = 0; x < xSize; x++){
                        if(grid[curYear + 1][y][x] < 0){
                                grid[curYear + 1][y][x] = 0;
                        }
                }
        }

        //console.log("growth: ");
        //printArray(growth);
        //console.log("yearly grid: ");
        //printArray(yearlyGrid);
        
        if(curYear + 1 < years){
                document.getElementById("progressBar").value = ((curYear + 1) / years) * 100;
                console.log(document.getElementById("progressBar").value);
                //runSimulation(curYear + 1);
                //generateCanvas(curYear);
                setTimeout(runSimulation, 10, curYear + 1);
        }
        else{
                document.getElementById("progressBar").style.display = "none";
                //setVisibleImage(0);
                //drawHeatMap(geoGrid);
                generateCanvas(curYear, 8);
                drawHeatMap(geoGrid);
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

function generateHeatmap(){
        var drawControls;
        var teststyle = new ol.style.Style({
                //stroke: new ol.style.Stroke({width: 0 }),
                fill: new ol.style.Fill({ color: [0, 255, 0, 0.3]})
        });
        features = new ol.source.Vector();
        map = new ol.Map({
                target: 'map_canvas',
                layers: [
                        new ol.layer.Tile({
                                source: new ol.source.OSM()
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
                })
        });
        
var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});

        map.addLayer(vector);
        
        var maxPoints, geometryFunction;
        draw = new ol.interaction.Draw({
                source: source,
                type: 'Point',
                geometryFunction: geometryFunction,
                maxPoints: maxPoints
        });
        map.addInteraction(draw);

        console.log(map.getView().calculateExtent(map.getSize()));
        console.log(ol.geom.Polygon.fromExtent(map.getView().calculateExtent(map.getSize())));

        map.on('click', function(e){
                addPoint(e.coordinate);
                //drawHeatMap(e.coordinate);
        });
}

function drawHeatMap(matrix){
        console.log("starting drawHeatMap: " + matrix[0][0][0]);
        //var curPosition = startPoint;
        //var otherCorner;
        console.log("ySize: " + ySize +  " xSize: " + xSize);
        for(var y = 0; y < ySize; y++){
                console.log("starting row: " + y);
                for(var x = 0; x < xSize - 1; x++){
                        //var lowerPoint = destEllipse(curPosition[1], curPosition[0], 180);
                        //var sidePoint = destEllipse(curPosition[1], curPosition[0], 90);
                        //otherCorner = [sidePoint[1], lowerPoint[0]];
                        //console.log(curPosition);
                        //console.log([lowerPoint[1], lowerPoint[0]]);
                        //console.log(otherCorner);
                        //console.log([sidePoint[1], sidePoint[0]]);
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

                        var teststyle = new ol.style.Style({
                                //stroke: new ol.style.Stroke({width: 1 }),
                                fill: new ol.style.Fill({ color: [255, 0, 0, (1 - (grid[years][y][x] / carryCapacity))]})
                                //stroke: new ol.style.Stroke({color: [255, 0, 0, (1 - (grid[years][y][x] / carryCapacity))], width: 1})
                        });
                        tempFeature.setStyle(teststyle);
                        features.addFeature(tempFeature);

                        //curPosition = [sidePoint[1], sidePoint[0]];
                }
                //curPosition = [startPoint[0], otherCorner[1]];
        }

        /*
        console.log("new square");
        var coordinates = e.coordinate;
        var corner = [coordinates[1], coordinates[0]];
        var lowerPoint = destEllipse(coordinates[1], coordinates[0], 180);
        var sidePoint = destEllipse(coordinates[1], coordinates[0], 90);
        var otherCorner = [sidePoint[1], lowerPoint[0]];
        console.log(coordinates);
        console.log([lowerPoint[1], lowerPoint[0]]);
        console.log(otherCorner);
        console.log([sidePoint[1], sidePoint[0]]);

        var tempPolygon = new ol.geom.Polygon( [[
                coordinates,
                [lowerPoint[1], lowerPoint[0]],
                otherCorner,
                [sidePoint[1], sidePoint[0]],
                coordinates
        ]]);

        var tempFeature = new ol.Feature({
                name: "Thing1",
                geometry: tempPolygon
        });

        features.addFeature(tempFeature);

        var coords = [coordinates, [lowerPoint[1], lowerPoint[0]], otherCorner, [sidePoint[1], sidePoint[0]], coordinates];
        var area;
        var sphere = new ol.Sphere(6378137);
        var area_m = sphere.geodesicArea(coords);
        var area = area_m /1000/1000;

        console.log("area: " + area);
        */
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
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = xSize * scale;
        canvas.height = ySize * scale;

        var imgData=ctx.getImageData(0,0,xSize * scale,ySize * scale);
        var data=imgData.data;

        var pos = 0;
        for(var y = 0; y < ySize; y++) {
                for(var row = 0; row < scale; row++){
                        for(var x = 0; x < xSize; x++) {
                                var opacity = (1 - (grid[curYear][y][x] / carryCapacity)) * 255;
                                for(var s = 0; s < scale; s++){
                                        data[pos] = 255;           // some R value [0, 255]
                                        data[pos + 1] = 0;           // some G value
                                        data[pos + 2] = 0;           // some B value
                                        data[pos + 3] = opacity;
                                        pos += 4;
                                }
                        }
                }
        }

        ctx.putImageData(imgData, 0, 0);
        var image = new Image();
        image.id = 'image' + curYear;

        image.src = canvas.toDataURL();
        document.body.appendChild(image);
}

function setVisibleImage(change){
        var position = curImage + change;
        if(position < 0){
                position = 0;
        }
        else if(position > years){
                position = years;
        }

}

function rad(dg) {
        return (dg* Math.PI / 180);
}

function deg(rd) {
        return (rd* 180 / Math.PI);
}

function normalizeLongitude(lon) {
        var n=Math.PI;
        if (lon > n) {
                lon = lon - 2*n
        } else if (lon < -n) {
                lon = lon + 2*n
        }
        return lon;
}

function destEllipse(lat1, lon1, bearing) {
        var point = [0.0, 0.0, 0.0, 0.0];
        var brg = new Array(0, 180, 0);
        brg[0] = bearing;
        var j=0;
        if (lat1 == 90) {
                startlat = 89.999999999;
                j=1
        }
        if (lat1 == -90) {
                startlat = -89.999999999;
                j=2;
        }
        lat1 = rad(lat1);
        lon1 = rad(lon1);
        brg[j] = rad(brg[j]);
        var s = 1;
        var a = 6378137;
        var b = a - (a/298.257223563);
        with (Math) {
                s *= 1000;
                //var ind = max(f1.model.selectedIndex, 1);
                var cs1, ds1, ss1, cs1m;
                var f = 1/298.257223563;
                var sb=sin(brg[j]);
                var cb=cos(brg[j]);
                var tu1=(1-f)*tan(lat1);
                var cu1=1/sqrt((1+tu1*tu1));
                var su1=tu1*cu1;
                var s2=atan2(tu1, cb);
                var sa = cu1*sb;
                var csa=1-sa*sa;
                var us=csa*(a*a - b*b)/(b*b);
                var A=1+us/16384*(4096+us*(-768+us*(320-175*us)));
                var B = us/1024*(256+us*(-128+us*(74-47*us)));
                var s1=s/(b*A);
                var s1p = 2*PI;
                while (abs(s1-s1p) > 1e-12) {
                        cs1m=cos(2*s2+s1);
                        ss1=sin(s1);
                        cs1=cos(s1);
                        ds1=B*ss1*(cs1m+B/4*(cs1*(-1+2*cs1m*cs1m)- B/6*cs1m*(-3+4*ss1*ss1)*(-3+4*cs1m*cs1m)));
                        s1p=s1;
                        s1=s/(b*A)+ds1;
                }
                var t=su1*ss1-cu1*cs1*cb;
                var lat2=atan2(su1*cs1+cu1*ss1*cb, (1-f)*sqrt(sa*sa + t*t));
                var l2=atan2(ss1*sb, cu1*cs1-su1*ss1*cb);
                var c=f/16*csa*(4+f*(4-3*csa));
                var l=l2-(1-c)*f*sa* (s1+c*ss1*(cs1m+c*cs1*(-1+2*cs1m*cs1m)));
                var d=atan2(sa, -t);
                point[2] = d+2*PI;
                point[3] = d+PI;
                point[0] = deg(lat2);
                point[1] = deg(normalizeLongitude(lon1+l));
        }

        return point;
}

//setupSim();
//runSimulation(0);
generateHeatmap();
