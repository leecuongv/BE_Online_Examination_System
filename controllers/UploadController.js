const mongoose = require("mongoose");
const User = require("../models/User")
const axios = require('axios');
const FormData = require('form-data');
const tokenBot = 'bot5684898171:AAH2OsGKaWNllMyA7QmGcleN9V3Gd78aDxU'
const UploadController = {
    UploadImage: async (req, res) => {
        try {
            const username = req.user.sub
            const file = req.files.upload

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            if (!file) {
                return res.status(400).json({
                    message: 'Không có file'
                })
            }

            var bodyFormData = new FormData();
            bodyFormData.append('chat_id', 1668897001)
            bodyFormData.append('document', file.data, { filename: file.name })
            
            axios.post(`https://api.telegram.org/${tokenBot}/sendDocument`,
                bodyFormData,
                {
                    headers: {
                        ...bodyFormData.getHeaders()
                    }
                }
            )
                .then(response => {
                    let file_id = response.data.result.document.file_id
                    axios.get(`https://api.telegram.org/${tokenBot}/getFile?file_id=${file_id}`)
                        .then(responsePath => {
                            let path = responsePath.data.result.file_path
                            return res.status(200).json({
                                url: `https://api.telegram.org/file/${tokenBot}/${path}`
                            })
                        })

                })
                .catch(error => {
                    //console.log(error.response);
                    return res.status(200).json({
                        message: 'Tải lên không thành công'
                    })
                });
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi upload file" })
        }
    },
    Upload: async (req, res) => {
        try {
            const username = req.user.sub
            const file = req.files.upload

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            if (!file) {
                return res.status(400).json({
                    message: 'Không có file'
                })
            }

            var bodyFormData = new FormData();
            bodyFormData.append('chat_id', 1668897001)
            bodyFormData.append('document', file.data, { filename: file.name })
            
            axios.post(`https://api.telegram.org/${tokenBot}/sendDocument`,
                bodyFormData,
                {
                    headers: {
                        ...bodyFormData.getHeaders()
                    }
                }
            )
                .then(response => {
                    let file_id = response.data.result.document.file_id
                    axios.get(`https://api.telegram.org/${tokenBot}/getFile?file_id=${file_id}`)
                        .then(responsePath => {
                            let path = responsePath.data.result.file_path
                            return res.status(200).json({
                                url: `https://api.telegram.org/file/${tokenBot}/${path}`
                            })
                        })

                })
                .catch(error => {
                    //console.log(error.response);
                    return res.status(200).json({
                        message: 'Tải lên không thành công'
                    })
                });
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi upload file" })
        }
    },
    Download: async (req, res) => {
        try {
            const file_id = req.query.fileId


            const axios = require('axios');

            const data = {
                file_id
            }

            axios.get('https://api.telegram.org/bot5684898171:AAH2OsGKaWNllMyA7QmGcleN9V3Gd78aDxU/getFile',
                { params: data },
            )
                .then(response => {
                    let file_path = response.data.result.file_path
                    console.log(file_path)
                    let fileName = "tailieu.doc"
                    let fileType = 'text/plain'
                    axios.get(`https://api.telegram.org/file/bot5684898171:AAH2OsGKaWNllMyA7QmGcleN9V3Gd78aDxU/${file_path}`)
                        .then(responseFile => {
                            res.writeHead(200, {
                                'Content-Disposition': `attachment; filename="${fileName}"`,
                                'Content-Type': fileType,
                            })

                            const download = Buffer.from(responseFile.data, 'base64')
                            res.end(download)
                        })
                })
                .catch(error => {
                    console.log(error.response);
                    return res.status(200).json({
                        message: 'Tải lên không thành công'
                    })
                });



        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài thi" })
        }
    },

    // Test: async (req, res) => {
    //     try {
    //         const alpha = Array.from(Array(100)).map((e, i) => i);
    //         const query = alpha.map(item=>({
    //             updateOne: {
    //               filter: { name: 'Eddard Stark' },
    //               // If you were using the MongoDB driver directly, you'd need to do
    //               // `update: { $set: { title: ... } }` but mongoose adds $set for
    //               // you.
    //               update: { title: 'Hand of the King' }
    //             }
    //           }))
    //         User.bulkWrite(query)
    //         .then(res=>{
    //             console.log(res)
    //         })
    //         res.status(200).json({message:'Thành công'})



    //     } catch (error) {
    //         console.log(error)
    //         res.status(400).json({ message: "Lỗi tạo bài thi" })
    //     }
    // },




}

module.exports = { UploadController }