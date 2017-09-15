//save load system for parsing files and dealing with browser storage
/*
Goals
- Save parameters as json
- load text file with json
- browser persistent storage

*/

/* parameters to handle plus populations
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
*/

function checkCompatibility(){
        console.log("checking for browser support...");
}

function loadFromFile(fileName){
        var reader = new FileReader();
        
        if(fileName.files && fileName.files[0]) {
                reader.onload = function (e) {
                        //parseConfigFile(e.target.result);
                        console.log(e.target.result);
                };
                reader.readAsText(fileName.files[0]);
        }
}

function parseConfigFile(fileString){
        
}

function saveObjectToFile(saveObject){
        var testData = {};
        testData.x = 4;
        testData.y = 6;
        testData.testVar = saveObject;
        var testString = JSON.stringify(testData);
        var jsonBlob = new Blob([testString], {type: "application/json"});
        saveAs(jsonBlob, "test.cfg");
}

checkCompatibility();
saveJsonToFile("test");