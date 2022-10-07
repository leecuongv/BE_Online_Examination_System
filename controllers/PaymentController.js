import crypto from 'crypto';
import https from 'https';
// const frontendUrl = 'http://localhost:3000/'
// const backendUrl = 'http://localhost:5000/'
const frontendUrl = 'https://quanlyduan.vercel.app/'
const backendUrl = 'https://.herokuapp.com/'
export const PaymentController = {
    createPayment: async (req, res) => {
        try {

            //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
            //parameters
            var partnerCode = "MOMOQDD420220927";
            var accessKey = "yFRGoK0eLSrthX4Y";
            var secretkey = "tZNafmaHgldR8XfZA9wiYCFIkaXbzxbu";
            var requestId = partnerCode + new Date().getTime();
            var orderId = req.body.orderId;
            var orderInfo = "Thanh toán đơn hàng #" + orderId;
            var redirectUrl = frontendUrl + "result-payment";
            var ipnUrl = backendUrl + "api/payment/result-payment";
            //var ipnUrl ='https://playerhostedapitest.herokuapp.com/api/myorders';
            // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
            var amount = req.body.amount;
            var requestType = "captureWallet"
            var extraData = ""; //pass empty value if your merchant does not have stores

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
                    res.status(200).json({payUrl})
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
    ipn: async (req, res) => {
        try {
            console.log(req.body)
            var resultCode = req.body.resultCode;
            var partnerCode = "MOMOALSN20220816";
            var accessKey = "u9nAcZb9iznbA05s";
            var secretkey = "A6pa8FuUSdrbg73MhT37DGKiHbCov12g";
            var orderId = req.body.orderId;
            var statusPayment = resultCode === 0 ? "Thành công":"Thất bại"
            const requestBody = JSON.stringify({
                type: {
                    "id": 2,
                    "name": "Đang xử lý"
                },
                statusPayment
            });
            //Create the HTTPS objects
            const options = {
                hostname: 'playerhostedapitest.herokuapp.com',
                port: 443,
                path: `/api/myorders/${orderId}`,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            }
        console.log(options)
            //Send the request and get the response
            const reqPayment = https.request(options, res => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Headers: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (body) => {
                    console.log('Body: ');
                    console.log(body);
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                });
            })

            reqPayment.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });
            // write data to request body
            reqPayment.write(requestBody);
            reqPayment.end();
            return res.status(204).json({});
        }
        catch (e) {
            return res.status(500).json({ error: "Lỗi tạo hoá đơn thanh toán. Vui lòng thực hiện lại thanh toán" });
        }
    }
}