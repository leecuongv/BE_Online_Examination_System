const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendMail, sendMailResetPassword } = require("../services/EmailService");
const mongoose = require("mongoose");
const generator = require("generate-password");
const { ROLES, STATUS, TYPE_ACCOUNT } = require("../utils/enum");
const { generateAccessToken, generateRefreshToken, generateToken } = require("../services/jwtService");
const AuthController = {


    RegisterUser: async (req, res) => {
        try {
            const { username, password, fullname, email, role } = req.body
            if (role === ROLES.ADMIN) {
                return res.status(400).json({
                    message: "Không thể tạo tài khoản"
                })
            }
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            if (role !== ROLES.STUDENT && role !== ROLES.TEACHER) {
                return res.status(400).json({
                    message: "Không thể tạo tài khoản"
                })
            }
            const newUser = await new User({
                fullname: fullname,
                username: username,
                password: hash,
                email: email,
                role: role,
                birthday: new Date()
            });

            let temp = (await User.findOne({ username: username }))
            if (temp) {
                return res.status(400).json({ username: "Username đã tồn tại" })
            }
            let error = newUser.validateSync();
            if (error)
                return res.status(400).json({
                    message: error.errors['email']?.message || error.errors['username']?.message
                })

            temp = await User.findOne({ email: req.body.email, type: TYPE_ACCOUNT.NORMAL })
            if (temp) {
                return res.status(400).json({ username: "Email đã tồn tại" })
            }
            const activeCode = jwt.sign(
                { email },
                process.env.JWT_ACCESS_KEY,
                { expiresIn: "15m" }
            )
            await sendMail(email, "Kích hoạt tài khoản", process.env.CLIENT_URL + "active/" + activeCode, username)
            await newUser.save();
            return res.status(200).json({
                message: "Tạo tài khoản thành công"
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo tài khoản" })
        }
    },

    LoginUser: async (req, res) => {
        try {
            const { username, password } = req.body
            const user = await User.findOne({ username: username })

            if (!user) {
                return res.status(404).json({ message: "Sai tên đăng nhập hoặc mật khẩu" })
            }
            const auth = await bcrypt.compare(password, user.password)
            if (auth) {
                if (user.status !== STATUS.ACTIVE) {
                    return res.status(403).json({ message: "Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra lại email kích hoạt" })
                }
                const data = {
                    sub: user.username,
                    role: user.role
                };
                const accessToken = generateAccessToken(data);
                const refreshToken = generateRefreshToken(data);
                const { password, id, status, type, ...rest } = user._doc;

                return res.status(200).json({
                    ...rest,
                    accessToken,
                    refreshToken
                });
            }
            return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu" })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi đăng nhập" })
        }
    },

    LoginAdmin: async (req, res) => {
        try {
            const { username, password } = req.body
            const user = await User.findOne({ username: username, role: ROLES.ADMIN })

            if (!user) {
                return res.status(404).json({ message: "Sai tên đăng nhập hoặc mật khẩu" })
            }
            const auth = await bcrypt.compare(password, user.password)
            if (auth) {

                const data = {
                    sub: user.username,
                    role: user.role
                };
                const accessToken = generateAccessToken(data);
                const refreshToken = generateRefreshToken(data);
                const { password, id, status, type, ...rest } = user._doc;

                return res.status(200).json({
                    ...rest,
                    accessToken,
                    refreshToken
                });
            }
            return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu" })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi đăng nhập" })
        }
    },

    RefreshToken: async (req, res) => {
        try {
            const refreshToken = req.body.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({ message: "Bạn chưa có token" })
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
                    sendMail(email, "Kích hoạt tài khoản", process.env.CLIENT_URL + "active/" + activeCode, user.username)
                        .then(response => {
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
            const email = req.query.email;
            if (email) {
                const user = await User.findOne({ email: email })
                if (user) {
                    const resetCode = generateToken({
                        id: user.id.toString()
                    })
                    sendMailResetPassword(email, 'Đặt lại mật khẩu', process.env.CLIENT_URL + "reset-password/" + resetCode, user.username)
                        .then(response => {
                            return res.status(200).json({ message: "Đã gửi đường đẫn mật khẩu tới email" })
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

    ResetPassword: async (req, res) => {
        try {
            const { token, newPassword, cfPassword } = req.body;
            if (token) {
                jwt.verify(token, process.env.JWT_ACCESS_KEY, async (err, user) => {
                    if (err) {
                        console.log(err)
                        return res.status(400).json({ message: "Mã đặt lại mật khẩu đã hết hạn" })
                    }
                    const id = user.id
                    const salt = await bcrypt.genSalt(10);
                    const hash = await bcrypt.hash(newPassword, salt);
                    const newUser = await User.findByIdAndUpdate(id, { password: hash }, { new: true })

                    if (newUser) {
                        return res.status(200).json({ message: "Đặt lại mật khẩu thành công" })
                    }
                    return res.status(400).json({ message: "Đặt lại mật khẩu thành công. Vui lòng thử lại" })

                })
            }
            else {
                return res.status(400).json({ message: "Không có mã kích hoạt" })
            }

        } catch (error) {
            return res.status(500).json({ message: "Lỗi đặt lại mật khẩu" })
        }
    },
    Active: async (req, res) => {
        try {
            const key = req.body.token;
            if (key) {
                jwt.verify(key, process.env.JWT_ACCESS_KEY, async (err, user) => {
                    if (err) {
                        console.log(err)
                        return res.status(400).json({ message: "Mã kích hoạt hết hạn" })
                    }
                    const email = user.email
                    const newUser = await User.findOneAndUpdate({ email: email }, { status: STATUS.ACTIVE }, { new: true })

                    if (newUser) {
                        const data = {
                            sub: newUser.username,
                            role: newUser.role
                        };
                        const accessToken = generateAccessToken(data);
                        const refreshToken = generateRefreshToken(data);
                        return res.status(200).json({ message: "Kích hoạt thành công", accessToken, refreshToken })
                    }
                    return res.status(400).json({ message: "Kích hoạt không thành công" })

                })
            }
            else {
                return res.status(400).json({ message: "Không có mã kích hoạt" })
            }

        } catch (error) {
            return res.status(500).json({ message: "Lỗi kích hoạt" })
        }
    },

    verifyToken: async (req, res) => {
        const token = req.headers.authorization;
        if (token) {
            const accessToken = token.split(" ")[1];
            jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                if (err) {
                    return res.status(403).json({ message: "Token không hợp lệ" });
                }
                return res.status(200).json({ message: "Hợp lệ" })
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
            return res.status(400).json({ message: "Kích hoạt thất bại" })
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi cập nhật quyền tài khoản" })
        }
    },

    inactiveByAdmin: async (req, res) => {
        try {
            const id = req.body.id;
            const userId = new mongoose.Types.ObjectId(id)
            const updateUser = await User.findByIdAndUpdate({ _id: userId }, { status: STATUS.INACTIVE }, { new: true }).populate('role')
            if (updateUser)
                return res.status(200).json(updateUser)
            return res.status(400).json({ message: "Khoá thất bại" })
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi cập nhật quyền tài khoản" })
        }
    },

    checkUsername: async (req, res) => {
        try {
            const username = req.body.username;
            const user = await User.findOne({ username: username })
            if (user)
                return res.status(200).json({ message: "Tên đăng nhập đã tồn tại trong hệ thống", valid: false })
            return res.status(200).json({ message: "Tên đăng nhập hợp lý", valid: true })
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi", valid: false })
        }
    },
    checkEmail: async (req, res) => {
        try {
            const email = req.body.email;
            const user = await User.findOne({ email: email, type: TYPE_ACCOUNT.NORMAL })
            if (user)
                return res.status(200).json({ message: "Email đã tồn tại trong hệ thống", valid: false })
            return res.status(200).json({ message: "Email hợp lý", valid: true })
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi", valid: false })
        }
    }

}

module.exports = { AuthController }