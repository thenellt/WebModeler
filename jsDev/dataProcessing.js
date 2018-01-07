/* global simResults simData Chartist JSZip saveAs*/

var csvAllYears;
var entireAreaChart;

function createCDFChart(densities){
        console.log("createCDFChart called with densities length: " + densities.length);
        //let densities = generateCDFBins(simData.years);

        var data = {
                labels: ['K0', 'K1','K2','K3','K4','K5','K6','K7','K8','K9','k10'],
                series: [densities],
        };
        var options = {
                width: 600,
                height: 400,
        };

        entireAreaChart = new Chartist.Bar('.ct-chart', data, options);
}

function resizeEntireAreaChart(event, ui){
        var newSizeOptions = {
                width: ui.size.width,
                height: ui.size.height,
        };
        
        entireAreaChart.update(newSizeOptions);
}

function rawHMYearInput(value){
        console.log("raw heatmap year changed: " + value);
        document.getElementById("previewYearText").innerHTML = value;
        //TODO change preview image
}

function rawHWScaleInput(value){

}

function setupOutputRanges(){
        document.getElementById("heatmapYear").max = simData.years;
        document.getElementById("overlayYear").max = simData.years;
        document.getElementById("csvNumberInput").max = simData.years;
}

function setupOpacitySlider(){
        document.getElementById("opacitySlider").value = simData.opacity * 100;
        console.log("setting opacity: " + simData.opacity * 100);
        document.getElementById("opacityLabel").innerHTML = "Overlay Opacity: " + simData.opacity * 100  + "%";
}

function generateCSV(yearNum){
        var outputString = "";
        for(let i = 0; i < simResults.grid[yearNum].length; i++){
                outputString += simResults.grid[yearNum][i].join(", ");
                outputString += "\r\n";
        }

        return outputString;
}

function csvSingleYear(){
        let yearNum = document.getElementById("csvNumberInput").value;
        console.log("csvSingleYear year: " + yearNum);
        workerThread.postMessage({type:"singleYearCSV", params:yearNum,});
}

function saveSingleCSV(data, year){
        var jsonBlob = new Blob([data], {type: "text/csv"});
        saveAs(jsonBlob, simData.simName + "_year" + year + "data.csv");
}

function csvAllYears(){
        var zip = new JSZip();
        for(let i = 0; i <= simData.years; i++){
                zip.file(simData.simName + "_year" + i + ".csv", generateCSV(i));
        }

        zip.generateAsync({type:"blob"})
                .then(function(content) {
                // see FileSaver.js
                saveAs(content, simData.simName + "_csvData.zip");
        });
}

function saveAllYearsCSV(data){
        
}
