
const Validator = require("validator");
const isEmpty = require('./is-empty');//changed

module.exports = function(user){

    let errors = {};

    if(isEmpty(user.userId)){
        errors.userId = 'شناسه کاربر معتبر نمی‌باشد.';
    }

    if(isEmpty(user.ConfirmStatus) || typeof(user.ConfirmStatus) !== "boolean"){
        errors.ConfirmStatus = 'پارامترهای وروردی معتبر نمی‌باشد.';
    }

    if(isEmpty(user.ActivationStatus) || typeof(user.ActivationStatus) !== "boolean"){
        errors.ActivationStatus = 'پارامترهای وروردی معتبر نمی‌باشد.';
    }

    if(isEmpty(user.RFIDCode)){
        errors.RFIDCode = 'کد کارت معتبر نمی‌باشد.';
    }

    if(isEmpty(user.MotorCode)){
        errors.MotorCode = 'کد کارت معتبر نمی‌باشد.';
    }

    return({
        errors,
        isValid: isEmpty(errors)
    });
}