const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

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
      //validator specifically for string
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      //not call the validator, just add it
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      //this function will be run each time that a new value is set for this field,
      set: (val) => Math.round(val * 10) / 10, //4.6666*10 => 46.666 => 47 => 4.7
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
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    priceDiscount: {
      type: Number,
      //use regular function, cuz we need to access "this" points to the current document
      validate: {
        validator: function (val) {
          //The price discount should always be lower.
          //false will trigger a validation error
          //caveat: "this" key word is only gonna point to the current document
          //when we are creating a NEW document.
          //So this validator here is not going to work on update.
          return val < this.price;
        },
        //{VALUE} is specific to mongoose, which is "val"
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
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
    startLocation: {
      //GeoJSON,field: type and coordinates are necessary
      //the schema declaration obj above now become sub-obj now
      //startLocation can also be the first element in the location array
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      //expect an array of numbers
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      //by specifying basically an array of objects,
      //this will then create brand new documents in side of parent document
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // these will be some sub-documents.So embedded documents.
    guides: [
      {
        // we expect a type of each of the elements in the guides array to be a MongoDB ID.
        type: mongoose.Schema.ObjectId,
        //this really is how we establish references between different data sets in Mongoose.
        ref: 'User',
      },
    ],
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

tourSchema.index({
  price:
    //1 means that we're sorting the price index in an ascending order,
    //-1 means descending order
    1,
  ratingsAverage: -1,
});

//most times the one or minus one is not that important.
tourSchema.index({
  slug: 1,
});

//for geospatial data query
//startLocation location here should be indexed to a 2D sphere.
tourSchema.index({ startLocation: '2dsphere' });

//define virtual property
tourSchema.virtual('durationWeeks').get(function () {
  //use regular function. not using arrow function here
  //arrow function not having its own "this" keyword
  return this.duration / 7;
});

//virtual populate
//name of virtual field
tourSchema.virtual('reviews', {
  //name of Model
  ref: 'Review',
  //this is the name of the field in the other model
  //So in the Review model in this case,
  //where the reference to the current model is stored.
  //in order to connect these two models
  foreignField: 'tour',
  //where that ID is actually stored here in this current Tour model.
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create(),
// but not be triggered for insertMany() or update()...etc
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

//for embedding
// tourSchema.pre('save', async function (next) {
//   //this.guides is an array of all the user IDs
//   //async returns a promise
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   //override that array of IDs with an array of user documents
//   //here add outer function(next) as async
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//QUERY MIDDLEWARE
//not just find but also stuff like findAndUpdate, findAndDelete, and all queries like that.
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

//guides field only contains reference, so we want to populate it
//for query like, find, but also stuff like findAndUpdate, findAndDelete etc..., but not in the database
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    //hides __v and passwordChangedAt field in the guides field
    select: '-__v -passwordChangedAt',
  });
  next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   //all we have to do is to add another match stage right at the beginning of this pipeline array,
//   //unshift add element to start of the array, shift add element to end of the array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //see the whole aggregation stage pipeline
//   console.log(this.pipeline());
//   next();
// });

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
