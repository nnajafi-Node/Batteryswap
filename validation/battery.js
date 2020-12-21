/**
 * use validator module
 * Validation of registration input values
 */
const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateBatteryInput(data) {
  let errors = {};
  data.soh = !isEmpty(data.soh) ? data.soh : "";
  data.stationId = !isEmpty(data.stationId) ? data.stationId : "";
  data.code = !isEmpty(data.code) ? data.code : "";
  data.soc1 = !isEmpty(data.soc1) ? data.soc1 : "";
  data.soc2 = !isEmpty(data.soc2) ? data.soc2 : "";
  data.username = !isEmpty(data.username) ? data.username : "";

  if (Validator.isEmpty(data.soh)) {
    errors.soh = "ورود وضعیت سلامت باتری الزامی است";
  }

  if (Validator.isEmpty(data.stationId)) {
    errors.stationId = "وارد کردن ایستگاه شارژ الزامی است";
  }

  if (Validator.isEmpty(data.code)) {
    errors.code = "ورود کد باتری ها الزامی است";
  }

  if (Validator.isEmpty(data.soc1)) {
    errors.soc1 = "ورود کد باتری ها الزامی است";
  }

  if (Validator.isEmpty(data.soc2)) {
    errors.soc2 = "ورود کد باتری ها الزامی است";
  }

  if (Validator.isEmpty(data.username)) {
    errors.username = "ورود نام کاربری الزامی است";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
