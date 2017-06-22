function setup(){
        var tabs = document.getElementsByClassName("tablinks");
        for(i = 0; i < tabs.length; i++){
                if(!tabs[i].classList.contains("defaultOpen")){
                        console.log("found non-default tab: " + tabs[i].id);
                        tabs[i].disabled = true;
                }
                else{
                        var contentName = tabs[i].id;
                        console.log("Setup content name: " + contentName.substring(0, contentName.length - 3));
                        changeTab(contentName.substring(0, contentName.length - 3));
                }
        }
}

setup();
