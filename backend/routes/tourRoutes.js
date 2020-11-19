const express = require('express');

const tourController = require('../controllers/tourController');

const tourRouter = express.Router(); //tourRouter is a middleware

//define param middleware, will be triggered if "/api/v1/tours/:id"
//'id' is specified param
//similar with app.use(), but here is sub app
// tourRouter.param('id', tourController.checkId);

tourRouter
  .route('/top-5-cheap')
  //the request hit this route will go through two middlewares
  .get(tourController.aliasTopTours, tourController.getAllTours);

//for aggregate pipeline
tourRouter.route('/tour-stats').get(tourController.getTourStats);

tourRouter
  .route('/')
  .get(tourController.getAllTours) //route handler, middleware, controller
  //when we have a post request for this route,
  // it will then run the first middleware first and only then the createTour.
  .post(tourController.createTour);
tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.patchTour)
  .delete(tourController.deleteTour);

module.exports = tourRouter; //only for export single file, middleware here
