const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");

// Load Input Validation
//const validateBatteryInput = require("../validation/battery");

// Load User model
const profileModel = require('../../modelsBS/userBS');
const batteryModel = require('../../modelsBS/batteryBS');

router.post('/insert', (req, res) => {
    
    batteryModel.findOne(
        {
            code: req.body.code
        }
    )
    .then(btr => {
        if(btr){
            return res.status(400).json('باتری با این کد قبلا ثبت شده‌است');
        }else{

            const battery = new batteryModel({

                code: req.body.code,
                userID: req.body.userID,
                status: req.body.status,
                soc: req.body.soc
        
            });
        
            battery
            .save()
            .then( newBattery => {
        
                if(newBattery){
                    return res.status(200).send(newBattery);
                }else{
                    console.log('Failed to save new battery');
                    return;
                }
        
            })
            .catch(err => {
                console.log(err);
                return;
            });

        }
    })
    .catch(err => {
        console.log(err);
        return;
    });

});

module.exports = router;