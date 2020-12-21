const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateProfileInput(data) {
  let errors = {};
  data.name = !isEmpty(data.name) ? data.name : "";
  data.username = !isEmpty(data.username) ? data.username : "";
  data.nationalcode = !isEmpty(data.nationalcode) ? data.nationalcode : "";
  data.phone = !isEmpty(data.phone) ? data.phone : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.batteries = !isEmpty(data.batteries) ? data.batteries : "";
  data.MotorCode = !isEmpty(data.MotorCode) ? data.MotorCode : "";

  if (Validator.isEmpty(data.name)) {
    errors.name = "وارد کردن نام و نام خانوادگی الزامی است";
  }
  if (Validator.isEmpty(data.username)) {
    errors.username = "وارد کردن نام کاربری الزامی است";
  }
  /**
   * Validate national-code to be exactly 10 characters,
   * also obey the Iran national-code structure
   */
  if (!Validator.isLength(data.nationalcode, {
      min: 10,
      max: 10
    }) || !nationalcodeValidation(data.nationalcode)) {
    errors.nationalcode = "کدملی معتبر نیست";
  }
  if (Validator.isEmpty(data.nationalcode)) {
    errors.nationalcode = "وارد کردن کدملی الزامی است";
  }
  /**
   * Validate the client's phone
   */
  if(!phoneValidation(data.phone)){
    errors.phone = "شماره موبایل معتبر نمی باشد.";
  }
  /**
   * Validate the client's email address
   */
  if(!emailValidation(data.email)){
    errors.email = "آدرس ایمیل معتبر نمی باشد.";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
/**
 * phone validation using regular expression.
 */
function phoneValidation(phone){
    return /^(\+98|0)?9\d{9}$/.test(phone);
}

/**
 * email validation using regular expression.
 * It should obey the email format: example@someDomain
 * @param {string} email 
 * @returns {boolean} true if is valid, else false.
 */
function emailValidation(email){
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

/**
 * national-code validation according to Iran's structure.
 * Reference: http://www.aliarash.com/article/codemeli/codemeli.htm
 * @param  {string} code - client's national code
 */
function nationalcodeValidation(code)
{
  var L=code.length;

  if(L<8 || parseInt(code,10)==0) return false;
  code=('0000'+code).substr(L+4-10);
  if(parseInt(code.substr(3,6),10)==0) return false;
  var c=parseInt(code.substr(9,1),10);
  var s=0;
  for(var i=0;i<9;i++)
    s+=parseInt(code.substr(i,1),10)*(10-i);
  s=s%11;
  return (s<2 && c==s) || (s>=2 && c==(11-s));
}