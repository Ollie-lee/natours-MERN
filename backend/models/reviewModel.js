const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      //const Tour = mongoose.model('Tour', tourSchema);
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    //virtual properties also show up in Json and object outputs
    //when we have a virtual property,basically a field that is not stored in the database
    //but calculated using some other value. So we want this to also show up whenever there is an output.
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

//turn off review populating tour
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   //tour field above
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

//call static method due to the aggregate function needs model
//available on Model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //this points to the current Model
  const stats = await this.aggregate([
    // select all the reviews that actually belong to the current tour that was passed in as the argument.
    {
      //tour:tour, tour is tourId here
      $match: { tour: tourId },
    },
    {
      //group by tour, '$ + field name'
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // stats is an array, when no review on a tour, it returns empty array
  // [ { _id: 5fcdf0ca6498836ab3f5c9ed, nRating: 2, avgRating: 2.5 } ]

  if (stats.length > 0) {
    //save the stats into the tour being reviewed
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    //that all our reviews are gone,
    await Tour.findByIdAndUpdate(tourId, {
      //set to default
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//call static method here in post save middleware
//use post to make sure current review is saved
//post middleware have no access to next
reviewSchema.post('save', function () {
  //"this" points to the current review
  //this.constructor help access Model, if put below the const Review = mongoose.model('Review', reviewSchema);
  //it doesn't work cuz too late for run in sequence, the middleware can't be added
  this.constructor.calcAverageRatings(this.tour);
});

// add unique index to make sure one user can review a tour once
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//findByIdAndUpdate
//findByIdAndDelete
//findByIdAndUpdate is only just a shorthand for findOneAndUpdate with the current ID
//we can't use this.review.constructor.calc...here, cuz it's pre hook and the query hasn't been executed
//so the data hasn't been updated in database
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // the goal is to get access to the current review document
  //but here the, this keyword is the current query.

  //query middleware here, to get the document
  //this.review helps pass data from pre hook to post hook
  this.review = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //after the above middleware has already finished,
  // and so therefore the review has been updated,
  //this is a perfect point in time where we can then call this function.

  //can't do await this.findOne() here, cuz in post hook the query has executed;
  //so we get document by pass data using "this.review"
  this.review.constructor.calcAverageRatings(this.review.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
