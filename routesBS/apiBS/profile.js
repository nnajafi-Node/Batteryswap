/**
 * use express,mongoose,passportوmoment-jalaali,multer,fs module
 * Register and edit user information
 */
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const multer = require('multer'); 
const fs = require('fs');

const validateProfileInput = require("../../validation/profile");
const Profile = require("../../modelsBS/userBS");
const Battery = require("../../modelsBS/batteryBS");
const Station = require("../../modelsBS/stationModelBS");

const passportLogin = require('passport')
        , LocalStrategy =require('passport-local').Strategy;

const jwt = require("jsonwebtoken");

const userValidation = require('../../validation/userValidation');//changed
const isEmpty = require('../../validation/is-empty');//changed
const { profile } = require("console");
const { resolve } = require("path");

passportLogin.use(new LocalStrategy(
  function(username, password, MotorCode, arrayOfBatteries, done){

      if(arrayOfBatteries.length <= 0 || MotorCode.length <= 0 || username.length <= 0 || password.length <= 0){
          console.log('Login to application parameters error.');
          return done(null, false, {message: 'خطا در پارامترهای وروردی.'});
      }
  
      try{
          Profile.find(
              {
                  username: username,
                  password: password,
                  MotorCode: MotorCode,
                  batteries: {'$in' : arrayOfBatteries},
                  active: true,
                  confirmed: true
              }
          )
          .then(user => {
              if(user){
                  console.log(user);
                  return done(null, true);
              }else{
                  return done(null, false, {message: 'کاربری با این مشخصات یافت نشد.'});
              }
              
          })
          .catch(err => {
              console.log("checkUserOwnershiptOfBatteries find user error: " + err);
              return done(null, false, {message: 'خطا در جستجوی کاربر.'});
          });
      }catch(err){
          console.log("checkUserOwnershiptOfBatteries error: " + err);
          return done(null, false, {message: 'خطا در جستجوی کاربر.'});
      }
  }
)
);

passportLogin.serializeUser(function(user, done){
  done(null, user._id);
});

passportLogin.deserializeUser(function(UserId, done){
  Profile.find({
      _id: UserId
  })
  .then(user => {
      done(null, user);
  })
  .catch(error => {
      done(error, null);
  });
});

/**
 * Change the way messages are displayed to the user
 */
router.post("/register",passport.authenticate("jwt", {session: false}),(req, res) => {
    const {
      errors,
      isValid
    } = validateProfileInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const profileFields = {};
    if (req.body.name) profileFields.name = req.body.name;
    if (req.body.username) profileFields.username = req.body.username;
    if (req.body.nationalcode) profileFields.nationalcode = req.body.nationalcode;
    if (req.body.phone) profileFields.phone = req.body.phone;
    if (req.body.email) profileFields.email = req.body.email;
    if (req.body.batteries) profileFields.batteries = req.body.batteries;
    if (req.body.MotorCode) profileFields.MotorCode = req.body.MotorCode;
    
    Profile.findOne({
      username: req.body.username
    }).then(profile => {
      if (profile) {
        Profile.findOneAndUpdate({
            username: req.body.username
        }, {
          $set: profileFields
        }, {
          new: true
        })
        .then(profile => res.json(profile))
        .catch(err => res.json(err));
      }
    });
});

router.post("/Edit", passport.authenticate("jwt", {session: false}), (req, res) => {
  const profileFields = {};
    if (req.body.name) profileFields.name = req.body.name;
    if (req.body.username) profileFields.username = req.body.username;
    if (req.body.nationalcode) profileFields.nationalcode = req.body.nationalcode;
    if (req.body.phone) profileFields.phone = req.body.phone;
    if (req.body.email) profileFields.email = req.body.email;
    if (req.body.batteries) profileFields.batteries = req.body.batteries;
    if (req.body.MotorCode) profileFields.MotorCode = req.body.MotorCode;

  Profile.findOne({
    username: req.body.username
  }).then(profile => {
    if (profile) {
      Profile.findOneAndUpdate({
        username: req.body.username
      }, {
        $set: profileFields
      }, {
        new: true
      })
      .then(profile => res.json(profile))
      .catch(err => res.json(err));
    }
  });
});

/**
 * cb is multer's callback. The first argument is the error 
 * and the next argument specifies if everything went ok(true) or not(false).
 */
var upload = multer({
  dest: 'uploads/', fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
          cb(null, true);
      } else {
          req.fileValidationError = 'فرمت فایل صحیح نمی‌باشد.';
          const error = new Error('فرمت فایل صحیح نمی‌باشد.');
          return cb(error, false);
      }
  }
});

/**
 * upload.single('fieldname') middleware:
 *      accept a single file with the name fieldname. The single file will be stored in req.file.
 */
router.post('/img/upload', upload.array('myImage', 10) , (req, res) => {
  let files_to_save = [];
  req.files.map(file => {
      if (file.size > 5000000)
          res.send('حجم فایل نباید بیشتر از 5 مگابایت باشد.');

      var img = fs.readFileSync(file.path);

      /**
       * Why use Base64 Encoding?
       * Sending information in binary format can sometimes be risky since 
       * not all applications or network systems can handle raw binary.
       * For instance email servers expect textual data, so ASCII is typically used. 
       * Therefore, if you want to send images or any other binary file to an email server 
       * you first need to encode it in text-based format, preferably ASCII.
       */
      var encode_image = img.toString('base64');
      
      const file_ = {
        data: new Buffer.from(encode_image, 'base64'),
        contentType: file.mimetype
      }

      files_to_save.push(file_);
      
      //remove the uploaded file from the "uploads" folder
      fs.unlink(file.path, (err)=>{
          if(err)
              res.send(err);
      });
  });

  /*const newFile = new fileUploadModel({
      files: files_to_save
  });
  
  newFile.save().then(saved_news => {
      res.redirect('../content/'+saved_news._id);
  });*/

  Profile.findOne({
    username: req.body.username
  }).then(profile => {
    if (profile) {
      Profile.findOneAndUpdate({
        username: req.body.username
      }, {
        $set: {
          docs: files_to_save
        }
      }, {
        new: true
      })
      .then(profile => res.json(profile))
      .catch(err => res.json(err));
    }
  });
});

router.post('/loginToApp', passport.authenticate('local'), (req, res) => {
  console.log('login to application.');

  const payload = {
    id: req.user._id,
    phone: req.user.phone
  }; 

  // Sign Token
  jwt.sign(
    payload,
    keys.secretOrKey, {
      expiresIn: 3600 * 5
    },
    (err, token) => {

        if(err){
            console.log(err);
        }

        res.json({
            success: true,
            token: "Bearer " + token,
            //refreshToken: refreshToken,
            phone: req.user.phone
        });
    }
  );
});

router.post('/changeConfirmUser', (req, res) => {

  try{

      const UserId = req.body.userId;
      const ConfirmStatus = req.body.ConfirmStatus;

       //Do confirm checkings

      const {
          errors,
          isValidUser
      } = userValidation(req.body);

      if(!isEmpty(errors.userId) || !isEmpty(errors.ConfirmStatus)){
          res.status(400).send(JSON.stringify(errors.userId, errors.ConfirmStatus));
          return false;
      }

      Profile.findOne(
          {
            _id: UserId
          }
      )
      .then(user => {

        if(user && user.doc.length > 0){

            Profile.findOneAndUpdate(
                {
                    _id: UserId
                },
                {
                    confirmed: ConfirmStatus
                }
            )
            .then((doc) => {
                console.log(doc);
                res.status(200).send(JSON.stringify('وضعیت تائید کاربر با موفقیت ثبت شد.'));
            })
            .catch(err => {
                console.log("changeConfirmUser update error: " + err);
                return res.status(400).send(JSON.stringify('خطا در تائید کاربر.'));
            });

        }else{
            return res.status(400).json('نقص مدارک کاربر.');
        }

      })
      .catch(err => {
          console.log(err);
      });
      
  }catch(err){
      console.log("changeConfirmUser error: " + err);
      res.status(400).send(JSON.stringify('خطا در تائید کاربر.'));
  }
  
});

router.post('/activationChangeUser', async (req, res) => {
  try{

      const UserId = req.body.userId;
      const ActivationStatus = req.body.ActivationStatus;

      const {
          errors,
          isValidUser
      } = userValidation(req.body);

      if(!isEmpty(errors.userId) || !isEmpty(errors.ActivationStatus)){
          res.status(400).send(JSON.stringify(errors.userId, errors.ActivationStatus));
          return false;
      }

      //Do active checkings
      const user = await Profile.findOne(
          {
              _id:UserId,
              confirmed:true
          }
      )
      .exec();

        if(user){

            checking = () => new Promise(async (resolve, reject) => {

                if(!user.active && ActivationStatus){

                    if(user.batteries.length <= 0 || !user.MotorCode){

                        return reject('کاربر مجاز به فعال بودن نیست.');

                    }else{

                        let error = "";
                        await Promise.all(
                            user.batteries.map(async (btr) => {

                                const battery = await Battery.findOne(
                                    {
                                        code: btr
                                    }
                                )
                                .exec();

                                if(battery){
                                    if(battery.status === 0){
                                        error = 'به دلیل غیرفعال بودن یکی از باتری‌های دراختیار کاربر، امکان فعال کردن کاربر وجود ندارد.';
                                        return;//return reject('به دلیل غیرفعال بودن یکی از باتری‌های دراختیار کاربر، امکان فعال کردن کاربر وجود ندارد.');
                                    }
                                }else{
                                    
                                    console.lof(err);
                                    error = 'خطا در فعالسازی کاربر.';
                                    return;// reject('خطا در فعالسازی کاربر.');
        
                                }
                            })
                        );

                        if(error.length > 0)
                            return reject(error);
                        else
                            return resolve(true);
                    }

                }else{
                    return resolve(true);
                }

            });

            checking()
            .then((result, err) => {

                if(err){
                    return res.status(400).json(err);

                }else if(result){

                    Profile.updateOne(
                        {
                            _id: UserId,
                            confirmed: true
                        },
                        {
                            active: ActivationStatus
                        }
                    )
                    .then((doc) => {
                        console.log(doc);
                        return res.status(200).send(JSON.stringify('وضعیت فعال/غیرفعال بودن کاربر باموفقیت بروزرسانی شد.'));
                    })
                    .catch(err => {
                        console.log("changeConfirmUser update error: " + err);
                        return res.status(400).send(JSON.stringify('خطا در فعالسازی کاربر.'));
                    });
                }
            })
            .catch(err =>{
                console.log(err);
                return res.status(400).json(err);
            });
        }
      
  }catch(err){
      console.log("changeConfirmUser error: " + err);
      return res.status(400).send(JSON.stringify('خطا در فعالسازی کاربر.'));
  }
});

router.post('/updateBatteryOwnerShip', passport.authenticate("jwt", {session: false}), async(req, res) => {

    if(isEmpty(req.batteries)){
        return res.status(400).json('فیلد باتری خالی است.');
    }

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
                return res.status(400).json('کاربر غیرفعال است.')
            }
            
            user.batteries.map(batteryCode => {

                Battery.findOne(
                    {
                        code: batteryCode,
                        userID: user._id
                    }
                )
                .then(battery => {
                    if(battery && battery.status === 0){

                        console.log('One of the betteries is not active');

                        Profile.findOneAndUpdate(
                            {
                                _id: user._id
                            },
                            {
                                confirmed: false
                            }
                        )
                        .then(() => {

                            return res.status(400).json({
                                valid: false,
                                userID: 0,
                                error: 'باتری با کد ' +  battery.code + 'دچار مشکل است و بنابراین کاربر غیرفعال شد.'
                            });

                        })
                        .catch(err => {
                            console.log('User confirmed db update error.', err);
                            return res.status(400).json({
                                valid: false,
                                userID: 0,
                                error: 'خطا در بروزرسانی اطلاعات.'
                            });
                        });

                    }
                })
                .catch(err => {
                    console.log('userValidationByQRCode battery validation db failed.', err);
                    return res.status(400).json({
                        valid: false,
                        userID: 0,
                        error: 'خطا در احراز هویت کاربر.'
                    });
                });
            });


            //check if new batteries are active
            req.batteries.map(btrCode => {

                Battery.findOne(
                    {
                        code: btrCode
                    }
                )
                .then(btr => {

                    if(btr.status === 0){
                        return res.status(400).json( {
                            valid: false,
                            userID: 0,
                            error: 'باتری با کد' + btr.code + 'قابل استفاده نمی‌باشد.'
                        });
                    }

                })
                .catch(err => {

                    console.log(err);
                    return res.status(400).json({
                        valid: false,
                        userID: 0,
                        error: 'خطا در احراز هویت کاربر.'
                    });
                });

            });

            Profile.findOneAndUpdate(
                {
                    _id: this.use._id
                },
                {
                    batteries: req.batteries
                }
            )
            .then()
            .catch(err => {
                console.log(err);
                return res.status(400).json( {
                    valid: false,
                    userID: 0,
                    error: 'خطا در بروزرسانی اطلاعات.'
                });
            })
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
});

provideRFIDCard = function(userId, RFIDCode){
  try{

      const {
          errors,
          isValidUser
      } = userValidation({userId, RFIDCode});

      if(!isEmpty(errors.userId) || !isEmpty(errors.RFIDCode)){
          res.status(400).send(JSON.stringify(errors.userId, errors.RFIDCode));
          return false;
      }

      Profile.updateOne(
          {
              _id: userId
          },
          {
              RFIDCode: RFIDCode
          }
      )
      .then((doc) => {
          console.log(doc);
          return true;
      })
      .catch(err => {
          console.log("provideRFIDCard update error: " + err);
          return false;
      })
  }catch(err){
      console.log("provideRFIDCard error: " + err);
      return false;
  }
}

checkUserOwnershiptOfMotor = function(UserId, MotorCode){
  try{

      const {
          errors,
          isValidUser
      } = userValidation({userId, MotorCode});

      if(!isEmpty(errors.userId) || !isEmpty(errors.MotorCode)){
          res.status(400).send(JSON.stringify(errors.userId, errors.MotorCode));
          return false;
      }

      Profile.find(
          {
              _id: UserId,
              MotorCode: MotorCode,
              active: true,
              confirmed: true
          }
      )
      .then(user => {
          if(user){
              console.log(user);
              return true;
          }else{
              return false;
          }
          
      })
      .catch(err => {
          console.log("checkUserOwnershiptOfMotor find user error: " + err);
          return false;
      })
  }catch(err){
      console.log("checkUserOwnershiptOfMotor error: " + err);
      return false;
  }
}

checkUserOwnershiptOfBatteries = function(UserId, arrayOfBatteries){

  if(arrayOfBatteries.length <= 0){
      console.log('checkUserOwnershiptOfBatteries array of batteries is null');
      return false;
  }

  try{
      Profile.find(
          {
              _id: UserId,
              batteries: {'$in' : arrayOfBatteries},
              active: true,
              confirmed: true
          }
      )
      .then(user => {
          if(user){
              console.log(user);
              return true;
          }else{
              return false;
          }
          
      })
      .catch(err => {
          console.log("checkUserOwnershiptOfBatteries find user error: " + err);
          return false;
      });
  }catch(err){
      console.log("checkUserOwnershiptOfBatteries error: " + err);
      return false;
  }
}

userValidationInLoginToApp = function(userId, MotorCode, arrayOfBatteries){

  if(arrayOfBatteries.length <= 0){
      console.log('checkUserOwnershiptOfBatteries array of batteries is null');
      return false;
  }

  const {
      errors,
      isValidUser
  } = userValidation({userId, MotorCode});

  if(!isEmpty(errors.userId) || !isEmpty(errors.MotorCode)){
      //res.status(400).send(JSON.stringify(errors.userId, errors.MotorCode));
      return false;
  }

  try{
      Profile.find(
          {
              _id: userId,
              MotorCode: MotorCode,
              batteries: {'$in' : arrayOfBatteries},
              active: true,
              confirmed: true
          }
      )
      .then(user => {
          if(user){
              console.log(user);
              return true;
          }else{
              return false;
          }
          
      })
      .catch(err => {
          console.log("checkUserOwnershiptOfBatteries find user error: " + err);
          return false;
      });
  }catch(err){
      console.log("checkUserOwnershiptOfBatteries error: " + err);
      return false;
  }
}

userValidationByUsernamePassword = function(username, password){

    Profile
    .findOne(
        {
            username: username, 
            password: password, 
            confirmed: true, 
            active: true
        }
    )
    .then(prof => {

        if(prof){

            prof.batteries.map(batteryCode => {

                Battery.findOne(
                    {
                        code: batteryCode,
                        userID: prof._id
                    }
                )
                .then(battery => {
                    if(battery && battery.status === 0){

                        console.log('One of the betteries is not active');
                        Profile.findOneAndUpdate(
                            {
                                _id: prof._id
                            },
                            {
                                confirmed: false
                            }
                        )
                        .then(() => {
                            return {
                                valid: false,
                                userID: 0,
                                error: 'باتری با کد ' +  battery.code + 'دچار مشکل است.'
                            };
                        })
                        .catch(err => {
                            console.log('User confirmed db update error.', err);
                            return {
                                valid: false,
                                userID: 0,
                                error: 'خطا در احراز هویت کاربر.'
                            };
                        });

                    }
                })
                .catch(err => {
                    console.log('userValidationByRFIDCode battery validation db failed.', err);
                    return {
                        valid: false,
                        userID: 0,
                        error: 'خطا در احراز هویت کاربر.'
                    };
                });
            });

            return {
                valid: true,
                userID: prof._id
            };

        }else{

            return {
                valid: false,
                userID: 0,
                error: 'کاربری با این مشخصات یافت نشد.'
            };

        }

    })
    .catch(err => {

        console.log('userValidationByUsernamePassword db error', err);
        return {
            valid: false,
            userID: 0,
            error: 'خطا در احراز هویت کاربر.'
        };
        
    });
}

userValidationByRFIDCode = function(RFIDCode){
    
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
            prof.batteries.map(batteryCode => {

                Battery.findOne(
                    {
                        code: batteryCode,
                        userID: prof._id
                    }
                )
                .then(battery => {
                    if(battery && battery.status === 0){

                        console.log('One of the betteries is not active');

                        Profile.findOneAndUpdate(
                            {
                                _id: prof._id
                            },
                            {
                                confirmed: false
                            }
                        )
                        .then(() => {
                            return {
                                valid: false,
                                userID: 0,
                                error: 'باتری با کد ' +  battery.code + 'دچار مشکل است.'
                            };
                        })
                        .catch(err => {
                            console.log('User confirmed db update error.', err);
                            return {
                                valid: false,
                                userID: 0,
                                error: 'خطا در احراز هویت کاربر.'
                            };
                        });

                    }
                })
                .catch(err => {
                    console.log('userValidationByRFIDCode battery validation db failed.', err);
                    return {
                        valid: false,
                        userID: 0,
                        error: 'خطا در احراز هویت کاربر.'
                    };
                });
            });

            return {
                valid: true,
                userID: prof._id
            };

        }else{

            return {
                valid: false,
                userID: 0,
                error: 'کاربری با این مشخصات یافت نشد.'
            };

        }

    })
    .catch(err => {
        console.log('userValidationByUsernamePassword db error', err);
        return {
            valid: false,
            userID: 0,
            error: 'خطا در احراز هویت کاربر.'
        };
    });
}

checkStationOwnerShipOfBattery = function(stationID, batteries){
    if(!isEmpty(stationID)){
        batteries.map(battery => {

        });
    }
}

userValidationByQRCode = async function(QRCode, userToken){

    let stationID = QRCode;
    Station.findOne(
        {
            _id: stationID,
            isActive: true
        }
    )
    .then(station => {
        if(!station){
            return {
                valid: false,
                userID: 0,
                error: 'ایستگاه فعالی با این مشخصات یافت نشد.'
            }
        }
    })
    .catch(err => {

        console.log('userValidationByQRCode station foundation db error.', err);
        return {
            valid: false,
            userID: 0,
            error: 'خطا در احراز هویت کاربر.'
        }

    });

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
            prof.batteries.map(batteryCode => {

                Battery.findOne(
                    {
                        code: batteryCode,
                        userID: prof._id
                    }
                )
                .then(battery => {
                    if(battery && battery.status === 0){

                        console.log('One of the betteries is not active');

                        Profile.findOneAndUpdate(
                            {
                                _id: prof._id
                            },
                            {
                                confirmed: false
                            }
                        )
                        .then(() => {
                            return {
                                valid: false,
                                userID: 0,
                                error: 'باتری با کد ' +  battery.code + 'دچار مشکل است.'
                            };
                        })
                        .catch(err => {
                            console.log('User confirmed db update error.', err);
                            return {
                                valid: false,
                                userID: 0,
                                error: 'خطا در احراز هویت کاربر.'
                            };
                        });

                    }
                })
                .catch(err => {
                    console.log('userValidationByQRCode battery validation db failed.', err);
                    return {
                        valid: false,
                        userID: 0,
                        error: 'خطا در احراز هویت کاربر.'
                    };
                });
            });

            return {
                valid: true,
                userID: prof._id
            };

        }else{

            return {
                valid: false,
                userID: 0,
                error: 'کاربری با این مشخصات یافت نشد.'
            };

        }

    })
    .catch(err => {
        console.log('userValidationByQRCode db error', err);
        return {
            valid: false,
            userID: 0,
            error: 'خطا در احراز هویت کاربر.'
        };
    });
}

module.exports = router;