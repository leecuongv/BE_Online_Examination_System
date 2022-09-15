import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { ResponseData, ResponseDetail } from "../services/ResponseJSON.js";
import { Role } from "../models/Role.js";
import { sendMail } from "../services/EmailService.js";
import mongoose from "mongoose";
import generator from "generate-password"
export const AuthController = {
    generateAccessToken: (data) => {
        const accessToken = jwt.sign(
            data,
            process.env.JWT_ACCESS_KEY,
            { expiresIn: "2h" }
        )
        return accessToken
    },

    generateRefreshToken: (data) => {
        const accessToken = jwt.sign(
            data,
            process.env.JWT_ACCESS_KEY,
            { expiresIn: "7d" }
        )
        return accessToken
    },

    RegisterUser: async (req, res) => {
        try {
            const roles = await Role.find({ name: "USER" });
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(req.body.password, salt);
            
            const newUser = await new User({
                username: req.body.username,
                password: hash,
                email: req.body.email,
                roles: roles.map(item => item._id),
                birthdate:new Date()
            });
            let error = newUser.validateSync();
            if(error)
                return res.status(400).json(ResponseDetail(400, { 
                    message: error.errors['email']?.message||error.errors['username']?.message }))
            let temp = (await User.findOne({ username: req.body.username }))
            if (temp) {
                return res.status(400).json(ResponseDetail(400, { username: "Username đã tồn tại" }))
            }
            temp = (await User.findOne({ email: req.body.email }))
            if (temp) {
                return res.status(400).json(ResponseDetail(400, { username: "Email đã tồn tại" }))
            }
            const activeCode = jwt.sign(
                { email:req.body.email },
                process.env.JWT_ACCESS_KEY,
                { expiresIn: "15m" }
            )
            sendMail(req.body.email , "Kích hoạt tài khoản", process.env.CLIENT_URL + "active/" + activeCode)
            const user = await newUser.save();
            return res.status(200).json(ResponseData(200, user))

        } catch (error) {
            console.log(error)
            res.status(500).json(ResponseDetail(400, { username: "Lỗi tạo tài khoản" }))
        }

    },

    LoginUser: async (req, res) => {
        try {
            console.log(req.body.username)
            const user = await User.findOne({ username: req.body.username }).populate("roles");

            if (!user) {
                return res.status(404).json(ResponseDetail(400, { username: "Sai tên đăng nhập/mật khẩu" }))
            }
            const auth = await bcrypt.compare(req.body.password, user.password)
            if (auth) {
                const data = {
                    sub: user.username,
                    roles: user.roles.map(item => item.name)
                };
                const accessToken = AuthController.generateAccessToken(data);
                const refreshToken = AuthController.generateRefreshToken(data);
                const { username, tenhienthi, image, roles } = user._doc;
                res.cookie("token", refreshToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "strict"
                })
                return res.status(200).json(ResponseData(200, {
                    username,
                    tenhienthi,
                    image,
                    accessToken,
                    refreshToken,
                    roles: roles.map(item => item.name)
                }));
            }
            return res.status(404).json(ResponseDetail(400, { username: "Sai tên đăng nhập/mật khẩu" }))

        } catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi đăng nhập" }))
        }
    },

    RefreshToken: async (req, res) => {
        try {
            const refreshToken = req.body.refreshToken;
            if (!refreshToken) {
                return res.status(401).json("Bạn chưa có token")
            }

            jwt.verify(refreshToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                if (err) {
                    console.log("Lỗi:" + err)
                    return res.status(500).json(ResponseDetail(500, { message: "Token sai" }))
                }
                else {
                    const { iat, exp, ...data } = user;
                    const newAccessToken = AuthController.generateAccessToken(data);
                    const newRefreshToken = AuthController.generateRefreshToken(data);
                    console.log("refresh")
                    res.cookie("token", newRefreshToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "strict"
                    })
                    return res.status(200).json(ResponseData(200, { refreshToken: newRefreshToken, accessToken: newAccessToken }));
                }

            })

        } catch (error) {
            console.log(error)
            res.status(500).json(error)
        }
    },

    LoadUsers: async (req, res) => {
        try {
            const listUser = await User.find().limit(20).populate('roles');
            return res.status(200).json(ResponseData(200, listUser))

        } catch (error) {
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi lấy thông tin user" }))
        }
    },

    LoginWithAccessToken: async (req, res) => {
        try {
            const token = req.headers.token;
            if (token) {
                const accessToken = token.split(" ")[1];
                jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                    if (err) {
                        res.status(403).json("Token is not valid");
                    }
                    req.user = user
                })
            } else {
                res.status(401).json("Bạn không có token");
            }
        } catch (error) {
            res.status(500).json("Lỗi xác thực")
        }
    },

    ReActive: async (req, res) => {
        try {
            const email = req.body.email;
            console.log(email)
            if (email) {
                const user = await User.findOne({ email: email })
                if (user) {
                    if (user.active)
                        return res.status(400).json(ResponseDetail(400, { message: "Tài khoản đã được kích hoạt" }))
                    const activeCode = jwt.sign(
                        { email },
                        process.env.JWT_ACCESS_KEY,
                        { expiresIn: "15m" }
                    )
                    console.log("active:" + activeCode);
                    sendMail(email, "Kích hoạt tài khoản", process.env.CLIENT_URL + "active/" + activeCode)
                        .then(response => {
                            console.log(response)
                            return res.status(200).json(ResponseData(200, { message: "Đã gửi mail kích hoạt" }))
                        })
                        .catch(err => {
                            console.log(err)
                            return res.status(500).json(ResponseDetail(400, { message: "Lỗi gửi mail" }))
                        })

                }
                else {
                    return res.status(400).json(ResponseDetail(400, { message: "Tài khoản không tồn tại" }))
                }

            } else {
                res.status(400).json(ResponseDetail(400, { message: "Thiếu email" }));
            }
        } catch (error) {
            res.status(500).json(ResponseDetail(400, { message: "Lỗi xác thực" }))
        }
    }
    ,
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
                            return res.status(200).json(ResponseData(200, { message: "Đã gửi mật khẩu mới" }))
                        })
                        .catch(err => {
                            console.log(err)
                            return res.status(500).json(ResponseDetail(400, { message: "Lỗi gửi mail" }))
                        })

                }
                else {
                    return res.status(400).json(ResponseDetail(400, { message: "Tài khoản không tồn tại" }))
                }

            } else {
                res.status(400).json(ResponseDetail(400, { message: "Thiếu email" }));
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
                        return res.status(400).json(ResponseDetail(400, { message: "Mã kích hoạt hết hạn" }))
                    }
                    const email = user.email
                    const newUser = await User.findOneAndUpdate({ email: email }, { active: true }, { new: true })
                    console.log(newUser)
                    if (newUser) {
                        return res.status(200).json(ResponseDetail(200, { message: "Kích hoạt thành công" }))
                    }
                    return res.status(400).json(ResponseDetail(200, { message: "Kích hoạt không thành công" }))

                })
            }
            else {
                return res.status(400).json(ResponseDetail(400, { message: "Không có mã kích hoạt" }))
            }

        } catch (error) {
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi kích hoạt" }))
        }
    },
    verifyToken: async (req, res) => {
        const token = req.headers.authorization;
        if (token) {
            const accessToken = token.split(" ")[1];
            console.log(accessToken)
            jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                if (err) {
                    return res.status(403).json(ResponseDetail(403, { message: "Token không hợp lệ" }));
                }
                return res.status(200).json(ResponseData(200, { message: "Hợp lệ" }))
            })
        } else {
            return res.status(401).json(ResponseDetail(401, { message: "Không có token" }));
        }
    },

    activeByAdmin: async (req, res) => {
        try {
            const id = req.body.id;
            const updateUser = await User.findByIdAndUpdate({ _id: id }, { active: true }, { new: true }).populate('roles')

            if (updateUser)
                return res.status(200).json(ResponseData(200, updateUser))
            return res.status(400).json(ResponseDetail(400, {message:"Kích hoạt thất bại"}))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi cập nhật quyền tài khoản" }))
        }
    },
    inactiveByAdmin: async (req, res) => {
        try {
            const id = req.body.id;
            const userId=new mongoose.Types.ObjectId(id)
            const updateUser = await User.findByIdAndUpdate({ _id: userId }, { active: false }, { new: true }).populate('roles')
            if (updateUser)
                return res.status(200).json(ResponseData(200, updateUser))
            return res.status(400).json(ResponseDetail(400,  {message:"Khoá thất bại"}))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi cập nhật quyền tài khoản" }))
        }
    },

    checkUsername: async (req, res) => {
        try {
            const username = req.body.username;
            const user = await User.findOne({ username:username })
            if (user)
                return res.status(200).json(ResponseData(200, {message:"Tên đăng nhập đã tồn tại trong hệ thống",valid: false}))
            return res.status(200).json(ResponseData(200, {message:"Tên đăng nhập hợp lý",valid: true}))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi",valid: false }))
        }
    },
    checkEmail: async (req, res) => {
        try {
            const email = req.body.email;
            const user = await User.findOne({ email:email })
            if (user)
                return res.status(200).json(ResponseData(200, {message:"Email đã tồn tại trong hệ thống",valid: false}))
            return res.status(200).json(ResponseData(200, {message:"Email hợp lý",valid: true}))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi",valid: false }))
        }
    }

}