
function startMatch(){
	if(game.whohost=="youhost"||game.whohost=="hehost"||game.whohost=="local"){
		document.getElementById("game_status").innerHTML = "进行在线游戏之前必须停止正在进行的游戏";
		return;
	}
	else if(game.whohost=="youhoststopped"||game.whohost=="hehoststopped"||game.whohost=="localstopped"){
		game.endGame();
	}
	//开启与服务器的连接
	connection_manager.startSocket();
	connection_manager.server_socket.onopen = function(){

		connection_manager.server_socket.send(JSON.stringify({tag:"match", key:""}));

		console.log("匹配中");
		connection_manager.setDistributionFunction("match_success", function(msg){
			connection_manager.setDistributionFunction("match_success", null);
			console.log("匹配成功");
			connection_manager.startPeerConnection(msg.whohost=="youhost");
			connection_manager.dataChannel.onopen = function(){
				game.prepareGame(msg.whohost, connection_manager.dataChannel);
				updateButtons();
				console.log("channel open");
				connection_manager.peerConnection.oniceconnectionstatechange = function(){
					console.log("peerConnection iceConnectionState "+connection_manager.peerConnection.iceConnectionState);
					if(connection_manager.peerConnection.iceConnectionState=="disconnected"){
						console.log("连接已中断");
						connection_manager.peerConnection.oniceconnectionstatechange = function(){};
					}
				}
			}
			connection_manager.peerConnection.oniceconnectionstatechange = function(){
				console.log("peerConnection iceConnectionState "+connection_manager.peerConnection.iceConnectionState);
				if(connection_manager.peerConnection.iceConnectionState=="completed"){
					connection_manager.server_socket.close();
					console.log("close socket");
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
		});
	}
}
function endGame(){
	connection_manager.setDistributionFunction("match_success", null);
	console.log("游戏已结束");
	if(game.whohost==null){
		return;
	}
	game.endGame();updateButtons();
	if(connection_manager.peerConnection!=null){
		connection_manager.closePeerConnection();
	}
}

function startLocal(){
	connection_manager.setDistributionFunction("pairing success", null);
	if(game.whohost=="local"||game.whohost=="localstopped"){
		game.endGame();
	}
	game.prepareGame("local");updateButtons();
}
function updateButtons(){
	if(game.whohost=="youhost"||game.whohost=="hehost"||game.whohost=="local"){
		document.getElementById("sm").style.visibility = "hidden";
		document.getElementById("sl").style.visibility = "hidden";
		document.getElementById("success").style.visibility = "hidden";
	}
	else if(game.whohost=="youhoststopped"||game.whohost=="hehoststopped"||game.whohost=="localstopped"){
		document.getElementById("sm").style.visibility = "hidden";
		document.getElementById("sl").style.visibility = "hidden";
		document.getElementById("success").style.visibility = "visible";
	}
	else{
		document.getElementById("sm").style.visibility = "visible";
		document.getElementById("sl").style.visibility = "visible";
		document.getElementById("success").style.visibility = "hidden";
	}
}