const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { Int32 } = require('bson');

const BSBatterySchema = new mongoose.Schema({
   
    code:{
        type: String,
        require: true
    },
    firstUse:{
        type: Date
    },
    lastUse:{
        type: Date
    },
    userID:{
        type: Schema.Types.ObjectId,
        ref: 'profile'
    },
    stationID:{
        type: Schema.Types.ObjectId,
        ref: 'station'
    },
    status:{//0 if not ok to use, 1 if ok to use
       // type: Int32 بررسی شود
       type:Number
    },
    soc:{
       type:Number
    }
});

module.exports = BSBattery = mongoose.model('battery', BSBatterySchema);