const AuthRoute = require('./AuthRoute')
const UserRoute = require('./UserRoute');
const SocialRoutes = require('./SocialRoutes');
const CourseRoutes = require('./CourseRoutes');
const BillRoute = require('./BillRoute');
const examRoutes = require("./examRoutes");
const questionRoutes = require("./questionRoutes")
const TakeExamRoutes = require("./TakeExamRoutes") 

module.exports = { AuthRoute, UserRoute, SocialRoutes, CourseRoutes, BillRoute, examRoutes,questionRoutes,TakeExamRoutes }
