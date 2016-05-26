// Base64 Encoding
function encode(s) {
    var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        o = [];
    for (var i = 0, n = s.length; i < n;) {
        var c1 = s.charCodeAt(i++),
            c2 = s.charCodeAt(i++),
            c3 = s.charCodeAt(i++);
        o.push(c.charAt(c1 >> 2));
        o.push(c.charAt(((c1 & 3) << 4) | (c2 >> 4)));
        o.push(c.charAt(i < n + 2 ? ((c2 & 15) << 2) | (c3 >> 6) : 64));
        o.push(c.charAt(i < n + 1 ? c3 & 63 : 64));
    }
    return o.join("");
}

// The first day  time stamp of the current month
function GetFirstDayTimestampOfCurrentMonth(){
    var d = new Date();
    var first_day_timestamp = d.getFullYear().toString()  + '-' + (d.getMonth()+1).toString() + '-'  + '01'
        + ' 00:00:00';
    return first_day_timestamp;
}

function GetCurrentDayTimestampOfCurrentMonth(){
    var d = new Date();
    var cur_day_timestamp =  d.getFullYear().toString()  + '-' + (d.getMonth()+1).toString() + '-'  + d.getDate().toString()
        + ' 23:59:59';
    return cur_day_timestamp;
}

function GetCurrentTimestamp(){
    var d = new Date();
    var time_stamp = d.getFullYear().toString() + '-' + (d.getMonth()+1).toString() +'-' + d.getDate().toString()
        + ' ' + d.getHours().toString() + ':' + d.getMinutes().toString() + ':' + d.getSeconds().toString();
    return time_stamp;
}

function GetLastTenMinutesTimestamp(){
    var d = new Date();
    d.setMinutes(d.getMinutes() - 10);
    var time_stamp = d.getFullYear().toString() + '-' + (d.getMonth()+1).toString() +'-' + d.getDate().toString()
        + ' ' + d.getHours().toString() + ':' + d.getMinutes().toString() + ':' + d.getSeconds().toString();
    return time_stamp;
}
