self.importScripts('./jimp.min.js');
var workerNumber;

onmessage = function(oEvent){
        switch(oEvent.data.type){
        case 'genImg':
                genEncodedImg(oEvent.data.params, oEvent.data.array);
                break;
        case 'setNum':
                workerNumber = oEvent.data.number;
                break;
        }
}

function genEncodedImg(params, rawImageData){
        new Jimp({ data: rawImageData, width: params.width, height: params.height }, function(err, image){
                image.getBase64(Jimp.MIME_PNG, function(err, result){
                        self.postMessage({threadNum:workerNumber, dest:params.dest, year:params.year, isEnd:params.isEnd, url:result});
                }); 
        });
}