class chartMgr {
        constructor(){
                this._currentConfigType = '';
                this._currentConfig = '';
                this._currentYear = -1;
                this._resultsChart = '';
                this._colors = {};
                this._configs = [];
                this._controls = ['#graphSelectContainer', '#graphRangeContainer', '#graphYearContainer'];
                this._animElmnts = '#graphSaveBtn, #graphDecRange, #graphIncRange, #graphDecYear, #graphIncYear, #tabFillerButton';
                $("#graphPlayBtn").off('click').click(function(){ChartMgr.playAnimation();});
        }

        register(name, config){
                this._configs[name] = config;
        }

        changeYear(isNext){
                if(isNext && (this._currentYear + 1) <= simRunData.years){
                        this._currentYear += 1;
                        $('#graphYearLabel').html("Simulation Year: " + this._currentYear);
                        this._currentConfig.changeYear(this._currentYear, this._resultsChart);
                } else if(!isNext && (this._currentYear - 1) >= 0) {
                        this._currentYear -= 1;
                        $('#graphYearLabel').html("Simulation Year: " + this._currentYear);
                        this._currentConfig.changeYear(this._currentYear, this._resultsChart);
                }
        }

        changeSelected(){
                this._currentConfig.changeSelection();
        }

        changeRange(isNext){
                if(isNext && (this._currentConfig.range + 1) <= this._currentConfig.rangeMax){
                        this._currentConfig.range += 1;
                        this._currentConfig.rangeFnc(this._currentConfig.range);
                } else if(!isNext && (this._currentConfig.range - 1) >= this._currentConfig.rangeMin){
                        this._currentConfig.range -= 1;
                        this._currentConfig.rangeFnc(this._currentConfig.range);
                }
        }

        changeChart(){
                const chartName = $("#graphTypeSelector").val();
                this._currentConfigType = chartName;
                this._currentConfig = this._configs[chartName];
                let chartElement = document.getElementById('resultsGraph');
                $('#graphTypeTitle').html(this._currentConfig.title);
                $('#graphHelpText').html(this._currentConfig.helpText);

                if(this._currentConfig.setupSelect)
                        this._currentConfig.setupSelect();
                for(const ctrl in this._currentConfig.uiModules){
                        if(this._currentConfig.uiModules[ctrl]){
                                $(this._controls[ctrl]).css('visibility', 'visible');
                        } else {
                                $(this._controls[ctrl]).css('visibility', 'hidden');
                        }
                }

                if(this._resultsChart)
                        this._resultsChart.destroy();

                if(this._currentConfig.isSplit){
                        $('#localAreaPictureContainer').css('display', 'inline-block');
                        chartElement.width = 550;
                        chartElement.height = 500;
                } else {
                        $('#localAreaPictureContainer').css('display', 'none');
                        chartElement.width = 800;
                        chartElement.height = 500;
                }
                let ctx = chartElement.getContext('2d');
                this._resultsChart = this._currentConfig.createGraph(ctx);
                if(this._currentConfig.changeSelection){
                        this.changeSelected();
                } else if(this._currentConfig.changeYear){
                        this._currentYear -= 1;
                        this.changeYear(true);
                }
        }

        playAnimation(){
                $(this._animElmnts).addClass('disabled');
                $('#graphSettlementSelect, #graphTypeSelector').attr("disabled", "");
                $('#graphSettlementSelect, #graphTypeSelector').material_select();
                tabManager.disableAll();
                this._currentYear = -1;
                this.changeYear(true);

                var animHandle;
                var endFnc = function(){
                        clearTimeout(animHandle);
                        $(ChartMgr._animElmnts).removeClass('disabled');
                        $('#graphSettlementSelect, #graphTypeSelector').removeAttr('disabled');
                        $('#graphSettlementSelect, #graphTypeSelector').material_select();
                        tabManager.enableAll();
                        $('#graphPlayBtn').html('Play').removeClass('red').addClass('blue').off('click')
                                                .click(function(){ChartMgr.playAnimation();});
                }

                animHandle = setInterval(function(){
                        if(ChartMgr._currentYear === simRunData.years){
                                endFnc();
                        } else {
                                ChartMgr.changeYear(true);
                        }
                }, 350);

                $('#graphPlayBtn').html('Stop').removeClass('blue').addClass('red').off('click').click(endFnc);
        }

        saveImg(){
                const selected = this._currentConfig.selected;
                var name;
                switch(this._currentConfigType){
                case "Entire Map CDF":
                        name = "year" + this._currentYear + "_entireMapCDF.png";
                        break;
                case "Local CDF":
                        name = simRunData.townsByID[this._currentConfig.selected].name + "_year" + this._currentYear;
                        name += "_range" + this._currentConfig.range + "_localCDF.png"
                        break;
                case "Settlement Offtake":
                        name = selected in simRunData.townsByID ? simRunData.townsByID[selected].name : selected;
                        name += "_offtake.png";
                        break;
                case "Exploitation":
                        return;
                case "Catch/Unit Effort":
                        name = selected in simRunData.townsByID ? simRunData.townsByID[selected].name : selected;
                        name += "_CPUE.png";
                        break;
                }

                $('#resultsGraph').get(0).toBlob(function(blob){
                        saveAs(blob, name);
                });
        }

        getPopColor(id){
                if(id in this._colors){
                        return this._colors[id];
                } else {
                        this._colors[id] = getRandomColor();
                        return this._colors[id];
                }
        }

        saveData(){
                this._currentConfig.saveData(this._currentYear);
        }

        getCurrentlySelected(){
                return this._currentConfig.selected;
        }

        getYear(){
                return this._currentYear;
        }

        getRange(){
                return this._currentConfig.range;
        }

        getChart(){
                return this._resultsChart;
        }
}