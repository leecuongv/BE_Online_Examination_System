import  mongoose  from "mongoose";
import {Comment} from './Comment.js';
import { Novel } from "./Novel.js";
import { Reading } from "./Reading.js";
const schema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique:true,
        validate:{
            validator:item=>{
                return item.length >= 6
            },
            message:"Tên đăng nhập phải dài hơn 5 kí tự"
        }
    },
    password: {
        type:String,
        require: true,
        validate:{
            validator:item=>{
                return item.length >= 8
            },
            message:"Mật khẩu phải dài hơn 8 kí tự"
        }
    },
    email: {
        type: String,
        require: true,
        default: "Anonymous",
        validate:{
            validator:item=>{
                return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(item)
            },
            message:"Email không hợp lệ"
        }
    },
    roles:[
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role"
        }
      ],
    tenhienthi:{
        type: String,
        require: true,
        default: "Anonymous",
        validate:{
            validator:item=>{
                return item.length<=20
            },
            message:"Tên hiển thị phải ngắn hơn 20 ký tự"
        }
    },
    image:{
        type:String,

    },
    active:{
        type:Boolean,
        require: true,
        default:false
    },
    birthdate:{
        type:Date,
        required:true,
    }
},
    {timestamps:true}
 );

 schema.pre('deleteOne', { query: true, document: false },async function(next) {
    // 'this' is the client being removed. Provide callbacks here if you want
    // to be notified of the calls' result.
    let id=this.getQuery()['_id'];
    await Comment.deleteMany({userId: id})
    await Reading.deleteMany({userId:id})
    await Novel.deleteMany({nguoidangtruyen:id})
    next();
});

 export const User = mongoose.model('User',schema);