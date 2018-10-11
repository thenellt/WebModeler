var csvStrings;
var entireAreaData;
var localAreaData;
var localAreaPictures;
var offtakeChartData;
var CPUEchartData;
var overlayYear;
var heatMapImages;
var exploitImages;
var ChartMgr;

function setupResultsPages(){
        overlayYear = simRunData.years;
        document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;
        document.getElementById("csvNumberInput").max = simRunData.years;
        localAreaPictures = new Array(simRunData.years + 1);
        document.getElementById("heatmapOpacitySlider").value = simRunData.opacity * 100;
        $("#overlayPlayButton").off('click').click(overlayAnimation);
        if(ChartMgr && ChartMgr._resultsChart)
                ChartMgr._resultsChart.destroy();
        ChartMgr = new chartMgr();
        registerCharts();
}
      
function createGradient(){
        let svg = document.getElementById('gradientSVG');
        let child = svg.getElementById('heatGradient');
        if(child)
                child.parentNode.removeChild(child);

        var id = 'heatGradient';
        let grad = simRunData.gradient;
        let len = grad.length - 1;
        const lowColor = 'rgb(' + grad[0][0] + ',' + grad[0][1] + ',' + grad[0][2] + ')';
        var stops = [{offset:'0%', 'stop-color':lowColor}];
        if(simRunData.threeColorMode){
                const pos = (Math.floor(simData.carryCapacity) - 1)/2;
                const midColor = 'rgb(' + grad[pos][0] + ',' + grad[pos][1] + ',' + grad[pos][2] + ')';
                stops.push({offset:'50%','stop-color':midColor});
        }
        const highColor = 'rgb(' + grad[len][0] + ',' + grad[len][1] + ',' + grad[len][2] + ')';
        stops.push({offset:'100%','stop-color':highColor});
        var svgNS = svg.namespaceURI;
        var gradCon  = document.createElementNS(svgNS,'linearGradient');
        gradCon.setAttribute('id',id);
        for (var i=0;i<stops.length;i++){
                var attrs = stops[i];
                var stop = document.createElementNS(svgNS,'stop');
                for (var attr in attrs){
                        if (attrs.hasOwnProperty(attr)) stop.setAttribute(attr,attrs[attr]);
                }
                gradCon.appendChild(stop);
        }
      
        var defs = svg.querySelector('defs') || svg.insertBefore( document.createElementNS(svgNS,'defs'), svg.firstChild );
        defs.appendChild(gradCon);
        $('#gradientSVG rect').attr('fill','url(#heatGradient)');
}
      

function populateOtherInfo(){
        let timeString = simulationTime > 1000 ? (simulationTime / 1000).toFixed(2) + ' s' : simulationTime.toFixed(2) + ' ms';
        document.getElementById('oStatsTime').innerHTML = timeString;
        document.getElementById('oStatsArea').innerHTML = simResults.xSize * simResults.ySize + ' km2';
        document.getElementById('oStatsWidth').innerHTML = simResults.xSize + ' km';
        document.getElementById('oStatsHeight').innerHTML = simResults.ySize + ' km';
        let popTotal = 0;
        for(let i = 0, length = simResults.townData.length; i < length; i++){
                if(simResults.townData[i].type == "yearly"){
                        popTotal += simResults.townData[i].population[simRunData.years];
                } else {
                        let tTown = simResults.townData[i];
                        popTotal += tTown.population*Math.pow(1 + tTown.growthRate, simRunData.years);
                }
        }
        document.getElementById('oStatsTotalPop').innerHTML = Math.ceil(popTotal);
        document.getElementById('oStatsMemUsage').innerHTML = calculateMemoryUsage();
        let leftCorner = proj4(proj4('mollweide'), proj4('espg4326'), [simResults.simPosition[0], simResults.simPosition[3]]);
        let rightCorner = proj4(proj4('mollweide'), proj4('espg4326'), [simResults.simPosition[2], simResults.simPosition[1]]);
        document.getElementById('oStatsLeftCorner').innerHTML = leftCorner[0].toFixed(3) + ', ' + leftCorner[1].toFixed(3);
        document.getElementById('oStatsRightCorner').innerHTML = rightCorner[0].toFixed(3) + ', ' + rightCorner[1].toFixed(3);
}

function showPerformanceDetails(){
        let visStr = simResults.visTime > 1000 ? (simResults.visTime / 1000).toFixed(2) + ' s' : simResults.visTime.toFixed(2) + ' ms';
        const title = "Performance Details";
        let body = "<table>";
        for(let i = 0; i < simResults.perfData.length; i++){
                body += "<tr><td style='padding: 0;'>Year " + (i + 1) + "</td>";
                body += "<td style='padding: 0;'>" + simResults.perfData[i].toFixed(2) + " ms </td></tr>";
        }
        body += "<tr><td style='padding: 0;'>Visualization Time</td>";
        body += "<td style='padding: 0;'>" + visStr + " </td></tr>";
        body += "</table>";
        modalDialog(title, body);
}

function registerCharts(){
        const hText1 = 'Calculates the depletion of terrain within a radius around each population. While the preview is square, the graph only uses data from the cells contained within a circle inscribed in the square piece of terrain shown in the preview.';
        let localCDFconfig = {helpText:hText1, createGraph:createLocalCDFChart, isSplit:true, changeYear:changeLocalCDFYear,
                   range:simRunData.huntRange, rangeMin:1, rangeMax:(simRunData.huntRange * 2 + simRunData.boundryWidth - 2),
                   rangeFnc:changeLocalCDFRange, setupSelect:populateCDFSelection, changeSelection:changeCDFSettlement,
                   title:'Single Settlement Spatial Distribution', uiModules:[true, true, true], saveData:localCDFcsv};

        const hText2 = '';
        let fullCDFconfig = {helpText:hText2, createGraph:createEntireCDFChart, isSplit:false, changeYear:changeEntireCDFYear,
                title:'Entire Map Spatial Distribution', uiModules:[false, false, true], saveData:fullCDFcsv};

        const hText3 = '';
        let offtakeConfig = {helpText:hText3, createGraph:createOfftakeChart, isSplit:false, setupSelect:populateOfftakeSelection, 
                changeSelection:changeOfftakeSettlement, title:'Settlement Offtake', uiModules:[true, false, false], saveData:offtakeCSV};

        const hText4 = '';
        let CPUEconfig = {helpText:hText4, createGraph:createCPUEchart, isSplit:false, setupSelect:populateCPUEselection, 
                changeSelection:changeCPUEselection, title:'Catch per Unit Effort', uiModules:[true, false, false], saveData:CPUEcsv};

        ChartMgr.register('Local CDF', localCDFconfig);
        ChartMgr.register('Entire Map CDF', fullCDFconfig);
        ChartMgr.register('Settlement Offtake', offtakeConfig);
        ChartMgr.register('Catch/Unit Effort', CPUEconfig);
        }
        
function populateCDFSelection(){
        $('#graphSettlementSelect').children('option').remove();
        var CDFselector = document.getElementById('graphSettlementSelect');
        for(let settlement of simRunData.towns){
                let option = document.createElement("option");
                option.text = settlement.name;
                option.value = settlement.id;
                CDFselector.add(option);
        }

        if(!ChartMgr._currentConfig.selected){
                ChartMgr._currentConfig.selected = simRunData.towns[0].id;
        } else {
                for(let child of CDFselector.childNodes)
                        if(parseInt(child.value, 10) === ChartMgr._currentConfig.selected){
                                child.setAttribute('selected','');
                                break;
                        }
        }
        $('#graphSettlementSelect').material_select();
}

function populateOfftakeSelection(){
        $('#graphSettlementSelect').children('option').remove();
        var offtakeSelector = document.getElementById('graphSettlementSelect');

        if(simRunData.towns.length > 1){
                let option1 = document.createElement("option");
                option1.text = 'All Settlements';
                option1.value = 'all';
                offtakeSelector.add(option1);

                let option3 = document.createElement("option");
                option3.text = 'Combined Totals';
                option3.value = 'total';
                offtakeSelector.add(option3);

                let option2 = document.createElement("option");
                option2.text = 'Combined Average';
                option2.value = 'avg';
                offtakeSelector.add(option2);
        }

        for(let settlementID in uiData){
                let settlement = uiData[settlementID];
                let option = document.createElement("option");
                option.text = settlement.name;
                option.value = settlement.id;
                offtakeSelector.add(option.cloneNode(true));
        }

        if(!ChartMgr._currentConfig.selected){
                if(simRunData.towns.length > 1){
                        ChartMgr._currentConfig.selected = 'all';
        } else {
                        ChartMgr._currentConfig.selected = simRunData.towns[0].id;
                }
        } else {
                for(let child of offtakeSelector.childNodes)
                        if(child.value == ChartMgr._currentConfig.selected){
                                child.setAttribute('selected','');
                                break;
                        }
        }

        $('#graphSettlementSelect').material_select();
}

function populateCPUEselection(){
        $('#graphSettlementSelect').children('option').remove();
        var offtakeSelector = document.getElementById('graphSettlementSelect');

        if(simRunData.towns.length > 1){
                let option1 = document.createElement("option");
                option1.text = 'All Settlements';
                option1.value = 'all';
                offtakeSelector.add(option1);

                let option2 = document.createElement("option");
                option2.text = 'Combined Average';
                option2.value = 'avg';
                offtakeSelector.add(option2);
        }

        for(let settlementID in uiData){
                let settlement = uiData[settlementID];
                let option = document.createElement("option");
                option.text = settlement.name;
                option.value = settlement.id;
                offtakeSelector.add(option.cloneNode(true));
        }

        if(!ChartMgr._currentConfig.selected){
                if(simRunData.towns.length > 1){
                        ChartMgr._currentConfig.selected = 'all';
                } else {
                        ChartMgr._currentConfig.selected = simRunData.towns[0].id;
                }
        } else {
                for(let child of offtakeSelector.childNodes)
                        if(child.value == ChartMgr._currentConfig.selected){
                                child.setAttribute('selected','');
                                break;
                        }
        }

        $('#graphSettlementSelect').material_select();
}

function changeOverlayYear(isNext){
        if(isNext && overlayYear != simRunData.years){
                overlayYear += 1;
        } else if(!isNext && overlayYear > 0){
                overlayYear -= 1;
        } else {
                return;
        }

                drawCanvasToMap(heatMapImages[overlayYear], heatmapLayer);
                drawCanvasToMap(exploitImages[overlayYear], exploitLayer);
                document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;
                if(mouseLastPosition)
                        workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:overlayYear});
        }

function overlayAnimation(){
        $('#overlaySaveButton, #mapFullscreenButton, #resultsFitBtn, #overlaySelectionBtn').addClass('disabled');
        $('#overlayUpButton, #overlayDownButton, #tabFillerButton').addClass('disabled');
        overlayYear = 0;
        if(mouseLastPosition)
                workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:overlayYear});
        drawCanvasToMap(heatMapImages[overlayYear], heatmapLayer);
        drawCanvasToMap(exploitImages[overlayYear], exploitLayer);
        document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;

        var animHandle;
        var endFnc = function(){
                        clearTimeout(animHandle);
                $('#overlaySaveButton, #mapFullscreenButton, #resultsFitBtn, #overlaySelectionBtn').removeClass('disabled');
                        $('#overlayUpButton, #overlayDownButton, #tabFillerButton').removeClass('disabled');
                        $('#overlayPlayButton').html('Play').removeClass('red').addClass('blue').off('click').click(overlayAnimation);
        }

        var year = 0;
        animHandle = setInterval(function(){
                if(year === simRunData.years){
                        endFnc();
                } else {
                        changeOverlayYear(true);
                        year += 1;
                }
        }, 250);

        $('#overlayPlayButton').html('Stop').removeClass('blue').addClass('red').off('click').click(endFnc);
}

function storeCDFData(location, data, id){
        switch(location){
        case 'entire':
                entireAreaData = data;
                break;
        case 'single':
                localAreaData[id] = data;
                const tempID = ChartMgr.getCurrentlySelected();
                if(tempID && id === tempID){
                        ChartMgr._resultsChart.data.datasets[0].data = localAreaData[tempID][ChartMgr.getYear()];
                        let labelText = simRunData.townsByID[tempID].name +  ": " + ChartMgr.getRange() + " km Spatial Distribution";
                        ChartMgr._resultsChart.options.title.text = labelText;
                        ChartMgr._resultsChart.update();
                }
                break;
        }
}

function storeOfftakeData(data){
        let simData = JSON.parse(data);
        offtakeChartData = {};
        if(simRunData.towns.length > 1){
                let totalPopData = new Array(simRunData.years).fill(0.0);;
                for(key in simData)
                        for(let y = 0; y < simRunData.years; y++)
                                totalPopData[y] += simData[key][y];

                let avgPopData = new Array(simRunData.years);
                for(let i = 0; i < simRunData.years; i++)
                        avgPopData[i] = totalPopData[i] / simRunData.towns.length;

                offtakeChartData.total = totalPopData;
                offtakeChartData.total.color = ChartMgr.getPopColor('total');
                offtakeChartData.avg = avgPopData;
                offtakeChartData.avg.color = ChartMgr.getPopColor('avg');
        }

        offtakeChartData.towns = {};
        for(town in simRunData.townsByID){
                offtakeChartData.towns[town] = {
                        data:Object.values(simData[town]),
                        color:ChartMgr.getPopColor(town)
                }
        }
}

function changeEntireCDFYear(newYear, chart){
        chart.data.datasets[0].data = entireAreaData[newYear];
        chart.update();
}

function changeLocalCDFRange(newRange){
        const selectedID = ChartMgr.getCurrentlySelected();
        workerThread.postMessage({type:"getSingleCDFData", id:selectedID, range:newRange});
        workerThread.postMessage({type:"getSingleCDFPictures", id:selectedID, range:newRange});
        $("#graphRangeLabel").html("Radius: " + newRange + " km");
}

function changeLocalCDFYear(newYear, chart){
        const selectedID = ChartMgr.getCurrentlySelected();
        setLocalCDFPicture(newYear);
        chart.data.datasets[0].data = localAreaData[selectedID][newYear];
        chart.update();
}

function setLocalCDFPicture(newYear){
        let canvasImage = new Image();
        canvasImage.onload = function(){
                canvasImage.classList.add('localCDFImage');
                let container = document.getElementById('localAreaPicture');
                if(container.firstChild)
                        container.removeChild(container.firstChild);
                container.appendChild(canvasImage);
        };

        canvasImage.src = localAreaPictures[newYear];
}

function changeCDFSettlement(){
        let value = $("#graphSettlementSelect").val();
        const localAreaRange = ChartMgr.getRange();
        const localAreaSelectedID = parseInt(value, 10);
        ChartMgr._currentConfig.selected = localAreaSelectedID;
        workerThread.postMessage({type:"getSingleCDFData", id:localAreaSelectedID, range:localAreaRange});
        workerThread.postMessage({type:"getSingleCDFPictures", id:localAreaSelectedID, range:localAreaRange});
}

function changeOfftakeSettlement(){
        let offtakeChart = ChartMgr.getChart();
        let offtakeSelectedID = ChartMgr._currentConfig.selected = $("#graphSettlementSelect").val();
        offtakeChart.data.datasets = [];
        if(offtakeSelectedID == 'all'){
                for(key in offtakeChartData.towns){
                        offtakeChart.data.datasets.push({
                                label: simRunData.townsByID[key].name,
                                backgroundColor: 'rgba(0,0,0,0)',
                                borderColor: offtakeChartData.towns[key].color,
                                data: offtakeChartData.towns[key].data,
                        });
                }

                var titleText = 'All Settlement Offtake';
                var maxTemp = 0;
                for(key in offtakeChartData.towns){
                        let maxVal = Math.max.apply(Math, offtakeChartData.towns[key].data);
                        maxTemp = maxVal > maxTemp ? maxVal : maxTemp;
                }
        } else {
                if(offtakeSelectedID == 'total' || offtakeSelectedID == 'avg'){
                        var data = offtakeChartData[offtakeSelectedID];
                        var tempColor = offtakeChartData[offtakeSelectedID].color;
                        var titleText = 'total' ? 'Combined Offtake' : 'Average Offtake';
                } else {
                        var data = offtakeChartData.towns[offtakeSelectedID].data;
                        var tempColor = offtakeChartData.towns[offtakeSelectedID].color;
                        var titleText = simRunData.townsByID[offtakeSelectedID].name + ' Offtake';
                }

                offtakeChart.data.datasets.push({
                        label: offtakeSelectedID in simRunData.townsByID ? simRunData.townsByID[offtakeSelectedID].name : offtakeSelectedID,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderColor:tempColor,
                        data:data,
                });
                var maxTemp = Math.max.apply(Math, data);
        }

        const tickMin = 0.0;
        const tickMax = Math.ceil(maxTemp * 1.10);
        const stepAmount = Math.ceil(tickMax / 10);
        offtakeChart.options.scales.yAxes[0].ticks.min = tickMin;
        offtakeChart.options.scales.yAxes[0].ticks.max = tickMin + stepAmount * 10;
        offtakeChart.options.scales.yAxes[0].ticks.stepSize = stepAmount;
        offtakeChart.options.title.text = titleText;
        offtakeChart.update();
}

function changeCPUEselection(){
        let chart = ChartMgr.getChart();
        let selectedID = ChartMgr._currentConfig.selected = $("#graphSettlementSelect").val();
        chart.data.datasets = [];
        if(selectedID == 'all'){
                for(let key in CPUEchartData.towns){
                        chart.data.datasets.push({
                                label: simRunData.townsByID[key].name,
                                backgroundColor: 'rgba(0,0,0,0)',
                                borderColor: CPUEchartData.towns[key].color,
                                data: CPUEchartData.towns[key],
                        });
                }

                var titleText = 'All Settlements CPUE';
                var maxTemp = 0;
                for(let key in CPUEchartData.towns){
                        let maxVal = Math.max.apply(Math, CPUEchartData.towns[key]);
                        maxTemp = maxVal > maxTemp ? maxVal : maxTemp;
                }
        } else {
                if(selectedID == 'avg'){
                        var data = CPUEchartData.avg.data;
                        var tempColor = CPUEchartData.avg.color;
                        var titleText = 'Average CPUE';
                } else {
                        var data = CPUEchartData.towns[selectedID];
                        var tempColor = CPUEchartData.towns[selectedID].color;
                        var titleText = simRunData.townsByID[selectedID].name + ' CPUE';
                }

                chart.data.datasets.push({
                        label: selectedID in simRunData.townsByID ? simRunData.townsByID[selectedID].name : selectedID,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderColor:tempColor,
                        data:data,
                });
                var maxTemp = Math.max.apply(Math, data);
        }

        const tickMin = 0.0;
        const tickMax = maxTemp * 1.10;
        const stepAmount = tickMax / 10.0;
        chart.options.scales.yAxes[0].ticks.min = tickMin;
        chart.options.scales.yAxes[0].ticks.max = tickMin + stepAmount * 10;
        chart.options.scales.yAxes[0].ticks.stepSize = stepAmount;
        chart.options.title.text = titleText;
        chart.update();
}

function storeCPUEdata(data){
        CPUEchartData = {towns: JSON.parse(data)};
        if(simRunData.towns.length > 1){
                let totalPopData = new Array(simRunData.years).fill(0.0);
                for(key in CPUEchartData.towns)
                        for(let y = 0; y < simRunData.years; y++)
                                totalPopData[y] += CPUEchartData.towns[key][y];

                let avgPopData = new Array(simRunData.years);
                for(let i = 0; i < simRunData.years; i++)
                        avgPopData[i] = totalPopData[i] / simRunData.towns.length;

                CPUEchartData.avg = {data:avgPopData, color:ChartMgr.getPopColor('avg')};
        }

        for(const town in CPUEchartData.towns)
                CPUEchartData.towns[town].color = ChartMgr.getPopColor(town);
}

function requestRawdataCSV(isAllYears){
        if(isAllYears){
                csvStrings = [];
                workerThread.postMessage({type:"allYearsCSV", year:0});
        } else {
                workerThread.postMessage({type:"singleYearCSV", year:$('#csvNumberInput').val()});
        }
}

function saveSingleCSV(data, year){
        var jsonBlob = new Blob([data], {type: "text/csv"});
        saveAs(jsonBlob, simRunData.simName + "_year" + year + "data.csv");
}

function saveAllYearsCSV(csvString, curYear){
        csvStrings.push(csvString);

        if(csvStrings.length <= simRunData.years){
                workerThread.postMessage({type:"allYearsCSV", year:(curYear + 1),});
        } else if(csvStrings.length === simRunData.years + 1) {
                var zip = new JSZip();
                for(let i = 0; i < csvStrings.length; i++){
                        zip.file(simRunData.simName + "_year" + i + "data.csv", csvStrings[i]);
                }

                zip.generateAsync({type:"blob"}).then(function(content) {
                        saveAs(content, simRunData.simName + "_csvData.zip");
                        csvStrings = [];
                });
        }
}

function localCDFcsv(){
        const selected = ChartMgr.getCurrentlySelected();
        var data = ['Bins as Percentage of K', '0.0 - 0.1', '0.1 - 0.2','0.2 - 0.3','0.3 - 0.4','0.4 - 0.5',
                   '0.5 - 0.6', '0.6 - 0.7','0.7 - 0.8','0.8 - 0.9',"0.9 - 1.0"].toString() + "\r\n";

        let temp = new Array(11);
        for(let i = 0; i <= simRunData.years; i++){
                temp[0] = 'Year ' + i;
                for(let j = 1; j < 11; j++)
                        temp[j] = localAreaData[selected][i][j - 1].toFixed(3);

                data += temp.toString() + "\r\n";
        }
        
        const popName = document.getElementById("graphSettlementSelect").selectedOptions[0].label;
        saveAs(new Blob([data], {type: "text/csv"}), popName + "_cdf_data.csv");
}

function fullCDFcsv(){
        var data = ['Bins as Percentage of K', '0.0 - 0.1', '0.1 - 0.2','0.2 - 0.3','0.3 - 0.4','0.4 - 0.5',
                   '0.5 - 0.6', '0.6 - 0.7','0.7 - 0.8','0.8 - 0.9',"0.9 - 1.0"].toString() + "\r\n";

        let temp = new Array(11);
        for(let i = 0; i <= simRunData.years; i++){
                temp[0] = 'Year ' + i;
                for(let j = 1; j < 11; j++)
                        temp[j] = entireAreaData[i][j - 1].toFixed(3);

                data += temp.toString() + "\r\n";
        }
        
        saveAs(new Blob([data], {type: "text/csv"}), simRunData.simName + "_fullMapCDF_data.csv");
}

function offtakeCSV(){
        var datasets = ChartMgr.getChart().data.datasets;
        var temp = [];
        for(let i = 1; i <= simRunData.years; i++)
                temp.push("Year: " + i);
        var data = 'Settlement:,' + temp.toString() + "\r\n";

        for(let i = 0; i < datasets.length; i++){
                for(let j = 0; j < simRunData.years; j++)
                        temp[j] = datasets[i].data[j].toFixed(3);
                
                data += datasets[i].label + ',' + temp.toString() + "\r\n";
        }

        const selected = ChartMgr.getCurrentlySelected();
        const tempName = selected in simRunData.townsByID ? simRunData.townsByID[selected].name : selected;
        saveAs(new Blob([data], {type: "text/csv"}), simRunData.simName + "_" + tempName + "_offtakeData.csv");
}

function CPUEcsv(){
        var datasets = ChartMgr.getChart().data.datasets;
        var temp = [];
        for(let i = 1; i <= simRunData.years; i++)
                temp.push("Year: " + i);
        var data = 'Settlement:,' + temp.toString() + "\r\n";

        for(let i = 0; i < datasets.length; i++){
                for(let j = 0; j < simRunData.years; j++)
                        temp[j] = datasets[i].data[j].toFixed(5);
                
                data += datasets[i].label + ',' + temp.toString() + "\r\n";
        }

        const selected = ChartMgr.getCurrentlySelected();
        const tempName = selected in simRunData.townsByID ? simRunData.townsByID[selected].name : selected;
        saveAs(new Blob([data], {type: "text/csv"}), simRunData.simName + "_" + tempName + "_CPUEdata.csv");
}

function calculateMemoryUsage(){
        let gridFloats  = 2 * simRunData.years * simResults.xSize * simResults.ySize;
        let geoFloats   = 2 * simResults.xSize * simResults.ySize * 2;
        let otherFloats = 3 * simResults.xSize * simResults.ySize;

        let imageBytes    = simRunData.years * simResults.xSize * simResults.ySize * 4;
        let floatBytes    = (gridFloats + geoFloats + otherFloats) * 8;

        let numBytes = imageBytes + floatBytes;
        if(numBytes < 1000000)
                return (numBytes/1000).toFixed(2) + ' KB';
        else
                return (numBytes/1000000).toFixed(2) + ' MB';
}

//based on https://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript/14187677#14187677
function getRandomColor(){
        let brightness = 50;
        let randomChannel = function(brightness){
                let r = 255-brightness;
                let n = 0|((Math.random() * r) + brightness);
                let s = n.toString(16);
                return (s.length==1) ? '0' + s : s;
        }
        return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}

function refreshCanvas(){
        if(simulationRun && ChartMgr._resultsChart)
                ChartMgr._resultsChart.update();

        if(bingLayers[0]){
                bingLayers[0].getSource().refresh();
                bingLayers[1].getSource().refresh();
        }

        if(heatmapLayer.getSource())
                heatmapLayer.getSource().refresh();

        map.updateSize();
}