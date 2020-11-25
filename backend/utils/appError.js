class AppError extends Error {
  constructor(message, statusCode) {
    //message is the only parameter that the built-in error accepts.
    super(message);
    this.statusCode = statusCode;
    //status depends on statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //make sure programming error or dependency bug will not be send
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
