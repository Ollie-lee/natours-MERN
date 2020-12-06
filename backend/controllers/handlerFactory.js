const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const { id } = req.params; // id is string

    // in a RESTful API, it is a common practice not
    // to send back any data to the client
    //when there was a delete operation
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      //stop execution, not move on to the next line
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'successful',
      data: {
        data: null,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //you would have to get tour from the JSON file,
    // than change that tour and then save it again to the file.
    // const { id } = req.params; // id is string

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      // the new updated document is the one that will be returned.
      new: true,
      //run validators in the schema
      runValidators: true,
    });

    if (!doc) {
      //stop execution, not move on to the next line
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'successful',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //return a promise as well
    //using data comes from post request
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;
    console.log(
      '🚀 ~ file: handlerFactory.js ~ line 88 ~ catchAsync ~ query',
      query
    );
    console.log(
      '🚀 ~ file: handlerFactory.js ~ line 89 ~ catchAsync ~ doc',
      doc
    );

    // id from url parameter
    // const doc = await Model.findById(req.params.id).populate('reviews');

    if (!doc) {
      //stop execution, not move on to the next line
      return next(new AppError('No doc found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
