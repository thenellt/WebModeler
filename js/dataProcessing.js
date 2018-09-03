var csvStrings;
var entireAreaData;
var localAreaData;
var localAreaPictures;
var offtakeChartData;
var overlayYear;
var heatMapImages;
var simPosition;
var exploitImages;

function setupResultsPages(){
        overlayYear = simRunData.years;
        document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;
        document.getElementById("csvNumberInput").max = simRunData.years;
        //offtakeSelectedID = 'all';
        //localAreaRange = simRunData.huntRange;
        //localAreaSelectedID = uiData[Object.keys(uiData)[0]].id;
        localAreaPictures = new Array(simRunData.years + 1);
        //document.getElementById("singleCDFRangeLabel").innerHTML = "Radius: " + localAreaRange + " km";
        document.getElementById("heatmapOpacitySlider").value = simRunData.opacity * 100;
        //$("#overlayPlayButton").off('click').click(overlayAnimation);
        //$('#entireCDFplayButton').off('click').click(entireCDFAnimation);
        //$('#localCDFplayButton').off('click').click(localCDFAnimation);
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
        let leftCorner = proj4(proj4('mollweide'), proj4('espg4326'), simResults.geoGrid[0][0]);
        let rightCorner = proj4(proj4('mollweide'), proj4('espg4326'), simResults.geoGrid[simResults.ySize - 1][simResults.xSize - 1]);
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
        let cfg = {helpText:hText1, createGraph:createLocalCDFChart, isSplit:true, changeYear:changeLocalCDFYear,
                   range:simRunData.huntRange, rangeMin:1, rangeMax:(simRunData.huntRange * 2 + simRunData.boundryWidth - 2),
                   rangeFnc:changeLocalCDFRange, updateSelect:populateCDFSelection, changeSelection:changeCDFSettlement};
        ChartMgr.register('Local CDF', cfg);
}

Chart.plugins.register({
        beforeDraw: function(c) {
                var ctx = c.chart.ctx;
                ctx.fillStyle = "#eceff1";
                ctx.fillRect(0, 0, c.chart.width, c.chart.height);
        }
});

function createEntireCDFChart(ctx){
        return new Chart(ctx, {
                type: 'bar',
                data: {
                        labels: ['0.0 - 0.1', '0.1 - 0.2','0.2 - 0.3','0.3 - 0.4','0.4 - 0.5','0.5 - 0.6',
                         '0.6 - 0.7','0.7 - 0.8','0.8 - 0.9','0.9 - 1.0'],
                        datasets: [{ legend: { display: false }, backgroundColor: "#90caf9", data: [0], }]
                },
                options: {
                        legend: { display: false },
                        plugins: {
                                datalabels: {
                                        anchor: 'end',
                                        align: 'top',
                                        offset: 4,
                                        color: 'grey',
                                        font: { weight: 'bold' },
                                        formatter: function(value, context) {
                                                return value.toFixed(2) + ' %';
                                        }
                                }
                        },
                        scales: {
                                xAxes: [{
                                        ticks: { min: 0 },
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Fraction of Carrying Capacity (K)'
                                        }
                                }],
                                yAxes: [{
                                        ticks: { beginAtZero: true, min: 0, max: 100 },
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Percent of Bins'
                                        }
                                }]
                        },
                        title: { display: true, fontSize: 16, text: 'Entire Map Spatial Distribution' },
                        responsive: false,
                        tooltips: { callbacks: {
                                        label: function(tooltipItem, data) {
                                                var label = data.datasets[tooltipItem.datasetIndex].label || '';
                                                if (label)
                                                        label += ': ';
                                                label += Math.round(tooltipItem.yLabel * 100) / 100;
                                                return label + ' %';
                                        }
                                }
                        }
                }
        }); 
}

function createLocalCDFChart(ctx){
        const labelText = simRunData.townsByID[ChartMgr.getCurrentlySelected()].name +  ": " + ChartMgr.getRange() + " km CDF Graph";
        return new Chart(ctx, {
                type: 'bar',
                data: {
                        labels: ['0.0 - 0.1', '0.1 - 0.2','0.2 - 0.3','0.3 - 0.4','0.4 - 0.5','0.5 - 0.6',
                         '0.6 - 0.7','0.7 - 0.8','0.8 - 0.9','0.9 - 1.0'],
                        datasets: [{ legend: { display: false, }, backgroundColor: "#90caf9", data: [0], }]
                },
                options: {
                        legend: { display: false },
                        plugins: {
                                datalabels: {
                                        anchor: 'end',
                                        align: 'top',
                                        offset: 4,
                                        color: 'grey',
                                        font: { weight: 'bold' },
                                        formatter: function(value, context) {
                                                return !isNaN(value) ? value.toFixed(2) + ' %' : '- %';
                                        }
                                }
                        },
                        scales: {
                                xAxes: [{
                                        ticks: { min: 0 },
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Fraction of Carrying Capacity (K)'
                                        }
                                }],
                                yAxes: [{
                                        ticks: { beginAtZero: true, min: 0, max: 100 },
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Percent of Bins'
                                        }
                                }]
                        },
                        title: { display: true, fontSize: 16, text: labelText },
                        responsive: false,
                        tooltips: {
                                callbacks: {
                                        label: function(tooltipItem, data) {
                                                var label = data.datasets[tooltipItem.datasetIndex].label || '';
                                                if (label)
                                                        label += ': ';
                                                label += Math.round(tooltipItem.yLabel * 100) / 100;
                                                return label + ' %';
                                        }
                                }
                        }
                }
        });
}

function createOfftakeChart(ctx){
        if(simRunData.towns.length > 1){
                var data = offtakeChartData.total;
                var tempColor = offtakeChartData.total.color;
                var titleText = 'Combined Settlement Offtake';
        } else {
                var data = offtakeChartData.towns[simRunData.towns[0].id]
                var tempColor = offtakeChartData.towns[simRunData.towns[0].id].color;
                var titleText = offtakeChartData.towns[simRunData.towns[0].id].name + ' Offtake';
        }
        
        let xAxisLabels = [];
        for(let i = 1; i <= simRunData.years; i++)
                xAxisLabels.push(i);

        const minTemp = Math.min.apply(Math, data);
        const tickMin = Math.floor(minTemp > 0 ? minTemp * 0.9 : 0.0);
        const maxTemp = Math.max.apply(Math, data);
        const tickMax = Math.ceil(maxTemp * 1.10);
        const stepAmount = (tickMax - tickMin) / 10;

        return new Chart(ctx, {
                type: 'line',
                data: {
                        datasets: [{
                                legend: { display: false },
                                data: data,
                                borderColor: tempColor,
                        }],
                        labels: xAxisLabels
                }, options: {
                        title: { display: true, fontSize: 16, text: titleText },
                        legend: { display: false },
                        plugins: {
                                datalabels: {
                                        anchor: 'end',
                                        align: 'top',
                                        offset: 4,
                                        color: 'black',
                                        font: { weight: 'bold' },
                                        formatter: function() { return ""; }
                                }
                        },
                        scales: { yAxes: [{
                                        ticks: {min: tickMin, max: tickMax, stepSize: stepAmount},
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Hunting Offtake'
                                        }
                                }],
                                xAxes: [{
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Year'
                                        }
                                }]
                        },
                        responsive: false,
                        tooltips: {
                                callbacks: {
                                        title: function(tooltipItem, data){
                                                switch(offtakeSelectedID){
                                                case 'avg':
                                                        return 'Average - Year: ' + tooltipItem[0].xLabel;
                                                case 'total':
                                                        return 'Total - Year: ' + tooltipItem[0].xLabel;
                                                case 'all':
                                                        return simRunData.towns[tooltipItem[0].datasetIndex].name + ' - Year: ' + tooltipItem[0].xLabel;
                                                default:
                                                        return simRunData.townsByID[offtakeSelectedID].name + ' - Year: ' + tooltipItem[0].xLabel;
                                                };
                                        },
                                        label: function(tooltipItem, data) { 
                                                return  '~' + Math.floor(tooltipItem.yLabel) + ' Animals'; 
                                        }
                                }
                        }
                }
        });
}

function createExterpationChart(ctx){
        return new Chart(ctx, {
                type: 'line',
                data: {
                        datasets: [{
                                label: 'Overexploited',
                                data: [0, 20, 40, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
                                borderColor: 'yellow',
                                backgroundColor: 'rgba(0, 0, 0, 0)'
                        }, {
                                label: 'Collapsed',
                                data: [0, 20, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
                                borderColor: 'orange',
                                backgroundColor: 'rgba(0, 0, 0, 0)'
                        }, {
                                label: 'Exterpated',
                                data: [0, 20, 20, 20, 50, 50, 20, 50, 50, 20, 50, 20, 50, 20, 50, 20, 20, 20, 50, 20],
                                borderColor: 'red',
                                backgroundColor: 'rgba(0, 0, 0, 0)'
                        }
                        ],
                        labels: xAxisLabels
                }, options: {
                        scales: { yAxes: [{
                                        ticks: {min: 0, max: 100},
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Percent of Bins'
                                        }
                                }],
                                xAxes: [{
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Distance from Settlement'
                                        }
                                }]
                        },
                        responsive: false,
                        tooltips: {
                                callbacks: {
                                        label: function(tooltipItem, data) {
                                                let label = data.datasets[tooltipItem.datasetIndex].label;
                                                return  tooltipItem.yLabel + '% ' + label;
                                        }
                                }
                        }
                }
        });
}

function populateCDFSelection(){
        $('#graphSettlementSelect').children('option').remove();
        var CDFselector = document.getElementById('graphSettlementSelect');
        for(let settlement in simRunData.towns){
                let option = document.createElement("option");
                option.text = settlement.name;
                option.value = settlement.id;
                CDFselector.add(option);
        }

        ChartMgr._curSettlementID = simRunData.towns[0].id;
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

                ChartMgr._curSettlementID = 'all';
        } else {
                ChartMgr._curSettlementID = simRunData.towns[0].id;
        }

        for(let settlementID in uiData){
                let settlement = uiData[settlementID];
                let option = document.createElement("option");
                option.text = settlement.name;
                option.value = settlement.id;
                offtakeSelector.add(option.cloneNode(true));
        }
        $('#graphSettlementSelect').material_select();
}

function changeOverlayYear(isNext){
        if(isNext && overlayYear != simRunData.years){
                overlayYear += 1;
                drawCanvasToMap(heatMapImages[overlayYear], heatmapLayer);
                drawCanvasToMap(exploitImages[overlayYear], exploitLayer);
                document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;
                if(mouseLastPosition)
                        workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:overlayYear});
        } else if(!isNext && overlayYear > 0){
                overlayYear -= 1;
                drawCanvasToMap(heatMapImages[overlayYear], heatmapLayer);
                drawCanvasToMap(exploitImages[overlayYear], exploitLayer);
                document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;
                if(mouseLastPosition)
                        workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:overlayYear});
        }
}

function overlayAnimation(){
        $('#overlaySaveButton, #mapFullscreenButton').addClass('disabled');
        $('#overlayUpButton, #overlayDownButton, #tabFillerButton').addClass('disabled');
        overlayYear = 0;
        if(mouseLastPosition)
                workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:overlayYear});
        drawCanvasToMap(heatMapImages[overlayYear], heatmapLayer);
        drawCanvasToMap(exploitImages[overlayYear], exploitLayer);
        document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;

        var year = 0;
        var animHandle = setInterval(function(){
                if(year === simRunData.years){
                        clearTimeout(animHandle);
                        $('#overlaySaveButton, #mapFullscreenButton').removeClass('disabled');
                        $('#overlayUpButton, #overlayDownButton, #tabFillerButton').removeClass('disabled');
                        $('#overlayPlayButton').html('Play').removeClass('red').addClass('blue').off('click').click(overlayAnimation);
                } else {
                        changeOverlayYear(true);
                        year++;
                }
        }, 250);

        $('#overlayPlayButton').html('Stop').removeClass('blue').addClass('red').off('click').click(function(){
                clearTimeout(animHandle);
                $('#overlaySaveButton, #mapFullscreenButton').removeClass('disabled');
                $('#overlayUpButton, #overlayDownButton, #tabFillerButton').removeClass('disabled');
                $('#overlayPlayButton').html('Play').removeClass('red').addClass('blue').off('click').click(overlayAnimation);
        });
}

function storeCDFData(location, year, data, id){
        switch(location){
        case 'entire':
                entireAreaData[year] = data;
                /*
                if(year === simRunData.years){
                        createEntireCDFChart();
                        entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
                        entireAreaChart.update();
                }
                */
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
        offtakeChartData = {towns: JSON.parse(data)};
        if(simRunData.towns.length > 1){
                let totalPopData = new Array(simRunData.years);
                for(let i = 0; i < simRunData.years; i++)
                        totalPopData[i] = 0;
                for(key in offtakeChartData.towns)
                        for(let y = 0; y < simRunData.years; y++)
                                totalPopData[y] += offtakeChartData.towns[key][y];

                let avgPopData = new Array(simRunData.years);
                for(let i = 0; i < simRunData.years; i++)
                        avgPopData[i] = totalPopData[i] / simRunData.towns.length;

                offtakeChartData.total = totalPopData;
                offtakeChartData.total.color = getRandomColor();
                offtakeChartData.avg = avgPopData;
                offtakeChartData.avg.color = getRandomColor();
                offtakeSelectedID = 'total';
        } else {
                offtakeSelectedID = simRunData.towns[0].id;
        }

        for(key in offtakeChartData.towns){
                offtakeChartData.towns[key].color = getRandomColor();
        }
}

function changeEntireCDFYear(newYear, chart){
        chart.data.datasets[0].data = entireAreaData[newYear];
        chart.update();
}

function entireCDFAnimation(){
        $('#entireCDFSaveButton, #entireCDFdownYear, #entireCDFupYear').addClass('disabled');
        entireAreaYear = 0;
        entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
        entireAreaChart.update();
        document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + entireAreaYear;
        var year = 0;

        var animHandle = setInterval(function(){
                if(year === simRunData.years){
                        clearTimeout(animHandle);
                        $('#entireCDFSaveButton, #entireCDFdownYear, #entireCDFupYear').removeClass('disabled');
                        $('#entireCDFplayButton').html('Play').removeClass('red').addClass('blue').off('click')
                                                 .click(entireCDFAnimation);
                } else {
                        changeEntireCDFYear(true);
                        year++;
                }
        }, 300);

        $('#entireCDFplayButton').html('Stop').removeClass('blue').addClass('red').off('click').click(function(){
                clearTimeout(animHandle);
                $('#entireCDFSaveButton, #entireCDFdownYear, #entireCDFupYear').removeClass('disabled');
                $('#entireCDFplayButton').html('Play').removeClass('red').addClass('blue').off('click')
                                         .click(entireCDFAnimation);
        });
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
        ChartMgr._curSettlementID = localAreaSelectedID;
        workerThread.postMessage({type:"getSingleCDFData", id:localAreaSelectedID, range:localAreaRange});
        workerThread.postMessage({type:"getSingleCDFPictures", id:localAreaSelectedID, range:localAreaRange});
}

function changeOfftakeSettlement(chart){
        offtakeSelectedID = $("#graphSettlementSelect").val();
        if(offtakeSelectedID == 'all'){
                offtakeChart.data.datasets = [];
                for(key in offtakeChartData.towns){
                        let newDataset = {
                                label: simRunData.townsByID[key].name,
                                backgroundColor: 'rgba(0,0,0,0)',
                                borderColor: offtakeChartData.towns[key].color,
                                data: offtakeChartData.towns[key],
                        }
                        offtakeChart.data.datasets.push(newDataset);
                }

                var titleText = 'All Settlement Offtake';
                var minTemp = Number.MAX_SAFE_INTEGER;
                var maxTemp = 0;
                for(key in offtakeChartData.towns){
                        let minVal = Math.min.apply(Math, offtakeChartData.towns[key]);
                        let maxVal = Math.max.apply(Math, offtakeChartData.towns[key]);
                        minTemp = minVal < minTemp ? minVal : minTemp;
                        maxTemp = maxVal > maxTemp ? maxVal : maxTemp;
                }
        } else {
                if(offtakeSelectedID == 'total' || offtakeSelectedID == 'avg'){
                        var data = offtakeChartData[offtakeSelectedID];
                        var tempColor = offtakeChartData[offtakeSelectedID].color;
                        var titleText = offtakeSelectedID == 'total' ? 'Combined Offtake' : 'Average Offtake';
                } else {
                        var data = offtakeChartData.towns[offtakeSelectedID];
                        var tempColor = offtakeChartData.towns[offtakeSelectedID].color;
                        var titleText = simRunData.townsByID[offtakeSelectedID].name + ' Offtake';
                }

                while(offtakeChart.data.datasets.length > 1)
                        offtakeChart.data.datasets.pop();
                offtakeChart.data.datasets[0].data = data;
                offtakeChart.data.datasets[0].borderColor = tempColor;
                var minTemp = Math.min.apply(Math, data);
                var maxTemp = Math.max.apply(Math, data);
        }

        const tickMin = Math.floor(minTemp * 0.9);
        const tickMax = Math.ceil(maxTemp * 1.10);
        const stepAmount = Math.floor((tickMax - tickMin) / 10);
        offtakeChart.options.scales.yAxes[0].ticks.min = tickMin;
        offtakeChart.options.scales.yAxes[0].ticks.max = tickMax;
        offtakeChart.options.scales.yAxes[0].ticks.stepSize = stepAmount;
        offtakeChart.options.title.text = titleText;
        offtakeChart.update();
}

function csvSingleYear(){
        let yearNum = document.getElementById("csvNumberInput").value;
        console.log("csvSingleYear year: " + yearNum);
        workerThread.postMessage({type:"singleYearCSV", year:yearNum,});
}

function saveSingleCSV(data, year){
        var jsonBlob = new Blob([data], {type: "text/csv"});
        saveAs(jsonBlob, simRunData.simName + "_year" + year + "data.csv");
}

function csvAllYears(){
        csvStrings = [];
        workerThread.postMessage({type:"allYearsCSV", year:0,});
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
                });
        }
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
        function randomChannel(brightness){
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

        if(heatmapLayer.getSource()){
                heatmapLayer.getSource().refresh();

        }
        
        map.updateSize();
}