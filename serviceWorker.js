var appCache = 'app-cache';
var extCache = 'ext-cache';
var fileNames = [
        './',
        './index.html',
        './changelog.txt',
        './keys.js',
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
        './fonts/roboto/Roboto-Thin.woff2'
];

self.onmessage = function(msg){
        console.log("service worker::" + msg.data);
}

self.addEventListener('install', function (evt) {
        console.log('The service worker is being installed.');
        evt.waitUntil(precache());
});

self.addEventListener('fetch', function (evt) {
        evt.respondWith(caches.open('app-cache').then(function (appCache) {
                return appCache.match(evt.request).then(function (response) {
                        if(response) 
                                console.log('app-cache: ' + evt.request.url);
                        return response || fetch(evt.request).then(function (response) {
                                console.log('fetch: ' + evt.request.url);
                                if(response.status === 200 || response.type == "opaque"){
                                        //extCache.put(evt.request, response.clone());
                                        return response;
                                } else {
                                        return Promise.reject('no-match');
                                }
                        });
                        /*
                        caches.open('ext-cache').then(function (extCache) {
                                return extCache.match(evt.request).then(function (response) {
                                        if(response) 
                                                console.log('ext-cache: ' + evt.request.url);
                                        return response || fetch(evt.request).then(function (response) {
                                                console.log('fetch: ' + evt.request.url);
                                                if(response.status === 200 || response.type == "opaque"){
                                                        extCache.put(evt.request, response.clone());
                                                        return response;
                                                } else {
                                                        return Promise.reject('no-match');
                                                }
                                        });
                                });
                        });
                        */
                });
        }));
});

function precache() {
        return caches.open(appCache).then(function (cache) {
                return cache.addAll(fileNames);
        });
}

// Time limited network request. If the network fails or the response is not
// served before timeout, the promise is rejected.
function fromNetwork(request, timeout) {
        return new Promise(function (fulfill, reject) {
                // Reject in case of timeout.
                var timeoutId = setTimeout(reject, timeout);
                // Fulfill in case of success.
                fetch(request).then(function (response) {
                        clearTimeout(timeoutId);
                        fulfill(response);
                        // Reject also if network fetch rejects.
                }, reject);
        });
}

// Open the cache where the assets were stored and search for the requested
// resource. Notice that in case of no matching, the promise still resolves
// but it does with `undefined` as value.
function fromCache(request) {
        return caches.open(CACHE).then(function (cache) {
                return cache.match(request).then(function (matching) {
                        return matching || Promise.reject('no-match');
                });
        });
}

// Update consists in opening the cache, performing a network request and
// storing the new response data.
function update(request) {
        return caches.open(CACHE).then(function (cache) {
                return fetch(request).then(function (response) {
                        return cache.put(request, response);
                });
        });
}