const express = require('express');

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const tourRouter = express.Router(); //tourRouter is a middleware

//nested route
//post /tours/xxxx/reviews
//get /tours/xxx/reviews
//get /tours/xxx/reviews/xxx

// this tour router should use the review router in case it ever encounters a route like this.
//similar in app.js, so why it's called sub app
//enable the review router to actually get access to this parameter here as well.
tourRouter.use('/:tourId/reviews', reviewRouter);

//define param middleware, will be triggered if "/api/v1/tours/:id"
//'id' is specified param
//similar with app.use(), but here is sub app
// tourRouter.param('id', tourController.checkId);

tourRouter
  .route('/top-5-cheap')
  //the request hit this route will go through two middlewares
  .get(tourController.aliasTopTours, tourController.getAllTours);

//for aggregate pipeline
tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
tourRouter.route('/tour-stats').get(tourController.getTourStats);

//another format: /tours-within?distance=233&center=-40,45&unit=mi
tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

// calculate the distance from a certain point to all the tours
tourRouter
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances);

tourRouter
  .route('/')
  .get(tourController.getAllTours) //route handler, middleware, controller
  //when we have a post request for this route,
  // it will then run the first middleware first and only then the createTour.
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.patchTour
  )
  //always check if a user is logged in
  //only admin and lead-guide can delete a tour
  .delete(
    authController.protect,
    //protect middle also exposes fresh/current user to next middleware
    //this function return a middleware function
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = tourRouter; //only for export single file, middleware here
