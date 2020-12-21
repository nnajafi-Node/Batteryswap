/**
 * use validator module
 * Validation of registration input values
 */
const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateRegisterInput(data) {
  let errors = {};
  data.phone = !isEmpty(data.phone) ? data.phone : "";
  data.username = !isEmpty(data.username) ? data.username : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.password2 = !isEmpty(data.password2) ? data.password2 : "";

  if (Validator.isEmpty(data.phone)) {
    errors.phone = "ورود شماره موبایل الزامی است";
  }
  if(!phoneValidation(data.phone)){
    errors.phone = "شماره موبایل معتبر نیست";
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = "وارد کردن رمز عبور الزامی است";
  }

  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "طول رمز عبور نباید کمتر از 6 حرف یا عدد باشد";
  }

  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "تکرار رمز عبور الزامی است";
  }

  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "تکرار رمز ورود صحیح نیست";
  }

  function phoneValidation(phone){
    return /^(\+98|0)?9\d{9}$/.test(phone);
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
