const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  //only field in the schema can be added to the database
  {
    //schema use native JS data type
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      // we can not now have two tour documents with the same name
      unique: true,
      trim: true,
    },
    slug: String,
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
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  //add schema obj as second parameter of Schema constructor
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

//define virtual property
tourSchema.virtual('durationWeeks').get(function () {
  //use regular function. not using arrow function here
  //arrow function not having its own "this" keyword
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create(), but not be triggered for insertMany()
// A Pre Save Hook/Middleware
tourSchema.pre(
  //event in this case is the save event.
  'save',
  // this function will be called before an actual document is saved to the database.
  function (next) {
    // in a save middleware, this keyword point to the currently processed document.
    this.slug = slugify(this.name, { lower: true });
    //call the next middleware in the stack.
    // console.log(1, this);
    next();
  }
);

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  //this keyword will now point at the current query and not at the current document,
  // create a secret tour field and then query only for tours that are not secret.
  //other tours are not currently set to false, so we use $ne
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

//in the post-find middleware, get access to all the documents
// that we returned from the query.
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  //all we have to do is to add another match stage right at the beginning of this pipeline array,
  //unshift add element to start of the array, shift add element to end of the array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

// //can have multiple same middleware
// tourSchema.pre('save', function (next) {
//   console.log('Will save document');
//   console.log(2, this);
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   //executed after all the pre middleware functions have completed
//   //no longer have "this" keyword, instead we have finished doc
//   console.log('3', doc);
//   next();
// });

//convention in programming to always use uppercase on model names and variables.
//name, schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
