base_generator = {};
base_generator.scene_div = null;
base_generator.globle_material = new p2.Material(1);
base_generator.lastTime = 0;
base_generator.gravity = [0, 0];

//input track
base_generator.inputs = [[0,0,0,0],[0,0,0,0]];
base_generator.imgPath = "";


base_generator.generateGraphics = function(base_objects){
    for(var i=0; i<base_objects.length; i++){
        add_object_to_scene(base_objects[i]);
    }
    base_generator.initCamare(base_objects);
    function add_object_to_scene(object){
        if(object.src){
            var element = document.createElement("img");
            element.src = base_generator.imgPath + object.src;
            element.style.width = object.width*base_generator.render_scale;
            element.style.height = object.height*base_generator.render_scale;
        }
        else if(object.tag=="destination1"||object.tag=="destination2"){
            var element = document.createElement("div");
            element.style.width = object.width*base_generator.render_scale;
            element.style.height = object.height*base_generator.render_scale;
            element.appendChild(document.createElement("div"));
            element.firstChild.style.backgroundColor = object.tag=="destination1"?"#FFCC00":"#FF6666";
            element.firstChild.style.width = "0%";
            element.firstChild.style.height = "100%";
            element.style.borderStyle = "solid";
            element.style.borderWidth = base_generator.render_scale+"px";
            element.style.borderColor = "#000000"
        }
        else{
            var element = document.createElement("div");
            element.style.width = object.width*base_generator.render_scale;
            element.style.height = object.height*base_generator.render_scale;
            element.style.backgroundColor = "#AAAAAA";
        }
        element.style.position = "absolute";
        element.style.top = object.y*base_generator.render_scale;
        element.style.left = object.x*base_generator.render_scale;
        element.style.transform = "translateY(-50%) translateX(-50%) rotate("+object.angle+"rad)";
        base_generator.scene_div.appendChild(element);
        object.element = element;
    }
}
base_generator.countCamareDestination = function(camWatch){
    //var camareLeadingFactor = 0;
    var tps = [];
    var sumps = [0, 0, 1];
    for(var i=0; i<base_generator.camObjects.length; i++){
        tps.push([tx,ty]);
    }
    //sumps[2]
    if(base_generator.camObjects.length>1){
        var tx, ty;
        tx = base_generator.camObjects[0].x; ty = base_generator.camObjects[0].y;
        sumps[0]+=tx; sumps[1]+=ty;
        tx = base_generator.camObjects[1].x; ty = base_generator.camObjects[1].y;
        sumps[0]+=tx; sumps[1]+=ty;
        sumps[0]/=2;
        sumps[1]/=2;

        tx = Math.abs(base_generator.camObjects[0].x-base_generator.camObjects[1].x)+400;
        ty = Math.abs(base_generator.camObjects[0].y-base_generator.camObjects[1].y)+400;
        sumps[2]=Math.max(tx/base_generator.scene_div.parentElement.parentElement.clientWidth,
            ty/base_generator.scene_div.parentElement.parentElement.clientHeight, 1);
    }
    else{
        sumps[0] = base_generator.camObjects[0].x; sumps[1] = base_generator.camObjects[0].y;
        sumps[2]=Math.max(400/base_generator.scene_div.parentElement.parentElement.clientlWidth,
            400/base_generator.scene_div.parentElement.parentElement.clientHeight, 1);
    }
    sumps[1]-=50;
    sumps[0]+=camWatch[0]*base_generator.scene_div.parentElement.parentElement.clientWidth;
    sumps[1]+=camWatch[1]*base_generator.scene_div.parentElement.parentElement.clientHeight;
    return sumps;
}
base_generator.initCamare = function(base_objects){
    base_objects.camareWatch = [0, 0];
    base_objects[0].vx = 0; base_objects[0].vy = 0; base_objects[0].va = 0;
    base_objects[1].vx = 0; base_objects[1].vy = 0; base_objects[1].va = 0;
    base_generator.currentCamWatch = [0, 0];
    base_generator.currentCamare = base_generator.countCamareDestination([0, 0]);
}
base_generator.moveCamare = function(deltaTick, camWatch){
    var approachRate = 2;
    var deltaTime = deltaTick/1000;
    var t = 1-Math.pow(1/Math.E, deltaTime*approachRate);

    base_generator.currentCamWatch[0] = base_generator.currentCamWatch[0]*(1-t)+camWatch[0]*t;
    base_generator.currentCamWatch[1] = base_generator.currentCamWatch[1]*(1-t)+camWatch[1]*t;
    var destination = base_generator.countCamareDestination(base_generator.currentCamWatch);
    base_generator.currentCamare[0] = base_generator.currentCamare[0]*(1-t)+destination[0]*t;
    base_generator.currentCamare[1] = base_generator.currentCamare[1]*(1-t)+destination[1]*t;
    base_generator.currentCamare[2] = base_generator.currentCamare[2]*(1-t)+destination[2]*t;
}
base_generator.destoryGraphics = function(base_objects){
    for(var i=0; i<base_objects.length; i++){
        base_objects[i].element = null;
    }
    base_generator.camObjects = null;
}
base_generator.render = function(base_objects){
    base_generator.scene_div.style.top = -base_generator.currentCamare[1]*base_generator.render_scale;
    base_generator.scene_div.style.left = -base_generator.currentCamare[0]*base_generator.render_scale;
    base_generator.scene_div.parentElement.style.transform = "scale("+1/base_generator.currentCamare[2]/base_generator.render_scale+")";
    for(var i=0; i<base_objects.length; i++){
        var object = base_objects[i];
        if(object.element){
            var element = object.element;
            element.style.top = object.y*base_generator.render_scale;
            element.style.left = object.x*base_generator.render_scale;;
            element.style.transform = "translateY(-50%) translateX(-50%) rotate("+object.angle+"rad)";
        }
    }
    base_objects[2].element.firstChild.style.width = (base_objects[2].value*100)+"%";
    base_objects[3].element.firstChild.style.width = (base_objects[3].value*100)+"%";
}
base_generator.generatePhysics = function(base_objects){
    // Create a physics world, where bodies and constraints live
    base_generator.world = new p2.World({
        gravity: base_generator.gravity
    });
    base_generator.world.addContactMaterial(new p2.ContactMaterial(
        base_generator.globle_material, base_generator.globle_material, {restitution: 0, friction: 0.5}));
    //add bodies
    for(var i=0; i<base_objects.length; i++){
        add_object_to_world(base_objects[i]);
    }
    //add constraints
    for(var i=0; i<base_objects.length; i++){
        if(base_objects[i].constraints!=null){
            let constraints = base_objects[i].constraints;
            let bodyA = base_objects[i].body;
            for(var j=0; j<constraints.length; j++){
                let bodyB = base_objects[i+constraints[j].offsetBA].body;
                add_constraint_to_world(bodyA, bodyB, constraints[j]);
            }
        }
    }
    base_objects[0].body.angularDamping = 0.9994;
    base_objects[1].body.angularDamping = 0.9994;
    //add_player_angularFriction(0);
    //add_player_angularFriction(1);
    function add_constraint_to_world(bodyA, bodyB, constraintInfo){
        var constraint;
        if(constraintInfo.type=="revolute"){
            constraint = new p2.RevoluteConstraint(bodyA, bodyB, constraintInfo.options);
        }
        else if(constraintInfo.type=="distance"){
            constraint = new p2.DistanceConstraint(bodyA, bodyB, constraintInfo.options);
            if(constraintInfo.options.upperLimit!=null){
                constraint.upperLimitEnabled = true; constraint.upperLimit = constraintInfo.options.upperLimit;
            }
            if(constraintInfo.options.lowerLimit!=null){
                constraint.lowerLimitEnabled = true; constraint.lowerLimit = constraintInfo.options.lowerLimit;
            }
        }
        else if(constraintInfo.type=="prismatic"){
            constraint = new p2.PrismaticConstraint(bodyA, bodyB, constraintInfo.options);
        }
        else if(constraintInfo.type=="gear"){
            constraint = new p2.GearConstraint(bodyA, bodyB, constraintInfo.options);
        }
        else if(constraintInfo.type=="lock"){
            constraint = new p2.LockConstraint(bodyA, bodyB, constraintInfo.options);
        }
        base_generator.world.addConstraint(constraint);
    }
    function add_player_angularFriction(id){
        let body = base_objects[id].body;
        let frictionBody = new p2.Body({position: [id*100, 200], mass:0.2, fixedX: true});
        frictionBody.addShape(new p2.Circle({radius: body.shapes[0].radius*2}));
        base_generator.world.addBody(frictionBody);
        let gearConstraint = new p2.GearConstraint(body, frictionBody);
        base_generator.world.addConstraint(gearConstraint);
    }

    function add_object_to_world(object){
        var option = {
            position: [object.x, object.y],
            angle: object.angle,
        };
        //mass
        if(object.tag=="fixed"){
        }
        else if(object.mass!=null){
            option.mass = object.mass;
        }
        else{
            option.mass = 1;
        }
        option.damping = object.damping; option.angularDamping = object.angularDamping;
        var body = new p2.Body(option);
        //shape
        var shape;
        if(object.shape){
            if(object.shape.type == "convex"){
                let vertices = [];
                for(let i=0; i<object.shape.vertices.length; i++){
                    vertices.push([object.shape.vertices[i][0]*object.width, object.shape.vertices[i][1]*object.height]);
                }
                body.fromPolygon(vertices);
            }
            else if(object.shape.type == "circle"){
                shape = new p2.Circle(object.shape);
                body.addShape(shape);
            }
            else if(object.shape.type == "null"){
                //no shape body
            }
        }
        else{//box by deafult
            shape = new p2.Box({width: object.width, height: object.height});
            body.addShape(shape);
        }
        //material
        for(let i=0; i<body.shapes.length; i++){
            body.shapes[i].material = base_generator.globle_material;
        }
        base_generator.world.addBody(body);
        object.body = body;
    }
    return base_generator.world;
}
base_generator.destoryPhysics = function(base_objects){
    for(var i=0; i<base_objects.length; i++){
        base_objects[i].body = null;
    }
    base_generator.world = null;
}
base_generator.playerObject = function(tag){
    var obj = {x:0+base_generator.debug_offset[0], y:-300+base_generator.debug_offset[1],
         angle:0, width:40, height:40, damageSum:0, mass:1,
    shape:{type:"circle", radius: 20}};
    obj.tag = tag;
    if(tag=="player1"){
        obj.src="huaji.png";
        obj.x=50+base_generator.debug_offset[0];
    }
    else{
        obj.src="yinxian.png";
        obj.x=-50+base_generator.debug_offset[0];
    }
    return obj;
}
base_generator.level = function(i){
    let base_objects = [];
    if(i==0){
        base_objects.push(base_generator.playerObject("player1")); //p1body
        base_objects.push(base_generator.playerObject("player2")); //p2body
        
        base_objects.push({x:1100, y:-1690, width:100, height:16, angle:0, tag:"destination1", mass:0, value:0});
        base_objects.push({x:900, y:-1690, width:100, height:16, angle:0, tag:"destination2", mass:0, value:0});
        base_objects.push({x:1100, y:-1790, width:30, height:30, angle:0, tag:"fixed", src:"huaji.png", shape:{type:"null"}});
        base_objects.push({x:900, y:-1790, width:30, height:30, angle:0, tag:"fixed", src:"yinxian.png", shape:{type:"null"}});

        base_objects.push({x:-750, y:-430, width:800, height:100, angle:88, tag:"fixed", src:"wood_solid.png"}); //left wall
        base_objects.push({x:-530, y:10, width:500, height:30, angle:4, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:0, y:0, width:500, height:30, angle:-1, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:300, y:-150, width:280, height:30, angle:-40, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:650, y:-190, width:460, height:30, angle: 10, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:893, y:-240, width:160, height:15, angle:-86, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1040, y:-320, width:300, height:15, angle:1, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1100, y:-410, width:120, height:120, angle:0, tag:"body", src:"wood_circle.png", 
            shape:{type:"circle", radius: 60}, mass: 4}); //a ball
        base_objects.push({x:1350, y:-325, width:300, height:15, angle:-3, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1500, y:-740, width:800, height:50, angle:90, tag:"fixed", src:"wood_solid.png"}); //one right wall
        base_objects.push({x:760, y:-470, width:180, height:15, angle:90, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1400, y:-400, width:150, height:15, angle:2, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1230, y:-540, width:150, height:15, angle:36, tag:"fixed", src:"wood_solid.png"}); //floor

        base_objects.push({x:940, y:-570, width:150, height:15, angle:0, tag:"box", src:"wood_box_short.png", mass:10}); //a floating bridge
        base_objects.push({x:940, y:-650, width:150, height:15, angle:90, tag:"box", src:"wood_constraint_1.png", mass:0.01, 
            shape:{type:"circle", radius:100, collisionGroup:0, collisionMask:0},
            constraints:[{type: "lock", offsetBA:-1},
                {type: "revolute", offsetBA: 1, options:{worldPivot:[940, -720]}}]}); //a holder
        base_objects.push({x:940, y:-720, width:50, height:50, angle:0, tag:"fixed", src:"wood_hinge.png", shape:{type:"null"}}); //hinge

        base_objects.push({x:760, y:-640, width:130, height:15, angle:80, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:750, y:-710, width:130, height:15, angle:10, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:650, y:-720, width:80, height:15, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:650, y:-790, width:120, height:120, angle:0, tag:"body", src:"wood_circle.png", 
            shape:{type:"circle", radius: 60}, mass: 4}); //a ball
        base_objects.push({x:480, y:-420, width:300, height:18, angle:20, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:950, y:-940, width:1000, height:40, angle:7, tag:"fixed", src:"wood_solid.png"}); //floor

        base_objects.push({x:125, y:-470, width:400, height:70, angle:8, tag:"box", src:"wood_box_short.png", mass:10, constraints:[
            {type: "revolute", offsetBA: 1, options:{worldPivot:[100,-435]} }
        ]}); //a floating bridge
        base_objects.push({x:100, y:-435, width:50, height:50, angle:0, tag:"fixed", src:"wood_hinge.png", shape:{type:"null"}}); //hinge
        base_objects.push({x:-60, y:-685, width:300, height:18, angle:90, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:-200, y:-335, width:300, height:18, angle:-7, tag:"fixed", src:"wood_solid.png"}); //floor

        base_objects.push({x:200, y:-900, width:500, height:18, angle:-14, tag:"fixed", src:"wood_solid.png"}); //high wall
        
        base_objects.push({x:-520, y:-335, width:300, height:18, angle:4, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:-250, y:-520, width:390, height:18, angle:-30, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:-450, y:-620, width:500, height:18, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:-200, y:-620, width:30, height:30, angle:0, tag:"fixed", src:"wood_hinge.png", shape:{type:"null"}}); //hinge
        base_objects.push({x:-155, y:-635, width:80, height:10, angle:-15, tag:"box", src:"wood_box_short.png", mass:2, constraints:[
            {type: "revolute", offsetBA: -1, options:{worldPivot:[-200,-620]} }
        ]}); //a cover

        base_objects.push({x:-400, y:-800, width:70, height:70, angle:0, tag:"fixed", src:"wood_hinge.png", shape:{type:"null"}}); //hinge
        base_objects.push({x:-400, y:-660, width:130, height:20, angle:0, tag:"box", src:"wood_box_short.png", mass:2, constraints:[
            {type: "revolute", offsetBA: -1, options:{worldPivot:[-400,-800]} }
        ], damping: 0, angularDamping:0}); //a bridge
        base_objects.push({x:-280, y:-690, width:130, height:20, angle:-25, tag:"box", src:"wood_box_short.png", mass:2, constraints:[
            {type: "lock", offsetBA: -1, options:{collideConnected: false}}
        ], damping: 0, angularDamping:0}); //a bridge
        base_objects.push({x:-520, y:-690, width:130, height:20, angle:25, tag:"box", src:"wood_box_short.png", mass:2, constraints:[
            {type: "lock", offsetBA: -2, options:{collideConnected: false}}
        ], damping: 0, angularDamping:0}); //a bridge
        base_objects.push({x:-400, y:-780, width:250, height:30, angle:90, tag:"box", src:"wood_constraint_1.png", mass:0.01, 
        shape:{type:"circle", radius:100, collisionGroup:0, collisionMask:0},
        constraints:[{type: "lock", offsetBA:-3}]}); //a holder shape
        base_objects.push({x:0, y:-860, width:150, height:10, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor

        base_objects.push({x:-100, y:-1000, width:400, height:15, angle:16, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:-500, y:-1100, width:440, height:15, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:-800, y:-1400, width:1100, height:100, angle:88, tag:"fixed", src:"wood_solid.png"}); //a left wall
        //rail
        base_objects.push({x:500, y:-1300, width:1500, height:10, angle:-3, tag:"fixed", src:"wood_solid.png"}); //main rail
        base_objects.push({x:-250, y:-1280, width:50, height:10, angle:90, tag:"fixed", src:"wood_solid.png"}); //rail left
        base_objects.push({x:-230, y:-1320, width:50, height:10, angle:-3, tag:"fixed", src:"wood_solid.png"}); //rail left
        base_objects.push({x:1250, y:-1370, width:50, height:10, angle:90, tag:"fixed", src:"wood_solid.png"}); //rail right
        base_objects.push({x:1230, y:-1390, width:50, height:10, angle:-3, tag:"fixed", src:"wood_solid.png"}); //rail right
        
        base_objects.push({x:300, y:-1345, width:900, height:10, angle:-3, tag:"fixed", src:"wood_solid.png"}); //upper rail
        base_objects.push({x:-150, y:-1340, width:50, height:10, angle:90, tag:"fixed", src:"wood_solid.png"}); //rail left
        base_objects.push({x:300, y:-1400, width:900, height:10, angle:-3, tag:"fixed", src:"wood_solid.png"}); //rail up

        base_objects.push({x:0, y:-1190, width:200, height:10, angle:0, tag:"box", src:"wood_box_short.png",
        mass:2, damping: 0, angularDamping:0}); //car body
        base_objects.push({x:100, y:-1360, width:40, height:40, angle:0, tag:"body", src:"wood_wheel.png",
            shape:{type:"circle", radius: 20}, mass: 0.1, constraints:[{
                type:"revolute", offsetBA:-1, options:{localPivotA:[0,0], localPivotB:[100,-170]}
            }], damping: 0, angularDamping:0}); //car wheel
        base_objects.push({x:-100, y:-1360, width:40, height:40, angle:0, tag:"body", src:"wood_wheel.png",
            shape:{type:"circle", radius: 20}, mass: 0.1, constraints:[{
                type:"revolute", offsetBA:-2, options:{localPivotA:[0,0], localPivotB:[-100,-170]}
            }], damping: 0, angularDamping:0}); //car wheel
        base_objects.push({x:-100, y:-1280, width:170, height:6, angle:90, tag:"box", src:"wood_constraint_1.png", mass:0.01, 
            shape:{type:"circle", radius:100, collisionGroup:0, collisionMask:0},
            constraints:[{type: "lock", offsetBA:-3}]}); //a holder shape
        base_objects.push({x:100, y:-1280, width:170, height:6, angle:90, tag:"box", src:"wood_constraint_1.png", mass:0.01, 
            shape:{type:"circle", radius:100, collisionGroup:0, collisionMask:0},
            constraints:[{type: "lock", offsetBA:-4}]}); //a holder shape
        
        base_objects.push({x:1500, y:-1540, width:800, height:50, angle:90, tag:"fixed", src:"wood_solid.png"}); //one right wall
        base_objects.push({x:1360, y:-1150, width:200, height:10, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1400, y:-1240, width:140, height:10, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1300, y:-1330, width:100, height:10, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        
        base_objects.push({x:1420, y:-1420, width:100, height:10, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1220, y:-1510, width:40, height:10, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        base_objects.push({x:1000, y:-1600, width:100, height:10, angle:0, tag:"fixed", src:"wood_solid.png"}); //floor
        
        base_objects.push({x:1500, y:-2340, width:800, height:50, angle:90, tag:"fixed", src:"wood_solid.png"}); //one right wall
    }
    for(let i=0; i<base_objects.length; i++){
        base_objects[i].angle *= Math.PI/180;
    }
    return base_objects;
}

base_generator.debug_offset = [1100, -1500];
//base_generator.debug_offset = [0, 0];
