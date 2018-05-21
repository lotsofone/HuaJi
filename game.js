var game = {};

game.init = function(){
    game.init = function(){};
    base_generator.scene_div = document.getElementById("scene_div");
    base_generator.damageSuma1 = document.getElementById("damage1");
    base_generator.damageSuma2 = document.getElementById("damage2");
    base_generator.ballhpa = document.getElementById("ballhp");
    base_generator.resulta = document.getElementById("resulta");
    base_generator.render_scale = 32;
    base_generator.gravity = [0, 300];
    game.whohost = null;
    game.world = null;
    game.base_objects = [];
    game.inputs = [[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    game.tickStamp = 0;
    game.tickInterval = 10;
    setInterval("game.timetickout("+game.tickInterval+")", game.tickInterval);
    game.intervalCount = 0;
    game.sendInterval = 40;
    game.lastTime = null;
    game.leftToSend = "";
    game.keyCatchTimes = [10, 20, 60];
    game.hostCatchTImes = [60, 100, 150];
    game.guestCatchTImes = [20, 40, 90];
    game.addKeyListening();
}
var peerConnectionSendFunc = function(){};

game.addRenderAlterEvent = function(pack){
    game.renderCache.addPack(pack);
    if(game.whohost=="youhost"){
        if(game.leftToSend.length>0)game.leftToSend+="|";
        if(pack.tag)
        game.leftToSend += codec.encodePack(pack);
    }
}
game.addInputMessage = function(){
    if(game.leftToSend.length>0)game.leftToSend+="|";
    game.leftToSend += codec.encodeInput(game.inputs[0], game.tickStamp);
}
//ticktime
game.timetickout = function(){
    let timenow = new Date().getTime();
    let deltaTime = (game.lastTickTime&&timenow>game.lastTickTime)?timenow-game.lastTickTime:game.tickInterval;
    game.lastTickTime = (game.lastTickTime==null||timenow>game.lastTickTime)?timenow:game.lastTickTime;

    game.leftTickToRun+=deltaTime;
    if(game.leftTickToRun>500)game.leftTickToRun = game.tickInterval;
    while(game.leftTickToRun>game.tickInterval){
        game.leftTickToRun-=game.tickInterval;
        timetick(game.tickInterval);
    }
    function timetick(deltaTime){
        if((game.whohost=="youhost"||game.whohost=="local")&&game.world){
            if(game.whohost=="youhost"){
                let cachedTime=game.opponentInputCache.getCachedTick();
                let kdt = deltaTime;
                if(cachedTime-kdt > game.keyCatchTimes[2]){
                    kdt = cachedTime - game.keyCatchTimes[2];
                }
                else if(kdt > game.keyCatchTimes[1]){
                    kdt*=1.2;
                }
                else if(kdt > game.keyCatchTimes[0]){
                    
                }
                else{
                    kdt*=0.8;
                }
                let ks = game.opponentInputCache.getPacks(kdt);
                if(ks.length>0){
                    game.inputs[1] = ks[ks.length-1];
                    if(game.opponentInputCache.tickStamp-ks[ks.length-1].tickStamp>1000){//本地时钟快过对方超过1秒，表示失去同步
                        game.opponentInputCache.tickStamp=ks[ks.length-1].tickStamp;
                    }
                }
            }
            game.world.step(deltaTime/1000);
            game.renderCache.addPack({tag:"dest", a:game.base_objects[2].body.value, b:game.base_objects[3].body.value, tickStamp:game.tickStamp});
            let p = game.takePositions();
            //add to cache
            game.renderCache.addPack(p);
        }
        else if(game.whohost=="hehost"){
            game.addInputMessage();
        }
        game.tickStamp+=deltaTime;
        game.intervalCount += deltaTime;
        if(game.intervalCount>=game.sendInterval){
            if(game.whohost=="youhost"){
                if(game.leftToSend.length>0)game.leftToSend+="|";
                let p = game.takeMotions();
                game.leftToSend += codec.encodePack(p);

                if(game.base_objects[2].body.value!=0||game.base_objects[3].body.value!=0){
                    game.leftToSend+="|";
                    game.leftToSend+=JSON.stringify({tag:"dest", a:game.base_objects[2].body.value, b:game.base_objects[3].body.value, tickStamp:game.tickStamp});
                }
            }
            if(game.leftToSend.length>0){
                peerConnectionSendFunc();
            }
        }
        game.intervalCount%=game.sendInterval;
    }
};

game.render = function(time){
    if(game.whohost){
        //console.log(JSON.stringify(shadowSys.shadowQueue));
        let deltaTime = game.lastTime ? (time - game.lastTime) : 0;
        game.lastTime = time;
        let cachedTime = game.renderCache.getCachedTick();
        if(cachedTime-deltaTime > game.renderCatchTimes[2]){
            deltaTime = cachedTime - game.renderCatchTimes[2];
        }
        else if(cachedTime > game.renderCatchTimes[1]){
            deltaTime*=1.1;
        }
        else if(cachedTime > game.renderCatchTimes[0]){
            
        }
        else{
            deltaTime*=0.9;
        }
        //对渲染包的处理
        let pastPacks = game.renderCache.getPacks(deltaTime);
        if(pastPacks.length>0){
            if(game.renderCache.tickStamp-pastPacks[pastPacks.length-1].tickStamp>1000){//本地跟随钟超过对方时钟1000毫秒，则立即回退
                game.renderCache.tickStamp=pastPacks[pastPacks.length-1].tickStamp;
            }
        }
        for(let i=0; i<pastPacks.length; i++){
            let pack = pastPacks[i];
            if(pack.tag == "positions"){
                game.applyPositions(pack);
            }
            else if(pack.tag =="motions"){
                if(pack.tickStamp>=game.renderedMotionTickStamp){
                    game.renderedMotionTickStamp = pack.tickStamp;
                    game.stepedTickStamp = pack.tickStamp;
                    game.currentMotionPack = pack;
                    game.motionsToWorld(game.currentMotionPack);
                }
            }
            else if(pack.tag=="dest"){
                game.base_objects[2].value = pack.a; game.base_objects[3].value = pack.b;
            }
            else if(pack.tag=="success"){
                game.stopGame();
                document.getElementById("success").style.opacity=0.5;

                //end here---------------------------------------------
            }
            else{
                console.log("Unknown pack tag: "+pack.tag);
            }
        }
        //物理预测
        if(game.whohost=="hehost"){
            game.world.step(game.tickInterval/1000, (game.renderCache.tickStamp-game.stepedTickStamp)/1000, parseInt(100/game.tickInterval)+1);
            game.stepedTickStamp = game.renderCache.tickStamp;
            let ps = game.takeInterpolatedPositions();
            game.applyPositions(ps);
            //ttt
            //console.log(game.base_objects[2].x+" otc:"+game.renderCache.tickStamp);
        }
        //camare
        base_generator.moveCamare(deltaTime, [game.inputs[2][2]-game.inputs[2][0], game.inputs[2][3]-game.inputs[2][1]]);
        //render
        base_generator.render(game.base_objects);
    }
    requestAnimationFrame(game.render);
}
requestAnimationFrame(game.render);


game.applyPositions = function(positions){
    for(let i=0; i<game.base_objects.length; i++){
        let position = positions[i];
        if(position.x!=null){
            let object = game.base_objects[i];
            object.x = position.x;
            object.y = position.y;
            object.angle = position.angle;
        }
    }
}
game.motionsToWorld = function(motions){
    for(let i=0; i<game.base_objects.length; i++){
        let motion = motions[i];
        if(motion.x!=null){
            let body = game.base_objects[i].body;
            body.position = [motion.x, motion.y];
            body.angle = motion.angle;
            body.velocity = [motion.vx, motion.vy];
            body.angularVelocity = motion.va;
        }
    }
}
game.takeInterpolatedPositions = function(){
    let positions = [];
    positions.tickStamp = game.tickStamp;
    for(let i=0; i<game.base_objects.length; i++){
        let p = {};
        let object = game.base_objects[i];
        if(object.tag=="fixed"){
        }
        else{
            p.x=object.body.interpolatedPosition[0];
            p.y=object.body.interpolatedPosition[1];
            p.angle=object.body.interpolatedAngle;
        }
        positions.push(p);
    }
    positions.tag = "positions";
    return positions;
}
game.takePositions = function(){
    let positions = [];
    positions.tickStamp = game.tickStamp;
    for(let i=0; i<game.base_objects.length; i++){
        let p = {};
        let object = game.base_objects[i];
        if(object.tag=="fixed"){
        }
        else{
            p.x=object.body.position[0];
            p.y=object.body.position[1];
            p.angle=object.body.angle;
        }
        positions.push(p);
    }
    positions.tag = "positions";
    return positions;
}
game.takeMotions = function(){
    let motions = [];
    motions.tickStamp = game.tickStamp;
    for(let i=0; i<game.base_objects.length; i++){
        let p = {};
        let object = game.base_objects[i];
        if(object.tag=="fixed"){
        }
        else{
            p.x=object.body.position[0];
            p.y=object.body.position[1];
            p.angle=object.body.angle;
            p.vx=object.body.velocity[0];
            p.vy=object.body.velocity[1];
            p.va=object.body.angularVelocity;
        }
        motions.push(p);
    }
    motions.tag = "motions";
    return motions;
}
game.prepareGame = function(whohost, dataChannel){
    if(game.whohost!=null){
        console.log("Warning! Starting game without stopping the last game");
        game.stopGame();
        game.endGame();
    }
    game.whohost = whohost;
    game.base_objects = base_generator.level(0);
    game.tickStamp = 0;
    game.leftTickToRun = 0;
    game.leftToSend = "";
    game.renderCache = new PackCache();
    codec.setMotionList(game.base_objects);
    game.renderedMotionTickStamp = 0;
    
    peerConnectionSendFunc = function(){
        if(connection_manager.dataChannel==null||connection_manager.dataChannel.readyState!="open"){
            return;
        }
        connection_manager.dataChannel.send(game.leftToSend);
        game.leftToSend = "";
    }
    if(game.whohost == "youhost"){
        //catchtime
        game.renderCatchTimes = game.hostCatchTImes;
        game.opponentInputCache = new PackCache();
        //channel
        dataChannel.onmessage = function(e){
            let msgs = codec.decodeMessages(e.data);
            for(let i=0; i<msgs.length; i++)
                game.opponentInputCache.addPack(msgs[i])
        }
    }
    else if(game.whohost=="hehost"){
        game.renderCatchTimes = game.guestCatchTImes;
        dataChannel.onmessage = function(e){
            let packs = codec.decodeMessages(e.data);
            for(let i=0; i<packs.length; i++)
                game.renderCache.addPack(packs[i]);
        }
    }
    else if(game.whohost=="local"){
        game.renderCatchTimes = [0, 0, 0];
    }

    //generate according to whohost
    if(game.whohost == "youhost"){
        game.world = base_generator.generatePhysics(game.base_objects);
        game.setRule();
        base_generator.camObjects = [game.base_objects[0]];
    }
    else if(game.whohost=="local"){
        game.world = base_generator.generatePhysics(game.base_objects);
        game.setRule();
        base_generator.camObjects = [game.base_objects[0], game.base_objects[1]];
    }
    else{//hehost
        game.world = base_generator.generatePhysics(game.base_objects);//used only for dead reckoning
        game.currentMotionPack = game.takeMotions();
        base_generator.camObjects = [game.base_objects[1]];
    }
    base_generator.generateGraphics(game.base_objects);
}
game.stopGame = function(){
    if(game.whohost=="youhost"){
        game.whohost = "youhoststopped";
        //connection_manager.dataChannel.onmessage = function(){};
    }
    else if(game.whohost=="hehost"){
        game.whohost = "hehoststopped";
        //connection_manager.dataChannel.onmessage = function(){};
    }
    else if(game.whohost=="local")game.whohost = "localstopped";
    else return;
}
game.setRule = function(){

    game.world.on("postStep", postStep);

    function postStep(){
        if(game.base_objects[2].body.value==null)game.base_objects[2].body.value=0;
        if(game.base_objects[3].body.value==null)game.base_objects[3].body.value=0;
        game.base_objects[2].body.value-=game.tickInterval/3000;
        game.base_objects[3].body.value-=game.tickInterval/3000;
        if(game.base_objects[2].body.value<0)game.base_objects[2].body.value=0;
        if(game.base_objects[3].body.value<0)game.base_objects[3].body.value=0;
        if(game.base_objects[2].body.value>=1&&game.base_objects[3].body.value>=1){
            game.renderCache.addPack({tag:"success", tickStamp:game.tickStamp})
            connection_manager.dataChannel.send(JSON.stringify({tag:"success", tickStamp:game.tickStamp}));
        }
        if(game.base_objects[2].body.value>1)game.base_objects[2].body.value=1;
        if(game.base_objects[3].body.value>1)game.base_objects[3].body.value=1;
        update_player_action(0);
        update_player_action(1);
    }
    function update_player_action(id){
        //moving
        let input = game.inputs[id];
        let object = game.base_objects[id];
        let rl = input[2]-input[0];
        object.body.angularForce = rl*15000;
        object.body.applyForce([rl*100, 0], [0, 20]);
        if(object.body.contactingBody!=null){
            let pv = [0, 0];
            object.body.toWorldFrame(pv, [0, 20]);
            object.body.contactingBody.toLocalFrame(pv, pv);
            object.body.contactingBody.applyForce([-rl*100, 0], pv);
        }
    }
    function pJumpImpulse(bodyH, bodyL, contactPointH, contactPointL){
        if(contactPointH[1]<0||contactPointH[1]<Math.abs(contactPointH[0])){
            return;
        }
        //固定两者最终速度差
        /*let requested_dvy = -200;
        let dvy = bodyH.velocity[1]-bodyL.velocity[1];
        let ddvy_pre_Ns = bodyH.invMass+bodyL.invMass;
        let impulse = (requested_dvy-dvy)/ddvy_pre_Ns;
        bodyH.applyImpulse([0, impulse]);
        bodyL.applyImpulse([0, -impulse]);*/
        //消除垂直动能后固定作用力与加速距离
        //计算碰撞点相对速度
        let vhp = [0, 0], vlp=[0,0];
        bodyH.getVelocityAtPoint(vhp ,contactPointH);
        bodyL.getVelocityAtPoint(vlp ,contactPointL);
        let dvy = vhp[1]-vlp[1];
        //let dvy = bodyH.velocity[1]-bodyL.velocity[1];
        let ddvy_pre_Ns = bodyH.invMass+bodyL.invMass;
        let impulse = -dvy/ddvy_pre_Ns;
        bodyH.applyImpulse([0, impulse], contactPointH);
        bodyL.applyImpulse([0, -impulse], contactPointL);
        let ac_distance_rate = bodyH.invMass/(bodyH.invMass+bodyL.invMass);
        let ac_rate = Math.sqrt(ac_distance_rate);
        impulse = -250*ac_rate*bodyH.invMass;
        bodyH.applyImpulse([0, impulse], contactPointH);
        bodyL.applyImpulse([0, -impulse], contactPointL);
    }
    game.world.on("preSolve", function(e){
        //jump
        if(game.inputs[0][1]){
            for(let i=0; i<e.contactEquations.length; i++){
                let ce = e.contactEquations[i];
                if(ce.bodyA==game.base_objects[0].body){
                    pJumpImpulse(ce.bodyA, ce.bodyB, ce.contactPointA, ce.contactPointB);
                }
                if(ce.bodyB==game.base_objects[0].body){
                    pJumpImpulse(ce.bodyB, ce.bodyA, ce.contactPointB, ce.contactPointA);
                }
            }
        }
        if(game.inputs[1][1]){
            for(let i=0; i<e.contactEquations.length; i++){
                let ce = e.contactEquations[i];
                if(ce.bodyA==game.base_objects[1].body){
                    pJumpImpulse(ce.bodyA, ce.bodyB, ce.contactPointA, ce.contactPointB);
                }
                if(ce.bodyB==game.base_objects[1].body){
                    pJumpImpulse(ce.bodyB, ce.bodyA, ce.contactPointB, ce.contactPointA);
                }
            }
        }
        //contactingBody
        for(let i=0; i<e.contactEquations.length; i++){
            let ce = e.contactEquations[i];
            if(ce.bodyA==game.base_objects[0].body||ce.bodyA==game.base_objects[1].body){
                if(ce.bodyA.contactingBody==null||ce.bodyB.mass>ce.bodyA.contactingBody.mass)ce.bodyA.contactingBody = ce.bodyB;
            }
            if(ce.bodyB==game.base_objects[0].body||ce.bodyB==game.base_objects[1].body){
                if(ce.bodyB.contactingBody==null||ce.bodyA.mass>ce.bodyB.contactingBody.mass)ce.bodyB.contactingBody = ce.bodyA;
            }
        }
        //destination
        for(let i=0; i<e.contactEquations.length; i++){
            let ce = e.contactEquations[i];
            if((ce.bodyA==game.base_objects[2].body&&ce.bodyB==game.base_objects[0].body)||
            (ce.bodyB==game.base_objects[2].body&&ce.bodyA==game.base_objects[0].body)){
                if(game.base_objects[2].body.value==null)game.base_objects[2].body.value=0;
                game.base_objects[2].body.value+=game.tickInterval*2/3000;
            }
            if((ce.bodyA==game.base_objects[3].body&&ce.bodyB==game.base_objects[1].body)||
            (ce.bodyB==game.base_objects[3].body&&ce.bodyA==game.base_objects[1].body)){
                if(game.base_objects[3].body.value==null)game.base_objects[3].body.value=0;
                game.base_objects[3].body.value+=game.tickInterval*2/3000;
            }
        }
    });
    game.world.on("beginContact", function(e){
        if(e.bodyA==game.base_objects[0].body||e.bodyA==game.base_objects[1].body){
            if(e.bodyB!=game.base_objects[0].body&&e.bodyB!=game.base_objects[1].body)e.bodyA.contactingBody = e.bodyB;
        }
        if(e.bodyB==game.base_objects[0].body||e.bodyB==game.base_objects[1].body){
            if(e.bodyA!=game.base_objects[0].body&&e.bodyA!=game.base_objects[1].body)e.bodyB.contactingBody = e.bodyA;
        }
    });
    game.world.on("endContact", function(e){/*
        if(e.bodyA==game.base_objects[0].body||e.bodyA==game.base_objects[1].body){
            e.bodyA.contactingBody = null;
        }
        if(e.bodyB==game.base_objects[0].body||e.bodyB==game.base_objects[1].body){
            e.bodyB.contactingBody = null;
        }*/
    })
}
game.endGame = function(){
    if(!game.whohost)return;
    if(game.whohost=="youhost"||game.whohost=="hehost"||game.whohost=="local"){
        game.stopGame();
    }
    base_generator.destoryPhysics(game.base_objects);
    game.world = null;
    if(game.whohost=="youhoststopped"||game.whohost=="hehoststopped"){
        connection_manager.dataChannel.onmessage = function(){};
    }
    game.inputs = [[0, 0, 0, 0],[0, 0, 0, 0 ],[0, 0, 0, 0]];
    peerConnectionSendFunc = function(){};
    game.renderCache = null;
    base_generator.destoryGraphics(game.base_objects);
    game.base_objects = null;
    game.whohost = null;
}
game.addKeyListening = function(){
    document.addEventListener("keydown", function(e){
        switch(e.keyCode){
            case 37:
                game.inputs[0][0]=1;
                e.preventDefault();
                break;
            case 38:
                game.inputs[0][1]=1;
                e.preventDefault();
                break;
            case 39:
                game.inputs[0][2]=1;
                e.preventDefault();
                break;
            case 40:
                game.inputs[0][3]=1;
                e.preventDefault();
                break;
        }
        if(game.whohost=="local"){
            switch(e.keyCode){
                case 65:
                    game.inputs[1][0]=1;
                    e.preventDefault();
                    break;
                case 87:
                    game.inputs[1][1]=1;
                    e.preventDefault();
                    break;
                case 68:
                    game.inputs[1][2]=1;
                    e.preventDefault();
                    break;
                case 83:
                    game.inputs[1][3]=1;
                    e.preventDefault();
                    break;
            }
        }
        else if(game.whohost=="youhost"||game.whohost=="hehost"){
            switch(e.keyCode){
                case 65:
                    game.inputs[2][0]=1;
                    e.preventDefault();
                    break;
                case 87:
                    game.inputs[2][1]=1;
                    e.preventDefault();
                    break;
                case 68:
                    game.inputs[2][2]=1;
                    e.preventDefault();
                    break;
                case 83:
                    game.inputs[2][3]=1;
                    e.preventDefault();
                    break;
            }
        }
        if(e.keyCode==70){
        }
    })
    document.addEventListener("keyup", function(e){
        switch(e.keyCode){
            case 37:
                game.inputs[0][0]=0;
                e.preventDefault();
                break;
            case 38:
                game.inputs[0][1]=0;
                e.preventDefault();
                break;
            case 39:
                game.inputs[0][2]=0;
                e.preventDefault();
                break;
            case 40:
                game.inputs[0][3]=0;
                e.preventDefault();
                break;
        }
        if(game.whohost=="local"){
            switch(e.keyCode){
                case 65:
                    game.inputs[1][0]=0;
                    e.preventDefault();
                    break;
                case 87:
                    game.inputs[1][1]=0;
                    e.preventDefault();
                    break;
                case 68:
                    game.inputs[1][2]=0;
                    e.preventDefault();
                    break;
                case 83:
                    game.inputs[1][3]=0;
                    e.preventDefault();
                    break;
            }
        }
        else if(game.whohost=="youhost"||game.whohost=="hehost"){
            switch(e.keyCode){
                case 65:
                    game.inputs[2][0]=0;
                    e.preventDefault();
                    break;
                case 87:
                    game.inputs[2][1]=0;
                    e.preventDefault();
                    break;
                case 68:
                    game.inputs[2][2]=0;
                    e.preventDefault();
                    break;
                case 83:
                    game.inputs[2][3]=0;
                    e.preventDefault();
                    break;
            }
        }
    })
}
