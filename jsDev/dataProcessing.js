/* global simResults simData Chartist JSZip saveAs*/

function createCDFChart(densities){
        console.log("createCDFChart called with densities length: " + densities.length);
        //let densities = generateCDFBins(simData.years);

        var data = {
          // A labels array that can contain any sort of values
          labels: ['K0', 'K1','K2','K3','K4','K5','K6','K7','K8','K9','k10'],
          // Our series array that contains series objects or in this case series data arrays
          series: [
            densities
          ]
        };
        var options = {
                width: 450,
                height: 300
        };

        new Chartist.Bar('.ct-chart', data, options);
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
        var text = generateCSV(yearNum);

        var jsonBlob = new Blob([text], {type: "text/csv"});
        saveAs(jsonBlob, simData.simName + "_year" + yearNum + "data.csv");
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
