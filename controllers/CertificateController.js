const mongoose = require("mongoose")
const User = require("../models/User")
const { ROLES, STATUS, CERTIFICATION } = require("../utils/enum")
const dotenv = require('dotenv')
const axios = require('axios');
const FormData = require('form-data');
const tokenBot = 'bot5567501004:AAEFZl4XA8Fc1D92QrO0vpKGLytC5fN_wZs'
const telegramURL = "https://api.telegram.org/file/" + tokenBot + "/documents/"
const fs = require("fs")
const { degrees, PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const Course = require("../models/Course");
const Certificate = require("../models/Certificate");
dotenv.config()
const CertificateController = {

    Create: async (req, res) => {
        try {
            const loginUsername = req.user?.sub
            const { courseId } = req.query
            const loginUser = await User.findOne({ username: loginUsername })
            if (!loginUser) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }

            const course = await Course.aggregate([
                {
                    $match:

                        { courseId: Number(courseId) }

                },
                {
                    $facet: {
                        'temp': [
                            {
                                $lookup: {
                                    from: "take_exams",
                                    let: { examIds: "$exams" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$userId", mongoose.Types.ObjectId(loginUser.id)] },
                                                            { $in: ["$examId", "$$examIds"] }
                                                        ]
                                                }
                                            }
                                        },
                                        { $project: { _id: 0, countId: "$examId" } },
                                    ],
                                    as: "takeExams"
                                }
                            },
                            {
                                $lookup: {
                                    from: "submit_assignments",
                                    let: { assignmentIds: "$assignments" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$creatorId", mongoose.Types.ObjectId(loginUser.id)] },
                                                            { $in: ["$assignmentId", "$$assignmentIds"] }
                                                        ]
                                                }
                                            }
                                        },
                                        { $project: { _id: 0, countId: "$assignmentId" } },
                                    ],
                                    as: "assigns"
                                }
                            },
                            {
                                $lookup: {
                                    from: "seen_lessons",
                                    let: { lessonIds: "$lessons" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$creatorId", mongoose.Types.ObjectId(loginUser.id)] },
                                                            { $in: ["$lessonId", "$$lessonIds"] }
                                                        ]
                                                }
                                            }
                                        },
                                        { $project: { _id: 0, countId: "$lessonId" } },
                                    ],
                                    as: "seenLessons"
                                }
                            },
                            {
                                $project: {
                                    'counts': { $concatArrays: ['$assigns', '$takeExams', '$seenLessons'] }
                                }
                            },
                            {
                                $unwind: {
                                    path: "$counts",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $group: {
                                    _id: '$counts.countId', "doc": { "$first": "$_id" }
                                }
                            },
                            {
                                $group: {
                                    _id: '$doc', count: { $sum: 1 }
                                }
                            }
                        ],
                        'main': [
                            {
                                // $match: { students: { $in: [mongoose.Types.ObjectId(student.id)] } }
                                $match: { courseId: Number(courseId) }
                            },
                            {
                                $project: {
                                    'doc': '$$ROOT',
                                    'total': {
                                        $size:
                                        {
                                            $concatArrays: [
                                                '$exams', { $ifNull: ['$assignments', []] }, { $ifNull: ['$lessons', []] }]
                                        }
                                    }
                                }
                            },

                        ]
                    }
                },
                {
                    $project: {
                        all: {
                            $concatArrays: ["$temp", "$main"]
                        }
                    }
                },
                {
                    $unwind: "$all"
                },
                {
                    $group: {
                        _id: "$all._id",
                        doc: { '$last': '$all.doc' },
                        count: { $sum: "$all.count" },
                        total: { $sum: "$all.total" },

                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: '$doc.name',
                        image: '$doc.image',
                        courseId: "$doc.courseId",
                        exams: '$doc.exams',
                        students: '$doc.students',
                        description: '$doc.description',
                        certification: "$doc.certification",
                        count: 1,
                        total: 1,
                        endTime: "$doc.endTime",
                        avg: { $cond: [{ $eq: ["$total", 0] }, "0", { "$divide": ["$count", "$total"] }] }
                    }
                }

            ]);
            const courseCert = course[0].certification
            if (!course) {
                return res.status(400).json({ message: "Khoá học không tồn tại!" })
            }
            if (!course[0].students.find(item => item.toString() === loginUser.id.toString())) {//nếu chưa có sinh viên trên
                return res.status(400).json({ message: "Học viên không thuộc khoá học" })
            }
            if (course[0].certification === CERTIFICATION.NOTALLOW)
                return res.status(400).json({ message: "Khoá học không hỗ trợ cấp chứng chỉ!" })
            // TODO: điều kiện cấp chứng chỉ 
            if (course[0].certification === CERTIFICATION.WHENDONE && course[0].avg < 0.8)
                return res.status(400).json({ message: "Chưa đủ điều kiện cấp chứng chỉ" })
            if (course[0].certification === CERTIFICATION.WHENCOURSEDONE)
                if ((new Date(course[0].endTime)) > (new Date()) || course[0].avg < 0.8)
                    return res.status(400).json({ message: "Chưa đủ điều kiện cấp chứng chỉ" })

            const certificate = await Certificate.findOne({ user: loginUser.id, course: course.id })
            if (certificate) {
                return res.status(200).json({ link: certificate.file })
            }

            const location = "Hồ Chí Minh"
            const existingPdfBytes = await fetch("https://tg-cloud-file-small-file.ajz.workers.dev/documents/file_6908.pdf?file_name=cert.pdf&expire=1683795361&signature=1TZqKfgOz2mqM%2FavhF1CETpBFNwH7QjYwhTClrF9%2BUo%3D").then((res) =>
                res.arrayBuffer()
            );

            // Load a PDFDocument from the existing PDF bytes
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            pdfDoc.registerFontkit(fontkit);

            //get font

            const fontName = await fetch("https://tg-cloud-file-small-file.ajz.workers.dev/documents/file_6910.ttf?file_name=utm-french-vanilla.ttf&expire=1683795580&signature=y7FVBpKThzOZuY1QudbP%2BfXwkBfFjo7wTr9Zg0Kkd7Y%3D").then((res) =>
                res.arrayBuffer()
            );
            const fontCourse = await fetch("https://tg-cloud-file-small-file.ajz.workers.dev/documents/file_6914.ttf?file_name=utm-neo-sans-intelbold.ttf&expire=1683795856&signature=d7Ivg7YBiuk13oado4%2BlYTGS2bRdYRKsl%2FEcx8PNTbk%3D").then((res) =>
                res.arrayBuffer()
            );
            const fontCourseItalic = await fetch("https://tg-cloud-file-small-file.ajz.workers.dev/documents/file_6913.ttf?file_name=utm-neo-sans-intel-italic.ttf&expire=1683795791&signature=btRnAkw%2FY1xhH7RrYuAOaeJq2ilns9u8ihv3VvKC9fY%3D").then((res) =>
                res.arrayBuffer()
            );
            const fontDay = await fetch("https://tg-cloud-file-small-file.ajz.workers.dev/documents/file_6912.ttf?file_name=utm-neo-sans-intel.ttf&expire=1683795678&signature=G6S%2BuLGetrawNsji1vW45%2FzmVwbZp7e%2BjIHQ68D9XMA%3D").then((res) =>
                res.arrayBuffer()
            );


            // Embed our custom font in the document
            const embedFontName = await pdfDoc.embedFont(fontName)
            const embedFontCourse = await pdfDoc.embedFont(fontCourse)
            const embedFontCourseItalic = await pdfDoc.embedFont(fontCourseItalic)
            const embedFontDay = await pdfDoc.embedFont(fontDay)
            // Get the first page of the document
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const newDate = new Date()
            const options = { day: '2-digit', month: 'long', year: 'numeric' };
            const formattedDate = newDate.toLocaleDateString('en-US', options);
            // Draw a string of text diagonally across the first page
            const url = GenerateURL(loginUser.name + " " + course[0].name)

            firstPage.drawText(loginUser.fullname, {
                x: 80,
                y: 275,
                size: 65,
                font: embedFontName,
                color: rgb(0.36, 0.54, 0.66),
            });
            firstPage.drawText(`Đã hoàn thành khoá học "` + course[0].name + `"`, {
                x: 35,
                y: 210,
                size: 18,
                font: embedFontCourse,
                color: rgb(0, 0, 0),
            });
            firstPage.drawText(`Has successfully completed the course  "` + course[0].name + `"`, {
                x: 35,
                y: 180,
                size: 17,
                font: embedFontCourseItalic,
                color: rgb(0.36, 0.54, 0.66),
            });
            firstPage.drawText(location + `, ` + ChuoiNgay(formattedDate), {
                x: 75,
                y: 85,
                size: 12,
                font: embedFontDay,
                color: rgb(0, 0, 0),
            });
            firstPage.drawText(XoaDau(location) + ", " + formattedDate, {
                x: 90,
                y: 65,
                size: 10,
                font: embedFontDay,
                color: rgb(0.36, 0.54, 0.66),
            });
            firstPage.drawText("Xác nhận tại: oes.vercel.app/certification/" + url, {
                x: 30,
                y: 30,
                size: 10,
                font: embedFontCourseItalic,
                color: rgb(0.36, 0.54, 0.66),
            });


            const pdfBytes = await pdfDoc.save()
            fs.writeFile('newfile.pdf', pdfBytes, function (err) {
                if (err) throw err;
                console.log('Tạo file mới thành công!');
            });


            var bodyFormData = new FormData();
            bodyFormData.append('chat_id', 5813484449)
            bodyFormData.append('document', fs.createReadStream("newfile.pdf"))
            console.log("Đọc file")
            let linkFile = ""

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
                        .then(async responsePath => {
                            let path = responsePath.data.result.file_path
                            linkFile = "https://api.telegram.org/file/" + tokenBot + "/" + path
                            console.log(linkFile)

                            const newCert = await new Certificate({
                                user: loginUser.id,
                                course: course.id,
                                file: linkFile,
                                slug: url
                            })
                            console.log(linkFile)
                            let error = newCert.validateSync();
                            if (error) {
                                console.log(error)
                                return res.status(400).json({
                                    message: "Tạo chứng chỉ không thành công!"
                                })
                            }

                            const cert = await newCert.save();
                            return res.status(200).json({
                                message: "Tạo chứng chỉ thành công!",
                                link: newCert.file
                            })


                            // return res.status(200).json({
                            //     url: `https://api.telegram.org/file/${tokenBot}/${path}`

                            // })
                        })

                })
                .catch(error => {
                    console.log(error.response);
                    return res.status(400).json({
                        message: 'Tạo file không thành công'
                    })
                });




        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi upload file" })
        }
    },
    View: async (req, res) => {
        try {

            const { slug } = req.query

            //TODO: điều kiện cấp chứng chỉ 

            const certificate = await Certificate.findOne({ slug })
            if (certificate) {
                return res.status(200).json({ link: certificate.file })
            }
            return res.status(200).json({ message: "Không tồn tại chứng chỉ!" })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xem chứng chỉ!" })
        }
    }

}
function XoaDau(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}
function ChuoiNgay(str) {
    const date = new Date(str);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const formattedDate = `ngày ${day} tháng ${month} năm ${year}`;
    return formattedDate;
}
function GenerateURL(str) {

    XoaDau(str.toLowerCase());

    const words = str.split(' ');

    const firstLetters = words.map(word => word.charAt(0));

    return firstLetters.join('');
}

module.exports = { CertificateController }