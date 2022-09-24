// function ErrorHandler(message, statusCode) {
//   // console.log(message);
//   this.message = message;
//   this.statusCode = statusCode;
//   Error.captureStackTrace(this);
// }

// export default errorHandler;

//inheriting ErrorHandler from Error object.
//in class the object name start's with capital.
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
