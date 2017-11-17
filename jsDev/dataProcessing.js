
function createTestChart(){
        var data = {
          // A labels array that can contain any sort of values
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          // Our series array that contains series objects or in this case series data arrays
          series: [
            [5, 2, 4, 2, 0]
          ]
        };
        var options = {
                width: 450,
                height: 300
        };

        new Chartist.Line('.ct-chart', data, options);
}

function setupOutputRanges(){

}

function generateCSV(yearNum){
        var outputString = "";
        for(let i = 0; i < grid[yearNum].length; i++){
                outputString += grid[yearNum][i].join(", ");
                outputString += "\r\n";
        }

        return outputString;
}

function csvSingleYear(){
        let yearNum = document.getElementById("csvNumberInput").value;
        console.log("csvSingleYear year: " + yearNum);
        var text = generateCSV(yearNum);

        var jsonBlob = new Blob([text], {type: "text/csv"});
        saveAs(jsonBlob, simName + "_year" + yearNum + "data.csv");
}

function csvAllYears(){
        var zip = new JSZip();
        for(let i = 0; i <= years; i++){
                zip.file(simName + "_year" + i + ".csv", generateCSV(i));
        }

        zip.generateAsync({type:"blob"})
                .then(function(content) {
                // see FileSaver.js
                saveAs(content, simName + "_csvData.zip");
        });
}

console.log("hello from the stats file :)");
