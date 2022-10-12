import bcrypt from "bcrypt";
import { Course } from "../models/Course.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import generator from "generate-password"
import { ROLES, STATUS } from "../utils/enum.js";
export const CourseController = {
    CreateCourse: async (req, res) => {
        try {
            const {slug, name, description, image,userId} =req.body
            
            const newCourse = await new Course({
                name,
                slug,
                description,
                image,
                creatorId:userId
            });

            
            let error = newCourse.validateSync();
            if(error)
                return res.status(400).json({ 
                    message: "Tạo khoá học không thành công"})
            
            const course = await newCourse.save();
                
            return res.status(200).json({
                message:"Tạo khoá học thành công",
                slug:course._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({message: "Lỗi tạo khoá học" })
        }
    },
    getCourseBySlug: async (req, res) => {
        try {
            const {slug} =req.query
            console.log(slug)
            const course = await Course.findOne({slug:slug})
            console.log(course)
            if(course){
                const {name, description, exams,image,status} = course._doc
                return res.status(200).json({name, description, exams,image,status})
            }

            return res.status(400).json({
                message:"Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({message: "Lỗi tạo khoá học" })
        }
    },
    UpdateCourse: async (req, res) => {//nhớ sửa
        try {
            const {slug, name, description, image,userId} =req.body
            
            const newCourse = await new Course({
                name,
                slug,
                description,
                email,
                image,
                creatorId:userId
            });

            
            let error = newCourse.validateSync();
            if(error)
                return res.status(400).json({ 
                    message: "Tạo khoá học không thành công"})
            
            const course = await newCourse.save();
                
            return res.status(200).json({
                message:"Tạo khoá học thành công",
                slug:course._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({message: "Lỗi tạo khoá học" })
        }
    },
}