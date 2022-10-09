import mongoose from "mongoose";
import { STATUS ,TYPE_ACCOUNT} from "../utils/enum.js";
const schema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true,
        validate: {
            validator: item => {
                return item.length >= 6
            },
            message: "Tên đăng nhập phải dài hơn 5 kí tự"
        }
    },
    password: {
        type: String,
        require: true,
        validate: {
            validator: item => {
                return item.length >= 8
            },
            message: "Mật khẩu phải dài hơn 8 kí tự"
        }
    },
    email: {
        type: String,
        require: true,
        default: "Anonymous",
        validate: {
            validator: item => {
                return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(item)
            },
            message: "Email không hợp lệ"
        }
    },
    role: 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role"
        }
    ,
    fullname: {
        type: String,
        require: true,
        default: "Anonymous",
        validate: {
            validator: item => {
                return item.length <= 20
            },
            message: "Tên hiển thị phải ngắn hơn 20 ký tự"
        }
    },
    avatar: {
        type: String,

    },
    status: {
        type: String,
        require: true,
        default: STATUS.INACTIVE
    },
    birthday: {
        type: Date,
        required: true,
    },
    balance:{
        type:Number,
        require: true,
        default: 0
    },
    type:{
        type:String,
        require: true,
        default: TYPE_ACCOUNT.NORMAL
    },
    socialId:{
        type:String,
        require: true,
        default: ""
    },
    premium:{
        type:Boolean,
        require:true,
        default: false
    }
},
    { timestamps: true }
);

schema.pre('deleteOne', { query: true, document: false }, async function (next) {
    // 'this' is the client being removed. Provide callbacks here if you want
    // to be notified of the calls' result.
    let id = this.getQuery()['_id'];
    // await Comment.deleteMany({ userId: id })
    // await Reading.deleteMany({ userId: id })
    // await Novel.deleteMany({ nguoidangtruyen: id })
    next();
});

export const User = mongoose.model('User', schema);