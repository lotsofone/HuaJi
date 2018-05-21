
async function startMatch(){
	if(game.whohost=="youhost"||game.whohost=="hehost"||game.whohost=="local"){
		document.getElementById("game_status").innerHTML = "进行在线游戏之前必须停止正在进行的游戏";
		return;
	}
	else if(game.whohost=="youhoststopped"||game.whohost=="hehoststopped"||game.whohost=="localstopped"){
		game.endGame();
	}

	try{
		await connection_manager.server_socket.send(JSON.stringify({tag:"match", key:""}));
	}
	catch(reason){
		document.getElementById("game_status").innerHTML = "暂未连接上服务器，请等待几秒后重试";
		return;
	}
	console.log("匹配中");
	connection_manager.setDistributionFunction("match_success", function(msg){
		connection_manager.setDistributionFunction("match_success", null);
		console.log("匹配成功");
		tryp2p(msg);
	});
}
function tryp2p(msg){
	connection_manager.startPeerConnection(msg.whohost=="youhost");
	connection_manager.dataChannel.onopen = function(){
		game.prepareGame(msg.whohost, connection_manager.dataChannel);
		console.log("channel open");
		connection_manager.peerConnection.oniceconnectionstatechange = function(){
			console.log("peerConnection iceConnectionState "+connection_manager.peerConnection.iceConnectionState);
			if(connection_manager.peerConnection.iceConnectionState=="disconnected"){
				console.log("连接已中断");
			}
			connection_manager.peerConnection.oniceconnectionstatechange = function(){};
		}
	}
	connection_manager.dataChannel.onerror = function(e){
		game.stopGame();
		console.log("channel error:"+JSON.stringify(e));
	}
	connection_manager.dataChannel.onclose = function(){
		game.stopGame();
		console.log("channel closed");
	}
	//retry
	connection_manager.peerConnection.oniceconnectionstatechange = function(){
		console.log("peerConnection iceConnectionState "+connection_manager.peerConnection.iceConnectionState);
		if(connection_manager.peerConnection.iceConnectionState=="failed"){
			console.log("retrying");
			console.log("正在尝试重连");
			connection_manager.closePeerConnection();
			tryp2p();
		}
	}
}
function closeMatch(){
	connection_manager.setDistributionFunction("pairing success", null);
	console.log("游戏已结束");
	if(game.whohost==null){
		return;
	}
	game.endGame();
	if(connection_manager.peerConnection!=null){
		connection_manager.closePeerConnection();
	}
}

function startLocal(){
	connection_manager.setDistributionFunction("pairing success", null);
	if(game.whohost=="local"||game.whohost=="localstopped"){
		game.endGame();
	}
	game.prepareGame("local");
}