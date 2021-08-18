const mongoose = require('mongoose')

const Schema = mongoose.Schema

const personSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
 
 lastSentDate:{
     type:Date
 }
})

const Person = mongoose.model('person', personSchema)

module.exports = Person