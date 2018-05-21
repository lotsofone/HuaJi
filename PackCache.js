function PackCache(){
    this.init();
}
PackCache.prototype.init = function(){
    this.packQueue = [];
    this.tickStamp = 0;
}
PackCache.prototype.addPack = function(pack){
    if(pack!=null&&pack.tag!=null&&pack.tickStamp!=null){
        let i = this.packQueue.length-1;
        for(; i>=0; i--){
            if(this.packQueue[i].tickStamp<=pack.tickStamp){
                i++;
                break;
            }
        }
        this.packQueue.splice(i, 0, pack);
    }
    else{
        console.log("Warning! receiving bad pack");
    }
}
PackCache.prototype.getPacks = function(deltaTick){
    this.tickStamp += deltaTick;
    let retQueue = [];
    while(this.packQueue.length>0){
        if(this.packQueue[0].tickStamp<=this.tickStamp){
            retQueue.push(this.packQueue[0]);
            this.packQueue.splice(0,1);
        }
        else{
            break;
        }
    }
    return retQueue;
}
PackCache.prototype.getCachedTick = function(){
    if(this.packQueue.length==0){
        return 0;
    }
    else{
        return this.packQueue[this.packQueue.length-1].tickStamp - this.tickStamp;
    }
}