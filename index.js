import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'
import {UserRoute,AuthRoute,SocialRoutes} from './routers/index.js'
import * as helmet from "helmet";
import passport from 'passport'
import rateLimit from 'express-rate-limit'
import session from 'express-session'

dotenv.config()
import './services/passport.js'
const app=express();
const PORT = process.env.PORT ||5000;
const URI=process.env.MONGODB_URL;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true,limit:'3mb'}))//Giới hạn kích thước request gửi lên server phải nhỏ hơn 3mb

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 50 
});

app.use(limiter)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 3
});


app.use(session({
   secret: 'somethingsecretgoeshere',
   resave: false,
   saveUninitialized: true,
   cookie: { secure: true }
}));

app.use("/auth/login", loginLimiter);
 

//app.use(cors({ credentials: true, origin:"https://febaomatweb.vercel.app"}));//fix lỗi cross-domain
app.use(cors({ credentials: true, origin:true}));
app.use(cookieParser());
app.disable('x-powered-by');//fix lỗi leak info from x-powered-by

app.use(helmet.frameguard())//fix lỗi clickjacking
app.use(helmet.noSniff());//fix lỗi X-Content-Type-Options Header Missing
app.use(helmet.xssFilter());
app.use(
    helmet.hsts({
      maxAge: 31000000,
      preload: true,
    })
  );

app.use(helmet.contentSecurityPolicy({
  useDefaults: false,
   directives: {
       defaultSrc: ["'none'"],  // default value for all directives that are absent
       scriptSrc: ["'none'"],   // helps prevent XSS attacks
       frameAncestors: ["'self'"],  // helps prevent Clickjacking attacks
       styleSrc: ["'none'"],
       fontSrc:["'none'"],
       formAction:["'self'"],
       objectSrc:["'none'"]
    }
}))

app.use(
    helmet.referrerPolicy({
      policy: ["no-referrer"],
    })
  );

  app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next()
});

mongoose.connect(URI)
    .then(()=>{
        console.log('Connected')
        
    }).catch(err=> {
        console.log('err',err)
    })


app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} `)
        })
app.get('/',(req,res)=>{
        res.send('SUCCESS');
    });

  
app.use(passport.initialize());
app.use(passport.session());
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback',
  passport.authenticate('google'),
  (req, res) => {
    res.redirect('/surveys');
  }
);
app.use('/api',AuthRoute)
app.use('/api/user',UserRoute)
app.use('/api/social',SocialRoutes)