var csvStrings;
var entireAreaChart;
var entireAreaData;
var entireAreaYear;
var localAreaChart;
var localAreaData;
var localAreaYear;
var localAreaSelectedID;
var heatMapYear;
var heatMapImages;

function setupOutputRanges(){
        heatMapYear = simData.years;
        document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        document.getElementById("entireCDFYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        document.getElementById("singleCDFYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        document.getElementById("rawHeatmapYear").max = simData.years;
        document.getElementById("rawHeatmapYear").value = simData.years;
        document.getElementById("csvNumberInput").max = simData.years;
        entireAreaYear = simData.years;
        localAreaYear = simData.years;
}

Chart.plugins.register({
        beforeDraw: function(c) {
                var ctx = c.chart.ctx;
                ctx.fillStyle = "#eceff1";
                ctx.fillRect(0, 0, c.chart.width, c.chart.height);
        }
});

function createEntireCDFChart(densities){
        let ctx = document.getElementById('entireMapChart').getContext('2d');
        let color = Chart.helpers.color;
        entireAreaChart = new Chart(ctx, {
                type: 'bar',
                data: {
                        labels: ['0.0 - 0.1', '0.1 - 0.2','0.2 - 0.3','0.3 - 0.4','0.4 - 0.5','0.5 - 0.6',
                         '0.6 - 0.7','0.7 - 0.8','0.8 - 0.9','0.9 - 0.99','> 0.99'],
                        datasets: [{
                                legend: {
                                        display: false,
                                },
                                backgroundColor: "#90caf9",
                                data: densities,
                        }]
                },
                options: {
                        legend: { 
                                display: false 
                        },
                        plugins: {
                                datalabels: {
                                        anchor: 'end',
                                        align: 'top',
                                        offset: 4,
                                        color: 'grey',
                                        font: {
                                                weight: 'bold'
                                        },
                                        formatter: function(value, context) {
                                                return value.toFixed(2) + ' %';
                                        }
                                }
                        },
                        scales: {
                                xAxes: [{
                                        ticks: {
                                                min: 0
                                        },
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Fraction of Carrying Capacity (K)'
                                        }
                                }],
                                yAxes: [{
                                        ticks: {
                                                beginAtZero: true,
                                                min: 0,
                                                max: 100
                                        },
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Percent of Bins'
                                        }
                                }]
                        },
                        title: {
                                display: true,
                                fontSize: 16,
                                text: 'Entire Map CDF Graph'
                        },
                        responsive: false,
                        tooltips: {
                                callbacks: {
                                        label: function(tooltipItem, data) {
                                                var label = data.datasets[tooltipItem.datasetIndex].label || '';
                    
                                                if (label) {
                                                        label += ': ';
                                                }
                                                label += Math.round(tooltipItem.yLabel * 100) / 100;
                                                return label + ' %';
                                        }
                                }
                        }
                }
        }); 
}

function downloadGraph(containerID){
        if(containerID === "entireMapChart"){
                var name = "entireMapCDF_year" + entireAreaYear + ".png";
        } else if(containerID === "entireMapChart"){
                var name = "";
        }
        $('#' + containerID).get(0).toBlob(function(blob) {
                saveAs(blob, name);
        });
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

function populateCDFSelection(selectorID){
        var selector = document.getElementById(selectorID);
        for(let settlementID in uiData){
                let settlement = uiData[settlementID];
                let option = document.createElement("option");
                option.text = settlement.name;
                option.value = settlement.id;
                selector.add(option);
        }

        $('#' + selectorID).material_select();
}

function setupOpacitySlider(){
        document.getElementById("opacitySlider").value = simData.opacity * 100;
        document.getElementById("opacityLabel").innerHTML = "Overlay Opacity: " + simData.opacity * 100  + "%";
}

function changeHeatmapOverlayYear(isNext){
        if(isNext && heatMapYear != simResults.years){
                heatMapYear += 1;
                drawCanvasToMap(heatMapYear);
                document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        } else if(!isNext && heatMapYear > 0){
                heatMapYear -= 1;
                drawCanvasToMap(heatMapYear);
                document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        }
}

function heatmapOverlayAnimation(year){
        if(year === 0){
                $('#overlaySaveButton').addClass('disabled');
                heatMapYear = 0;
                drawCanvasToMap(heatMapYear);
                document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        } else{
                changeHeatmapOverlayYear(true);
        }

        if(year < simResults.duration)
                setTimeout(heatmapOverlayAnimation, 250, year + 1);
        else
                $('#overlaySaveButton').removeClass('disabled');
}

function storeCDFData(location, year, data, id){
        console.log("storeCDFData:: location: " + location + " year: " + year);
        console.log(data);
        switch(location){
        case 'entire':
                entireAreaData[year] = data;
                if(year === simData.years){
                        createEntireCDFChart(entireAreaData[year]);
                }
                break;
        case 'single':
                localAreaData[year][id] = data;
                if(year === simData.years && id === localAreaSelectedID){
                        localAreaYear = simData.years - 1;
                        changeLocalCDFYear(true, localAreaSelectedID);
                }
                break;
        }
}

function changeEntireCDFYear(isNext){
        if(isNext && entireAreaYear != simResults.years){
                entireAreaYear += 1;
                entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
                entireAreaChart.update();
                document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + entireAreaYear;
        } else if(!isNext && entireAreaYear > 0){
                entireAreaYear -= 1;
                entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
                entireAreaChart.update();
                document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + entireAreaYear;
        }
}

function entireCDFAnimation(year){
        if(year === 0){
                $('#entireCDFSaveButton').addClass('disabled');
                entireAreaYear = 0;
                entireAreaChart.data.datasets[0].data = entireAreaData[entireAreaYear];
                entireAreaChart.update();
                document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + heatMapYear;
        } else{
                changeEntireCDFYear(true);
        }

        if(year < simResults.duration)
                setTimeout(entireCDFAnimation, 250, year + 1);
        else
                $('#entireCDFSaveButton').removeClass('disabled');
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
