class chartMgr {
        constructor(){
                this._currentConfigType = '';
                this._currentConfig = '';
                this._currentYear = -1;
                this._curSettlementID = '';
                this._resultsChart = '';
                this._configs = [];
                this._controls = ['settlement', 'radius', 'year'];
                this._animElmnts = ['#graphSaveBtn', '#graphDecRange', '#graphIncRange', '#graphDecYear', '#graphIncYear', '#tabFillerButton'];
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

        changeSettlement(){
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
                $('#graphHelpText').html(this._currentConfig.helpText);
                //disable all controls
                //enable correct controls

                if(this._currentConfig.updateSelect)
                        this._currentConfig.updateSelect();

                if(this._resultsChart)
                        this._resultsChart.destroy();

                if(this._currentConfig.isSplit){
                        $('#localAreaPictureContainer').css('display', 'inline-block');
                        chartElement.width = 550;
                        chartElement.height = 400;
                } else {
                        $('#localAreaPictureContainer').css('display', 'none');
                        chartElement.width = 800;
                        chartElement.height = 400;
                }
                let ctx = chartElement.getContext('2d');
                this._resultsChart = this._currentConfig.createGraph(ctx);
                this._currentYear -= 1;
                this.changeYear(true);
        }

        playAnimation(){
                $(this._animElmnts).addClass('disabled');
                $('#graphSettlementSelect').attr("disabled", "");
                $('#graphSettlementSelect').material_select();
                this._currentYear = -1;
                this.changeYear(true);

                var animHandle = setInterval(function(){
                        if(ChartMgr._currentYear === simRunData.years){
                                clearTimeout(animHandle);
                                $(ChartMgr._animElmnts).removeClass('disabled');
                                $('#graphSettlementSelect').removeAttr('disabled');
                                $('#graphSettlementSelect').material_select();
                                $('#graphPlayBtn').html('Play').removeClass('red').addClass('blue').off('click')
                                                        .click(function(){ChartMgr.playAnimation();});
                        } else {
                                ChartMgr.changeYear(true);
                        }
                }, 350);

                $('#graphPlayBtn').html('Stop').removeClass('blue').addClass('red').off('click').click(function(){
                        clearTimeout(animHandle);
                        $(this._animElmnts).removeClass('disabled');
                        $('#graphSettlementSelect').removeAttr('disabled');
                        $('#graphSettlementSelect').material_select();
                        $('#graphPlayBtn').html('Play').removeClass('red').addClass('blue').off('click')
                                                .click(function(){ChartMgr.playAnimation();});
                });
        }

        saveImg(){
                if(this._currentConfigType === "Entire Simulation CDF"){
                        var name = "entireMapCDF_year" + this._currentYear + ".png";
                } else if(this._currentConfigType === "Local CDF") {
                        var name = simRunData.townsByID[this._curSettlementID].name + "_year" + this._currentYear + "_localCDF.png";
                } else if(this._currentConfigType === "Settlement Offtake") {
                        var name = simRunData.townsByID[this._curSettlementID].name + "_offtake.png";
                }
                $('#resultsGraph').get(0).toBlob(function(blob){
                        saveAs(blob, name);
                });
        }

        getCurrentlySelected(){
                return this._curSettlementID;
        }

        getYear(){
                return this._currentYear;
        }

        getRange(){
                return this._currentConfig.range;
        }
}
  
var ChartMgr = new chartMgr();