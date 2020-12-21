/**
 * use express,bcrypt,jwt,passport,randtoken module
 * Registration and editing user information
 */
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const randtoken = require('rand-token');

let refreshTokens = {}; //mngdb

// Load Input Validation
const validateRegisterInput = require("../../validation/register");

// Load User model
const profileModel = require('../../modelsBS/userBS');//changed
const randomCodeModel = require('../../modelsBS/randomCodeBS');//changed

const sendsms = require('./sms');
/**
 * @summary Confirm the mobile number entered by the user, check the lack of previous registration, create a verification code and send by SMS to the user.
 * @param phone
 * @returns error - an array of error strings
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post('/verifyPhone', async (req, res) => {
  console.log("REQUEST: " + JSON.stringify(req.body.phone))
  try {
    let errors = {};
    var reg=/^(\+98|0)?9\d{9}$/.test(req.body.phone);
    if(!reg) {
      console.log("شماره موبایل صحیح نمی باشد")
      errors.phone="شماره موبایل صحیح نمی باشد";
    }
    var tmp = await profileModel.findOne({
      phone: req.body.phone
    });
    if(tmp) {
      console.log("شماره موبایل وجود دارد");
      errors.isphone="شماره موبایل وجود دارد";
      if(!isEmpty(errors))
        return res.status(400).json(errors);
    } 
    else {
      let code = Math.floor(100000 + Math.random() * 900000);
      let tmp = 0;
      randomCodeModel.findOne({
        phone: req.body.phone
      })
      .then(randomCode => {
        if (randomCode) {
          randomCodeModel.findOneAndUpdate({
            phone: req.body.phone
          }, {
            $set: {
              code:code
            }
          })
          .then(() => {
            res.status(200).send("کد ارسال خواهد شد");
            sendsms(req.body.phone, code.toString(),"m3lv2766gr");
          })
          .catch(err => res.status(400).json(err));
        }
        else {
          const randomcode =  new randomCodeModel({
            phone: req.body.phone,
            code: code
          });
          randomcode.save().then(() => {
            res.status(200).send('کد ارسال خواهد شد'); 
            sendsms(req.body.phone, code.toString(),"m3lv2766gr");
          })
          .catch(err => res.status(400).json(err));
        }
      })
      .catch(err => res.status(400).json(err));
    }
  } 
  catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})
/**
 * @summary Resend verification code.
 * @param phone
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post('/resendCode', async (req, res) => {
  console.log("resendCode: " + JSON.stringify(req.body.phone))
  try {
    let code = Math.floor(100000 + Math.random() * 900000);
    let tmp = 0;
    randomCodeModel.findOne({
      phone: req.body.phone
    })
    .then(randomCode => {
      if (randomCode) {
        randomCodeModel.findOneAndUpdate({
          phone: req.body.phone
        }, {
          $set: {
            code:code
          }
        })
        .then(() => {
          res.status(200).send("کد ارسال خواهد شد");
          sendsms(req.body.phone, code.toString(),"m3lv2766gr");
        })
        .catch(err => res.status(400).json(err));
      }
      else {
        const randomcode =  new randomCodeModel({
          phone: req.body.phone,
          code: code
        });
        randomcode.save().then(() => {
          res.status(200).send('کد ارسال خواهد شد'); 
          sendsms(req.body.phone, code.toString(),"m3lv2766gr");
        })
        .catch(err => res.status(400).json(err));
      }
    })
    .catch(err => res.status(400).json(err));
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})
/**
 * @summary Check the verification code entered by the user.
 * @param phone,code
 * @returns error - an array of error strings
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post('/verifyCode', async (req, res) => {
  try {
    var tmp = await randomCodeModel.findOne({
      phone: req.body.phone
    });
    if (tmp) {
      if (JSON.parse(JSON.stringify(tmp)).code == req.body.code) {
        return res.status(200).send();
      } 
      else {
        res.status(400).send('کد صحیح نیست');
      }
    } 
    else {
      res.status(400).send('کد وجود ندارد');
    }
  } 
  catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})
/**
 * @summary Initial user registration.
 * @param phone,username,password
 * @returns error - an array of error strings
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post("/InitialRegister", (req, res) => {
  const {
    errors,
    isValid
  } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  profileModel.findOne({
    username: req.body.username
  }).then(user => {
    if (user) {
      errors.username = "نام کاربری وجود دارد";
      return res.status(400).json(errors);
    } 
    else {
      const newUser = new profileModel({
        phone: req.body.phone,
        username: req.body.username,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => res.status(400).json(err));
        });
      });
    }
  })
  .catch(err => res.send(err));
});
/**
 * Change the way messages are displayed to the user
 * regex Iran Mobile Number
 */
router.post('/forgotverify', async (req, res) => {
  console.log("forgotverify: " + JSON.stringify(req.body.phone))
  try {
    var reg=/^(\+98|0)?9\d{9}$/.test(req.body.phone);
    if(!reg) {
      console.log("شماره موبایل صحیح نمی باشد")
      return res.status(400).send('شماره موبایل صحیح نمی باشد');
    }
    var tmp = await profileModel.findOne({
      phone: req.body.phone
    });
    if (!tmp) {
      console.log("شماره موبایل وجود ندارد، لطفا ابتدا ثبت نام نمایید.")
      return res.status(400).send('شماره موبایل وجود ندارد، لطفا ابتدا ثبت نام نمایید.');
    } 
    else {
      let code = Math.floor(100000 + Math.random() * 900000);
      let tmp = 0;
      randomCodeModel.findOne({
        phone: req.body.phone
      })
      .then(randomCode => {
        if (randomCode) {
          randomCodeModel.findOneAndUpdate({
            phone: req.body.phone
          }, {
            $set: {
              code:code
            }
          })
          .then(() => {
            res.status(200).send("کد ارسال خواهد شد");
            sendsms(req.body.phone, code.toString(),"m3lv2766gr");
          })
          .catch(err => res.status(404).json(err));
        }
        else {
          const randomcode =  new randomCodeModel({
            phone: req.body.phone,
            code: code
          });
          randomcode.save().then(() => {
            res.status(200).send('کد ارسال خواهد شد'); 
            sendsms(req.body.phone, code.toString(),"m3lv2766gr");
          })
          .catch(err => res.status(404).json(err));
        }
      })
      .catch(err => res.status(404).json(err));
    }
  } 
  catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})
/**
 * Change the way messages are displayed to the user
 */
router.post("/reset", (req, res) => {
  const {
    errors,
    isValid
  } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(req.body.password, salt, (err, hash) => {
    if (err) throw err;
    req.body.password = hash;
    profileModel.findOneAndUpdate({
      phone: req.body.phone
    }, {
        $set: {
          password:req.body.password
        }
      })
      .then(user=> {
      res.status(200).send(user)
      })
      .catch(err => res.status(404).json(err));  
    });
  });
});

module.exports = router;