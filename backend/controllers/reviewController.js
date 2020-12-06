const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  //for nested route
  let filter = {};
  //thanks for params merging in review router
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

// an middleware added in routes
exports.setTourUserIds = (req, res, next) => {
  //allow nested routes
  if (!req.body.tour) {
    //come from url
    req.body.tour = req.params.tourId;
  }

  if (!req.body.user) {
    //from protect middleware
    req.body.user = req.user.id;
  }

  next();
};

exports.createReview = factory.createOne(Review);

// exports.createReview = catchAsync(async (req, res, next) => {
//   //any field not belong to review schema, will be ignored
//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);
