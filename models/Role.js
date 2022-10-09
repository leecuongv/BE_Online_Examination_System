import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
    }
},
);

schema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
  });
  
export const Role = mongoose.model('Role', schema);