const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { Int32 } = require('bson');
mongoose.set('useFindAndModify', false);

const BSProfileSchema = mongoose.Schema({
    active:{
        type: Boolean,
        default:0 //0 is not active, 1 is active
    },
    batteries:[
        {
            type: Schema.Types.ObjectId,
            ref: 'battery'
        }
    ],
    email:{
        type: String,
        require: true
    },
    docs:[
        {
            data: Buffer, 
            contentType: String,
            docType: String
        }
    ],
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