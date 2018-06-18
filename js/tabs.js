const pageTabs = {
        MENU: 0,
        PARAMS: 1,
        POPS: 2,
        MAPS: 3,
        STATS: 4,
        ANY: 5,
};

const tabNames = ["getStarted", "parameterSetup", "popSetup", "resultsPage", "statsPage"];

var tabManager = new tabManager();

function tabManager(){
        this.populationView = 1;
        this.tabChanges = new Array(5);
        for(let i = 0; i < 5; i++)
                this.tabChanges[i] = [];
        this.currentPage = pageTabs.MENU;
        olmapLocation = 0;
        simulationRun = 0;
        let _this = this;

        this.changeTab = function(tab, isDirect){
                console.log("from: " + _this.currentPage + " to: " + tab);
                if(_this.tabChanges[tab] && !isDirect)
                        for(let i = 0; i < _this.tabChanges[tab].length; i++)
                                if(_this.tabChanges[tab][i].src == _this.currentPage || _this.tabChanges[tab][i].src == pageTabs.ANY)
                                        _this.tabChanges[tab][i].func();
                
                $('#' + tabNames[_this.currentPage]).css("display", "none");
                $('#' + tabNames[tab]).css("display", "block");
                $('#' + tabNames[_this.currentPage] + 'Tab').removeClass("active");
                $('#' + tabNames[tab] + 'Tab').addClass("active");
                _this.currentPage = tab;
                document.body.scrollTop = document.documentElement.scrollTop = 0;
        };
        this.togglePopView = function(mode){
                if(mode == _this.populationView)
                        return;

                _this.populationView = mode;
                if(_this.populationView){
                        $("#popMapContent").addClass("hide");
                        $("#popTableContent").removeClass("hide");
                } else{
                        $("#popTableContent").addClass("hide");
                        $("#popMapContent").removeClass("hide");
                        map.updateSize();
                }
        };
        this.registerChange = function(src, dest, func){
                _this.tabChanges[dest].push(new tabChange(src, func));
        };
        this.disableTab = function(tab){
                const id = tabNames[tab] + 'Tab';
                document.getElementById(id).disabled = true;
        };
        this.enableTab = function(tab){
                const id = tabNames[tab] + 'Tab';
                document.getElementById(id).disabled = false;
        }

        var tabs = document.getElementsByClassName("tablinks");
        for(let i = 0; i < tabs.length; i++){
                if(!tabs[i].classList.contains("defaultOpen")){
                        tabs[i].disabled = true;
                } else{
                        this.changeTab(i);
                }
        }
}

function tabChange(src, func){
        this.src = src;
        this.func = func;
}

function setupTabSystem(){
        tabManager.registerChange(pageTabs.ANY, pageTabs.POPS, changeToPopulations);
        tabManager.registerChange(pageTabs.ANY, pageTabs.MAPS, changeToOutput);
        tabManager.registerChange(pageTabs.ANY, pageTabs.MENU, changeToGetStarted);

        document.getElementById('getStartedTab').onclick = function(){tabManager.changeTab(pageTabs.MENU);};
        document.getElementById('parameterSetupTab').onclick = function(){tabManager.changeTab(pageTabs.PARAMS);};
        document.getElementById('popSetupTab').onclick = function(){tabManager.changeTab(pageTabs.POPS);};
        document.getElementById('resultsPageTab').onclick = function(){tabManager.changeTab(pageTabs.MAPS);};
        document.getElementById('statsPageTab').onclick = function(){tabManager.changeTab(pageTabs.STATS);};
}