var csvStrings;
var entireAreaChart;
var entireAreaData;
var entireAreaYear;
var localAreaChart;
var localAreaData;
var localAreaPictures;
var localAreaYear;
var localAreaSelectedID;
var localAreaRange;
var offtakeChart;
var offtakeChartData;
var offtakeSelectedID;
var overlayYear;
var overlayAnimationHandle;
var heatMapImages;
var simPosition;
var exploitImages;

function setupResultsPages(){
        overlayYear = simRunData.years;
        document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;
        document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + overlayYear;
        document.getElementById("singleCDFYearLabel").innerHTML = "Simulation Year: " + overlayYear;
        document.getElementById("csvNumberInput").max = simRunData.years;
        entireAreaYear = localAreaYear = simRunData.years;
        offtakeSelectedID = 'all';
        localAreaRange = simRunData.huntRange;
        localAreaSelectedID = uiData[Object.keys(uiData)[0]].id;
        localAreaPictures = new Array(simRunData.years + 1);
        document.getElementById("singleCDFRangeLabel").innerHTML = "Radius: " + localAreaRange + " km";
        document.getElementById("heatmapOpacitySlider").value = simRunData.opacity * 100;
        $("#overlayPlayButton").attr("onclick","overlayAnimation(0, false)");
}

function populateOtherInfo(){
        let timeString = simulationTime > 1000 ? (simulationTime / 1000).toFixed(2) + ' s' : simulationTime + ' ms';
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
        const title = "Performance Details";
        let body = "<table>";
        for(let i = 0; i < simResults.perfData.length; i++){
                body += "<tr><td style='padding: 0;'>Year " + (i + 1) + "</td>";
                body += "<td style='padding: 0;'>" + simResults.perfData[i].toFixed(2) + " ms </td></tr>";
        }
        body += "<tr><td style='padding: 0;'>Visualization Time</td>";
        body += "<td style='padding: 0;'>" + simResults.visTime.toFixed(2) + " ms </td></tr>";
        body += "</table>";
        modalDialog(title, body);
}

Chart.plugins.register({
        beforeDraw: function(c) {
                var ctx = c.chart.ctx;
                ctx.fillStyle = "#eceff1";
                ctx.fillRect(0, 0, c.chart.width, c.chart.height);
        }
});

function createEntireCDFChart(){
        if(entireAreaChart){
                entireAreaChart.destroy();
                document.getElementById('entireMapChart').width = 800;
                document.getElementById('entireMapChart').height = 400;
        }
        let ctx = document.getElementById('entireMapChart').getContext('2d');
        entireAreaChart = new Chart(ctx, {
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

function createLocalCDFChart(){
        var labelText = simRunData.townsByID[localAreaSelectedID].name +  ": " + localAreaRange + " km CDF Graph";

        if(localAreaChart){
                localAreaChart.destroy();
                document.getElementById('localAreaCDF').width = 800;
                document.getElementById('localAreaCDF').height = 400;
        }
        let ctx = document.getElementById('localAreaCDF').getContext('2d');
        localAreaChart = new Chart(ctx, {
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

function createOfftakeChart(){
        if(simRunData.towns.length > 1){
                var data = offtakeChartData.total;
                var tempColor = offtakeChartData.total.color;
                var titleText = 'Combined Settlement Offtake';
        } else {
                var data = offtakeChartData.towns[simRunData.towns[0].id]
                var tempColor = offtakeChartData.towns[simRunData.towns[0].id].color;
                var titleText = offtakeChartData.towns[simRunData.towns[0].id].name + ' Offtake';
        }
        
        let ctx = document.getElementById('offtakeChart').getContext('2d');
        let xAxisLabels = [];
        for(let i = 1; i <= simRunData.years; i++)
                xAxisLabels.push(i);

        const minTemp = Math.min.apply(Math, data);
        const tickMin = Math.floor(minTemp > 0 ? minTemp * 0.9 : 0.0);
        const maxTemp = Math.max.apply(Math, data);
        const tickMax = Math.ceil(maxTemp * 1.10);
        const stepAmount = (tickMax - tickMin) / 10;

        if(offtakeChart){
                offtakeChart.destroy();
                document.getElementById('offtakeChart').width = 800;
                document.getElementById('offtakeChart').height = 400;
        }
        offtakeChart = new Chart(ctx, {
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

function createExterpationChart(){
        exterpationChart = new Chart(ctx, {
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

function downloadGraph(containerID){
        if(containerID === "entireMapChart"){
                var name = "entireMapCDF_year_" + entireAreaYear + ".png";
        } else if(containerID === "localAreaCDF") {
                var name = "localAreaCDF_year_" + localAreaYear + ".png";
        } else if(containerID === "offtakeChart") {
                for(let i = 0; i < simResults.townData.length; i++)
                        if(simResults.townData[i].id = offtakeSelectedID)
                                var vName = simResults.townData[i].name;
                var name = vName + "_offtake.png";
        }
        $('#' + containerID).get(0).toBlob(function(blob){
                saveAs(blob, name);
        });
}

function populateSelectionsFields(){
        $('#CDFSetSelection').children('option').remove();
        $('#offtakeSetSelection').children('option').remove();
        var CDFselector = document.getElementById('CDFSetSelection');
        var offtakeSelector = document.getElementById('offtakeSetSelection');

        if(simRunData.towns.length > 1){
                let option3 = document.createElement("option");
                option3.text = 'Combined Totals';
                option3.value = 'total';
                offtakeSelector.add(option3);

                let option2 = document.createElement("option");
                option2.text = 'Combined Average';
                option2.value = 'avg';
                offtakeSelector.add(option2);

                let option1 = document.createElement("option");
                option1.text = 'All Settlements';
                option1.value = 'all';
                offtakeSelector.add(option1);
        }

        for(let settlementID in uiData){
                let settlement = uiData[settlementID];
                let option = document.createElement("option");
                option.text = settlement.name;
                option.value = settlement.id;
                CDFselector.add(option);
                offtakeSelector.add(option.cloneNode(true));
        }

        $('#CDFSetSelection').material_select();
        $('#offtakeSetSelection').material_select();
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

function overlayAnimation(year, stop){
        if(stop){
                clearTimeout(overlayAnimationHandle);
                $('#overlaySaveButton, #mapFullscreenButton').removeClass('disabled');
                $('#overlayUpButton, #overlayDownButton, #overlaySelectionBtn').removeClass('disabled');
                $('#overlayPlayButton').html('Play').removeClass('red').addClass('blue')
                        .attr("onclick","overlayAnimation(0, false)");
                overlayAnimationHandle = false;
                return;
        }
        if(year === 0){
                $('#overlaySaveButton, #mapFullscreenButton').addClass('disabled');
                $('#overlayUpButton, #overlayDownButton, #overlaySelectionBtn').addClass('disabled');
                $('#overlayPlayButton').html('Stop').removeClass('blue').addClass('red')
                        .attr("onclick","overlayAnimation(0, true)");
                overlayYear = 0;
                if(mouseLastPosition)
                        workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:overlayYear});
                drawCanvasToMap(heatMapImages[overlayYear], heatmapLayer);
                drawCanvasToMap(exploitImages[overlayYear], exploitLayer);
                document.getElementById("overlayYearLabel").innerHTML = "Overlay Year: " + overlayYear;
        } else {
                changeOverlayYear(true);
        }

        if(year < simRunData.years){
                overlayAnimationHandle = setTimeout(overlayAnimation, 250, year + 1);
        } else {
                $('#overlaySaveButton, #mapFullscreenButton').removeClass('disabled');
                $('#overlayUpButton, #overlayDownButton, #overlaySelectionBtn').removeClass('disabled');
                $('#overlayPlayButton').html('Play').removeClass('red').addClass('blue')
                        .attr("onclick","overlayAnimation(0, false)");
                overlayAnimationHandle = false;
        }
}

function storeCDFData(location, year, data, id){
        switch(location){
        case 'entire':
                entireAreaData[year] = data;
                if(year === simRunData.years){
                        createEntireCDFChart();
                        entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
                        entireAreaChart.update();
                }
                break;
        case 'single':
                localAreaData[id] = data;
                if(id === localAreaSelectedID){
                        if(!localAreaChart)
                                createLocalCDFChart();
                        localAreaChart.data.datasets[0].data = localAreaData[localAreaSelectedID][localAreaYear];
                        var labelText = simRunData.townsByID[localAreaSelectedID].name +  ": " + localAreaRange + " km Spatial Distribution";
                        localAreaChart.options.title.text = labelText;
                        localAreaChart.update();
                }
                break;
        }
}

function storeLocalCDFPictures(data){
        let canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        let scale = 5;
        canvas.width = data.x * scale;
        canvas.height = data.y * scale;
        let picData = new ImageData(data.array, data.x * scale, data.y * scale);
        ctx.putImageData(picData, 0, 0);

        if(data.year === localAreaYear){
                localAreaPictures[data.year] = canvas.toDataURL();;
                setLocalCDFPicture();
        } else {
                localAreaPictures[data.year] = canvas.toDataURL();;
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

        createOfftakeChart();
}

function changeEntireCDFYear(isNext){
        if(isNext && entireAreaYear != simRunData.years){
                entireAreaYear += 1;
                entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
                entireAreaChart.update();
                document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + entireAreaYear;
        } else if(!isNext && entireAreaYear > 0) {
                entireAreaYear -= 1;
                entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
                entireAreaChart.update();
                document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + entireAreaYear;
        }
}

function entireCDFAnimation(year){
        if(year === 0){
                $('#entireCDFSaveButton').addClass('disabled');
                $('#entireCDFdownYear').addClass('disabled');
                $('#entireCDFupYear').addClass('disabled');
                $('#entireCDFplayButton').addClass('disabled');
                entireAreaYear = 0;
                entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
                entireAreaChart.update();
                document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + entireAreaYear;
        } else {
                changeEntireCDFYear(true);
        }

        if(year === 0) 
                setTimeout(entireCDFAnimation, 1000, year + 1);
        else if(year < simRunData.years)
                setTimeout(entireCDFAnimation, 250, year + 1);
        else{
                $('#entireCDFSaveButton').removeClass('disabled');
                $('#entireCDFdownYear').removeClass('disabled');
                $('#entireCDFupYear').removeClass('disabled');
                $('#entireCDFplayButton').removeClass('disabled');
        }
}

function changeLocalCDFRange(isNext){
        if(isNext && localAreaRange < simRunData.huntRange * 2 + simRunData.boundryWidth - 2){
                localAreaRange += 1;
                workerThread.postMessage({type:"getSingleCDFData", id:localAreaSelectedID, range:localAreaRange});
                workerThread.postMessage({type:"getSingleCDFPictures", id:localAreaSelectedID, range:localAreaRange});
                document.getElementById("singleCDFRangeLabel").innerHTML = "Radius: " + localAreaRange + " km";
        } else if(!isNext && localAreaRange > 1){
                localAreaRange -= 1;
                workerThread.postMessage({type:"getSingleCDFData", id:localAreaSelectedID, range:localAreaRange});
                workerThread.postMessage({type:"getSingleCDFPictures", id:localAreaSelectedID, range:localAreaRange});
                document.getElementById("singleCDFRangeLabel").innerHTML = "Radius: " + localAreaRange + " km";
        }
}

function changeLocalCDFYear(isNext){
        if(isNext && localAreaYear != simRunData.years){
                localAreaYear += 1;
                setLocalCDFPicture();
                localAreaChart.data.datasets[0].data = localAreaData[localAreaSelectedID][localAreaYear];
                localAreaChart.update();
                document.getElementById("singleCDFYearLabel").innerHTML = "Simulation Year: " + localAreaYear;
        } else if(!isNext && localAreaYear > 0) {
                localAreaYear -= 1;
                setLocalCDFPicture();
                localAreaChart.data.datasets[0].data = localAreaData[localAreaSelectedID][localAreaYear];
                localAreaChart.update();
                document.getElementById("singleCDFYearLabel").innerHTML = "Simulation Year: " + localAreaYear;
        }
}

function setLocalCDFPicture(){
        //let picData = new ImageData(data.array, data.x * scale, data.y * scale);
        //ctx.putImageData(picData, 0, 0);
        let canvasImage = new Image();
        canvasImage.onload = function(){
                canvasImage.classList.add('localCDFImage');
                let container = document.getElementById('localAreaCDFPicture');
                if(container.firstChild)
                        container.removeChild(container.firstChild);
                container.appendChild(canvasImage);
        };

        canvasImage.src = localAreaPictures[localAreaYear];
}

function localCDFAnimation(year){
        if(year === 0){
                $('#singleCDFSaveButton, #localCDFdownRange, #localCDFplayButton').addClass('disabled');
                $('#localCDFupRange, #localCDFdownYear, #localCDFupYear').addClass('disabled');
                $('#CDFSetSelection').attr("disabled", "");
                $('#CDFSetSelection').material_select();
                localAreaYear = 0;
                setLocalCDFPicture();
                localAreaChart.data.datasets[0].data = localAreaData[localAreaSelectedID][localAreaYear];
                localAreaChart.update();
                document.getElementById("singleCDFYearLabel").innerHTML = "Simulation Year: " + localAreaYear;
                setTimeout(localCDFAnimation, 1000, year + 1);
        } else {
                changeLocalCDFYear(true);
                if(year < simRunData.years){
                        setTimeout(localCDFAnimation, 350, year + 1);
                } else {
                        $('#singleCDFSaveButton, #localCDFdownRange, #localCDFplayButton').removeClass('disabled');
                        $('#localCDFupRange, #localCDFdownYear, #localCDFupYear').removeClass('disabled');
                        $('#CDFSetSelection').removeAttr('disabled');
                        $('#CDFSetSelection').material_select();
                }
        }
}

function changeCDFSettlement(){
        let value = $("#CDFSetSelection").val();
        localAreaSelectedID = parseInt(value, 10);
        workerThread.postMessage({type:"getSingleCDFData", id:localAreaSelectedID, range:localAreaRange});
        workerThread.postMessage({type:"getSingleCDFPictures", id:localAreaSelectedID, range:localAreaRange});
}

function changeOfftakeSettlement(){
        offtakeSelectedID = $("#offtakeSetSelection").val();
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
        if(simulationRun){
                localAreaChart.update();
                entireAreaChart.update();
                offtakeChart.update();
        }
        if(bingLayers[0]){
                bingLayers[0].getSource().refresh();
                bingLayers[1].getSource().refresh();
        }

        if(heatmapLayer.getSource()){
                heatmapLayer.getSource().refresh();

        }
        
        map.updateSize();
}