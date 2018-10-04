self.importScripts('./jimp.min.js');
var workerNumber;
var params;

onmessage = function(oEvent){
        switch(oEvent.data.type){
        case 'genImgs':
                params = oEvent.data.params;
                genHeatmapImg();
                //genEncodedImg(oEvent.data.params, oEvent.data.array);
                break;
        case 'setNum':
                workerNumber = oEvent.data.number;
                break;
        }
}

/*
function genEncodedImg(params, rawImageData){
        new Jimp({ data: rawImageData, width: params.width, height: params.height }, function(err, image){
                image.getBase64(Jimp.MIME_PNG, function(err, result){
                        self.postMessage({threadNum:workerNumber, dest:params.dest, year:params.year, isEnd:params.isEnd, url:result});
                }); 
        });
}
*/

function genImages(){
        genHeatmapImg()
                .then(genExploitationImg)
                .then(function(){
                        //const args = {width:(xSize - 1) * scale, height:(ySize - 1) * scale, year:params.year, threadNum:workerNumber};
                        self.postMessage({threadNum:workerNumber, year:params.year, heatmapData:heatmap, exploitData:exploitmap});
                });
        
}

//gradient, year, carryCapacity, grid[year], ysize, xsize
function genHeatmapImg(){
        const scale = 3;//(params.xScale * params.yScale) > 1000000 ? 3 : 2;
        const gradientSteps = Math.floor(params.carryCapacity) - 1;

        let img = new Jimp(((params.xSize - 1) * scale), ((params.ySize - 1) * scale));
        for(let y = 0; y < params.ySize - 1; y++){
                for(let x = 0; x < params.xSize - 1; x++){
                        let gradientPosition = Math.ceil(gradientSteps * (1 - (params.grid[y][x] / params.carryCapacity)));

                        if(gradientPosition < 0 || !gradientPosition){
                                j_fillPixel(img, x, y, params.gradient[0], scale);
                        } else {
                                j_fillPixel(img, x, y, params.gradient[gradientPosition], scale);
                        }
                }
        }

        //const params = {width:(xSize - 1) * scale, height:(ySize - 1) * scale, year:params.year, dest:'heatmapImages'};
        img.getBase64(Jimp.MIME_PNG, function(err, result){
                genExploitationImg(result);
        }); 
}

function genExploitationImg(result1){
        const overexploitedColor = Jimp.rgbaToInt(255, 255, 0, 255);
        const collapsedColor = Jimp.rgbaToInt(255, 0, 0, 255);
        const extirpatedColor = Jimp.rgbaToInt(128, 0, 0, 255);
        const scale = 6;//(params.xScale * params.yScale) > 1000000 ? 6 : 5;

        let img = new Jimp(((params.xSize - 1) * scale), ((params.ySize - 1) * scale));
        for(let y = 0; y < params.ySize - 1; y++){
                for(let x = 0; x < params.xSize - 1; x++){
                        if(params.grid[y][x] < 0.01 * params.carryCapacity){
                                outlinePixel(img, x, y, extirpatedColor, scale);
                        } else if(params.grid[y][x] < 0.1 * params.carryCapacity){
                                outlinePixel(img, x, y, collapsedColor, scale);
                        } else if(params.grid[y][x] < 0.5 * params.carryCapacity){
                                outlinePixel(img, x, y, overexploitedColor, scale);
                        }
                }
        }

        img.getBase64(Jimp.MIME_PNG, function(err, result){
                //console.log("Thread " + workerNumber + " finished year " + params.year + " exploitmap");
                self.postMessage({threadNum:workerNumber, year:params.year, heatmapData:result1, exploitData:result});
                params = '';
                heatmap = '';
                //exploitmap = result; //self.postMessage({type:'testImgData', params:params, url:result});
        }); 

        //const params = {width:(xSize - 1) * scale, height:(ySize - 1) * scale, year:curYear, dest:'expImages'};
        //self.postMessage({type:'imgData', params:params, data:imgData}, [imgData.buffer]);
}

function j_fillPixel(img, xPos, yPos, color, scale){
        const yEnd = yPos * scale + scale;
        const xEnd = xPos * scale + scale;

        for(let y = yPos * scale; y < yEnd; y++){
                for(let x = xPos * scale; x < xEnd; x++){
                        img.setPixelColor(color, x, y);
                }
        }
}

function outlinePixel(img, xPos, yPos, color, scale){
        const yEnd = yPos * scale + scale;
        const xEnd = xPos * scale + scale;

        for(let y = yPos * scale; y < yEnd; y++){
                for(let x = xPos * scale; x < xEnd; x++){
                        if(y === 0 || y === (scale - 1) || x === 0 || x === (scale - 1)){
                                img.setPixelColor(color, x, y);
                        } 
                }
        }
}