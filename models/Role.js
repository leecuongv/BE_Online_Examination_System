import  mongoose  from "mongoose";

const schema = new mongoose.Schema({
    name:{
        type: String,
        require: true,
    }
},
 );

 export const Role = mongoose.model('Role',schema);