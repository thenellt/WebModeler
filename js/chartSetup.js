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
        let xAxisLabels = [];
        for(let i = 1; i <= simRunData.years; i++)
                xAxisLabels.push(i);

        return new Chart(ctx, {
                type: 'line',
                data: {
                        datasets: [{legend: { display: false },}],
                        labels: xAxisLabels
                }, options: {
                        title: { display: true, fontSize: 16,},
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
                        scales: { yAxes: [{scaleLabel: {
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
                                                const selected = ChartMgr.getCurrentlySelected();
                                                switch(selected){
                                                case 'avg':
                                                        return 'Average - Year: ' + tooltipItem[0].xLabel;
                                                case 'total':
                                                        return 'Total - Year: ' + tooltipItem[0].xLabel;
                                                case 'all':
                                                        return simRunData.towns[tooltipItem[0].datasetIndex].name + ' - Year: ' + tooltipItem[0].xLabel;
                                                default:
                                                        return simRunData.townsByID[selected].name + ' - Year: ' + tooltipItem[0].xLabel;
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

function createCPUEchart(ctx){
        let xAxisLabels = [];
        for(let i = 1; i <= simRunData.years; i++)
                xAxisLabels.push(i);

        return new Chart(ctx, {
                type: 'line',
                data: {
                        datasets: [{legend: { display: false },}],
                        labels: xAxisLabels
                }, options: {
                        title: { display: true, fontSize: 16,},
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
                                        scaleLabel: {
                                                display: true,
                                                fontSize: 12,
                                                labelString: 'Animal offtake per km walked'
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
                                                const selected = ChartMgr.getCurrentlySelected();
                                                switch(selected){
                                                case 'avg':
                                                        return 'Average - Year: ' + tooltipItem[0].xLabel;
                                                case 'all':
                                                        return simRunData.towns[tooltipItem[0].datasetIndex].name + ' - Year: ' + tooltipItem[0].xLabel;
                                                default:
                                                        return simRunData.townsByID[selected].name + ' - Year: ' + tooltipItem[0].xLabel;
                                                };
                                        },
                                        label: function(tooltipItem, data) { 
                                                return  '~' + tooltipItem.yLabel.toFixed(3) + ' CPUE'; 
                                        }
                                }
                        }
                }
        });
}