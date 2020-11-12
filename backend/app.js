const express = require('express');
const morgan = require('morgan');

//middleware(sub app)
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

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
  next();
});
app.use(express.static(`${__dirname}/public`));

// Tour Route
// use tourRouter middleware for "/api/v1/tours" this specific route
// we define a sub app(router) for each resource i.e. define a router for each resource
// mounting a new router on a route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
