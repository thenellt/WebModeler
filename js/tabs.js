const pageTabs = {
        MENU: 0,
        PARAMS: 1,
        POPS: 2,
        MAPS: 3,
        STATS: 4,
        INFO: 5,
        ANY: 6,
};
const tabNames = ["getStarted", "parameterSetup", "popSetup", "resultsPage", "statsPage", "otherInfo"];
var tabManager;

class tabChange {
        constructor(src, func) {
                this.src = src;
                this.func = func;
        }
}

class TabManager {
        constructor() {
                this.populationView = 1;
                this.tabChanges = [];
                for (let i = 0; i < 5; i++)
                        this.tabChanges.push([]);
                this.currentPage = pageTabs.MENU;
                olmapLocation = 0;
                let tabs = document.getElementsByClassName("tablinks");
                for (let i = 0; i < tabs.length; i++) {
                        if (!tabs[i].classList.contains("defaultOpen")) {
                                tabs[i].disabled = true;
                        } else {
                                this.changeTab(i);
                        }
                }
        }

        changeTab(tab, isDirect) {
                $('#' + tabNames[this.currentPage]).css("display", "none");
                $('#' + tabNames[tab]).css("display", "block");
                $('#' + tabNames[this.currentPage] + 'Tab').removeClass("active");
                $('#' + tabNames[tab] + 'Tab').addClass("active");
                this.currentPage = tab;
                document.body.scrollTop = document.documentElement.scrollTop = 0;
                if (this.tabChanges[tab] && !isDirect)
                        for (let i = 0; i < this.tabChanges[tab].length; i++)
                                if (this.tabChanges[tab][i].src == this.currentPage || this.tabChanges[tab][i].src == pageTabs.ANY)
                                        this.tabChanges[tab][i].func();
        }

        togglePopView(mode) {
                if (mode == this.populationView)
                        return;
                this.populationView = mode;
                if (this.populationView) {
                        $("#popMapContent").addClass("hide");
                        $("#popTableContent").removeClass("hide");
                } else {
                        $("#popTableContent").addClass("hide");
                        $("#popMapContent").removeClass("hide");
                        map.updateSize();
                }
        }

        registerChange(src, dest, func) {
                this.tabChanges[dest].push(new tabChange(src, func));
        }

        disableTab(tab) {
                const id = tabNames[tab] + 'Tab';
                document.getElementById(id).disabled = true;
        }

        enableTab(tab) {
                const id = tabNames[tab] + 'Tab';
                document.getElementById(id).disabled = false;
        }

        disableAll(){
                for(const tab of tabNames)
                        document.getElementById(tab + 'Tab').disabled = true;
        }

        enableAll(){
                for(const tab of tabNames)
                        document.getElementById(tab + 'Tab').disabled = false;
        }
}

function setupTabSystem(){
        tabManager = new TabManager();
        tabManager.registerChange(pageTabs.ANY, pageTabs.POPS, changeToPopulations);
        tabManager.registerChange(pageTabs.ANY, pageTabs.MAPS, changeToOutput);
        tabManager.registerChange(pageTabs.ANY, pageTabs.MENU, changeToGetStarted);
        tabManager.registerChange(pageTabs.ANY, pageTabs.STATS, refreshCanvas);

        document.getElementById('getStartedTab').onclick = function(){tabManager.changeTab(pageTabs.MENU);};
        document.getElementById('parameterSetupTab').onclick = function(){tabManager.changeTab(pageTabs.PARAMS);};
        document.getElementById('popSetupTab').onclick = function(){tabManager.changeTab(pageTabs.POPS);};
        document.getElementById('resultsPageTab').onclick = function(){tabManager.changeTab(pageTabs.MAPS);};
        document.getElementById('statsPageTab').onclick = function(){tabManager.changeTab(pageTabs.STATS);};
        document.getElementById('otherInfoTab').onclick = function(){tabManager.changeTab(pageTabs.INFO);};
        document.getElementById('dropdownMapView').onclick = function(){tabManager.togglePopView(0);};
        document.getElementById('dropdownTableView').onclick = function(){tabManager.togglePopView(1);};
}