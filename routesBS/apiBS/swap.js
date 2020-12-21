/**
 * use express,jwt,passport module
 * Battery status of the user and the status of the station batteries
 */
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");

// Load Input Validation
const validateBatteryInput = require("../validation/battery");

// Load User model
const profile = require('./modelsBS/userBS');
const battery = require('./modelsBS/batteryBS');

/**
 * @summary Battery status of the user and the status of the station batteries
 * @param sohوstationId,code,soc1,soc2,username
 * @returns Restore battery information
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post('/batteryHealthCheck', passport.authenticate('jwt', {
  session: false,
}), (req, res) => {
  console.log("soh: " + req.body.soh)//سلامت
  console.log("stationId: " + req.body.stationId)
  console.log("code: " + req.body.code)
  console.log("soc1: " + req.body.soc1)//میزان شارژ
  console.log("soc2: " + req.body.soc2)//میزان شارژ
  console.log("username: " + req.body.username)
  try {
    const {
      errors,
      isValid
    } = validateProfileInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    let errors = {};
    if(req.body.soh==0)
    {
      Profile.findOne({
        username: req.body.username
      }).then(profile => {
        if (profile) {
          Profile.findOneAndUpdate({
              username: req.body.username
          }, {
            $set: {
              active : 0
            }
          }, {
            new: true
          })
          .then(profile => res.status(400).send("باتری های قرار داده شده خراب می باشد، تا اطلاع ثانوی کاربر غیرفعال شده. جهت پیگیری با پشتیبانی تماس بگیرید"))
          .catch(err => res.json(err));
        }
      });
    }
    else {
      const batteryAray = [];
      battery.find({
        stationId: req.body.stationId,
        status : 1
      })
      .then(baterries => {
        baterries.map((battery, index) => {
          if(battery.soc > req.body.soc1 || battery.soc > req.body.soc2)
          batteryAray[index] = battery;
        });
        res.status(200).json(timeSections);
      })
      .catch(err => res.status(404).json(err));
    }
  } 
  catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})

module.exports = router;