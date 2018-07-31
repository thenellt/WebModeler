var appCache = 'app-cache';
var earthCache = 'earth-cache';
var tileCache = 'tile-cache';
const ONE_DAY = 24 * 60 * 60 * 1000;
var earthCacheAge;
var fileNames = [
        './',
        './index.html',
        './changelog.txt',
        './keys.js',
        './manifest.json',
        './js/model.js',
        './js/simulationSetup.js',
        './js/mapFunctionality.js',
        './js/saveLoad.js',
        './js/dataProcessing.js',
        './js/floatingContent.js',
        './js/main.js',
        './js/table.js',
        './js/tabs.js',
        './js/ol.js',
        './js/proj4js.js',
        './js/Chart.min.js',
        './js/chartjs-plugin-datalabels.min.js',
        './js/materialize.min.js',
        './js/jquery-3.2.1.min.js',
        './js/jszip.min.js',
        './js/FileSaver.min.js',
        './css/materialize.min.css',
        './css/otherStyle.css',
        './css/table.css',
        './css/chartist.min.css',
        './css/ol.css',
        './fonts/roboto/Roboto-Bold.woff',
        './fonts/roboto/Roboto-Bold.woff2',
        './fonts/roboto/Roboto-Light.woff',
        './fonts/roboto/Roboto-Light.woff2',
        './fonts/roboto/Roboto-Medium.woff',
        './fonts/roboto/Roboto-Medium.woff2',
        './fonts/roboto/Roboto-Regular.woff',
        './fonts/roboto/Roboto-Regular.woff2',
        './fonts/roboto/Roboto-Thin.woff',
        './fonts/roboto/Roboto-Thin.woff2',
        './images/baseline_layers_black_192.png',
        './images/baseline_layers_black_48.png'
];

self.onmessage = function(msg){
        console.log("service worker::" + msg.data.request);
        switch(msg.data.request){
        case 'checkUpdate':
                queryUpdates(msg.data.version, msg.ports[0]);
                break;
        case 'clearAppCache':
                break;
        case 'clearEarthCache':
                break;
        case 'clearTileCache':
                break;
        }
}

self.addEventListener('install', function (evt) {
        console.log('The service worker is being installed.');
        earthCacheAge = false;
        self.skipWaiting();
        evt.waitUntil(precache());
});

self.addEventListener('activate', function(event){
        console.log("The service worker is activating.");
        event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (evt) {
        const url = new URL(evt.request.url);
        if(url.origin === 'https://dev.virtualearth.net'){
                evt.respondWith(accessEarthCache(evt.request));
        } else if(url.search.endsWith('shading=hill')) {
                evt.respondWith(caches.open('tile-cache').then(function (tileCache) {
                        return tileCache.match(evt.request).then(function (response) {
                                return response || fetch(evt.request).then(function (response) {
                                        if(response.status === 200 || response.type == "opaque"){
                                                tileCache.put(evt.request, response.clone());
                                                return response;
                                        } else {
                                                return Promise.reject('no-match');
                                        }
                                });
                        });
                }));
        } else {
                evt.respondWith(caches.open('app-cache').then(function (appCache) {
                        return appCache.match(evt.request).then(function (response) {
                                if(response) {
                                        console.log('app-cache: ' + evt.request.url);
                                        return response;
                                } else {
                                        return fetch(evt.request).then(function (response) {
                                                console.log('fetch: ' + evt.request.url);
                                                if(response.status === 200 || response.type == "opaque"){
                                                        return response;
                                                } else {
                                                        return Promise.reject('no-match');
                                                }
                                        });
                                }
                        });
                }));
        }
});

function accessEarthCache(request){
        if(!earthCacheAge || ((new Date) - earthCacheAge > ONE_DAY) && navigator.onLine){
                earthCacheAge = new Date();
                return caches.open('earth-cache').then(function (earthCache) {
                        earthCache.keys().then(function(keyList) {
                                return Promise.all(keyList.map(function(key) {
                                        return earthCache.delete(key);
                                }));
                        });
                }).then(function(){
                        return fetch(request).then(function(response){
                                if(response.status === 200 || response.type == "opaque"){
                                        return caches.open('earth-cache').then(function (earthCache) {
                                                earthCache.put(request, response.clone());
                                                return response;
                                        });
                                } else {
                                        return Promise.reject('no-match');
                                }
                        });
                });
                
        } else if(earthCacheAge){
                return caches.open('earth-cache').then(function (earthCache) {
                        return earthCache.match(request).then(function (response) {
                                if(response){
                                        console.log('earthCache: ' + request.url);
                                        return response;
                                } else {
                                        console.log('earth cache miss: ' + request.url);
                                        return fetch(request).then(function(response){
                                                if(response.status === 200 || response.type == "opaque"){
                                                        return caches.open('earth-cache').then(function (earthCache) {
                                                                earthCache.put(request, response.clone());
                                                                return response;
                                                        });
                                                } else {
                                                        return Promise.reject('no-match');
                                                }
                                        });
                                }
                        });
                });
        }
}

function precache() {
        return caches.open(appCache).then(function (cache) {
                return cache.addAll(fileNames);
        });
}

function queryUpdates(loadedVersion, responsePort){
        if(!navigator.onLine){
                responsePort.postMessage("noUpdate");
        } else {
                fetch(location.origin + "/manifest.json").then(function(response){
                        response.json().then(function(data){
                                console.log("Service worker found version: " + data.version);
                                if(data.version > loadedVersion){
                                        caches.open(appCache).then(function (cache) {
                                                cache.addAll(fileNames).then(function() {
                                                        responsePort.postMessage("update");
                                                });
                                        });
                                } else {
                                        responsePort.postMessage("noUpdate");
                                }
                        });
                });
        }
}