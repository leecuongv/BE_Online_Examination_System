const jwt = require("jsonwebtoken");
 const generateAccessToken= (data) => {
    const accessToken = jwt.sign(
        data,
        process.env.JWT_ACCESS_KEY,
        { expiresIn: "2h" }
    )
    return accessToken
}

const generateRefreshToken= (data) => {
    const accessToken = jwt.sign(
        data,
        process.env.JWT_ACCESS_KEY,
        { expiresIn: "7d" }
    )
    return accessToken
}
module.exports = {generateAccessToken,generateRefreshToken}