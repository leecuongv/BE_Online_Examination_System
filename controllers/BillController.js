const crypto =require('crypto')
const https =require('https')
const dateFormat =require('dateformat')
const { User } =require('../models/User')
// const frontendUrl = 'http://localhost:3000/'
// const backendUrl = 'http://localhost:5000/'
const frontendUrl = 'https://quanlyduan.vercel.app/'
const backendUrl = 'https://becnpmm.cyclic.app/'
const BillController = {
    createPaymentMomo: async (req, res) => {
        try {

            //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
            //parameters
            const username = req.user.sub
            var partnerCode = "MOMOALSN20220816";
            var accessKey = "u9nAcZb9iznbA05s";
            var secretkey = "A6pa8FuUSdrbg73MhT37DGKiHbCov12g";
            var requestId = partnerCode + new Date().getTime();
            var orderId = req.body.orderId;
            var orderInfo = "Thanh toán đơn hàng #" + orderId;
            var redirectUrl = frontendUrl + "result-payment";
            var ipnUrl = backendUrl + "api/bill/upgrade-momo";
            //var ipnUrl ='https://playerhostedapitest.herokuapp.com/api/myorders';
            // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
            var amount = req.body.amount;
            var requestType = "captureWallet"
            var extraData = Buffer.from(JSON.stringify(username)).toString('base64');; //pass empty value if your merchant does not have stores

            //before sign HMAC SHA256 with format
            //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType
            //puts raw signature
            console.log("--------------------RAW SIGNATURE----------------")
            console.log(rawSignature)
            //signature

            var signature = crypto.createHmac('sha256', secretkey)
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
            var resultCode = req.body.resultCode;
            var partnerCode = "MOMOALSN20220816";
            var accessKey = "u9nAcZb9iznbA05s";
            var secretkey = "A6pa8FuUSdrbg73MhT37DGKiHbCov12g";
            var orderId = req.body.orderId;
            var extraData = req.body.extraData
            var statusPayment = resultCode === 0 ? "Thành công" : "Thất bại"
            if (resultCode === 0) {
                var username = JSON.parse(Buffer.from(extraData, 'base64').toString('ascii')).username;
            }
            const newUser = await User.findOneAndUpdate({ username }, { premium: true }, { new: true })
            return res.status(204).json({});
        }
        catch (e) {
            return res.status(500).json({ error: "Lỗi tạo hoá đơn thanh toán. Vui lòng thực hiện lại thanh toán" });
        }
    },
    UICreatePaymentVNPay: async (req, res, next) => {
        
        var date = new Date();

        var desc = 'Thanh toan don hang thoi gian: ' + dateFormat(date, 'yyyy-mm-dd HH:mm:ss');
        res.render('order', { title: 'Tạo mới đơn hàng', amount: 10000, description: desc })
    },
    CreatePaymentVNPay: async (req, res, next) => {
        var ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        var config = require('config');
        var dateFormat = require('dateformat');


        var tmnCode = config.get('vnp_TmnCode');
        var secretKey = config.get('vnp_HashSecret');
        var vnpUrl = config.get('vnp_Url');
        var returnUrl = config.get('vnp_ReturnUrl');

        var date = new Date();

        var createDate = dateFormat(date, 'yyyymmddHHmmss');
        var orderId = dateFormat(date, 'HHmmss');
        var amount = req.body.amount;
        var bankCode = req.body.bankCode;

        var orderInfo = req.body.orderDescription;
        var orderType = req.body.orderType;
        var locale = req.body.language;
        if (locale === null || locale === '') {
            locale = 'vn';
        }
        var currCode = 'VND';
        var vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        // vnp_Params['vnp_Merchant'] = ''
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = orderInfo;
        vnp_Params['vnp_OrderType'] = orderType;
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if (bankCode !== null && bankCode !== '') {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        var querystring = require('qs');
        var signData = querystring.stringify(vnp_Params, { encode: false });
        var crypto = require("crypto");
        var hmac = crypto.createHmac("sha512", secretKey);
        var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        res.redirect(vnpUrl)
    },
    VNPayReturn:async(req, res, next)=>{
        var vnp_Params = req.query;
    
        var secureHash = vnp_Params['vnp_SecureHash'];
    
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
    
        vnp_Params = sortObject(vnp_Params);
    
        var config = require('config');
        var tmnCode = config.get('vnp_TmnCode');
        var secretKey = config.get('vnp_HashSecret');
    
        var querystring = require('qs');
        var signData = querystring.stringify(vnp_Params, { encode: false });
        var crypto = require("crypto");     
        var hmac = crypto.createHmac("sha512", secretKey);
        var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");     
    
        if(secureHash === signed){
            //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
    
            res.render('success', {code: vnp_Params['vnp_ResponseCode']})
        } else{
            res.render('success', {code: '97'})
        }
    },
    VNPayIPN:async(req, res, next)=>{
        var vnp_Params = req.query;
        var secureHash = vnp_Params['vnp_SecureHash'];
    
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
    
        vnp_Params = sortObject(vnp_Params);
        var config = require('config');
        var secretKey = config.get('vnp_HashSecret');
        var querystring = require('qs');
        var signData = querystring.stringify(vnp_Params, { encode: false });
        var crypto = require("crypto");     
        var hmac = crypto.createHmac("sha512", secretKey);
        var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");     
         
    
        if(secureHash === signed){
            var orderId = vnp_Params['vnp_TxnRef'];
            var rspCode = vnp_Params['vnp_ResponseCode'];
            //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
            res.status(200).json({RspCode: '00', Message: 'success'})
        }
        else {
            res.status(200).json({RspCode: '97', Message: 'Fail checksum'})
        }
    }

}

module.exports = {BillController}