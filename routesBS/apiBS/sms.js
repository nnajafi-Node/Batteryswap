/**
 * use request module
 * send sms to user
 */
const request = require('request');
/**
 * @summary Send request to ippanel to send sms to user.
 * @param number,code,patterncode
 * @returns If the status is 200, sending sms has been successful, otherwise the error message will be returned.
 */
module.exports = function sendsms(number,code,patterncode){
    request.post({
        url: 'http://ippanel.com/api/select',
        body: {
    "op":"pattern",
    "user":"09124607657",
    "pass":"2669895433",
    "fromNum":"3000505",
    "toNum":number,
    "patternCode":patterncode,
    "inputData":[
        {"code":code}	
    ]
    },
        json: true,
    }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        console.log(response.body);
    } else {
        console.log("sms ارسال نشد.");
    }
    });
}