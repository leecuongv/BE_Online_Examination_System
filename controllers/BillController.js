const crypto = require('crypto')
const https = require('https')
const moment = require('moment')
const User = require('../models/User')
const Course = require("../models/Course")
const TransactionHistory = require("../models/TransactionHistory")
const dotenv = require('dotenv')
const Bill = require('../models/Bill')
const mongoose = require('mongoose')
const { STATUS, BANK, FEE } = require('../utils/enum')
dotenv.config()
// const frontendUrl = 'http://localhost:3006/'
// const backendUrl = 'http://localhost:5000/'
//const frontendUrl = 'https://oes.vercel.app/'
const frontendUrl = 'https://www.belloquiz.tech/'
const backendUrl = 'https://be-oes.vercel.app/'
const bcrypt = require("bcrypt");
const BillController = {

    createPaymentMomo: async (req, res) => {
        try {

            //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
            //parameters
            const username = req.user?.sub
            let amount = 50000;
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Không tồn tại tài khoản" })
            }
            const newBill = new Bill({
                creatorId: user.id,
                description: "Nâng cấp tài khoản bằng Momo",
                amount,
                method: "Momo"

            })

            await newBill.save()//lưu bill vào db
            let partnerCode = "MOMOALSN20220816";
            let accessKey = "u9nAcZb9iznbA05s";
            let secretkey = "A6pa8FuUSdrbg73MhT37DGKiHbCov12g";
            let requestId = partnerCode + new Date().getTime();
            let orderId = new Date().getTime();
            let orderInfo = "Thanh toán đơn hàng #" + orderId;
            let redirectUrl = frontendUrl + "result-payment";
            let ipnUrl = backendUrl + "api/payment/upgrade-momo";
            //let ipnUrl ='https://playerhostedapitest.herokuapp.com/api/myorders';
            // let ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";

            let requestType = "captureWallet"
            let extraData = Buffer.from(JSON.stringify(
                {
                    username,
                    billId: newBill.id.toString()
                })).toString('base64');; //pass empty value if your merchant does not have stores

            //before sign HMAC SHA256 with format
            //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            let rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType
            //puts raw signature
            console.log("--------------------RAW SIGNATURE----------------")
            console.log(rawSignature)
            //signature

            let signature = crypto.createHmac('sha256', secretkey)
                .update(rawSignature)
                .digest('hex');
            console.log("--------------------SIGNATURE----------------")
            console.log(signature)

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: 'vi'
            });
            //Create the HTTPS objects
            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            }


            let payUrl = ""
            //Send the request and get the response
            const reqPayment = https.request(options, response => {
                console.log(`Status: ${response.statusCode}`);
                console.log(`Headers: ${JSON.stringify(response.headers)}`);
                response.setEncoding('utf8');
                response.on('data', (body) => {
                    console.log('Body: ');
                    console.log(body);
                    console.log('payUrl: ');
                    console.log(JSON.parse(body).payUrl);
                    payUrl = JSON.parse(body).payUrl;
                });
                response.on('end', () => {
                    console.log('No more data in response.');
                    return res.status(200).json({ payUrl })
                });
            })

            reqPayment.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });
            // write data to request body
            console.log("Sending....")
            reqPayment.write(requestBody);
            reqPayment.end();

        }
        catch (e) {
            console.log(e)
            return res.status(500).json({ error: "Lỗi tạo hoá đơn thanh toán. Vui lòng thực hiện lại thanh toán" });
        }
    },

    upgradeAccountWithMomo: async (req, res) => {
        try {
            console.log(req.body)
            let resultCode = req.body.resultCode;
            let transId = req.body.transId;
            let extraData = req.body.extraData
            let statusPayment = resultCode === 0 ? "Thành công" : "Thất bại"
            console.log("resultCode: ", resultCode)
            if (resultCode === 0) {

                let data = JSON.parse(Buffer.from(extraData, 'base64').toString('ascii'));
                let username = data.username
                const user = await User.findOne({ username })
                let balance = user.balance



                let billId = data.billId
                const newBill = await Bill.findOneAndUpdate({ _id: mongoose.Types.ObjectId(billId) }
                    , { status: STATUS.SUCCESS, transactionId: transId }
                    , { new: true })
                console.log("billId: ", billId)
                const cost = newBill.amount
                let newBalance = balance + cost

                const newUser = await User.findOneAndUpdate({ username }, { balance: newBalance }, { new: true })
            }
            return res.status(204).json({});
        }
        catch (e) {
            return res.status(500).json({ error: "Lỗi tạo hoá đơn thanh toán. Vui lòng thực hiện lại thanh toán" });
        }
    },

    CreatePaymentVNPay: async (req, res, next) => {
        try {

            let ipAddr = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
            if (ipAddr === '::1')
                ipAddr = '127.0.0.1'
            let tmnCode = process.env.vnp_TmnCode;
            let secretKey = process.env.vnp_HashSecret;
            let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
            let returnUrl = backendUrl + "api/payment/vnpay-return"
            let date = new Date();

            let createDate = moment().format('YYYYMMDDHHmmss');
            let orderId = date.getTime()
            let username = req.user?.sub
            let amount = 50000;
            let bankCode = req.body.bankCode;

            let orderInfo = req.body.orderDescription || "Nang cap tai khoan " + username;
            let orderType = req.body.orderType || 'billpayment';
            let locale = req.body.language;
            if (locale === null || locale === '') {
                locale = 'vn';
            }
            let currCode = 'VND';
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = tmnCode;
            // vnp_Params['vnp_Merchant'] = ''
            vnp_Params['vnp_Locale'] = locale;
            vnp_Params['vnp_CurrCode'] = currCode;
            vnp_Params['vnp_OrderInfo'] = orderInfo;
            vnp_Params['vnp_OrderType'] = orderType;
            vnp_Params['vnp_Amount'] = amount * 100;
            vnp_Params['vnp_ReturnUrl'] = returnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = createDate;
            if (bankCode !== null && bankCode !== '') {
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            //Tạo bill
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Không tồn tại tài khoản" })
            }
            const newBill = await new Bill({
                creatorId: user.id,
                description: "Nâng cấp tài khoản bằng VNPay",
                amount,
                method: "VNPay"
            })
            await newBill.save()//lưu bill vào db
            vnp_Params['vnp_TxnRef'] = newBill.id.toString()
            vnp_Params = sortObject(vnp_Params);

            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
            console.log(vnpUrl)
            res.status(200).json({ payUrl: vnpUrl })
        }
        catch (err) {
            res.status(400).json({ message: "Tạo hoá đơn không thành công. Vui lòng thử lại" })
        }
    },
    VNPayReturn: async (req, res, next) => {
        try {

            let vnp_Params = req.query;

            let secureHash = vnp_Params['vnp_SecureHash'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = sortObject(vnp_Params);

            let tmnCode = process.env.vnp_TmnCode;
            let secretKey = process.env.vnp_HashSecret;

            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            if (secureHash === signed) {
                //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
                res.render('success', { code: vnp_Params['vnp_ResponseCode'] })
            } else {
                res.render('success', { code: '97' })
            }
        }
        catch (err) {

        }
    },
    VNPayIPN: async (req, res, next) => {
        try {
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = sortObject(vnp_Params);
            let secretKey = process.env.vnp_HashSecret;
            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            if (secureHash === signed) {
                let orderId = vnp_Params['vnp_TxnRef'];
                let rspCode = vnp_Params['vnp_ResponseCode'];
                console.log(rspCode);
                if (rspCode === '00')//giao dich thanh cong
                {





                    const newBill = await Bill.findOneAndUpdate({ _id: mongoose.Types.ObjectId(orderId) }
                        , { status: STATUS.SUCCESS, transactionId: vnp_Params['vnp_TransactionNo'] }
                        , { new: true })
                    const user = await User.findOne({ _id: mongoose.Types.ObjectId(newBill.creatorId) })
                    let balance = user.balance
                    const cost = newBill.amount
                    let newBalance = balance + cost

                    const newUser = await User.findByIdAndUpdate(newBill.creatorId, { balance: newBalance }, { new: true })


                    return res.redirect(`${frontendUrl}result-payment?message=Giao dịch thành công`)
                }
                //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
                return res.redirect(`${frontendUrl}result-payment?message=Giao dịch không thành công`)
            }
            else {
                return res.redirect(`${frontendUrl}result-payment?message=Giao dịch không thành công`)
            }
        }
        catch (err) {
            return res.redirect(`${frontendUrl}result-payment?message=Xác nhận giao dịch không thành công`)
        }
    },

    WithdrawMoney: async (req, res) => {
        try {
            const loginUsername = req.user?.sub
            if (!loginUsername)
                return res.status(400).json({ message: "Vui lòng đăng nhập!" })
            const loginUser = await User.findOne({ username: loginUsername })
            if (!loginUser)
                return res.status(400).json({ message: "Không có người dùng!" })
            const { bank, creditNumber, amount, password, feeIn } = req.body
            let flag = false
            for (var key in BANK) {
                console.log(key)
                if (bank === key) {
                    console.log(key)
                    flag = true
                }
            }

            if (!bank || bank === "" || flag === false) {
                return res.status(400).json({ message: "Ngân hàng không hợp lệ hoặc không được hỗ trợ!" })
            }
            if (!creditNumber || creditNumber === "") {
                return res.status(400).json({ message: "Vui lòng nhập số tài khoản ngân hàng hợp lệ!" })
            }
            if (!amount || amount < 50000) {
                return res.status(400).json({ message: "Số tiền rút phải lớn hơn 50000!" })
            }
            const auth = bcrypt.compare(password, loginUser.password)
            if (!auth) {
                return res.status(400).json({ message: "Sai mật khẩu!" })
            }
            let balance = loginUser.balance


            let phiRut = amount * (FEE.FEE / 100)
            let soTienNhanDuoc = amount - phiRut

            if (feeIn === false) {
                soTienNhanDuoc = amount
            }
            let total = phiRut + soTienNhanDuoc
            if (balance < total) {
                return res.status(400).json({ message: "Số tiền giao dịch phải nhỏ hơn số dư của tài khoản!" })
            }
            const newTransactionHistory = new TransactionHistory({
                creatorId: loginUser._id,
                bank,
                creditNumber,
                fee: phiRut,
                feeIn,
                amount,
                status: STATUS.SUCCESS,
                description: "Rút tiền",
                isTransferred: false
            })

            let error = newTransactionHistory.validateSync();
            if (error) {
                return res.status(400).json({
                    message: "Tạo giao dịch rút tiền không thành công"
                })
            }
            let newBalance = balance - total
            const transactionHistory = await newTransactionHistory.save()
            await User.findOneAndUpdate({ username: loginUsername }, {
                balance: newBalance
            }, { new: true })

            // const newBill = new Bill({
            //     creatorId: loginUser._id,
            //     description: "Rút tiền về tài khoản: " + bank + " STK: " + creditNumber + " STR: " + soTienNhanDuoc + " PHI: " + phiRut,
            //     amount: phiRut,
            //     method: "User balance",
            //     status: STATUS.SUCCESS
            // })
            // let error2 = newBill.validateSync()
            // if (error2)
            //     return res.status(400).json({
            //         message: "Tạo hóa đơn mới thất bại!"
            //     })
            // await newBill.save()


            return res.status(200).json({
                message: "Tạo giao dịch rút tiền thành công, số tiền rút sẽ được chuyển vào tài khoản của quý khách trong 5 - 10 ngày làm việc(không kể Thứ 7, Chủ nhật và ngày lễ)",
                amount: amount,
                fee: phiRut,
                feeIn: feeIn,
                soTienNhanDuoc: soTienNhanDuoc
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo giao dịch" })
        }


    },


    PayInVNPay: async (req, res, next) => {
        try {

            let ipAddr = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
            if (ipAddr === '::1')
                ipAddr = '127.0.0.1'
            let tmnCode = process.env.vnp_TmnCode;
            let secretKey = process.env.vnp_HashSecret;
            let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
            let returnUrl = backendUrl + "api/payment/vnpay-return"
            let date = new Date();

            let createDate = moment().format('YYYYMMDDHHmmss');
            let orderId = date.getTime()
            let username = req.user?.sub
            let { amount } = req.body;
            let bankCode = req.body.bankCode;

            let orderInfo = req.body.orderDescription || "Nang cap tai khoan " + username;
            let orderType = req.body.orderType || 'billpayment';
            let locale = req.body.language;
            if (locale === null || locale === '') {
                locale = 'vn';
            }
            let currCode = 'VND';
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = tmnCode;
            // vnp_Params['vnp_Merchant'] = ''
            vnp_Params['vnp_Locale'] = locale;
            vnp_Params['vnp_CurrCode'] = currCode;
            vnp_Params['vnp_OrderInfo'] = orderInfo;
            vnp_Params['vnp_OrderType'] = orderType;
            vnp_Params['vnp_Amount'] = amount * 100;
            vnp_Params['vnp_ReturnUrl'] = returnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = createDate;
            if (bankCode !== null && bankCode !== '') {
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            //Tạo bill
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Không tồn tại tài khoản" })
            }
            const newBill = await new Bill({
                creatorId: user.id,
                description: "Nâng cấp tài khoản bằng VNPay",
                amount,
                method: "VNPay"
            })
            await newBill.save()//lưu bill vào db
            vnp_Params['vnp_TxnRef'] = newBill.id.toString()
            vnp_Params = sortObject(vnp_Params);

            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
            console.log(vnpUrl)
            res.status(200).json({ payUrl: vnpUrl })
        }
        catch (err) {
            res.status(400).json({ message: "Tạo hoá đơn không thành công. Vui lòng thử lại" })
        }
    },

    PayInMomo: async (req, res) => {
        try {

            //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
            //parameters
            const username = req.user?.sub
            let { amount } = req.body;
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Không tồn tại tài khoản" })
            }
            const newBill = new Bill({
                creatorId: user.id,
                description: "Nâng cấp tài khoản bằng Momo",
                amount,
                method: "Momo"

            })

            await newBill.save()//lưu bill vào db
            let partnerCode = "MOMOALSN20220816";
            let accessKey = "u9nAcZb9iznbA05s";
            let secretkey = "A6pa8FuUSdrbg73MhT37DGKiHbCov12g";
            let requestId = partnerCode + new Date().getTime();
            let orderId = new Date().getTime();
            let orderInfo = "Thanh toán đơn hàng #" + orderId;
            let redirectUrl = frontendUrl + "result-payment";
            let ipnUrl = backendUrl + "api/payment/upgrade-momo";
            //let ipnUrl ='https://playerhostedapitest.herokuapp.com/api/myorders';
            // let ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";

            let requestType = "captureWallet"
            let extraData = Buffer.from(JSON.stringify(
                {
                    username,
                    billId: newBill.id.toString()
                })).toString('base64');; //pass empty value if your merchant does not have stores

            //before sign HMAC SHA256 with format
            //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            let rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType
            //puts raw signature
            console.log("--------------------RAW SIGNATURE----------------")
            console.log(rawSignature)
            //signature

            let signature = crypto.createHmac('sha256', secretkey)
                .update(rawSignature)
                .digest('hex');
            console.log("--------------------SIGNATURE----------------")
            console.log(signature)

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: 'vi'
            });
            //Create the HTTPS objects
            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            }


            let payUrl = ""
            //Send the request and get the response
            const reqPayment = https.request(options, response => {
                console.log(`Status: ${response.statusCode}`);
                console.log(`Headers: ${JSON.stringify(response.headers)}`);
                response.setEncoding('utf8');
                response.on('data', (body) => {
                    console.log('Body: ');
                    console.log(body);
                    console.log('payUrl: ');
                    console.log(JSON.parse(body).payUrl);
                    payUrl = JSON.parse(body).payUrl;
                });
                response.on('end', () => {
                    console.log('No more data in response.');
                    return res.status(200).json({ payUrl })
                });
            })

            reqPayment.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });
            // write data to request body
            console.log("Sending....")
            reqPayment.write(requestBody);
            reqPayment.end();

        }
        catch (e) {
            console.log(e)
            return res.status(500).json({ error: "Lỗi tạo hoá đơn thanh toán. Vui lòng thực hiện lại thanh toán" });
        }
    },

    PurchaseCourse: async (req, res) => {
        try {
            const username = req.user?.sub
            const { courseId } = req.body

            const user = await User.findOne({ username: username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }
            const course = await Course.findOne({ courseId })
            if (!course)
                return res.status(400).json({ message: "Không tồn tại khóa học!" })

            if (course.status !== STATUS.PUBLIC) {
                return res.status(400).json({ message: "Khóa học này chưa được phát hành!" })
            }

            let coursePrice = course.price
            let customerBalance = user.balance

            if (customerBalance < coursePrice) {
                return res.status(400).json({ message: "Không đủ số dư tài khoản, vui lòng nạp thêm!" })
            }
            if (!course.students.find(item => item.toString() === user.id.toString())) {
                course.students.push(user.id)

                let newBalance = customerBalance - coursePrice
                await User.findOneAndUpdate({ username }, {
                    balance: newBalance
                }, { new: true })
                let description = "Mua khoá học: " + course.name
                const newBill = new Bill({
                    creatorId: user.id,
                    description: description,
                    amount: coursePrice,
                    method: "User balance",
                    status: STATUS.SUCCESS
                })
                await newBill.save()
                let seller = await User.findById(course.creatorId)
                let sellerBalance = seller.balance
                let newSellerBalance = sellerBalance + coursePrice - coursePrice * (FEE.FEE / 100)
                await User.findByIdAndUpdate(course.creatorId, { balance: newSellerBalance }, { new: true })
            }
            else {
                return res.status(400).json({ message: "Học viên đã thuộc lớp học!" })
            }
            await course.save()
            return res.status(200).json({
                message: "Đăng ký khóa học thành công!",
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi đăng ký khoá học!" })
        }
    },

    UpgradeAccount: async (req, res) => {
        try {
            const username = req.user?.sub
            const price = 50000
            const user = await User.findOne({ username: username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }

            let balance = user.balance

            if (balance < price) {
                return res.status(400).json({ message: "Không đủ số dư tài khoản, vui lòng nạp thêm!" })
            }

            let newBalance = balance - price
            await User.findOneAndUpdate({ username }, {
                balance: newBalance, premium: true
            }, { new: true })
            let description = "Upgrade Account"
            const newBill = new Bill({
                creatorId: user.id,
                description: description,
                amount: price,
                method: "User balance"
            })
            await newBill.save()
            return res.status(200).json({
                message: "Nâng cấp tài khoản thành công!",
            })
        }

        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi nâng cấp tài khoản!" })
        }
    }
}




function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = { BillController }