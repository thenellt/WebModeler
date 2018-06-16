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
var heatMapYear;
var heatMapImages;

function setupOutputRanges(){
        heatMapYear = simRunData.years;
        document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + heatMapYear;
        document.getElementById("singleCDFYearLabel").innerHTML = "Simulation Year: " + heatMapYear;
        document.getElementById("rawHeatmapYear").max = simRunData.years;
        document.getElementById("rawHeatmapYear").value = simRunData.years;
        document.getElementById("csvNumberInput").max = simRunData.years;
        entireAreaYear = simRunData.years;
        localAreaYear = simRunData.years;
        localAreaRange = simRunData.huntRange;
        localAreaSelectedID = uiData[Object.keys(uiData)[0]].id;
        localAreaPictures = new Array(simRunData.years + 1);
        document.getElementById("singleCDFRangeLabel").innerHTML = "Range: " + localAreaRange + " km";
}

Chart.plugins.register({
        beforeDraw: function(c) {
                var ctx = c.chart.ctx;
                ctx.fillStyle = "#eceff1";
                ctx.fillRect(0, 0, c.chart.width, c.chart.height);
        }
});

function createEntireCDFChart(){
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
                                data: [0],
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

function createLocalCDFChart(){
        for(let i = 0; i < simRunData.towns.length; i++)
                if(simRunData.towns[i].id === localAreaSelectedID)
                        var labelText = simRunData.towns[i].name +  ": " + localAreaRange + " km CDF Graph";
        let ctx = document.getElementById('localAreaCDF').getContext('2d');
        let color = Chart.helpers.color;
        localAreaChart = new Chart(ctx, {
                type: 'bar',
                data: {
                        labels: ['0.0 - 0.1', '0.1 - 0.2','0.2 - 0.3','0.3 - 0.4','0.4 - 0.5','0.5 - 0.6',
                         '0.6 - 0.7','0.7 - 0.8','0.8 - 0.9','0.9 - 0.99','> 0.99'],
                        datasets: [{
                                legend: {
                                        display: false,
                                },
                                backgroundColor: "#90caf9",
                                data: [0],
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
                                text: labelText
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

function rawHWScaleInput(value){
        const newWidth = simResults.xSize * (value / 100);
        const newHeight = simResults.ySize * (value / 100);

        document.getElementById('heatmapScaleText').innerHTML = "Image Resolution: " + newWidth + "px by " + newHeight + "px";
}

function populateCDFSelection(selectorID){
        $('#' + selectorID).children('option').remove();
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
        document.getElementById("opacitySlider").value = simRunData.opacity * 100;
        document.getElementById("opacityLabel").innerHTML = "Overlay Opacity: " + simRunData.opacity * 100  + "%";
}

function changeHeatmapOverlayYear(isNext){
        if(isNext && heatMapYear != simRunData.years){
                heatMapYear += 1;
                drawCanvasToMap(heatMapYear);
                document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
                if(mouseLastPosition)
                        workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:heatMapYear});
        } else if(!isNext && heatMapYear > 0){
                heatMapYear -= 1;
                drawCanvasToMap(heatMapYear);
                document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
                if(mouseLastPosition)
                        workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:heatMapYear});
        }
}

function heatmapOverlayAnimation(year){
        if(year === 0){
                $('#overlaySaveButton').addClass('disabled');
                heatMapYear = 0;
                if(mouseLastPosition)
                        workerThread.postMessage({type:"mouseKCheck", pos:mouseLastPosition, year:heatMapYear});
                drawCanvasToMap(heatMapYear);
                document.getElementById("heatmapYearLabel").innerHTML = "Heatmap Year: " + heatMapYear;
        } else{
                changeHeatmapOverlayYear(true);
        }

        if(year < simRunData.years)
                setTimeout(heatmapOverlayAnimation, 250, year + 1);
        else
                $('#overlaySaveButton').removeClass('disabled');
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
                        for(let i = 0; i < simRunData.towns.length; i++)
                                if(simRunData.towns[i].id === localAreaSelectedID)
                                        var labelText = simRunData.towns[i].name +  ": " + localAreaRange + " km CDF Graph";
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
        let canvasImage = new Image();
        canvasImage.id = 'image' + data.year;

        if(data.year === localAreaYear){
                canvasImage.onload = function(){
                        localAreaPictures[data.year] = canvasImage;
                        setLocalCDFPicture();
                }
        } else{
                canvasImage.onload = function(){
                        localAreaPictures[data.year] = canvasImage;
                } 
        }

        canvasImage.src = canvas.toDataURL();
}

function changeEntireCDFYear(isNext){
        if(isNext && entireAreaYear != simRunData.years){
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
                document.getElementById("entireCDFYearLabel").innerHTML = "Simulation Year: " + entireAreaYear;
        } else{
                changeEntireCDFYear(true);
        }

        if(year === 0) 
                setTimeout(entireCDFAnimation, 1000, year + 1);
        else if(year < simRunData.years)
                setTimeout(entireCDFAnimation, 250, year + 1);
        else
                $('#entireCDFSaveButton').removeClass('disabled');
}

function changeLocalCDFRange(isNext){
        if(isNext && localAreaRange < simData.huntRange * 2 + simData.boundryWidth - 2){
                localAreaRange += 1;
                workerThread.postMessage({type:"getSingleCDFData", id:localAreaSelectedID, range:localAreaRange});
                workerThread.postMessage({type:"getSingleCDFPictures", id:localAreaSelectedID, range:localAreaRange});
                document.getElementById("singleCDFRangeLabel").innerHTML = "Range: " + localAreaRange + " km";
        } else if(!isNext && localAreaRange > 1){
                localAreaRange -= 1;
                workerThread.postMessage({type:"getSingleCDFData", id:localAreaSelectedID, range:localAreaRange});
                workerThread.postMessage({type:"getSingleCDFPictures", id:localAreaSelectedID, range:localAreaRange});
                document.getElementById("singleCDFRangeLabel").innerHTML = "Range: " + localAreaRange + " km";
        }
}

function changeLocalCDFYear(isNext){
        if(isNext && localAreaYear != simRunData.years){
                localAreaYear += 1;
                setLocalCDFPicture();
                localAreaChart.data.datasets[0].data = localAreaData[localAreaSelectedID][localAreaYear];
                localAreaChart.update();
                document.getElementById("singleCDFYearLabel").innerHTML = "Simulation Year: " + localAreaYear;
        } else if(!isNext && localAreaYear > 0){
                localAreaYear -= 1;
                setLocalCDFPicture();
                localAreaChart.data.datasets[0].data = localAreaData[localAreaSelectedID][localAreaYear];
                localAreaChart.update();
                document.getElementById("singleCDFYearLabel").innerHTML = "Simulation Year: " + localAreaYear;
        }
}

function setLocalCDFPicture(){
        let canvasImage = localAreaPictures[localAreaYear]; 
        canvasImage.classList.add('localCDFImage');
        let container = document.getElementById('localAreaCDFPicture');
        if(container.firstChild)
                container.removeChild(container.firstChild);
        container.appendChild(canvasImage);
}

function localCDFAnimation(year){
        if(year === 0){
                $('#singleCDFSaveButton').addClass('disabled');
                $('#localCDFdownRange').addClass('disabled');
                $('#localCDFupRange').addClass('disabled');
                $('#localCDFdownYear').addClass('disabled');
                $('#localCDFupYear').addClass('disabled');
                $('#CDFSetSelection').attr("disabled", "");
                localAreaYear = 0;
                setLocalCDFPicture();
                localAreaChart.data.datasets[0].data = localAreaData[localAreaSelectedID][localAreaYear];
                localAreaChart.update();
                document.getElementById("singleCDFYearLabel").innerHTML = "Simulation Year: " + localAreaYear;
        } else{
                changeLocalCDFYear(true);
        }

        if(year === 0) 
                setTimeout(localCDFAnimation, 1000, year + 1);
        else if(year < simRunData.years)
                setTimeout(localCDFAnimation, 500, year + 1);
        else{
                $('#singleCDFSaveButton').removeClass('disabled');
                $('#localCDFdownRange').removeClass('disabled');
                $('#localCDFupRange').removeClass('disabled');
                $('#localCDFdownYear').removeClass('disabled');
                $('#localCDFupYear').removeClass('disabled');
                $('#CDFSetSelection').removeAttr("disabled");
                $('#CDFSetSelection').material_select();
        }
}

function changeCDFSettlement(){
        let value = $("#CDFSetSelection").val();
        localAreaSelectedID = parseInt(value, 10);
        workerThread.postMessage({type:"getSingleCDFData", id:localAreaSelectedID, range:localAreaRange});
        workerThread.postMessage({type:"getSingleCDFPictures", id:localAreaSelectedID, range:localAreaRange});
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
        }
        else if(csvStrings.length === simRunData.years + 1){
                var zip = new JSZip();
                for(let i = 0; i < csvStrings.length; i++){
                        zip.file(simRunData.simName + "_year" + i + "data.csv", csvStrings[i]);
                }

                zip.generateAsync({type:"blob"}).then(function(content) {
                        saveAs(content, simRunData.simName + "_csvData.zip");
                });
        }
}
