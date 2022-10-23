const hbs = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path')
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
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
            accessToken: accessToken
        }
    });

    // point to the template folder
    const handlebarOptions = {
        viewEngine: {
            partialsDir: path.resolve('./views/'),
            defaultLayout: false,
        },
        viewPath: path.resolve('./views/'),
    };

    // use a template file with nodemailer
    transporter.use('compile', hbs(handlebarOptions))
    return transporter

}



const sendMail = async (to, subject, activeLink, username) => {
    var emailOptions = { // thiết lập đối tượng, nội dung gửi mail
        from: 'Hệ thống thi trắc nghiệm Bello Quiz',
        to: to,
        subject: subject,
        template: 'emailActive', // the name of the template file i.e email.handlebars
        context: {
            activeLink, // replace {{name}} with Adebola
            username// replace {{company}} with My Company
        }
        //html: '<p>You have got a new message</b><ul><li>Username:' + req.body.name + '</li><li>Email:' + req.body.email + '</li><li>Username:' + req.body.message + '</li></ul>'
    }

    let emailTransporter = await createTransporter()
    return emailTransporter.sendMail(emailOptions)
}

const sendMailResetPassword = async (to, subject, activeLink, username) => {
    var emailOptions = { // thiết lập đối tượng, nội dung gửi mail
        from: '"Hệ thống thi trắc nghiệm Bello Quiz" <server10.noreply@gmail.com>',
        to: to,
        subject: subject,
        template: 'resetPassword', // the name of the template file i.e email.handlebars
        context: {
            activeLink, // replace {{name}} with Adebola
            username// replace {{company}} with My Company
        }
        //html: '<p>You have got a new message</b><ul><li>Username:' + req.body.name + '</li><li>Email:' + req.body.email + '</li><li>Username:' + req.body.message + '</li></ul>'
    }

    let emailTransporter = await createTransporter()
    return emailTransporter.sendMail(emailOptions)
}
module.exports = { sendMail,sendMailResetPassword }