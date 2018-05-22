
game.init();
//设置服务器
connection_manager.socketServer = "www.tianzhipengfei.xin/loo";
connection_manager.iceServers = [{urls: "stun:stun.xten.com"}, {urls: "stun:stun.sipgate.net:10000"},
    {urls: "stun:stun.freeswitch.org"},
    //{urls: "turn:47.95.195.115:3478?transport=tcp", username:"lijingmao", credential:"lijingmao"},
    {urls: "turn:47.95.195.115:3478?transport=udp", username:"lijingmao", credential:"lijingmao"},
    //{urls: "turn:47.95.195.115:5349?transport=tcp", username:"lijingmao", credential:"lijingmao"},
    {urls: "turn:47.95.195.115:5349?transport=udp", username:"lijingmao", credential:"lijingmao"}];
base_generator.imgPath = "images/";

//startLocal();
