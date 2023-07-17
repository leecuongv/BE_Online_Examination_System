const mongoose = require("mongoose")
const User = require("../models/User")
const { ROLES, STATUS, CERTIFICATION } = require("../utils/enum")
const dotenv = require('dotenv')
const tokenBot = 'bot5567501004:AAEFZl4XA8Fc1D92QrO0vpKGLytC5fN_wZs'
const fs = require("fs")
const { degrees, PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const Course = require("../models/Course");
const Certificate = require("../models/Certificate");
const { Deta } = require("deta");
const { XoaDau, GenerateURL, ChuoiNgay } = require("./handler/StringHandler")
dotenv.config()
const backendUrl = 'https://be-oes.vercel.app/'
const project_key = 'c0jjeyx4mur_FRm55gZPeEASwLoBFeVmWVu2PWbiQmjy';
const CertificateController = {
    Create: async (req, res) => {
        try {
            const loginUsername = req.user?.sub
            const { courseId } = req.body
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
                                    let: { examIds: "$exams", },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$userId", mongoose.Types.ObjectId(loginUser.id)] },
                                                            { $in: ["$examId", "$$examIds"] },
                                                            { $eq: ["$isPass", true] }
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
                                                            { $in: ["$assignmentId", "$$assignmentIds"] },
                                                            { $eq: ["$isPass", true] }
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
                                                            { $in: ["$lessonId", "$$lessonIds"] },

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
                        assignments: "$doc.assignments",
                        lessons: "$doc.lessons",
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
            //const courseCert = course[0].certification
            // const url1 = GenerateURL(loginUser.fullname + " " + course[0].name)

            if (course.length === 0) {
                return res.status(400).json({ message: "Khoá học không tồn tại!" })
            }

            if (!course[0].students.find(item => item.toString() === loginUser.id.toString())) {//nếu chưa có sinh viên trên
                return res.status(400).json({ message: "Học viên không thuộc khoá học" })
            }
            if (course[0].certification === CERTIFICATION.NOTALLOW)
                return res.status(400).json({ message: "Khoá học không hỗ trợ cấp chứng chỉ!" })
            // TODO: điều kiện cấp chứng chỉ 
            let toPass = course[0].toPass / 100
            if (course[0].certification === CERTIFICATION.WHENDONE && course[0].avg < toPass)
                return res.status(400).json({ message: "Chưa đủ điều kiện cấp chứng chỉ!" })
            if (course[0].certification === CERTIFICATION.WHENCOURSEDONE)
                if ((new Date(course[0].endTime)) > (new Date()) || course[0].avg < toPass)
                    return res.status(400).json({ message: "Chứng chỉ sẽ được cấp khi khoá học kết thúc và học viên hoàn thành khoá học!" })

            const certificate = await Certificate.findOne({ user: loginUser.id, course: course[0]._id })
            if (certificate) {

                return res.status(200).json({ message: "Đã tồn tại chứng chỉ", link: certificate.file })
            }

            const location = "Hồ Chí Minh"
            var path = require("path");
            const configDirectory = path.resolve(process.cwd(), "controllers/cert");
            const existingPdfBytes = fs.readFileSync(path.join(configDirectory, "cert.pdf"))


            // Load a PDFDocument from the existing PDF bytes
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            pdfDoc.registerFontkit(fontkit);

            //get font


            const fontName = fs.readFileSync("./controllers/cert/font/UTM French Vanilla.ttf")
            const fontCourse = fs.readFileSync("./controllers/cert/font/UTM Neo Sans IntelBold.ttf")
            const fontCourseItalic = fs.readFileSync("./controllers/cert/font/UTM Neo Sans Intel_Italic.ttf")
            const fontDay = fs.readFileSync("./controllers/cert/font/UTM Neo Sans Intel.ttf")


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
            const url = GenerateURL(loginUser.fullname + " " + course[0].name)
            let courseName = XoaDau(course[0].name)
            let filename = url + ".pdf"
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
            firstPage.drawText(`Has successfully completed the course  "` + courseName + `"`, {
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
            firstPage.drawText("Xác nhận tại: " + backendUrl + "api/upload/download-deta?filename=" + filename, {
                x: 20,
                y: 30,
                size: 6,
                font: embedFontCourseItalic,
                color: rgb(0.36, 0.54, 0.66),
            });

            const pdfBytes = await pdfDoc.save()


            //let filename = id.toString() + "-certificate.pdf";


            let linkFile = ""
            // Initialize with a Project Key
            const deta = Deta(project_key);

            // You can create as many as you want
            const FileDrive = deta.Drive('File');

            FileDrive.put(filename, { data: Buffer.from(pdfBytes) })
                .then(async (response) => {
                    linkFile = backendUrl + "api/upload/download-deta?filename=" + filename;

                    const newCert = new Certificate({
                        user: loginUser.id,
                        course: course[0]._id,
                        file: linkFile,
                        slug: filename
                    })
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
                })
                .catch(error => {
                    console.log(error.response);
                    return res.status(400).json({
                        message: 'Tạo file không thành công'
                    })
                });

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi upload file", error: error })
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




module.exports = { CertificateController }