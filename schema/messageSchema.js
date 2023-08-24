const mongoose = require("mongoose");
const {Schema} = mongoose;

const MessageSchema = new Schema({
    message : {type : String ,required : true} ,
    room : {type : String ,required : true} ,
    userName : {type : String ,required : true} ,
    __createdtime__ : {type : Date ,required : true}
})

const messageModel = mongoose.model("messageModel" ,MessageSchema);
module.exports = messageModel;