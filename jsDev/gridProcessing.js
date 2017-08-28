
//44.581266, -123.295130
//44.574480, -123.263201
//44.554269, -123.279895

var points;
var range;
var huntDistance;
var grid;

function setup(){
        range = [];
        grid = [[]];
        points = [];
        points[0] = [44.581266, -123.295130];
        points[1] = [44.574480, -123.263201];
        points[2] = [44.554269, -123.279895];
}

function generateRange(travelRange){
        var topLeft = points[0].slice();
        var botRight = points[0].slice();
        
        for(var i = 1; i < points.length; i++){
                if(points[i][0] > topLeft[0]){
                        topLeft[0] = points[i][0];
                }
                else if(points[i][0] < botRight[0]){
                        botRight[0] = points[i][0];
                }
                
                if(points[i][1] < topLeft[1]){
                        topLeft[1] = points[i][1];
                }
                else if(points[i][1] > botRight[1]){
                        botRight[1] = points[i][1];
                }
        }
        
        /*
        var temp1 = calculateDistanceOffset(topLeft, travelRange + 1, 270);
        var temp2 = calculateDistanceOffset(topLeft, travelRange + 1, 0);
        topLeft[0] = temp1[0];
        topLeft[1] = temp2[1];
        
        var temp3 = calculateDistanceOffset(botRight, travelRange + 1, 90);
        var temp4 = calculateDistanceOffset(botRight, travelRange + 1, 180);
        botRight[0] = temp3[0];
        botRight[1] = temp4[1];
        
        */
        range[0] = topLeft;
        range[1] = botRight;
        
        //console.log("topLeft: " + range[0] + " botRight: " + range[1]);
}

/* Process:
 * 1. generate extreme points from location set
 * 2. Calculate offset corners + range.
 * 3. Calculate horizontal and vertical distance rounding up
 * 4. generate coordinates of each upper left corner + 1 in each dimension
 * 5. Translate population coordinates to be in terms of x and y
 * 6.
 */


//works with being handed topLeft and bottom right points in the form: [[0,2], [2,0]]
function generateGrid(extremePoints){
        grid[0][0] = extremePoints[0];
        var x = extremePoints[0][1];
        var y = extremePoints[0][0];
        var i = 0;
        var j = 0;
        var temp = [];
        
        while(y > extremePoints[1][0]){
                while(x < extremePoints[1][1]){
                        temp = calculateDistanceOffset(grid[j][i], 1, 90);
                        grid[j].push(temp.slice());
                        
                        i++;
                }
                temp = calculateDistanceOffset(grid[j][i], 1, 90);
                grid[j].push(temp.slice());
                i = 0;
                j++;
        }
        
        while(x < extremePoints[1][1]){
                temp = calculateDistanceOffset(grid[j][i], 1, 90);
                grid[j].push(temp.slice());
                
                i++;
        }
        temp = calculateDistanceOffset(grid[j][i], 1, 90);
        grid[j].push(temp.slice());
        
        console.log("Grid size: " + grid[0].length + " x " + grid.length);
}

function placeLocations(grid, points){
        //for each location
        //loop over points until we find best fitting 1km x 1km square
        var y = 0;
        var x = 0;
        
        for(var i = 0; i < points.length; i++){
                while(grid[y][0][0] > points[i][0]){
                        y++;
                }
                
                while(grid[y][x][1] < points[i][1]){
                        x++;
                }
                
                console.log("placing point " + points[i] + " at: " + x + ", " + y);
                points[i][2] = y;
                points[i][3] = x;
        }
}

function calculateDistance(p1, p2){
        
}

setup();
generateRange(10);
console.log("topLeft: " + range[0] + " botRight: " + range[1]);