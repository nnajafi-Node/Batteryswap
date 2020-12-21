const mongoose = require('mongoose')
const stationSchema = new mongoose.Schema({
    location: {
        coordinates: {
          type: [Number]
        },
        name: String
      },
    batteries:[{
        type:mongoose.Schema.Types.ObjectId
    }],
    date:{
        type:Date,
        default:Date.now
    },
    isActive: Boolean
})
module.exports = mongoose.model('station',stationSchema);