var points = [];
var map;

function createPoint(xVal, yVal){
        var point = {
                x:xVal,
                y:yVal
        };
        return point;
}

var extent = document.getElementById("extent");
extent.addEventListener('click', function() {
        if(points.length < 2){
                return;
        }

        var max = createPoint(points[0].x, points[0].y);
        var min = createPoint(points[0].x, points[0].y);

        for(i = 0; i < points.length; i++){
                console.log("loop");
                console.log(points[i]);
                console.log("max");
                console.log(max);
                console.log("min");
                console.log(min);
                if(points[i].x > max.x){
                        console.log("increasing max x");
                        max.x = points[i].x;
                }
                else if(points[i].x < min.x){
                        console.log("decreasing min x");
                        min.x = points[i].x;
                }

                if(points[i].y > max.y){
                        console.log("increasing max y");
                        max.y = points[i].y;
                }
                else if(points[i].y < min.y){
                        console.log("decreasing min y");
                        min.y = points[i].y;
                }
        }
        console.log("max");
        console.log(max);
        console.log("min");
        console.log(min);
});

var addPoint = document.getElementById("addPointButton");
addPoint.addEventListener('click', function() {
        var latElement = document.getElementById("addLat");
        var longElement = document.getElementById("addLong");
        if(latElement.value.length == 0 || longElement.value.length == 0){
                console.log('empty input');
                return;
        }

        var point = createPoint(parseFloat(longElement.value), parseFloat(latElement.value));

        points.push(point);
        console.log(points);
});

var reset = document.getElementById("reset");
reset.addEventListener('click', function() {
        map.getView().setCenter(ol.proj.fromLonLat([-123.269542, 44.568696]));
});

var update = document.getElementById("updateButton");
update.addEventListener('click', function() {
        var latElement = document.getElementById("lat");
        var longElement = document.getElementById("long");

        if(latElement.value.length == 0 || longElement.value.length == 0){
                console.log('empty input');
                return;
        }
        console.log(parseFloat(latElement.value));
        console.log(parseFloat(longElement.value));
        map.getView().setCenter(ol.proj.fromLonLat([parseFloat(longElement.value), parseFloat(latElement.value)]));
        console.log(map.getView().getCenter());
}, false);

map.updateSize();
console.log(map.getSize());
