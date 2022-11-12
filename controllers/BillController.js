const crypto =require('crypto')
const https =require('https')
const moment = require('moment')
const  User  =require('../models/User')
const dotenv = require('dotenv')
const  Bill  = require('../models/Bill')
const mongoose  = require('mongoose')
const { STATUS } = require('../utils/enum')
dotenv.config()
// const frontendUrl = 'http://localhost:3006/'
// const backendUrl = 'http://localhost:5000/'
const frontendUrl = 'https://oes.vercel.app/'
const backendUrl = 'https://be-oes.vercel.app/'
const BillController = {
    createPaymentMomo: async (req, res) => {
        try {

            //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
            //parameters
            const username = req.user.sub
            let partnerCode = "MOMOALSN20220816";
            let accessKey = "u9nAcZb9iznbA05s";
            let secretkey = "A6pa8FuUSdrbg73MhT37DGKiHbCov12g";
            let requestId = partnerCode + new Date().getTime();
            let orderId = req.body.orderId;
            let orderInfo = "Thanh toán đơn hàng #" + orderId;
            let redirectUrl = frontendUrl + "result-payment";
            let ipnUrl = backendUrl + "api/bill/upgrade-momo";
            //let ipnUrl ='https://playerhostedapitest.herokuapp.com/api/myorders';
            // let ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
            let amount = req.body.amount;
            let requestType = "captureWallet"
            let extraData = Buffer.from(JSON.stringify(username)).toString('base64');; //pass empty value if your merchant does not have stores

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
            let partnerCode = "MOMOALSN20220816";
            let accessKey = "u9nAcZb9iznbA05s";
            let secretkey = "A6pa8FuUSdrbg73MhT37DGKiHbCov12g";
            let orderId = req.body.orderId;
            let extraData = req.body.extraData
            let statusPayment = resultCode === 0 ? "Thành công" : "Thất bại"
            if (resultCode === 0) {
                let username = JSON.parse(Buffer.from(extraData, 'base64').toString('ascii')).username;
            }
            const newUser = await User.findOneAndUpdate({ username }, { premium: true }, { new: true })
            return res.status(204).json({});
        }
        catch (e) {
            return res.status(500).json({ error: "Lỗi tạo hoá đơn thanh toán. Vui lòng thực hiện lại thanh toán" });
        }
    },
    CreatePaymentVNPay: async (req, res, next) => {
        try{

            let ipAddr = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
            if(ipAddr ==='::1')
                ipAddr ='127.0.0.1'
            let tmnCode = process.env.vnp_TmnCode;
            let secretKey = process.env.vnp_HashSecret;
            let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
            let returnUrl = backendUrl+"api/payment/vnpay-return"
            let date = new Date();
    
            let createDate =moment().format('YYYYMMDDHHmmss'); 
            let orderId = date.getTime()
            let username = req.user.sub
            let amount = req.body.amount;
            let bankCode = req.body.bankCode;
    
            let orderInfo = req.body.orderDescription || "Nang cap tai khoan "+username;
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
            const user = await User.findOne({username})
            if(!user){
                return res.status(400).json({message:"Không tồn tại tài khoản"})
            }
            const newBill = await new Bill({
                creatorId:user.id,
                description:"Nâng cấp tài khoản bằng VNPay",
                amount,
                method:"VNPay"
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
            res.status(200).json({payUrl:vnpUrl})
        }
        catch(err){
            res.status(400).json({message:"Tạo hoá đơn không thành công. Vui lòng thử lại"})
        }
    },
    VNPayReturn:async(req, res, next)=>{
        try{

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
        
            if(secureHash === signed){
                //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
                res.render('success', {code: vnp_Params['vnp_ResponseCode']})
            } else{
                res.render('success', {code: '97'})
            }
        }
        catch(err){

        }
    },
    VNPayIPN:async(req, res, next)=>{
        try{
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
             
            if(secureHash === signed){
                let orderId = vnp_Params['vnp_TxnRef'];
                let rspCode = vnp_Params['vnp_ResponseCode'];
                console.log(rspCode);
                if(rspCode==='00')//giao dich thanh cong
                {
                    const bill = await Bill.findOneAndUpdate({_id:mongoose.Types.ObjectId(orderId)}
                    ,{status:STATUS.SUCCESS,transactionId:vnp_Params['vnp_TransactionNo']}
                    ,{new:true})
                    const user = await User.findByIdAndUpdate(bill.creatorId,{premium:true})
                    return res.redirect(`${frontendUrl}result-payment?message=Giao dịch thành công`)
                }
                //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
                return res.redirect(`${frontendUrl}result-payment?message=Giao dịch không thành công`)
            }
            else {
                return res.redirect(`${frontendUrl}result-payment?message=Giao dịch không thành công`)
            }
        }
        catch(err){
            return res.redirect(`${frontendUrl}result-payment?message=Xác nhận giao dịch không thành công`)
        }
    }

}

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
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

module.exports = {BillController}