const formatTimeUTC = function () {
    let currentTime = new Date(new Date().toUTCString())
    let timeZone = currentTime.getTimezoneOffset();
    return new Date(currentTime.getTime() - (timeZone * 60000))
}


const formatTimeUTC_ = function (date) {
    let time = new Date(date)
    let currentTime = new Date(time.toUTCString())
    let timeZone = currentTime.getTimezoneOffset();
    return new Date(currentTime.getTime() - (timeZone * 60000))
}

const datetimeFormat = function (date, format) {
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
    let hour = date.getHours()
    let minute = date.getMinutes()
    let second = date.getSeconds()
    let millisecond = date.getMilliseconds()

    if (month < 10) month = '0' + month
    if (day < 10) day = '0' + day
    if (hour < 10) hour = '0' + hour
    if (minute < 10) minute = '0' + minute
    if (second < 10) second = '0' + second

    if (format === 'yyyymmddHHmmss') {
        return '' + year + month + day + hour + minute + second
    }
    else if (format === 'HHmmss') {
        return '' +  hour + minute + second
    }
}

module.exports = {formatTimeUTC,datetimeFormat,formatTimeUTC_}
