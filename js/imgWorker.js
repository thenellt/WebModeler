self.importScripts('./jimp.min.js');

onmessage = function(oEvent){
        switch(oEvent.data.params.type){
        case 'genImg':
                genEncodedImg(oEvent.data.params, oEvent.data.array);
                break;
        }
}

function genEncodedImg(params, rawImageData){
        var test = new Jimp({ data: rawImageData, width: params.width, height: params.height }, function(err, image){
                image.getBase64(Jimp.AUTO, function(err, result){
                        self.postMessage({dest:params.dest, year:params.year, isEnd:params.isEnd, url:result});
                }); 
        });
}