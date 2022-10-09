import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { ResponseData, ResponseDetail } from "../services/ResponseJSON.js";
import { Role } from "../models/Role.js";
import { sendMail } from "../services/EmailService.js";
import mongoose from "mongoose";
import generator from "generate-password"
import { ROLES, STATUS } from "../utils/enum.js";
import { generateAccessToken, generateRefreshToken } from "../services/jwtService.js";
export const AuthController = {
    

    RegisterUser: async (req, res) => {
        try {
            const {username, password, fullname, email,role} =req.body
            if(role===ROLES.ADMIN){
                return res.status(400).json({
                    message:"Không thể tạo tài khoản"
                })
            }
            const roleEntity = await Role.findOne({ name: role });
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            if(!roleEntity){
                return res.status(400).json({
                    message:"Không thể tạo tài khoản"
                })
            }
            const newUser = await new User({
                fullname: fullname,
                username: username,
                password: hash,
                email: email,
                role: roleEntity.id,
                birthday:new Date()
            });

            let temp = (await User.findOne({ username: username }))
            if (temp) {
                return res.status(400).json({ username: "Username đã tồn tại" })
            }
            let error = newUser.validateSync();
            if(error)
                return res.status(400).json({ 
                    message: error.errors['email']?.message||error.errors['username']?.message })

            // temp = (await User.findOne({ email: req.body.email }))
            // if (temp) {
            //     return res.status(400).json(ResponseDetail(400, { username: "Email đã tồn tại" }))
            // }
            const activeCode = jwt.sign(
                { email },
                process.env.JWT_ACCESS_KEY,
                { expiresIn: "15m" }
            )
            sendMail(email , "Kích hoạt tài khoản", process.env.CLIENT_URL + "active/" + activeCode)
            await newUser.save();
            return res.status(200).json({
                message:"Tạo tài khoản thành công"
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo tài khoản" })
        }
    },

    LoginUser: async (req, res) => {
        try {
            const {username, password} = req.body
            const user = await User.findOne({ username: username }).populate("role");

            if (!user) {
                return res.status(404).json({ username: "Sai tên đăng nhập hoặc mật khẩu" })
            }
            const auth = await bcrypt.compare(password, user.password)
            if (auth) {
                if(user.status !== STATUS.ACTIVE){
                    return res.status(403).json({ message: "Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra lại email kích hoạt" })
                }
                const data = {
                    sub: user.username,
                    role: user.role?.name
                };
                const accessToken = generateAccessToken(data);
                const refreshToken = generateRefreshToken(data);
                const { username, fullname, avatar, role } = user._doc;
                res.cookie("token", refreshToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "strict"
                })
                return res.status(200).json({
                    username,
                    fullname,
                    avatar,
                    accessToken,
                    refreshToken,
                    role: role.name
                });
            }
            return res.status(404).json({ username: "Sai tên đăng nhập hoặc mật khẩu" })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi đăng nhập" })
        }
    },

    RefreshToken: async (req, res) => {
        try {
            const refreshToken = req.body.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({message:"Bạn chưa có token"})
            }

            jwt.verify(refreshToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                if (err) {
                    console.log("Lỗi:" + err)
                    return res.status(500).json({ message: "Token sai" })
                }
                else {
                    const { iat, exp, ...data } = user;
                    const newAccessToken = generateAccessToken(data);
                    const newRefreshToken = generateRefreshToken(data);
                    console.log("refresh")
                    res.cookie("token", newRefreshToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "strict"
                    })
                    return res.status(200).json({ 
                        refreshToken: newRefreshToken, 
                        accessToken: newAccessToken 
                    });
                }
            })

        } catch (error) {
            console.log(error)
            res.status(500).json(error)
        }
    },

    
    ReActive: async (req, res) => {
        try {
            const email = req.body.email;
            console.log(email)
            if (email) {
                const user = await User.findOne({ email: email })
                if (user) {
                    if (user.status === STATUS.ACTIVE)
                        return res.status(400).json({ message: "Tài khoản đã được kích hoạt" })
                    const activeCode = jwt.sign(
                        { email },
                        process.env.JWT_ACCESS_KEY,
                        { expiresIn: "15m" }
                    )
                    console.log("active:" + activeCode);
                    sendMail(email, "Kích hoạt tài khoản", process.env.CLIENT_URL + "active/" + activeCode)
                        .then(response => {
                            console.log(response)
                            return res.status(200).json({ message: "Đã gửi mail kích hoạt. Vui lòng kiểm tra trong hộp thư của email" })
                        })
                        .catch(err => {
                            console.log(err)
                            return res.status(500).json({ message: "Lỗi gửi mail kích hoạt. Vui lòng thử lại" })
                        })
                }
                else {
                    return res.status(400).json({ message: "Tài khoản không tồn tại" })
                }

            } else {
                res.status(400).json({ message: "Thiếu email" });
            }
        } catch (error) {
            res.status(500).json({ message: "Lỗi xác thực" })
        }
    },

    Forgotpassword: async (req, res) => {
        try {
            const email = req.body.email;
            var password = generator.generate({
                length: 12,
                numbers: true,
            });
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            if (email) {
                const user = await User.findOne({ email: email })
                if (user) {
                    const newUser = await User.findOneAndUpdate({email: email },{password:hash},{new:true})
                    
                    sendMail(email, "Mật khẩu mới", "Mật khẩu mới của tài khoản:"+password)
                        .then(response => {
                            console.log(response)
                            return res.status(200).json({ message: "Đã gửi mật khẩu mới" })
                        })
                        .catch(err => {
                            console.log(err)
                            return res.status(500).json({ message: "Lỗi gửi mail" })
                        })

                }
                else {
                    return res.status(400).json({ message: "Tài khoản không tồn tại" })
                }

            } else {
                res.status(400).json({ message: "Thiếu email" });
            }
        } catch (error) {
            res.status(500).json("Lỗi xác thực")
        }
    },

    Active: async (req, res) => {
        try {
            const key = req.query.key;
            if (key) {
                jwt.verify(key, process.env.JWT_ACCESS_KEY, async (err, user) => {
                    if (err) {
                        console.log(err)
                        return res.status(400).json( { message: "Mã kích hoạt hết hạn" })
                    }
                    const email = user.email
                    const newUser = await User.findOneAndUpdate({ email: email }, { status: STATUS.ACTIVE }, { new: true })
                    console.log(newUser)
                    if (newUser) {
                        return res.status(200).json({ message: "Kích hoạt thành công" })
                    }
                    return res.status(400).json({ message: "Kích hoạt không thành công" })

                })
            }
            else {
                return res.status(400).json( { message: "Không có mã kích hoạt" })
            }

        } catch (error) {
            return res.status(500).json({ message: "Lỗi kích hoạt" })
        }
    },

    verifyToken: async (req, res) => {
        const token = req.headers.authorization;
        if (token) {
            const accessToken = token.split(" ")[1];
            console.log(accessToken)
            jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                if (err) {
                    return res.status(403).json({ message: "Token không hợp lệ" });
                }
                return res.status(200).json( { message: "Hợp lệ" })
            })
        } else {
            return res.status(401).json({ message: "Không có token" });
        }
    },

    activeByAdmin: async (req, res) => {
        try {
            const id = req.body.id;
            const updateUser = await User.findByIdAndUpdate({ _id: id }, { active: STATUS.ACTIVE }, { new: true }).populate('role')

            if (updateUser)
                return res.status(200).json(updateUser)
            return res.status(400).json({message:"Kích hoạt thất bại"})
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi cập nhật quyền tài khoản" })
        }
    },

    inactiveByAdmin: async (req, res) => {
        try {
            const id = req.body.id;
            const userId=new mongoose.Types.ObjectId(id)
            const updateUser = await User.findByIdAndUpdate({ _id: userId }, { status: STATUS.INACTIVE }, { new: true }).populate('role')
            if (updateUser)
                return res.status(200).json(updateUser)
            return res.status(400).json({message:"Khoá thất bại"})
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi cập nhật quyền tài khoản" })
        }
    },

    checkUsername: async (req, res) => {
        try {
            const username = req.body.username;
            const user = await User.findOne({ username:username })
            if (user)
                return res.status(200).json({message:"Tên đăng nhập đã tồn tại trong hệ thống",valid: false})
            return res.status(200).json({message:"Tên đăng nhập hợp lý",valid: true})
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi",valid: false })
        }
    },
    checkEmail: async (req, res) => {
        try {
            const email = req.body.email;
            const user = await User.findOne({ email:email })
            if (user)
                return res.status(200).json({message:"Email đã tồn tại trong hệ thống",valid: false})
            return res.status(200).json({message:"Email hợp lý",valid: true})
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi",valid: false })
        }
    }
    
}