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

var towns = [];


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
var popLabelFeatures = [];
var pointVector;

var lowColorCode = "ffeda0";
var highColorCode = "f03b20";
var gradientSteps = 63;
//var gradient = [];

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function town(long, lat, pop, killRate, name, growth){
        this.long = long;
        this.lat = lat;
        //this.x = x;
        //this.y = y;
        this.growthRate = growth;
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
        // get the text from the feature - `this` is ol.Feature
        // and show only under certain resolution
        text: this.get('description')
      })
    })
  ];
}

function addVillage(x, y, pop, kills, name, growth){
        towns.push(new town(x, y, pop, kills, name));
        var tempPoint = new ol.geom.Point(
                [x, y]
        );
        
        var tempFeature = new ol.Feature(tempPoint);
        tempFeature.set('description', name);
        tempFeature.setStyle(styleFunction);
        
        source.addFeature(tempFeature);
        
        towns.push(new town(x, y, pop, kills, name, growth));
}

function setupSim(){
        curImage = 0;
        xSize = geoGrid[0].length;
        ySize = geoGrid.length;
        console.log("setupSim grid size: " + xSize + ", " + ySize);
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
        
        //towns = [];
        //for(var g = 0; g < points.length; g++){
        //        var pop = getRandomInt(0, 100);
        //        towns.push(new town(points[g][3], points[g][2], pop, .2, "test" + g));
        //}

        for(var g = 0; g < towns.length; g++){
                points.push([]);
        }

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

function setupGradient(){
        var gradient = [];
        var hotColor = [];
        hotColor[0] = parseInt(highColorCode.substring(0, 2) , 16);
        hotColor[1] = parseInt(highColorCode.substring(2, 4) , 16);
        hotColor[2] = parseInt(highColorCode.substring(4, 6) , 16);
        
        var coolColor = [];
        coolColor[0] = parseInt(lowColorCode.substring(0, 2) , 16);
        coolColor[1] = parseInt(lowColorCode.substring(2, 4) , 16);
        coolColor[2] = parseInt(lowColorCode.substring(4, 6) , 16);
        
        console.log(hotColor);
        console.log(coolColor);
        
        var redRange = hotColor[0] - coolColor[0];
        var greenRange = hotColor[1] - coolColor[1];
        var blueRange = hotColor[2] - coolColor[2];
        
        for(var i = 0; i <= gradientSteps; i++){
                var colorOffset = i / gradientSteps;
                var tempColor = [];
                tempColor[0] = Math.round(redRange * colorOffset) + coolColor[0];
                tempColor[1] = Math.round(greenRange * colorOffset) + coolColor[1];
                tempColor[2] = Math.round(blueRange * colorOffset) + coolColor[2];
                gradient.push(tempColor.slice());
        }
        
        console.log(gradient);
        return gradient;
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
        
        /*
        var maxPoints, geometryFunction;
        drawControls = new ol.interaction.Draw({
                source: source,
                type: 'Point',
                geometryFunction: geometryFunction,
                maxPoints: maxPoints
        });
        map.addInteraction(drawControls);
        */
        map.on('click', function(e){
                showPopEditor(e.coordinate);
        });
        
        map.updateSize();
}

function drawHeatMap(matrix){
        console.log("starting drawHeatMap: ");
        
        var gradient = setupGradient();
        
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
                        if(gradientPosition < 0){
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
                                /*
                                var opacity = (1 - (grid[curYear][y][x] / carryCapacity)) * 255;
                                for(var s = 0; s < scale; s++){
                                        data[pos] = 255;           // some R value [0, 255]
                                        data[pos + 1] = 0;           // some G value
                                        data[pos + 2] = 0;           // some B value
                                        data[pos + 3] = opacity;
                                        pos += 4;
                                }
                                */
                                //console.log("test: " + grid[curYear][y][x] / carryCapacity);
                                var gradientPosition = Math.ceil(gradientSteps * (1 - (grid[curYear][y][x] / carryCapacity)));
                                if(gradientPosition < 0){
                                        for(var s = 0; s < scale; s++){
                                                data[pos] = gradient[0][0];//gradient[gradientPosition][0];           // some R value [0, 255]
                                                data[pos + 1] = gradient[0][1];//gradient[gradientPosition][1];           // some G value
                                                data[pos + 2] = gradient[0][2];//gradient[gradientPosition][2];           // some B value
                                                data[pos + 3] = 255;
                                                pos += 4;
                                        }
                                }
                                else{
                                        //console.log("gradient pos: " + gradientPosition);
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

setupOlInputMap();
