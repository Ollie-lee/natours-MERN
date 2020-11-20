const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  //schema use native JS data type
  name: {
    type: String,
    required: [true, 'A tour must have name'],
    // we can not now have two tour documents with the same name
    unique: true,
    trim: true,
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: { type: Number, required: [true, 'A tour must have price'] },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
  },
  priceDiscount: Number,
  summary: {
    type: String,
    //different schema for different type,
    // e.g. trim here will remove the space in the beginning and in the end of the string.
    trim: true,
    required: [true, 'A tour must have a summary'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    //name of the img. then read from file system
    // /we could store the entire image as well in a database, but that's usually not a good idea.
    // /We simply leave the images somewhere in the file system and then put the name of the image itself
    //in the database as a field.
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  // we have multiple images, and I want to save those images as an array. as an array of strings.
  images: [String],
  //createdAt field should basically be a timestamp
  //that is set by the time that the user adds a new tour.
  //should be added automatically
  createdAt: {
    type: Date,
    //which basically represents the current millisecond.
    //in Mongo,this is now immediately converted to today's datein order to make more sense of this data
    default: Date.now(),
    select: false,
  },
  // startDates are basically different dates at which a tour starts.
  //when parsing "2021-03-21", Mongo would then automatically parse this as a date.
  //And only if it can't, it will then throw an error.
  startDates: [Date],
});

//convention in programming to always use uppercase on model names and variables.
//name, schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
