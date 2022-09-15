
// import nodemailer from 'nodemailer';

// export const sendMail = (to,subject,active) => {
//     const mailHost = 'smtp.gmail.com'
// // 587 là một cổng tiêu chuẩn và phổ biến trong giao thức SMTP
// const mailPort = 587
//     var transporter = nodemailer.createTransport({ // config mail server
//         service: 'Gmail',
//         host: mailHost,
//     port: mailPort,
//     secure: false,
//         auth: {
//             user: 'server10.noreply@gmail.com',
//             pass: '123456789a.'
//         }
//     });
//     var mainOptions = { // thiết lập đối tượng, nội dung gửi mail
//         from: 'Thích truyện chữ',
//         to: to,
//         subject: subject,
//         text: active,
//         //html: '<p>You have got a new message</b><ul><li>Username:' + req.body.name + '</li><li>Email:' + req.body.email + '</li><li>Username:' + req.body.message + '</li></ul>'
//     }
//     return transporter.sendMail(mainOptions);
// }


import nodemailer from 'nodemailer';
import { google } from 'googleapis';
const OAuth2 = google.auth.OAuth2;

export const createTransporter = async () => {
        const oauth2Client = new OAuth2(
            process.env.clientId,
            process.env.clientSecret,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.refreshToken
        });
        

        const accessToken = await new Promise((resolve, reject) => {
            oauth2Client.getAccessToken((err, token) => {
                if (err) {
                    reject();
                }
                
                resolve(token);
            });
        });


        var transporter = nodemailer.createTransport({ // config mail server
            service: 'gmail',
            host: "smtp.gmail.com",
  port: 465,
  secure: true,
            auth: {
                type: 'OAuth2',
                user: 'server10.noreply@gmail.com',
                clientId: process.env.clientId,
                clientSecret: process.env.clientSecret,
                refreshToken: process.env.refreshToken,
                accessToken:accessToken
            }
        });
        return transporter

}

export const sendMail = async (to, subject, active) => {
    var emailOptions = { // thiết lập đối tượng, nội dung gửi mail
        from: 'Thích truyện chữ',
        to: to,
        subject: subject,
        text: active,
        //html: '<p>You have got a new message</b><ul><li>Username:' + req.body.name + '</li><li>Email:' + req.body.email + '</li><li>Username:' + req.body.message + '</li></ul>'
    }
    
    let emailTransporter = await createTransporter()
    return emailTransporter.sendMail(emailOptions)
    

}