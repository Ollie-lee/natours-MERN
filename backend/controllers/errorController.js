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

    //third party package error,error comes from mongoose,not from AppError class, etc...
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
    sendErrorProd(err, res);
  }
};
