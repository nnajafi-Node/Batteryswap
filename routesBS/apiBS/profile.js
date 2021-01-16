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
const logModel = require('../../modelsBS/logBS');

const passportLogin = require('passport')
        , LocalStrategy =require('passport-local' ).Strategy;

const jwt = require("jsonwebtoken");

const userValidation = require('../../validation/userValidation');//changed
const isEmpty = require('../../validation/is-empty');//changed
const { profile } = require("console");
const { resolve } = require("path");

passportLogin.use(new LocalStrategy(
  function(phone, password, MotorCode, arrayOfBatteries, done){

      if(arrayOfBatteries.length <= 0 || MotorCode.length <= 0 || phone.length <= 0 || password.length <= 0){
          console.log('Login to application parameters error.');
          return done(null, false, {message: 'خطا در پارامترهای وروردی.'});
      }
  
      try{
          Profile.find(
              {
                  phone: phone,
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
   // if (req.body.username) profileFields.username = req.body.username;
    if (req.body.nationalcode) profileFields.nationalcode = req.body.nationalcode;
    if (req.body.phone) profileFields.phone = req.body.phone;
    if (req.body.email) profileFields.email = req.body.email;
    if (req.body.batteries) profileFields.batteries = req.body.batteries;
    if (req.body.MotorCode) profileFields.MotorCode = req.body.MotorCode;
    
    Profile.findOne({
        phone: req.body.phone
    }).then(profile => {
      if (profile) {
        Profile.findOneAndUpdate({
            phone: req.body.phone
        }, {
          $set: profileFields
        }, {
          new: true
        })
        .then(profile => {

            let log = new logModel({
                typeID: 1,//User
                type: 1, //insert
                after: profile._id,
                changeDate: Date.now(),
                userID: profile._id
            });
    
            log.save()
            .then(() => {
                return res.status(200).json(profile);
            });
            
        })
        .catch(err => res.status(400).send(err));
      }
    });
});

router.post("/Edit", passport.authenticate("jwt", {session: false}), async (req, res) => {
  const profileFields = {};
  let log_arr = [];

  const prof = await Profile.findOne({
    phone: req.body.phone
  });

  if(prof){

    if (req.body.name) {
        profileFields.name = req.body.name;

        log_arr.push({  field: "name", 
                        before: prof.name,
                        after: profileFields.name
        });
    }
    //if (req.body.username) profileFields.username = req.body.username;
    if (req.body.nationalcode) {
        profileFields.nationalcode = req.body.nationalcode;

        log_arr.push({  field: "nationalcode", 
                        before: prof.nationalcode,
                        after: profileFields.nationalcode
        });
    }
    if (req.body.phone) {
        profileFields.phone = req.body.phone;

        log_arr.push({  field: "phone", 
                        before: prof.phone,
                        after: profileFields.phone
        });
    }
    if (req.body.email) {
        profileFields.email = req.body.email;

        log_arr.push({  field: "email", 
                        before: prof.email,
                        after: profileFields.email
        });
    }
    if (req.body.batteries) {
        profileFields.batteries = req.body.batteries;

        log_arr.push({  field: "batteries", 
                        before: prof.batteries,
                        after: profileFields.batteries
        });
    }
    if (req.body.MotorCode) {
        profileFields.MotorCode = req.body.MotorCode;

        log_arr.push({  field: "MotorCode", 
                        before: prof.MotorCode,
                        after: profileFields.MotorCode
        });
    }
  
    Profile.findOneAndUpdate({
        phone: req.body.phone
      }, {
        $set: profileFields
      }, {
        new: true
      })
      .then(async (profile) => {

        let logs = [];
        const date = Date.now();

        await Promise.all( log_arr.map( lg => {

            let log = new logModel({
                typeID: 1,//User
                type:2, //Edit
                field: lg.field,
                before: lg.before,
                after: lg.after,
                changeDate: date,
                userID: profile._id
            });

            logs.push(log);
        }));
            
        logs.save()
        .then(() => {
            return res.status(200).json(profile);
        });

      })
      .catch(err => res.json(err));
    }
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

router.get('/docHTML', function (req, res) {
    res.sendFile(__dirname + '/cms.html');

});

router.post('/doc/upload', upload.array('myImage', 10) , async (req, res) => {
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
        contentType: file.mimetype,
        docType:1
      }

      files_to_save.push(file_);
      
      //remove the uploaded file from the "uploads" folder
      fs.unlink(file.path, (err)=>{
          if(err)
              res.send(err);
      });
  });

  let valueArray = await Promise.all(
    files_to_save.map(function(val){ return val.docType; })
  );

  const hasDuplicate = valueArray.some(function(item, index){
      return valueArray.indexOf(item) !== index;
  });

  if(hasDuplicate){
      res.status(400).json('یکی از مدارک تکراری می‌باشد.');
  }

  await Promise.all(files_to_save.map(async (file, index) => {

      const newFile = await Profile.findOneAndUpdate(
          {
            phone: req.body.phone,
            docs: { $elemMatch: {docType: file.docType}}
          },
          {
              data: file.data,
              contentType: file.contentType
          }
      );

          checking = () => new Promise(async (resolve, reject) => {
            if(newFile){
                files_to_save.splice(index); 
                return resolve(true);
            }
            else
                return resolve(false);
          });

          await checking();

  }));

  if(files_to_save.length > 0){

  Profile.findOneAndUpdate(
      {
        phone: req.body.phone
      },
      {
        $push: {docs: files_to_save}
      }
  )
  .then((user) => {

    //insert log
    let log = new logModel({
        typeID: 1,
        type:1, //insert
        field: "docs",
        changeDate: Date.now(),
        userID: user._id
    });

    log.save()
    .then(() => {
        return res.status(200).send(user);
    });

  })
  .catch(err =>{
      console.log(err);
      res.status(400).json('failed');
  });
  
  }else{
    res.status(200).json('success');
  }
  
});

router.post('/removeDocs', async (req, res) => {

    if(!req.body.docs || (req.body.docs && req.body.docs.length <= 0)){

        return res.status(400).json('خطا در شناسایی فیلد مدارک.');

    }else if(!req.body.userID || (req.body.userID && parseInt(req.body.userID) <= 0)){

        return res.status(400).json('خطا در شناسایی فیلد شناسه کاربر.');

    }else{

        Profile
        .findOneAndUpdate(
            {
                _id: req.body.userID
            },
            {
                $pull: {docs: {_id: {$in: req.body.docs}}}
            }
        )
        .then((user) => {
            if(user){

                //insert log
                let log = new logModel({
                    typeID: 1,
                    type:3, //delete
                    field: "docs",
                    changeDate: Date.now(),
                    userID: req.body.userID
                });

                log.save()
                .then(() => {
                    return res.status(200).send(user);
                });

            }else{
                return res.status(400).json('کاربر یافت نشد.');
            }
        })
        .catch(err => {
            return res.status(400).send(err);
        });

    }
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

        //insert log
        let log = new logModel({
            typeID: 4,
            type:4, //login
            changeDate: Date.now(),
            userID: req.user._id
        });

        log.save()
        .then(() => {
            return res.status(200).json({
                success: true,
                token: "Bearer " + token,
                //refreshToken: refreshToken,
                phone: req.user.phone
            });
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

                let log = new logModel({
                    typeID: 1,//User
                    type:2, //update
                    field: 'confirmed',
                    before: !ConfirmStatus,
                    after: ConfirmStatus,
                    changeDate: Date.now(),
                    userID: UserId
                });
        
                log.save()
                .then(() => {
                    return res.status(200).send(JSON.stringify('وضعیت تائید کاربر با موفقیت ثبت شد.'));
                });
                
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
                                    
                                    console.log(err);
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

                        let log = new logModel({
                            typeID: 1,//User
                            type:2, //update
                            field: 'active',
                            before: !ActivationStatus,
                            after: ActivationStatus,
                            changeDate: Date.now(),
                            userID: UserId
                        });
                
                        log.save()
                        .then(() => {
                            return res.status(200).send(JSON.stringify('وضعیت فعال/غیرفعال بودن کاربر باموفقیت بروزرسانی شد.'));
                        });

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
        .then(async(user) => {
    
            if(user){
    
                if(!user.confirmed || !user.active){
                    return res.status(400).json('کاربر غیرفعال است.')
                }
                
                if(user.batteries.length > 0){
    
                    return res.status(400).json( {
                        valid: false,
                        userID: user._id,
                        error: 'پیش از این به کاربر باتری اختصاص داده‌ شده‌است.'
                    });
    
                }else{
    
                    await Promise.all(
                        //check if new batteries are active
                        req.batteries.map(async(btrCode) => {
    
                            const btr = await Battery.findOne(
                                {
                                    code: btrCode
                                }
                            )
                            .exec();
    
                            checking = () => new Promise(async (resolve, reject) => {
            
                                if(btr){
                                    if(btr.status === 0){
    
                                        return resolve(false);
    
                                    }else{
                                        if(btr.userID > 0){
                                            return resolve(false);
                                        }else{
                                            if(!btr.stationID || btr.stationID <= 0){
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
                                        error: 'یکی از باتری‌ها قابل استفاده نمی‌باشد.'
                                    });
                                }
                            })
                            .catch(err => {
    
                                console.log(err);
                                return res.status(400).json({
                                    valid: false,
                                    userID: 0,
                                    error: 'خطا در اختصاص باتری به کاربر.'
                                });
                            });
                        })
                    );
                    
                    Profile.findOneAndUpdate(
                        {
                            _id: this.use._id
                        },
                        {
                            batteries: req.batteries
                        }
                    )
                    .then(async () => {

                        let str = '';
                        await Promise.all( req.batteries.map(bat => {
                            str += bat;
                            str += ', ';
                        }));

                        let log = new logModel({
                            typeID: 1,//User
                            type:2, //update
                            field: 'batteries',
                            after: str,
                            changeDate: Date.now(),
                            userID: this.use._id
                        });
                
                        log.save()
                        .then(() => {
                            return res.status(200).send(JSON.stringify('باتری‌ها با موفقیت به کاربر اختصاص داده شدند.'));
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

router.post('/provideRFIDCard', async (req, res) => {
    const userId = req.body.userId;
    const RFIDCode = req.body.RFIDCode;

    try{

        const {
            errors,
            isValidUser
        } = userValidation({userId, RFIDCode});
  
        if(!isEmpty(errors.userId) || !isEmpty(errors.RFIDCode)){
            return res.status(400).send(JSON.stringify(errors.userId, errors.RFIDCode));
        }
  
        let prv_RFIDCode  =  await Profile.findOne(
            {
                _id: userId
            }
        )
        .select({'RFIDCode': 1, '_id': 0})
        .exec();

        Profile.updateOne(
            {
                _id: userId
            },
            {
                RFIDCode: RFIDCode
            }
        )
        .then(() => {

            let log = new logModel({
                typeID: 1,//User
                type:2, //update
                field: 'RFIDCode',
                before: prv_RFIDCode,
                after: RFIDCode,
                changeDate: Date.now(),
                userID: this.use._id
            });
    
            log.save()
            .then(() => {
                return res.status(200).send(JSON.stringify('باتری‌ها با موفقیت به کاربر اختصاص داده شدند.'));
            });

            return res.status(200).json('صدور کارت با موفقیت انجام شد.');
        })
        .catch(err => {
            console.log("provideRFIDCard update error: " + err);
            return res.status(400).json('خطا در صدور کارت.');
        })
    }catch(err){
        console.log("provideRFIDCard error: " + err);
        return res.status(400).json('خطا در صدور کارت.');
    }
});


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

checkStationOwnerShipOfBattery = function(stationID, batteries){
    if(!isEmpty(stationID)){
        batteries.map(battery => {

        });
    }
}

module.exports = router;