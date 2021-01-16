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
const Profile = require('../../modelsBS/userBS');
const Battery = require('../../modelsBS/batteryBS');
const Reserve = require('../../modelsBS/reserveModelBS');

/**
 * @summary Battery status of the user and the status of the station batteries
 * @param sohوstationId,code,soc1,soc2,username
 * @returns Restore battery information
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post('/batteryHealthCheck', passport.authenticate('jwt', {//درصورت خرابی باتری، باتری غیرفعال شود و تغییر اسم و دوباتری شدنه
  session: false,
}), (req, res) => {
  console.log("soh: " + req.body.soh)//سلامت
  console.log("stationId: " + req.body.stationId)
  console.log("code: " + req.body.code)
  console.log("soc1: " + req.body.soc1)//میزان شارژ
  console.log("soc2: " + req.body.soc2)//میزان شارژ
  console.log("phone: " + req.body.phone)
  try {
    const {
      errors,
      isValid
    } = validateBatteryInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    let errors = {};
    if(req.body.soh==0)
    {
      Profile.findOne({
        phone: req.body.phone
      }).then(profile => {
        if (profile) {
          Profile.findOneAndUpdate({
            phone: req.body.phone
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
      Battery.find({
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

router.post('/userValidationInSwap', async(req, res) => {

  switch(req.body.type){

      case 'PhonePassword':

            //const username = req.body.username;
          const phone = req.body.phone;
          const password = req.body.password;

          Profile
          .findOne(
            {
                //username: username, 
                phone: phone, 
                password: password, 
                confirmed: true, 
                active: true
            }
          )
          .then(prof => {

              if(prof){

                  await Promise.all(
                    prof.batteries.map(async(batteryCode) => {

                        const battery = await Battery.findOne(
                            {
                                code: batteryCode,
                                userID: prof._id
                            }
                        )
                        .exec();
                        
                        checking = () => new Promise(async (resolve, reject) => {

                            if(battery){
                                if(battery.status === 0){

                                    return resolve(false);
    
                                }else{
                                    return resolve(true);
                                }
                            }else{
                                return resolve(false);
                            }
                            
                        });

                        checking()
                        .then(resolve => {

                            if(!resolve){
                                console.log('One of the betteries is not active');
                                await Profile.findOneAndUpdate(
                                    {
                                        _id: prof._id
                                    },
                                    {
                                        confirmed: false
                                    }
                                )
                                .exec();
                                    
                                return res.status(400).send({
                                    valid: false,
                                    userID: 0,
                                    error: 'باتری با کد ' +  battery.code + 'دچار مشکل است.'
                                });
                            }
                        })
                        .catch(err => {

                            console.log(err);
                            return res.status(400).send({
                                valid: false,
                                userID: 0,
                                error: 'خطا در احراز هویت کاربر.'
                            });
                        });
                    })
                  );

                  return res.status(200).send({
                      valid: true,
                      userID: prof._id
                  });

              }else{

                  return res.status(400).send({
                      valid: false,
                      userID: 0,
                      error: 'کاربری با این مشخصات یافت نشد.'
                  });

              }

          })
          .catch(err => {

              console.log('userValidationByPhonePassword db error', err);
              return res.status(400).send({
                  valid: false,
                  userID: 0,
                  error: 'خطا در احراز هویت کاربر.'
              });
              
          });

          break;
      case 'RFIDCode':

        const RFIDCode = req.body.RFIDCode;
        Profile
        .findOne(
            {
                RFIDCode: RFIDCode, 
                confirmed: true, 
                active: true
            }
        )
        .then(prof => {

            if(prof){

                await Promise.all(

                    prof.batteries.map(async(batteryCode) => {

                        await Battery.findOne(
                            {
                                code: batteryCode,
                                userID: prof._id
                            }
                        )
                        .exec();

                        checking = () => new Promise(async (resolve, reject) => {

                            if(battery){
                                if(battery.status === 0){

                                    return resolve(false);

                                }else{
                                    return resolve(true);
                                }
                            }else{
                                return resolve(false);
                            }
                            
                        });

                        checking()
                        .then(resolve => {

                            if(!resolve){
                                console.log('One of the betteries is not active');
                                await Profile.findOneAndUpdate(
                                    {
                                        _id: prof._id
                                    },
                                    {
                                        confirmed: false
                                    }
                                )
                                .exec();
                                    
                                return res.status(400).send({
                                    valid: false,
                                    userID: 0,
                                    error: 'باتری با کد ' +  battery.code + 'دچار مشکل است.'
                                });
                            }
                        })
                        .catch(err => {

                            console.log(err);
                            return res.status(400).send({
                                valid: false,
                                userID: 0,
                                error: 'خطا در احراز هویت کاربر.'
                            });
                        });
                        
                    })
                );//End of promise.all

                return res.status(200).send({
                    valid: true,
                    userID: prof._id
                });

            }else{

                return res.status(400).send({
                    valid: false,
                    userID: 0,
                    error: 'کاربری با این مشخصات یافت نشد.'
                });

            }

        })
        .catch(err => {
            console.log('userValidationByRFIDCode db error', err);
            return res.status(400).send({
                valid: false,
                userID: 0,
                error: 'خطا در احراز هویت کاربر.'
            });
        });
        break;

      case 'QRCode':
          try{

              const stationID = req.body.QRCode;
              const userToken = req.body.token;

              const station = await Station.findOne(
                  {
                      _id: stationID,
                      isActive: true
                  }
              )
              .exec();

              if(!station){

                return res.status(400).send({
                    valid: false,
                    userID: 0,
                    error: 'ایستگاه فعالی با این مشخصات یافت نشد.'
                });

              }else{

                const decoded = await jwt.verify(
                    userToken.split(' ')[1],
                    keys.secretOrKey,
                );
            
                Profile.findOne(
                    {
                        phone: decoded.phone,
                        confirmed: true, 
                        active: true
                    }
                )
                .then(prof => {
            
                    if(prof){

                        await Promise.all(

                            prof.batteries.map(async(batteryCode) => {
        
                                await Battery.findOne(
                                    {
                                        code: batteryCode,
                                        userID: prof._id
                                    }
                                )
                                .exec();
        
                                checking = () => new Promise(async (resolve, reject) => {
        
                                    if(battery){
                                        if(battery.status === 0){
        
                                            return resolve(false);
        
                                        }else{
                                            return resolve(true);
                                        }
                                    }else{
                                        return resolve(false);
                                    }
                                    
                                });
        
                                checking()
                                .then(resolve => {
        
                                    if(!resolve){
                                        console.log('One of the betteries is not active');
                                        await Profile.findOneAndUpdate(
                                            {
                                                _id: prof._id
                                            },
                                            {
                                                confirmed: false
                                            }
                                        )
                                        .exec();
                                            
                                        return res.status(400).send({
                                            valid: false,
                                            userID: 0,
                                            error: 'باتری با کد ' +  battery.code + 'دچار مشکل است.'
                                        });
                                    }
                                })
                                .catch(err => {
        
                                    console.log(err);
                                    return res.status(400).send({
                                        valid: false,
                                        userID: 0,
                                        error: 'خطا در احراز هویت کاربر.'
                                    });
                                });
                                
                            })
                        );//End of promise.all
            
                        return res.status(200).send({
                            valid: true,
                            userID: prof._id
                        });
            
                    }else{
            
                        return res.status(400).send({
                            valid: false,
                            userID: 0,
                            error: 'کاربری با این مشخصات یافت نشد.'
                        });
            
                    }
            
                })
                .catch(err => {
                    console.log('userValidationByQRCode db error', err);
                    return res.status(400).send({
                        valid: false,
                        userID: 0,
                        error: 'خطا در احراز هویت کاربر.'
                    });
                });
              }

          }catch(err){

              console.log('userValidationByQRCode error', err);
              return res.status(400).send({
                  valid: false,
                  userID: 0,
                  error: 'خطا در احراز هویت کاربر.'
              });
          }
          
          break;
  }
});

router.post('/updateBatteryOwnerShipSwap', passport.authenticate("jwt", {session: false}), async(req, res) => {

    if(isEmpty(req.batteries)){

        return res.status(400).json('خطا در دریافت فیلد باتری.');

    }else{

        const decoded = await jwt.verify(
            req.token.split(' ')[1],
            keys.secretOrKey,
        );
    
        Profile.findOne(
            {
                phone: decoded.phone
            }
        )
        .then(user => {
    
            if(user){
    
                if(!user.confirmed || !user.active){

                    return res.status(400).json('کاربر غیرفعال است.');

                }else{

                    await Promise.all(

                        user.batteries.map(async(batteryCode) => {
    
                            const battery = await Battery.findOne(
                                {
                                    code: batteryCode,
                                    userID: user._id
                                }
                            )
                            .exec();

                            checking = () => new Promise(async (resolve, reject) => {
        
                                if(battery){
                                    if(battery.status === 0){
    
                                        return resolve(false);
    
                                    }else{
                                        return resolve(true);
                                    }
                                }else{
                                    return resolve(false);
                                }
                                
                            });
    
                            checking()
                            .then(resolve => {
    
                                if(!resolve){

                                    console.log('One of the betteries is not active');
                                    await Profile.findOneAndUpdate(
                                        {
                                            _id: prof._id
                                        },
                                        {
                                            confirmed: false
                                        }
                                    )
                                    .exec();
                                        
                                    return res.status(400).send({
                                        valid: false,
                                        userID: 0,
                                        error: 'باتری با کد ' +  battery.code + 'دچار مشکل است و بنابراین کاربر غیرفعال شد.'
                                    });
                                }
                            })
                            .catch(err => {
    
                                console.log(err);
                                return res.status(400).send({
                                    valid: false,
                                    userID: 0,
                                    error: 'خطا در بروزرسانی اطلاعات.'
                                });
                            });

                        })
                    );
                    
                    //check if new batteries are active
                    await Promise.all(
                        req.batteries.map(async(btrCode) => {
            
                            const btr = await Battery.findOne(
                                {
                                    code: btrCode
                                }
                            )
                            .exec();

                            checking = () => new Promise(async(resolve, reject) => {

                                if(btr){
                                    if(btr.status === 0){
                                        return resolve(false);
                                    }else{
                                        const reserve = await Reserve.find(
                                            {
                                                batteries: { '$in': btr._id}
                                            }
                                        )
                                        .exec();

                                        if(reserve){
                                            return resolve(false);
                                        }else{
                                            return resolve(true);
                                        }
                                    }
                                }else{
                                    return resolve(false);
                                }
                            });

                            checking()
                            .then(resolve => {
                                if(!resolve){

                                    return res.status(400).json( {
                                        valid: false,
                                        userID: 0,
                                        error: 'باتری با کد' + btr.code + 'قابل استفاده نمی‌باشد.'
                                    });
                                }
                            })
                            .catch();
                            
                        })
                    );

                    Profile.findOneAndUpdate(
                        {
                            _id: user._id
                        },
                        {
                            batteries: req.batteries
                        }
                    )
                    .then(() => {

                        Battery.updateMany(
                            {
                                userID: user._id,
                                code: {"$nin" : req.batteries}
                            },
                            {
                                userID:""
                            }
                        )
                        .then(() => {

                            return res.status(200).json({
                                valid: true,
                                userID: user._id
                            });
                        })
                        .catch(err => {
                            console.log(err);
                        });

                    })
                    .catch(err => {
    
                        console.log(err);
                        return res.status(400).json( {
                            valid: false,
                            userID: 0,
                            error: 'خطا در بروزرسانی اطلاعات.'
                        });
                    });
                }
                
            }else{

                return res.status(400).json({
                    valid: false,
                    userID: 0,
                    error: 'کاربر یافت نشد.'
                });
            }
            
        })
        .catch(err => {
    
            console.log('update battery ownership db error.', err);
            return res.status(400).json( {
                valid: false,
                userID: 0,
                error: 'خطا در بروزرسانی اطلاعات.'
            });
    
        });

    }

});

module.exports = router;