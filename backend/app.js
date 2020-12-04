const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

//middleware(sub app)
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

// 1) global middleware
// express.json() <- this is a middleware
//  get access to the request body on the request object.
// express.json() is also called body-parser
//read data from body into req.body
app.use(
  express.json({
    //when we have a body larger than 10 kilobyte
    //it will basically not be accepted
    limit: '10kb',
  })
);

//data sanitization against NoSQL query injection
//look at the request body, the request query string, and also at Request.Params, and
//then it will basically filter out all of the dollar signs and dots,
app.use(mongoSanitize());
//data sanitization against XSS
//clean any user input from malicious HTML code
app.use(xss());

//prevent parameter pollution
//used by the end, cuz it does is to clear up the query string
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//app use always receive a function, so helmet returns a function
//set http security header
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit request from same IP
//this is a middleware function
const limiter = rateLimit({
  //how many requests per IP we are going to allow in a certain amount of time.
  max: 100,
  //time window: 1h
  windowMs: 60 * 60 * 1000,
  //if that limit is then crossed by a certain IP, they will get back an error message.
  message: 'Too many requests from this IP, please try again in an hour',
});

//affect routes start with '/api'
app.use('/api', limiter);

//Test middleware
app.use((req, res, next) => {
  //for some route handler that really needs the information about
  //when exactly the request happens.

  //add requestTime to req
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

//serving static files
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
