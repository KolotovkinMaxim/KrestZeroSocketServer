let WebSocketServer = new require('ws');
let portNumber = process.env.PORT || 5000;
let  webSocketServer = new WebSocketServer.Server({
    port: portNumber
});

let clients = {};
let logins = {};
let nameCounter = 1;
let rooms = [];

class Room{
    constructor(player_1){
        this.p1 = player_1;
        this.p2 = "empty";

        this.hod = "KKK";
        this.field = "ppppppppp";

        this.gameFinished = false;
    }

    addSecondPlayer(player_2){
        this.p2 = player_2;
    }

    isInRoom(player){
        if(this.p1 === player){
            return true;
        }
        if(this.p2 === player){
            return true;
        }
        return false;
    }

    setCharOfString(s,c,number){
        s = s.toString();
        c = c.toString();
        number = parseInt(number);
        let mass = [];
        mass = s.split("");
        mass[number] = c;
        let answer = mass.join("");
        return answer;

    }

    getKvNumber(xx,yy){
        const s = xx + "_" + yy;

        if(s === "0_0") return 0;
        if(s === "1_0") return 1;
        if(s === "2_0") return 2;

        if(s === "0_1") return 3;
        if(s === "1_1") return 4;
        if(s === "2_1") return 5;

        if(s === "0_2") return 6;
        if(s === "1_2") return 7;
        if(s === "2_2") return 8;

        return null;
    }

    printRoom(){
        console.log(this.p1 + " ____ " + this.p2);
    }

    getInfo(){
        let login_1 = "empty";
        let login_2 = "empty";
        if(this.p1 !== "empty") login_1 = logins[this.p1];
        if(this.p2 !== "empty") login_2 = logins[this.p2];
        return login_1 + "!" + login_2;
    }

    makeMove(id,xx,yy){
        if(this.gameFinished === false){
            xx = parseInt(xx);
            yy = parseInt(yy);
            const number = this.getKvNumber(xx, yy);

            if (this.field.charAt(number) === "p") {
                if (id === this.p1 && this.hod === "KKK") {
                    this.field = this.setCharOfString(this.field, "k", number);
                    this.hod = "ZZZ";
                    clients[this.p1].send("NEWFIELD@" + this.field);
                    clients[this.p2].send("NEWFIELD@" + this.field);
                    this.gameResultControl();
                    return;
                }

                if (id === this.p2 && this.hod === "ZZZ") {
                    this.field = this.setCharOfString(this.field, "z", number);
                    this.hod = "KKK";
                    clients[this.p1].send("NEWFIELD@" + this.field);
                    clients[this.p2].send("NEWFIELD@" + this.field);
                    this.gameResultControl();
                    return;
                }
            }
        }else{
            clients[id].send("GAME_IS_ALREADY_FINISHED");
        }
    }

    getKv(number){
        return this.field.charAt(number);
    }

    isPlayerWin(c){
        let t = this;
        if(t.getKv(0) === c && t.getKv(1) === c && t.getKv(2) === c) return true;
        if(t.getKv(3) === c && t.getKv(4) === c && t.getKv(5) === c) return true;
        if(t.getKv(6) === c && t.getKv(7) === c && t.getKv(8) === c) return true;

        if(t.getKv(0) === c && t.getKv(3) === c && t.getKv(6) === c) return true;
        if(t.getKv(1) === c && t.getKv(4) === c && t.getKv(7) === c) return true;
        if(t.getKv(2) === c && t.getKv(5) === c && t.getKv(8) === c) return true;

        if(t.getKv(2) === c && t.getKv(4) === c && t.getKv(6) === c) return true;
        if(t.getKv(0) === c && t.getKv(4) === c && t.getKv(8) === c) return true;

        return false;
    }

    isKKKwin(){
        return this.isPlayerWin("k");
    }

    isZZZwin(){
        return this.isPlayerWin("z");
    }

    isNichia(){
        if(this.isKKKwin() === true) return false;
        if(this.isZZZwin() === true) return false;

        for(let i = 0; i < this.field.length; i++) {
            if (this.getKv(i) === "p"){
                return false;
            }
        }
        return true;
    }

    gameResultControl(){
        if(this.isKKKwin() === true){
            clients[this.p1].send("GAMERESULT@" + "KRESTWIN");
            clients[this.p2].send("GAMERESULT@" + "KRESTWIN");
            this.gameFinished = true;
            return;
        }

        if(this.isZZZwin() === true){
            clients[this.p1].send("GAMERESULT@" + "ZEROWIN");
            clients[this.p2].send("GAMERESULT@" + "ZEROWIN");
            this.gameFinished = true;
            return;
        }

        if(this.isNichia() === true){
            clients[this.p1].send("GAMERESULT@" + "NICH");
            clients[this.p2].send("GAMERESULT@" + "NICH");
            this.gameFinished = true;
            return;
        }
    }
};

function getRoomByIdPfPlayer(playerId){
    const n = rooms.length;
    for(let i = 0; i < n; i++){
        let room = rooms[i];
        if(room.p1 === playerId || room.p2 === playerId){
            return room;
        }
    }
    return null;
}
function getInfoAboutAllRooms(){
    let answer = "ROOMSINFO";
    let n = rooms.length;
    for(let i = 0; i < n; i++){
        answer += ("@" + rooms[i].getInfo());
    }
    return answer;
}
function sendToAllClients(s){
    for (let key in clients) {
        clients[key].send(s);
    }
}
function printRooms(){
    console.log("\nRooms " + rooms.length + " :");
    let n = rooms.length;
    for(let i = 0; i < n; i++){
        rooms[i].printRoom();
    }
    console.log("\n\n");
}
function isClientExists(idParam){
    let id = idParam.toString();
    for (let key in clients) {
        if(id === key){
            return true;
        }
    }
    return false;
}
function writeAllClientsAndLogins(){
    let s = "\n\nClients and logins:\n";
    for (let key in clients) {
        s += (key + " " + logins[key] + "\n");
    }
    s += "\n\n";
    console.log(s);
}
function getType(s){
    let mass = [];
    mass = s.split("@");
    return mass[0];
}
function getIdNumber(s){
    s += "";
    let mass = [];
    mass = s.split("_");
    let number = mass[1];
    number = parseInt(number);
    return number;
}
function getIdByLogin(loginParam){
    let login = loginParam.toString();
    let mass = [];
    mass = login.split("_");
    const number = mass[1];
    const id = "id_" + number;
    return id;
}


webSocketServer.on("connection", function(ws) {

    let id = "id_" + nameCounter;
    nameCounter++;
    clients[id] = ws;
    console.log("добавился клиент " + id);
    clients[id].send("ID: " + id);

    sendToAllClients(getInfoAboutAllRooms());

    ws.on("message", function(message) {
        console.log("получено сообщение " + message + " от " + id);

        const messageType = getType(message);

        if(messageType === "LOGINNAME"){
            let mass = message.split("@");
            clients[id].send("LOGINCOMPLETE@" + mass[1].toString() + "_" + getIdNumber(id));
            logins[id] = mass[1].toString() + "_" + getIdNumber(id);
            writeAllClientsAndLogins();
        }

        if(messageType === "RUBBISH"){
            clients[id].send("RUBBISH@ANSWER___" + id);
        }

        if(messageType === "CREATEROOM"){
            let room = new Room(id);
            rooms.push(room);
            printRooms();
            sendToAllClients(getInfoAboutAllRooms());
        }

        if(messageType === "JOINGAME"){
            let mass = message.split("@");
            let loginOfEnemy = mass[1];
            let idOfEnemy = getIdByLogin(loginOfEnemy);
            let room = getRoomByIdPfPlayer(idOfEnemy.toString());
            room.addSecondPlayer(id);
            let arr = [];
            arr.push("TWOPLAYERSROOM");
            arr.push(room.p1);
            arr.push(room.p2);
            arr.push(logins[room.p1]);
            arr.push(logins[room.p2]);
            const answer = arr.join("@");
            clients[room.p1].send(answer);
            clients[room.p2].send(answer);
            printRooms();
            sendToAllClients(getInfoAboutAllRooms());
        }

        if(messageType === "MAKEMOVE"){
            let mass = [];
            mass = message.split("@");
            let xx = mass[1];
            let yy = mass[2];
            for(let i = 0; i < rooms.length; i++){
                if (rooms[i].isInRoom(id) === true){
                    let room = rooms[i];
                    room.makeMove(id,xx,yy);
                }
            }
        }

        if(messageType === "DELETEROOM"){
            for(let i = 0; i < rooms.length; i++){
                if(rooms[i].isInRoom(id) === true){
                    if(rooms[i].p1 !== "empty" && isClientExists(rooms[i].p1) === true) clients[rooms[i].p1].send("ROOM_WAS_DELETED@DEL");
                    if(rooms[i].p2 !== "empty" && isClientExists(rooms[i].p2) === true) clients[rooms[i].p2].send("ROOM_WAS_DELETED@DEL");
                    rooms.splice(i,1);
                    i = 0;
                }
            }
            printRooms();
            writeAllClientsAndLogins();
            sendToAllClients(getInfoAboutAllRooms());
        }

    });

    ws.on("close", function() {
        console.log("соединение закрыто " + id);
        delete clients[id];
        delete logins[id];

        for(let i = 0; i < rooms.length; i++){
            if(rooms[i].isInRoom(id) === true){
                if(rooms[i].p1 !== "empty" && isClientExists(rooms[i].p1) === true) clients[rooms[i].p1].send("ROOM_WAS_DELETED@DEL");
                if(rooms[i].p2 !== "empty" && isClientExists(rooms[i].p2) === true) clients[rooms[i].p2].send("ROOM_WAS_DELETED@DEL");
                rooms.splice(i,1);
                i = 0;
            }
        }

        printRooms();
        writeAllClientsAndLogins();
        sendToAllClients(getInfoAboutAllRooms());
    });
});
