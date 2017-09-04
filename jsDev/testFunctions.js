
var points = [];
var geoGrid = [[[]]];
var counter = 0;

function setupPoints(){
        points.push([-123.749297, 43.091117]);
        points.push([-123.754029, 43.092112]);
        points.push([-123.745553, 43.091909]);
        points.push([-123.750166, 43.089237]);
        points.push([-123.754318, 43.092716]);
        console.log(points);
}

function addPoint(position){
        console.log("adding point: " + position);
        points.push(position);
        console.log("number of points: " + points.length);
        //generateBounds(0);
}

function generateBounds(range){
        console.log("range: " + range);
        var topLeft = points[0].slice(0);
        var botRight = points[0].slice(0);

        for(var i = 1; i < points.length; i++){

                console.log("array point: " + points[i][0] +  ", " + points[i][1]);
                console.log("top Left: " + topLeft[0] +  ", " + topLeft[1]);

                if(points[i][0] < topLeft[0]){
                        console.log("type of orig: " + (typeof topLeft[0]) + " type of new: " + (typeof points[i][0]));
                        console.log("replacing " + topLeft[0] +  " with " + points[i][0]);
                        topLeft[0] = points[i][0];
                }
                else if(points[i][0] > botRight[0]){
                        botRight[0] = points[i][0];
                }
                
                if(points[i][1] > topLeft[1]){
                        topLeft[1] = points[i][1];
                }
                else if(points[i][1] < botRight[1]){
                        botRight[1] = points[i][1];
                }
                console.log("");
        }
        
        var topOffset = [];
        var botOffset = [];
        
        topOffset = destEllipse(topLeft[1], topLeft[0], 0, range);
        topOffset = destEllipse(topOffset[0], topOffset[1], 270, range);

        botOffset = destEllipse(botRight[1], botRight[0], 180, range);
        botOffset = destEllipse(botOffset[0], botOffset[1], 90, range);
        
        console.log("***********offsetsf**************");
        console.log("topLeft: " + topOffset[0] + ", " + topOffset[1]);
        console.log("botRight: " + botOffset[0] + ", " + botOffset[1]);
        
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
        geoGrid[0][0] = [extremePoints[0][0], extremePoints[0][1]];
        console.log("grid 0,0: " + geoGrid[0][0]);
        var x = extremePoints[0][1];
        var y = extremePoints[0][0];
        var i = 0;
        var j = 0;
        var temp = [];
        
        var xd = 0;
        
        while(y > extremePoints[1][0]){
                while(x < extremePoints[1][1]){
                        //console.log("starting point: " + geoGrid[j][i][0] + ", " + geoGrid[j][i][1]);
                        temp = destEllipse(geoGrid[j][i][0], geoGrid[j][i][1], 90, 1);
                        //console.log("temp: " + [temp[0], temp[1]]);
                        geoGrid[j].push([temp[0], temp[1]]);
                        //console.log(geoGrid[j]);
                        x = temp[1];
                        i++;
                }
                temp = destEllipse(geoGrid[j][i][0], geoGrid[j][i][1], 90, 1);
                geoGrid[j].push([temp[0], temp[1]]);
                i = 0;
                x = extremePoints[0][1];
                

                temp = destEllipse(geoGrid[j][i][0], geoGrid[j][i][1], 180, 1);
                j++;
                y = temp[0];
                //console.log("starting point: " + geoGrid[0][0] + " new y: " + temp);
                geoGrid.push([]);
                geoGrid[j].push([temp[0], temp[1]]);
                

        }
        
        while(x < extremePoints[1][1]){
                temp = destEllipse(geoGrid[j][i][0], geoGrid[j][i][1], 90, 1);
                geoGrid[j].push([temp[0], temp[1]]);
                x = temp[1];
                i++;
        }
        temp = destEllipse(geoGrid[j][i][0], geoGrid[j][i][1], 90, 1);
        geoGrid[j].push(temp.slice());
        
        console.log("geoGrid size: " + geoGrid[0].length + " x " + geoGrid.length);
}

function drawgeoGrid(){
        for(var y = 0; y < geoGrid.length - 1; y++){
                for(var x = 0; x < geoGrid[0].length - 1; x++){
                        var tempPolygon = new ol.geom.Polygon([[
                                [geoGrid[y][x][1], geoGrid[y][x][0]],
                                [geoGrid[y][x][1], geoGrid[y + 1][x][0]],
                                [geoGrid[y + 1][x + 1][1], geoGrid[y + 1][x + 1][0]],
                                [geoGrid[y][x + 1][1], geoGrid[y][x][0]],
                                [geoGrid[y][x][1], geoGrid[y][x][0]]
                        ]]);

                        var tempFeature = new ol.Feature({
                                name: ("pos" + x + "," + y),
                                geometry: tempPolygon
                        });

                        var teststyle = new ol.style.Style({
                                stroke: new ol.style.Stroke({width: 1 }),
                                //fill: new ol.style.Fill({ color: [255, 0, 0, (1 - (geoGrid[years][y][x] / carryCapacity))]})
                                //stroke: new ol.style.Stroke({color: [255, 0, 0, (1 - (geoGrid[years][y][x] / carryCapacity))], width: 1})
                        });
                        tempFeature.setStyle(teststyle);
                        features.addFeature(tempFeature);
                }
        }
}

function placeLocations(matrix, pointSet){
        console.log("first point: " + pointSet[0]);
        console.log("corner: " + matrix[0][0]);
        //for each location
        //loop over points until we find best fitting 1km x 1km square
        var y = 0;
        var x = 0;
        
        for(var i = 0; i < pointSet.length; i++){
                while(matrix[y][0][0] > pointSet[i][1]){
                        y++;
                }
                
                while(matrix[y][x][1] < pointSet[i][0]){
                        x++;
                }
                
                console.log("placing point " + pointSet[i] + " at: " + x + ", " + y);
                pointSet[i].push(y - 1);
                towns[i].y = (y - 1);
                pointSet[i].push(x - 1);
                towns[i].x = (x - 1);
                
                x = 0;
                y = 0;
        }
}

function destEllipse(lat1, lon1, bearing, distance) {
        var point = [0.0, 0.0, 0.0, 0.0];
        var brg = new Array(0, 180, 0);
        brg[0] = bearing;
        var j=0;
        if (lat1 == 90) {
                startlat = 89.999999999;
                j=1;
        }
        if (lat1 == -90) {
                startlat = -89.999999999;
                j=2;
        }
        lat1 = rad(lat1);
        lon1 = rad(lon1);
        brg[j] = rad(brg[j]);
        var s = distance;
        var a = 6378137;
        var b = a - (a/298.257223563);
        
        s *= 1000;
        //var ind = max(f1.model.selectedIndex, 1);
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
        var d=Math.atan2(sa, -t);
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

function runTests(){
        for(var g = 0; g < towns.length; g++){
                points.push([towns[g].long, towns[g].lat]);
        }

        console.log("towns: " + towns.length);
        console.log("points: " + points.length);
        
        var bounds = generateBounds(30);
        
        generategeoGrid(bounds);
        //drawgeoGrid();
        setupSim();
        placeLocations(geoGrid, points);
        
        var progressBar = document.getElementById("progressBar");
        progressBar.style.display = "none";
        progressBar.value = 0;
        
        runSimulation(0);
        
        /*
        for(var i = 0; i < years; i++){
                runSimulation(i);
                progressBar.value = ((i + 1) / years) * 100;
        }
        
        progressBar.style.display = "none";
        */
        //generateCanvas(years, 4);
        
        //drawHeatMap(geoGrid);
}

