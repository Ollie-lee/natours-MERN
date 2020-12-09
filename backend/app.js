const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

//middleware(sub app)
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

//create a template and then easily fill up that template with our data.
app.set('view engine', 'pug');
//our pug templates are actually called views in Express.
//we don't always know whether a path that we receive from somewhere already has a slash or not.
//join prevent this bug
//express will go into "views" folder and find pug file
app.set('views', path.join(__dirname, 'views'));

// 1) global middleware
// express.json() <- this is a middleware
//  get access to the request body on the request object.
// express.json() is also called body-parser

//serving static files
//define that all the static assets, will always automatically be served
//from a folder called public
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

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

// Routes

//app.get, which for rendering pages in a browser is usually always the one that we use,
app.get('/', (req, res) => {
  // render will then render the template with the name that we pass in,
  //these passed data is called locals in the Pug file.
  res.status(200).render('base', { tour: 'The Forest Hiker', user: 'Ollie' });
});

// use tourRouter middleware for "/api/v1/tours" this specific route
// we define a sub app(router) for each resource i.e. define a router for each resource
// mounting a new router on a route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
//whenever there is a request with a url that starts like this
//then this middleware function here will basically be called.
app.use('/api/v1/reviews', reviewRouter);

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
