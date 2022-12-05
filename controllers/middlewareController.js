const jwt = require("jsonwebtoken");
const { STATUS, ROLES } = require("../utils/enum");
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        const accessToken = token.split(" ")[1];
        jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Token không hợp lệ" });
            }
            req.user = user;
            next();
        })
    } else {
        return res.status(401).json({ message: "Không có token" });
    }
}

const verifyTokenAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        const accessToken = token.split(" ")[1];
        jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Token không hợp lệ" });
            }
            // if(user.roles.includes("ADMIN")){
            //     req.user = user
            //     next();
            // } 
            if (user.role === ROLES.ADMIN) {
                req.user = user
                next();
            }
            else
                return res.status(403).json({ message: "Bạn không có quyền truy cập" })
        })
    } else {
        return res.status(401).json({ message: "Không có token" });
    }
}

module.exports = { verifyToken, verifyTokenAdmin }