const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//specify option such as merge params
const reviewRouter = express.Router({
  // by default, each router only have access to the parameters of their specific routes
  //there is not tour id in this post route, so we need merge the parameters in tourRoutes
  mergeParams: true,
});

//post /tours/xxxx/reviews
//get /tours/xxxx/reviews
//post /reviews

reviewRouter
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

reviewRouter
  .route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = reviewRouter;
