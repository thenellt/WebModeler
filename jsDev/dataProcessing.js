/* global simResults simData Chartist JSZip saveAs*/

var csvStrings;
var entireAreaChart;
var localAreaChart;
var heatMapYear;

function setupOutputRanges(){
        heatMapYear = simData.years;
        document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        document.getElementById("rawHeatmapYear").max = simData.years;
        document.getElementById("rawHeatmapYear").value = simData.years;
        document.getElementById("csvNumberInput").max = simData.years;
}

function createCDFChart(densities){
        console.log("createCDFChart called with densities length: " + densities.length);

        var data = {
                labels: ['K0', 'K1','K2','K3','K4','K5','K6','K7','K8','K9','k10'],
                series: [densities],
        };
        var options = {
                width: 600,
                height: 400,
        };

        entireAreaChart = new Chartist.Bar('#entireMapChart', data, options);
}

function resizeEntireAreaChart(event, ui){
        var newSizeOptions = {
                width: ui.size.width,
                height: ui.size.height,
        };
        
        entireAreaChart.update(newSizeOptions);
}

function createLocalCDFChart(densities){
        var data = {
                labels: ['K0', 'K1','K2','K3','K4','K5','K6','K7','K8','K9','k10'],
                series: [densities],
        };
        var options = {
                width: 600,
                height: 400,
        };

        localAreaChart = new Chartist.Bar('#surroundingChart', data, options);
}

function rawHWScaleInput(value){
        const newWidth = simResults.xSize * (value / 100);
        const newHeight = simResults.ySize * (value / 100);

        document.getElementById('heatmapScaleText').innerHTML = "Image Resolution: " + newWidth + "px by " + newHeight + "px";
}

function setupOpacitySlider(){
        document.getElementById("opacitySlider").value = simData.opacity * 100;
        console.log("setting opacity: " + simData.opacity * 100);
        document.getElementById("opacityLabel").innerHTML = "Overlay Opacity: " + simData.opacity * 100  + "%";
}

function changeOverlayYear(isNext){
        if(isNext && heatMapYear != simData.years){
                heatMapYear += 1;
                workerThread.postMessage({type:'genImage', dest:'mapViewerUpdate', year:heatMapYear, scale:1});
                document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        } else if(!isNext && heatMapYear > 0){
                heatMapYear -= 1;
                workerThread.postMessage({type:'genImage', dest:'mapViewerUpdate', year:heatMapYear, scale:1});
                document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        }
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
