var connection_manager = {};
connection_manager.server_socket = null;
connection_manager.peerConnection = null;
connection_manager.dataChannel = null;

connection_manager.socketServer = null;
connection_manager.iceServers = [];
connection_manager.tagFuncMap = new Map();

connection_manager.startSocket = function(){
    this.server_socket = new WebSocket("wss://"+this.socketServer);
    this.server_socket.onmessage = function(e){connection_manager.distribute(e);};
    return this.server_socket;
}
connection_manager.closeSocket = function(){
    this.server_socket.close();
    this.server_socket = null;
}
connection_manager.distribute = function(e){
    var edata = e.data;
    if(e.data.charAt(0)=='>'){
        edata = e.data.substring(1, e.data.length);
    }
    var message = JSON.parse(edata);
    var func = connection_manager.tagFuncMap.get(message.tag);
    if(func){
        func(message);
    }
    else{
        console.log("Unlistened tag: "+message.tag);
    }
}
connection_manager.setDistributionFunction = function(tag, func){
    if(func){
        this.tagFuncMap.set(tag, func);
    }
    else{
        this.tagFuncMap.delete(tag);
    }
}
connection_manager.startPeerConnection = function(starter){
    if(connection_manager.peerConnection){
        console.log("Warning! Starting a peerconnection without closing the last one");
        connection_manager.closePeerConnection();
    }
    var option = {iceServers: this.iceServers};
    this.peerConnection = new RTCPeerConnection(option);
    var dataoption = {ordered: false, negotiated: true, id: 1};
    this.dataChannel = this.peerConnection.createDataChannel("gm", dataoption);
    if(starter){//to be the one to createOffer
        this.peerConnection.createOffer({offerToReceiveAudio: false, offerToReceiveVideo: false, voiceActivityDetection: false})
        .then(function(offer){
            connection_manager.peerConnection.setLocalDescription(offer);
            connection_manager.setDistributionFunction("answer", function(message){//listen to "answer" message to receive answer
                connection_manager.peerConnection.setRemoteDescription(message.answer);
                connection_manager.setDistributionFunction("answer", null);//no need to listen to "answer" message anynore
            });
            connection_manager.server_socket.send(">"+JSON.stringify({tag: "offer", offer: offer}));
        });
    }
    else{//to be the one to wait an offer and createAnswer
        this.setDistributionFunction("offer", function(message){//listen to "offer" message to receive offer
            connection_manager.peerConnection.setRemoteDescription(message.offer)
            .then(function(){
                connection_manager.peerConnection.createAnswer({offerToReceiveAudio: false, offerToReceiveVideo: false, voiceActivityDetection: false})
                .then(function(answer){
                    connection_manager.peerConnection.setLocalDescription(answer);
                    connection_manager.setDistributionFunction("offer", null);//no need to listen to "offer" message anymore
                    connection_manager.server_socket.send(">"+JSON.stringify({tag: "answer", answer: answer}));
                });
            });
        });
    }
    //ice candidate
    this.setDistributionFunction("candidate", function(message){//listen to "candidate" message
        if(message.candidate){
            connection_manager.peerConnection.addIceCandidate(message.candidate);
        }
        else{
            connection_manager.setDistributionFunction("candidate", null);//stop listening
        }
    });
    this.peerConnection.onicecandidate = (e)=>{
        this.server_socket.send(">"+JSON.stringify({tag: "candidate", candidate: e.candidate}));//send candidate to the other one
    }
    //state changes
    /*
    this.peerConnection.onconnectionstatechange = function(){
        console.log("peerConnection connectionState "+connection_manager.peerConnection.connectionState);
    }
    this.peerConnection.oniceconnectionstatechange = function(){
        console.log("peerConnection iceConnectionState "+connection_manager.peerConnection.iceConnectionState);
    }*/
}
connection_manager.closePeerConnection = function(){
    this.dataChannel.close();
    this.peerConnection.close();
    this.dataChannel = null;
    this.peerConnection = null;
}