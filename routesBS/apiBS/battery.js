const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");

// Load Input Validation
//const validateBatteryInput = require("../validation/battery");

// Load User model
const profileModel = require('../../modelsBS/userBS');
const batteryModel = require('../../modelsBS/batteryBS');
const stationModel = require('../../modelsBS/stationModelBS');

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

            if(parseInt(req.body.userID) > 0){

                profileModel.findById(
                    
                    req.body.userID
                    
                )
                .then(user => {
    
                    if(user){
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

                                let log = new logModel({
                                    typeID: 3,//Battery
                                    type: 1, //insert
                                    after: newBattery.code,
                                    changeDate: Date.now(),
                                    //userID: this.use._id
                                });
                        
                                log.save()
                                .then(() => {
                                    return res.status(200).send(newBattery);
                                });

                            }else{
                                console.log('Failed to save new battery');
                                return;
                            }
                    
                        })
                        .catch(err => {
                            console.log(err);
                            return;
                        });
                    }else{
                       return res.status(404).json('کاربر موردنظر یافت نشد.');
                    }
                })
                .catch(err => {
                    console.log(err);
                    return res.status(400).send(err);
                });

            }else if(parseInt(req.body.stationID) > 0){

                stationModel.findOne(
                    {
                        _id: req.body.stationID
                    }
                )
                .then(station => {
                    if(station){

                        const battery = new batteryModel({
    
                            code: req.body.code,
                            stationID: req.body.stationID,
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

                    }else{

                        return res.status(404).json('ایستگاه مورد نظر یافت نشد.');
                    }
                })
                .catch(err => {
                    return res.status(400).send(err);
                });

            }else{
                return res.status(400).json('باتری باید متعلق به یک کاربر یا یک ایستگاه باشد.');
            }
           
        }
    })
    .catch(err => {
        console.log(err);
        return;
    });

});

router.post('/edit', (req, res) => {
    
    batteryModel.findOne(
        {
            code: req.body.code
        }
    )
    .then(btr => {

        if(btr){

            let log_arr = [];

            checking = () => new Promise(async (resolve, reject) => {

                let new_info = btr;

                if(req.body.firstUse){
                    new_info.firstUse = req.body.firstUse;

                    log_arr.push({  field: "firstUse", 
                                    before: btr.firstUse,
                                    after: new_info.firstUse
                    });
                }

                if(req.body.lastUse){
                    new_info.lastUse = req.body.lastUse;

                    log_arr.push({  field: "lastUse", 
                                    before: btr.lastUse,
                                    after: new_info.lastUse
                    });
                }

                if(req.body.stationID){
                    new_info.stationID = req.body.stationID;

                    log_arr.push({  field: "stationID", 
                                    before: btr.stationID,
                                    after: new_info.stationID
                    });
                }

                if(req.body.soc){
                    new_info.soc = req.body.soc;

                    log_arr.push({  field: "soc", 
                                    before: btr.soc,
                                    after: new_info.soc
                    });
                }

                return resolve(new_info);
            });

            checking()
            .then(async (resolve) => {
                if(resolve){
                    batteryModel.updateOne(
                        {
                            code: req.body.code
                        },
                        {
                            firstUse: resolve.firstUse,
                            lastUse: resolve.lastUse,
                            stationID: resolve.stationID,
                            soc: resolve.soc
                        }
                    )
                    .then(async (updated) => {

                        let logs = [];
                        const date = Date.now();

                        await Promise.all( log_arr.map( lg => {

                            let log = new logModel({
                                typeID: 3,//Battery
                                type:2, //Edit
                                field: lg.field,
                                before: lg.before,
                                after: lg.after,
                                changeDate: date,
                                //userID: this.use._id
                            });

                            logs.push(log);
                        }));
                            
                    
                        logs.save()
                        .then(() => {
                            return res.status(200).send(updated)
                        });
                    })
                    .catch(err => {
                        return res.status(400).send(err);
                    });
                }
            })
            .catch(err => {
                return res.status(400).send(err);
            });

        }else{
            return res.status(400).json('باتری موردنظر یافت نشد.');
        }
    })
    .catch(err => {
        console.log(err);
        return;
    });

});

router.post('/getBatteryInfo', async (req, res) => {

    if(req.body.code === undefined || req.body.code === ""){
        return res.status(400).json('خطا در دریافت کد باتری.');
    }else{

        batteryModel
        .findOne(
            {
                code: req.body.code
            }
        )
        .then(battery => {
            return res.status(200).send(battery);
        })
        .catch(err => {
            return res.status(400).send(err);
        });

    }
    
});

module.exports = router;