import jwt from "jsonwebtoken";
export const generateAccessToken= (data) => {
    const accessToken = jwt.sign(
        data,
        process.env.JWT_ACCESS_KEY,
        { expiresIn: "2h" }
    )
    return accessToken
}

export const generateRefreshToken= (data) => {
    const accessToken = jwt.sign(
        data,
        process.env.JWT_ACCESS_KEY,
        { expiresIn: "7d" }
    )
    return accessToken
}