import jwt from "jsonwebtoken";
import { ResponseDetail } from "../services/ResponseJSON.js";
const verifyToken = (req, res, next) => {
        const token = req.headers.authorization;
        if (token) {
            const accessToken = token.split(" ")[1];
            jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                if (err) {
                    return res.status(403).json(ResponseDetail(403,{message:"Token không hợp lệ"}));
                }
                req.user = user;
                next();
            })          
        } else {
            return res.status(401).json(ResponseDetail(401,{message:"Không có token"}));
        }    
}

export const verifyTokenAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        const accessToken = token.split(" ")[1];
        jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
            if (err) {
                return res.status(403).json(ResponseDetail(403,{message:"Token không hợp lệ"}));
            }
            if(user.roles.includes("ADMIN")){
                req.user = user
                next();
            }   
            else
                return req.status(403).json(ResponseDetail(403,{message:"Bạn không có quyền truy cập"}))
        })          
    } else {
        return res.status(401).json(ResponseDetail(401,{message:"Không có token"}));
    }    
}

export { verifyToken }