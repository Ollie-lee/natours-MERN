const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  //allow nested routes
  if (!req.body.tour) {
    //come from url
    req.body.tour = req.params.tourId;
  }

  if (!req.body.user) {
    //from protect middleware
    req.body.user = req.user.id;
  }
  //any field not belong to review schema, will be ignored
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
