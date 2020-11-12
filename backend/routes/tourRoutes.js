const express = require("express");

const tourController = require("../controllers/tourController");

const tourRouter = express.Router(); //tourRouter is a middleware

// param middleware, will be triggered if "/api/v1/tours/:id"
//'id' is specified param
//similar with app.use(), but here is sub app
tourRouter.param("id", tourController.checkId);

tourRouter
  .route("/")
  .get(tourController.getAllTours) //route handler, middleware, controller
  //when we have a post request for this route,
  // it will then run the first middleware first and only then the createTour.
  .post(tourController.checkBody, tourController.createTour);
tourRouter
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.patchTour)
  .delete(tourController.deleteTour);

module.exports = tourRouter; //only for export single file, middleware here
