/* global simResults simData Chartist JSZip saveAs*/

var csvStrings;
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

function csvSingleYear(){
        let yearNum = document.getElementById("csvNumberInput").value;
        console.log("csvSingleYear year: " + yearNum);
        workerThread.postMessage({type:"singleYearCSV", year:yearNum,});
}

function saveSingleCSV(data, year){
        var jsonBlob = new Blob([data], {type: "text/csv"});
        saveAs(jsonBlob, simData.simName + "_year" + year + "data.csv");
}

function csvAllYears(){
        csvStrings = [];
        workerThread.postMessage({type:"allYearsCSV", year:0,});
}

function saveAllYearsCSV(csvString, curYear){
        csvStrings.push(csvString);
        
        if(csvStrings.length <= simData.years){
                workerThread.postMessage({type:"allYearsCSV", year:(curYear + 1),});
        }
        else if(csvStrings.length === simData.years + 1){
                var zip = new JSZip();
                for(let i = 0; i < csvStrings.length; i++){
                        zip.file(simData.simName + "_year" + i + "data.csv", csvStrings[i]);
                }

                zip.generateAsync({type:"blob"}).then(function(content) {
                        saveAs(content, simData.simName + "_csvData.zip");
                });
        }
}
