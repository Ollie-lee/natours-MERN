module.exports = (fn) => {
  //create a function, return express to call
  return (req, res, next) => {
    //the fn function is the async function below, so it will return a promise
    //catch((err) => next(err)) same as catch(next)
    fn(req, res, next).catch((err) => {
      return next(err);
    });
  };
};
