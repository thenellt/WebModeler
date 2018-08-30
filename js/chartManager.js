class chartMgr {
        constructor(){
                this._currentGraph = '';
                this._currentYear = -1;
                this._currentRadius = -1;
                this._curSettlementID = '';
                this._configs = [];
                this._controls = ['settlement', 'radius', 'year'];
                $("#graphPlayBtn").off('click').click(this._playAnimation);
        }

        registerChart(name, config){
                this._configs[name] = config;
        }

        changeYear(isNext){
                this._configs.yearFunc(isNext);
        }

        changeSettlement(){

        }

        changeRadius(radius){

        }

        changeChart(chartName){
                //change title
                //change help text
                //disable all controls
                //enable correct controls
                //check graph container type (full or split)
        }

        playAnimation(){
                $('#graphSaveBtn, #graphDecRange, #graphIncRange').addClass('disabled');
                $('#graphDecYear, #graphIncYear, #localCDFupYear').addClass('disabled');
                $('#graphSettlementSelect').attr("disabled", "");
                $('#graphSettlementSelect').material_select();
                this._currentYear = 0;
                setLocalCDFPicture(this._currentYear);
                localAreaChart.data.datasets[0].data = localAreaData[this._curSettlementID][this._currentYear];
                localAreaChart.update();
                document.getElementById("graphYearLabel").innerHTML = "Simulation Year: " + this._currentYear;

                var year = 0;
                var animHandle = setInterval(function(){
                        if(year === simRunData.years){
                                clearTimeout(animHandle);
                                $('#singleCDFSaveButton, #localCDFdownRange').removeClass('disabled');
                                $('#localCDFupRange, #localCDFdownYear, #localCDFupYear').removeClass('disabled');
                                $('#CDFSetSelection').removeAttr('disabled');
                                $('#CDFSetSelection').material_select();
                                $('#localCDFplayButton').html('Play').removeClass('red').addClass('blue').off('click')
                                                        .click(localCDFAnimation);
                        } else {
                                changeLocalCDFYear(true);
                                year++;
                        }
                }, 350);

                $('#localCDFplayButton').html('Stop').removeClass('blue').addClass('red').off('click').click(function(){
                        clearTimeout(animHandle);
                        $('#singleCDFSaveButton, #localCDFdownRange').removeClass('disabled');
                        $('#localCDFupRange, #localCDFdownYear, #localCDFupYear').removeClass('disabled');
                        $('#CDFSetSelection').removeAttr('disabled');
                        $('#CDFSetSelection').material_select();
                        $('#localCDFplayButton').html('Play').removeClass('red').addClass('blue').off('click')
                                                .click(localCDFAnimation);
                });
        }

        saveImg(){
                if(this._currentGraph === "entireMapChart"){
                        var name = "entireMapCDF_year_" + entireAreaYear + ".png";
                } else if(this._currentGraph === "localAreaCDF") {
                        var name = "localAreaCDF_year_" + localAreaYear + ".png";
                } else if(this._currentGraph === "offtakeChart") {
                        for(let i = 0; i < simResults.townData.length; i++)
                                if(simResults.townData[i].id = offtakeSelectedID)
                                        var vName = simResults.townData[i].name;
                        var name = vName + "_offtake.png";
                }
                $('#' + containerID).get(0).toBlob(function(blob){
                        saveAs(blob, name);
                });
        }
  }
  
  const ChartMgr = new chartMgr();
  Object.freeze(ChartMgr);
  
  export default ChartMgr;