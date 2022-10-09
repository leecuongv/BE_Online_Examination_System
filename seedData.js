import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Role } from './models/Role.js';
import { User } from './models/User.js';
import { STATUS } from './utils/enum.js';
import bcrypt from "bcrypt";
dotenv.config()

const app=express();
const PORT = process.env.PORT ||5000;
const URI=process.env.MONGODB_URL;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true,limit:'3mb'}))//Giới hạn kích thước request gửi lên server phải nhỏ hơn 3mb


mongoose.connect(URI)
    .then(async()=>{
        const adminRole = new Role({name:"ADMIN"})
    const userRole = new Role({name:"USER"})
        const teacherRole = new Role({name:"TEACHER"})
        const admin = await adminRole.save()
        await userRole.save()
        await teacherRole.save()
        //const roles = await Role.find({ name: ROLES.ADMIN });
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("12345678", salt);
        const adminAcc = new User({
            username:'admin1',
            password:hash,
            email: 'server10.reply@gmail.com',
            role: admin._id,
            birthday:new Date(),
            status:STATUS.ACTIVE
        })
        adminAcc.save()
    }).catch(err=> {
        console.log('err',err)
    })


app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} `)
        })
app.get('/',(req,res)=>{
        res.send('SUCCESS');
    });