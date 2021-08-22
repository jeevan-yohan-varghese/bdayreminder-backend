const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
 
  email: {
    type: String,
    required: true
  },
  peopleList:{
    type:Array,
    default:[]
  },
  channelId:{
    type:String
  }
})

const User = mongoose.model('user', userSchema)

module.exports = User