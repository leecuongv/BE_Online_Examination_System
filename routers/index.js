const AuthRoute = require('./AuthRoute')
const UserRoute = require('./UserRoute');
const SocialRoutes = require('./SocialRoutes');
const CourseRoutes = require('./CourseRoutes');
const BillRoute = require('./BillRoute');
const ExamRoutes = require("./ExamRoutes");
const QuestionRoutes = require("./QuestionRoutes")
const TakeExamRoutes = require("./TakeExamRoutes")
const QuestionBankRoutes = require("./QuestionBankRoutes")  

module.exports = { 
    AuthRoute, 
    UserRoute, 
    SocialRoutes, 
    CourseRoutes, 
    BillRoute, 
    ExamRoutes,
    QuestionRoutes,
    TakeExamRoutes,
    QuestionBankRoutes
 }
