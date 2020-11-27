const express = require('express');
const morgan = require('morgan');

//middleware(sub app)
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

// express.json() <- this is a middleware
//  get access to the request body on the request object.
// express.json() is also called body-parser
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  //for some route handler that really needs the information about
  //when exactly the request happens.

  //add requestTime to req
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});
app.use(express.static(`${__dirname}/public`));

// Tour Route
// use tourRouter middleware for "/api/v1/tours" this specific route
// we define a sub app(router) for each resource i.e. define a router for each resource
// mounting a new router on a route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//fall back route, for uncaught routes
app.all('*', (req, res, next) => {
  // //create an error, pass a string, this string is error's message property
  // //define three property for error-handling middleware to consume
  // const err = new Error(`can't find ${req.originalUrl} on the server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  //express assume that the parameter passed to next() is error
  // then skip all the other middlewares in the middleware stack
  //and sent the error that we passed in to our global error handling middleware,
  next(new AppError(`can't find ${req.originalUrl} on the server`, 404));
});

//global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
