const mongoose = require('mongoose');
const { Int32 } = require('bson');
mongoose.set('useFindAndModify', false);

const BSProfileSchema = mongoose.Schema({
    active:{
        type: Boolean,
        default:0 //0 is not active, 1 is active
    },
    batteries:[String],
    email:{
        type: String,
        require: true
    },
    docs:[{
        // type: Int32,
        type: Number,
        file:{
            data: Buffer, 
            contentType: String 
        }
    }],
    MotorCode:{
        type: String
    },
    name:{
        type: String,
        require: true
    },
    password:{
        type: String,
        require: true
    },
    confirmed:{
        type: Boolean,
        default:0 //0 is not permitted, 1 is permitted
    },
    phone:{
        type: String,
        require: true
    },
    RFIDCode:{
        type: String
    },
    username:{
        type:String,
        require: true
    }
});

module.exports = BSProfile = mongoose.model('profile', BSProfileSchema);