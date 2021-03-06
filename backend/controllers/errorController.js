const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! please log in again!', 401);

const sendErrorDev = (err, res) => {
  //make development error detailed
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //trusted error: send error to the client
  if (err.isOperational) {
    //make production error simple
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //programming or other unknown error: not leaking error details to client
  } else {
    // 1) Log Error
    console.error('Error:', err);

    //third party package error,validation error,
    //error comes from mongoose,not from AppError class, etc...
    //2) send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong...',
    });
  }
};

module.exports = (err, req, res, next) => {
  // if the status code is defined, use it, or use 500
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //make some unoperational error to operational error
    // let error = JSON.parse(JSON.stringify(err));
    // console.log('🚀 ~ file: errorController.js ~ line 68 ~ err', err);
    // console.log('🚀 ~ file: errorController.js ~ line 69 ~ error', error);

    if (err.constructor.name === 'CastError') {
      //for invalid query id
      //return a new error created withAppError class, become operational
      err = handleCastErrorDB(err);
    }

    if (err.constructor.name === 'ValidationError') {
      //for validator error, which is an mongoose error
      err = handleValidationErrorDB(err);
    }

    if (err.name === 'JsonWebTokenError') {
      err = handleJWTError(err);
    }

    if (err.name === 'TokenExpiredError') {
      err = handleJWTExpiredError(err);
    }

    if (err.code === 11000) {
      //for duplicate "unique" field
      err = handleDuplicateFieldsDB(err);
    }
    sendErrorProd(err, res);
  }
};
