const jwt_decode =require('jwt-decode')
const { User } =require('../models/User.js')
const cloudinary=require('cloudinary').v2 
const dotenv =require('dotenv')
dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const bcrypt =require('bcrypt')
const { DEFAULT_VALUES } =require('../utils/enum')
const UserController = {
    getInfo: async (req, res) => {
        try {
            const username = req.user.sub
            const user = await User.findOne({ username })
            const { password, ...rest } = user._doc;

            return res.status(200).json({ ...rest })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi xác thực" })
        }
    },
    getInfoShort: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            const decodeToken = jwt_decode(token)
            const username = decodeToken.sub
            const user = await User.findOne({ username: username })
            const { password,...doc } = user._doc;
            return res.status(200).json({...doc})

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi xác thực" })
        }
    },
    updateAvatar: async (req, res) => {
        try {
            const username = req.user.sub
            const user = User.findOne({ username })

            if (!user)
                return res.status(400).json({ message: "Không tìm thấy tài khoản" })
            const image = req.files.file //file ảnh
            if (image) {
                let data = image.data.toString('base64')
                data = `data:${image.mimetype};base64,${data}`//chuyển sang data uri
                const upload = await cloudinary.uploader
                    .upload(data,
                        {
                            folder: "avatar/",
                            public_id: username
                        })

                const newUser = await User.findOneAndUpdate({ username }, { avatar: upload.secure_url }, { new: true })
                console.log(newUser)
                return res.status(200).json({ avatar: newUser.avatar })
            }
            else {
                return res.status(400).json({ message: "Không có hình ảnh tải lên" })
            }

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi cập nhật tài khoản" })
        }
    },
    resetAvatar: async (req, res) => {
        try {
            const username = req.user.sub
            
            const data = {
                avatar:DEFAULT_VALUES.AVATAR
            }
            try{
                const newUser = await User.findOneAndUpdate({ username }, data, { new: true })
                return res.status(200).json({avatar: newUser.avatar})
            }
            catch(error){
                return res.status(400).json({ message: "Lỗi cập nhật tài khoản" })
            }

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi cập nhật tài khoản" })
        }
    },
    updateUser: async (req, res) => {
        try {
            const username = req.user.sub
            let {fullname, address, phone, school,birthday,gender } = req.body
            console.log(birthday);
            console.log(new Date(birthday).toLocaleString())
            if(birthday===null || new Date(birthday).toLocaleString() === "Invalid Date"){
                return res.status(400).json({ message: "Ngày sinh không hợp lệ" })
            }
            const data = {
                fullname, address, phone, school,birthday,gender
            }
            try{
                const newUser = await User.findOneAndUpdate({ username: username }, data, { new: true })
                const { password, ...rest } = newUser._doc
                return res.status(200).json({...rest})
            }
            catch(error){
                return res.status(400).json({ message: "Lỗi cập nhật tài khoản" })
            }

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi cập nhật tài khoản" })
        }
    },
    updatePassword: async (req, res) => {
        try {
            const username = req.user.sub
            const {password, newPassword, cfPassword} = req.body
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);
            const data = {
                password: hash
            }
            const user = await User.findOne({ username})
            const auth = await bcrypt.compare(password, user.password)
            if (auth) {
                const newUser = await User.findOneAndUpdate({ username: username }, data, { new: true })
                if (newUser) {
                    return res.status(200).json({ message: "Cập nhật thành công" })
                }
                return res.status(400).json( { message: "Cập nhật không thành công" })
            }
            return res.status(400).json({ message: "Sai mật khẩu" })


        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi cập nhật tài khoản" })
        }
    },
    updateRoles: async (req, res) => {
        try {
            const rolesRequest = req.body.roles;
            const id = req.body.id;
            console.log(id)

            let roles = []

            const getRoles = async (list) => {
                const roles = []
                for (let i = 0; i < list.length; i++) {
                    let role = await Role.findOne({ name: list[i] })
                    roles.push(role)
                }
                return roles
            }
            roles = await getRoles(rolesRequest)
            if (id) {
                console.log(roles.map(item => item.id))
                const newUser = await User.updateOne({ _id: id }, { roles: roles.map(item => item.id) }, { new: true })
                if (newUser) {
                    return res.status(200).json(ResponseData(200, { message: "Cập nhật quyền thành công" }))
                }
                else
                    return res.status(400).json(ResponseDetail(400, { message: "Cập nhật không thành công" }))
            } else
                return res.status(400).json(ResponseDetail(400, { message: "Không có username" }))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi cập nhật quyền tài khoản" }))
        }
    },
    deleteAccount: async (req, res) => {
        try {
            const id = req.query.id;
            console.log(id)
            const deleteUser = await User.deleteOne({ _id: id })
            console.log(deleteUser)
            if (deleteUser)
                return res.status(200).json(ResponseData(200, { message: "Xoá thành công" }))
            return res.status(400).json(ResponseDetail(400, "Xoá thất bại"))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi cập nhật quyền tài khoản" }))
        }
    },

}
module.exports = {UserController}