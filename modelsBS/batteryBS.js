const mongoose = require('mongoose');
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
        type: String,
        default: '0'
    },
    stationID:{
        type: String
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