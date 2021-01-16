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
    
    let batteris_arr = [];
    stationModel.findOne(
        {
            stationID: req.body.stationID
        }
    )
    .then(station => {
        if(station){
            return res.status(400).json('ایستگاه با این شناسه قبلا ثبت شده‌است');
        }else{

            checking = () => new Promise(async (resolve, reject) => {

                if(req.body.batteries && req.body.batteries.length > 0){
                   
                    const btrs = await batteryModel.find(
                        {
                            code: {'$in': req.body.batteries}
                        }
                    );

                    if(btrs){

                        if(btrs.length < req.body.batteries.length){
                            return reject('یکی از باتری‌های ارسالی در دیتابیس موجود نمی‌باشد.');
                        }else{
                            await Promise.all(

                                btrs.map(btr => {
                                    batteris_arr.push(btr._id);
                                })

                            );
                        }
                    }

                    if(batteris_arr.length > 0){
                        await stationModel.find(
                            {
                                batteries: {'$in': batteris_arr}
                            }
                        )
                        .populate('battery')
                        .exec(function(err, st){
            
                            if(err){
    
                                console.log(err);
                                return(reject(err));
    
                            }else if(st && st.length > 0){
                                
                                let str = '';
                                str += 'باتری‌های زیر در ایستگاه دیگری ثبت شده‌اند: ';
                                return(reject(str));
                            }else{
                                return resolve(batteris_arr);
                            }
                        });
                    }else{
                        return resolve([]);
                    }
                }
            });
            
            checking()
            .then(async (resolve) => {

                console.log(resolve, batteris_arr);

                const station = new stationModel({
                    stationID: req.body.stationID,
                    location:{
                        coordinates: [req.body.location.coordinates[0], req.body.location.coordinates[1]],
                        name: req.body.location.name
                    },
                    batteries: resolve,
                    date: Date.now(),
                    isActive:req.body.isActive
                });
    
                station
                .save()
                .then( newStation => {
                        
                    if(newStation){

                        let log = new logModel({
                            typeID: 2,//Station
                            type:1, //insert
                            after: newStation._id,
                            changeDate: Date.now(),
                            //userID: this.use._id
                        });
                
                        log.save()
                        .then(() => {
                            return res.status(200).send(newStation);
                        });

                    }else{
                        console.log('Failed to save new station');
                        return res.status(400).json('خطا در ثبت ایستگاه جدید.');
                    }
            
                })
                .catch(err => {
                    console.log(err);
                    return res.status(400).send(err);
                });
            })
            .catch(reject => {
                return res.status(400).send(reject);
            });
        }
    })
    .catch(err => {
        console.log(err);
        return;
    });

});

router.post('/edit', async (req, res) => {

    stationModel.findOne(
        {
            stationID: req.body.stationID
        }
    )
    .then(async (station) => {

        if(station){

            let log_arr = [];

                checking = () => new Promise(async (resolve, reject) => {

                    batteris_arr = [];
                    let new_info = station;
                    

                    if(req.body.location){

                        if(req.body.location.coordinates && req.body.location.coordinates.length === 2){
        
                            new_info.location.coordinates[0] = req.body.location.coordinates[0];
                            new_info.location.coordinates[1] = req.body.location.coordinates[1];

                            log_arr.push({  field: "location.coordinate", 

                                            before: toString(station.location.coordinates[0]) + ', '
                                                    + toString(station.location.coordinates[1]),

                                            after: toString(new_info.location.coordinates[0]) + ', '
                                                    + toString(new_info.location.coordinates[1])
                            });
                        }
        
                        if(req.body.location.name){
                            new_info.location.name = req.body.location.name;

                            log_arr.push({  field: "location.name", 
                                            before: station.location.name,
                                            after: new_info.location.name
                            });

                        }
                    }

                    if(req.body.date){
                        new_info.date = req.body.date;

                        log_arr.push({  field: "date", 
                                        before: station.date,
                                        after: new_info.date
                        });
                    }

                    if(req.body.isActive !== undefined){

                        new_info.isActive = req.body.isActive;

                        log_arr.push({  field: "isActive", 
                                        before: station.isActive,
                                        after: new_info.isActive
                        });
                    }

                    if(req.body.batteries && req.body.batteries.length > 0){
                       
                        const btrs = await batteryModel.find(
                            {
                                code: {'$in': req.body.batteries}
                            }
                        );
    
                        if(btrs){
    
                            if(btrs.length < req.body.batteries.length){
                                return reject('یکی از باتری‌های ارسالی در دیتابیس موجود نمی‌باشد.');
                            }else{

                                let str ='';
                                await Promise.all(
    
                                    btrs.map(btr => {
                                        batteris_arr.push(btr._id);
                                        str += btr._id + ', ';
                                    })
    
                                );

                                log_arr.push({  field: "batteries", 
                                                before: "",
                                                after: str
                                });

                            }
                        }
    
                        if(batteris_arr.length > 0){
                            await stationModel.find(
                                {
                                    batteries: {'$in': batteris_arr}//,
                                    //stationID: {'$ne': req.body.stationID}
                                }
                            )
                            .populate('battery')
                            .exec(function(err, st){
                
                                if(err){
        
                                    console.log(err);
                                    return(reject(err));
        
                                }else if(st && st.length > 0){
                                    
                                    let str = '';
                                    str += 'باتری‌های زیر در ایستگاه دیگری ثبت شده‌اند: ';
                                    return(reject(str));

                                }else{
                                    new_info.batteries = batteris_arr;
                                    return resolve(new_info);
                                    //resolve({"batteries":batteris_arr});
                                }
                            });
                        }else{
                            new_info.batteries = [];
                            return resolve(new_info);
                            //resolve({"batteries": []});
                        }
                    }else{
                        new_info.batteries = [];
                        return resolve(new_info);
                    }

                });

                checking()
                .then(async (resolve) => {
                    if(resolve/* && resolve.length > 0*/){
                        stationModel.updateOne(
                            {
                                stationID: req.body.stationID
                            },
                            {
                                $push: {batteries: resolve.batteries},
                                location: resolve.location,
                                date: resolve.date,
                                isActive: resolve.isActive
                            }
                        )
                        .then(async (updated) => {
                            let logs = [];
                            const date = Date.now();

                            await Promise.all( log_arr.map( lg => {

                                let log = new logModel({
                                    typeID: 2,//Station
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
                                return res.status(200).send(updated);
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
            return res.status(400).json('ایستگاه مورد نظر یافت نشد.');
        }
    })
});

router.post('/removeBattery', async (req, res) => {

    if(!req.body.stationID || (req.body.stationID && parseInt(req.body.stationID) <= 0)){
        return res.status(400).json('خطا در شناسایی ایستگاه.');
    }

    if(!req.body.batteries || (req.body.batteries && req.body.batteries.length <= 0)){
        return res.status(400).json('لیست باتری‌ها نمی‌تواند خالی باشد.');
    }
    
    batteris_arr = [];

    const btrs = await batteryModel.find(
        {
            code: {'$in': req.body.batteries}
        }
    );

    if(btrs){

        if(btrs.length < req.body.batteries.length){
            return res.status(400).send('یکی از باتری‌های ارسالی در دیتابیس موجود نمی‌باشد.');
        }else{
            Promise.all(

                btrs.map(btr => {
                    batteris_arr.push(btr._id);
                })

            )
            .then(() => {
                if(batteris_arr && batteris_arr.length > 0){
                    stationModel.updateOne(
                        {
                            stationID: req.body.stationID
                        },
                        {
                            $pullAll: {batteries: batteris_arr}
                        }
                    )
                    .then((modified) => {
                        if(modified && modified.nModified <= 0){
                            return res.status(400).json('باتری‌ها در ایستگاه مورد نظر یافت نشدند.');
                        }else{

                            let log = new logModel({
                                typeID: 2,//Station
                                type:3, //delete
                                field: 'batteries',
                                before: req.body.batteries.toString(),
                                changeDate: Date.now(),
                                //userID: this.use._id
                            });
                    
                            log.save()
                            .then(() => {
                                return res.status(200).send('حذف باتری‌ها با موفقیت انجام شد.');
                            });

                        }
                    })
                    .catch(err => {
                        return res.status(400).send(err);
                    });
                }
                
            })
            .catch(err => {
                return res.status(400).send(err);
            });
        }
    }else{
        return res.status(400).json('باتری‌های مورد نظر یافت نشدند.');
    }

});

router.post('/getStationInfo', async (req, res) => {
    
    if(parseInt(req.body.stationID) <= 0){
        return res.status(400).json("خطا در دریافت شناسه ایستگاه.");
    }else{

        stationModel.findOne(
            {
                stationID: req.body.stationID
            }
        )
        .then(station => {

            if(station){
                return res.status(200).send(station);
            }else{
                return res.status(400).json('ایستگاه مورد نظر یافت نشد.');
            }
        })
        .catch(err => {
            return res.status(400).send(err);
        });
        
    }
});

router.post('/getAllStationsInfos', async (req, res) => {

    if(req.body.isActive === undefined){

        stationModel
        .find()
        .then(stations => {
            return res.status(200).send(stations);
        })
        .catch(err => {
            return res.status(400).send(err);
        });

    }else{

        stationModel
        .find(
            {
                isActive: req.body.isActive
            }
        )
        .then(stations => {
            return res.status(200).send(stations);
        })
        .catch(err => {
            return res.status(400).send(err);
        });

    }
    
});

module.exports = router;