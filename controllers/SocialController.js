import bcrypt from "bcrypt";
import { User } from "../models/User.js";

import { ResponseData, ResponseDetail } from "../services/ResponseJSON.js";
import { Role } from "../models/Role.js";
import { sendMail } from "../services/EmailService.js";
import mongoose from "mongoose";
import generator from "generate-password"
import { ROLES ,STATUS,TYPE_ACCOUNT} from "../utils/enum.js";
import axios from 'axios'
import { generateAccessToken,generateRefreshToken } from "../services/jwtService.js";
export const SocialController = {
    

    LoginGoogle: async (req, res) => {
        try {
            let {accessToken}= req.body
            const response = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: `Bearer ${accessToken}` } },
            )
            const profile = response.data

            const existingUser = await User.findOne({ socialId: profile.sub }).populate('role');

            if (existingUser) {
                const data = {
                    sub: existingUser.username,
                    role: existingUser.role.name
                };
                const accessToken = generateAccessToken(data)
                const refreshToken = generateRefreshToken(data)
                const {password,...doc} = existingUser._doc
                return res.status(200).json({
                    user:{
                        ...doc,
                        role:existingUser.role.name,
                        accessToken,
                        refreshToken
                    }
                });
            }
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash("12345678", salt);
            const role = await Role.findOne({ name: ROLES.STUDENT });
            const newUser = await new User({
                id: profile.sub,
                email: profile.email,
                fullname: profile.family_name + ' ' + profile.given_name,
                birthday:new Date(),
                username:profile.sub,
                password:hash,
                status:STATUS.ACTIVE,
                type:TYPE_ACCOUNT.GOOGLE,
                socialId:profile.sub,
                avatar:profile.picture,
                role:role._id
            })

            let error = newUser.validateSync();
            if (error)
                return res.status(400).json(ResponseDetail(400, {
                    message: error.errors['email']?.message || error.errors['username']?.message
                }))

            // let temp = (await User.findOne({ username: req.body.username }))
            // if (temp) {
            //     return res.status(400).json(ResponseDetail(400, { username: "Username đã tồn tại" }))
            // }
            // temp = (await User.findOne({ email: req.body.email }))
            // if (temp) {
            //     return res.status(400).json(ResponseDetail(400, { username: "Email đã tồn tại" }))
            // }
            
            const user = await newUser.save();
            const data = {
                sub: user.username,
                role: role.name
            };
            accessToken = generateAccessToken(data)
            const refreshToken = generateRefreshToken(data)
            const {password,...doc} = user._doc
            return res.status(200).json({
                user:{
                    ...doc,
                    role:role.name,
                    accessToken,
                    refreshToken
                }
            });

        } catch (error) {
            console.log(error)
            res.status(500).json(ResponseDetail(400, { username: "Lỗi tạo tài khoản" }))
        }

    },
    LoginFacebook: async (req, res) => {
        try {
            let {accessToken}= req.body
            const response = await axios.get(
                `https://graph.facebook.com/v9.0/me?access_token=${accessToken}&fields=name%2Cemail%2Cpicture&method=get&pretty=0&sdk=joey&suppress_http_code=1`,
                
            )
            const profile = response.data

            const existingUser = await User.findOne({ socialId: profile.id }).populate('role');

            if (existingUser) {
                const data = {
                    sub: existingUser.username,
                    role: existingUser.role.name
                };
                const accessToken = generateAccessToken(data)
                const refreshToken = generateRefreshToken(data)
                const {password,role,...doc} = existingUser._doc
                return res.status(200).json({
                    user:{
                        ...doc,
                        role:existingUser.role.name,
                        accessToken,
                        refreshToken
                    }
                });
            }
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash("12345678", salt);
            const role = await Role.findOne({ name: ROLES.STUDENT });
            const newUser = await new User({
                id: profile.sub,
                email: profile.email,
                fullname: profile.name,
                birthday:new Date(),
                username:profile.id,
                password:hash,
                status:STATUS.ACTIVE,
                type:TYPE_ACCOUNT.FACEBOOK,
                socialId:profile.id,
                role:role._id,
                avatar:profile.picture.data.url
            })

            let error = newUser.validateSync();
            if (error)
                return res.status(400).json(ResponseDetail(400, {
                    message: error.errors['email']?.message || error.errors['username']?.message
                }))

               
            const user = await newUser.save();
            const data = {
                sub: user.username,
                role: role.name
            };
            accessToken = generateAccessToken(data)
            const refreshToken = generateRefreshToken(data)
            const {password,...doc} = user._doc
            return res.status(200).json({
                user:{
                    ...doc,
                    role:role.name,
                    accessToken,
                    refreshToken
                }
            });

        } catch (error) {
            console.log(error)
            res.status(500).json(ResponseDetail(400, { username: "Lỗi tạo tài khoản" }))
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

}