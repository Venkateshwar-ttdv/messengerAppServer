const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const messageModel = require("./schema/messageSchema.js");
const mongoose = require("mongoose");

require("dotenv").config();
const {Server} = require("socket.io");

const server = http.createServer(app);
app.use(cors());
app.use(express.json());

main().catch((err) => {
    console.log(err);
})

async function main() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database has been connected");
}

const io = new Server(server , {
    cors : {
        origin : process.env.FRONT ,
        methods : ["GET" ,"POST"]
    }
})
const CHAT_BOT = "ChatBot";

let chatRoom = "";
let allUsers = [];
io.on("connection" ,(socket) => {
    socket.on('join_room' ,(data) =>{
       
        const {userName ,room} = data;
        socket.join(room);

        let __createdtime__ = Date.now();
        socket.to(room).emit("receive_message" ,{
            message : `${userName} has joined ${room}` ,
            userName : CHAT_BOT ,
            __createdtime__  
        })
        
        socket.emit("receive_message" ,{
            message : `welcome ${userName} to ${room}` ,
            userName : CHAT_BOT ,
            __createdtime__
        })

        chatRoom = room;
        allUsers.push({id : socket.id ,userName ,room});
        chatRoomUsers = allUsers.filter((user) => user.room === room);
        socket.to(room).emit("chatroom_users" ,chatRoomUsers);
        socket.emit("chatroom_users" ,chatRoomUsers);
        
        getDB().catch((err) => console.log(err));

        async function getDB() {
            const messageList = await messageModel.find({room : {$eq : room}}).sort({__createdtime__ : -1}).limit(100);
            socket.emit("last_100_messages" ,messageList);
        }
    });

    socket.on("send_message" ,(data) => {
        io.in(data.room).emit("receive_message" ,data);
        const entry = new messageModel(data);
        entry.save().then(console.log("Object Created in DB")).catch((err) => console.log(err));
        
    });

    socket.on("leave_room" ,(data) => {
        
        const {userName ,room} = data;
        socket.leave(room);
        const __createdtime__ = Date.now();
        allUsers = allUsers.filter((user) => user.userName !== userName);
        socket.to(room).emit("receive_message" ,{
            userName : CHAT_BOT ,
            message : `${userName} has left the chat` ,
            __createdtime__
        })

        socket.to(room).emit("chatroom_users" ,allUsers);
    });


    socket.on("disconnect" ,() => {
        const user = allUsers.find((user) => user.id === socket.id);
        if(user?.userName) {
            allUsers = allUsers.filter((e) => e.userName !== user.userName);
            socket.to(user.room).emit("chatroom_users" ,allUsers);
            const __createdtime__ = Date.now();
            socket.to(user.room).emit("receive_message" ,{
                message : `${user.userName} is disconnected from the chat` ,
                userName : CHAT_BOT ,
                __createdtime__
            })
        }
    });
})

const port = process.env.PORT || 8080;
server.listen(port ,() => {
    console.log("server is running on port 8080");
})

