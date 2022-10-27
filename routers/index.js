const AuthRoute = require('./AuthRoute')
const UserRoute = require('./UserRoute');
const SocialRoutes = require('./SocialRoutes');
const CourseRoutes = require('./CourseRoutes');
const BillRoute = require('./BillRoute');
const examRoute = require("./examRoutes");
const questionRoute = require("./questionRoutes")
const TakeExamRoute = require("./takeExamRoutes") 

module.exports = { AuthRoute, UserRoute, SocialRoutes, CourseRoutes, BillRoute, examRoute }
