const mongoose = require('mongoose')
const stationSchema = new mongoose.Schema({
    stationID: String,
    location: {
        coordinates: {
          type: [Number]
        },
        name: String
      },
    batteries:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'battery'
    }],
    date:{
        type:Date,
        default:Date.now
    },
    isActive: Boolean
})
module.exports = mongoose.model('station',stationSchema);