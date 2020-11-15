const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  //schema use native JS data type
  name: {
    type: String,
    required: [true, 'A tour must have name'],
    // we can not now have two tour documents with the same name
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: { type: String, required: [true, 'A tour must have price'] },
});

//convention in programming to always use uppercase on model names and variables.
//name, schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
