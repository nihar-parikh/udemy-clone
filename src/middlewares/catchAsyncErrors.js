// export default (theFunc) => (req, res, next) => {
//   Promise.resolve(theFunc(req, res, next)).catch(next);
// };

export const catchAsyncErrors = (theFunc) => {
  return async (req, res, next) => {
    try {
      await theFunc(req, res, next);
    } catch (error) {
      //goes to error handler
      next(error);
    }
  };
};
