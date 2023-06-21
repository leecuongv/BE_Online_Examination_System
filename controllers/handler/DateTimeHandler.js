function CompareDate(date1Str, date2Str) {
    let date1 = new Date(date1Str)
    let date2 = new Date(date2Str)
    if (date1.valueOf() < date2.getTime())
        return -1
    else if (date1.valueOf() > date2.valueOf())
        return 1
    else
        return 0

}
function IsOpen(dateStr) {

    if (CompareDate(dateStr, (new Date()).toDateString()) <= 0) {
        return true
    }
    else
        return false
}
function IsClose(dateStr) {

    if (CompareDate(dateStr, (new Date()).toDateString()) >= 0) {
        return true
    }
    else
        return false
}
module.exports = { CompareDate, IsClose, IsOpen };