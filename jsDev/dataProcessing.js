/* global simResults simData Chartist JSZip saveAs*/

function generateCDFBins(year){
        var numCells = 0;
        var dataValues = new Array(11);
        for(let i = 0; i < dataValues.length; i++){
                dataValues[i] = 0;
        }

        console.log("dataValues starting: " + dataValues);

        simResults.grid[year].forEach(function(element){
                element.forEach(function(ele){
                        numCells++;
                        let temp = ele / (1.0 * simData.carryCapacity);
                        if(temp > .99){
                                dataValues[10]++;
                        }
                        else{
                                dataValues[Math.floor(temp * 10)]++;
                        }
                });
        });

        console.log("num cells counted: " + numCells);
        console.log("cell values: " + dataValues);
        for(let i = 0; i < dataValues.length; i++){
                dataValues[i] = parseFloat(dataValues[i] / (1.0 *numCells));
        }

        console.log("cell post normalize: " + dataValues);

        return dataValues;
}

function createCDFChart(){
        let densities = generateCDFBins(simData.years);

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
