const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

//the third parameter of middleware is next
exports.aliasTopTours = (req, res, next) => {
  //add query params to request manually
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    //access all methods in the class
    // (Tour.find():from mongoose,req.query: from express)
    //add filter() functionality to APIFeatures instance
    //filter() also instantiate a new APIFeatures() obj, so can chain on the method
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    //return back  all documents
    const tours = await features.query;

    //route handler
    //send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status('404').json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    // id from url parameter
    //Tour.findById is shorthand for Tour.findOne({_id:req.params.id}),inside is filter obj
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.createTour = async (req, res, next) => {
  try {
    //return a promise as well
    //using data comes from post request
    //newTour:  the newly created document already with the ID and everything
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    //fail to create document, send back a response to notify
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.patchTour = async (req, res) => {
  //you would have to get tour from the JSON file,
  // than change that tour and then save it again to the file.
  // const { id } = req.params; // id is string

  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      // the new updated document is the one that will be returned.
      new: true,
      //run validators in the schema
      runValidators: true,
    });
    res.status(200).json({
      status: 'successful',
      data: {
        tour: updatedTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.deleteTour = async (req, res) => {
  // const { id } = req.params; // id is string
  try {
    // in a RESTful API, it is a common practice not
    // to send back any data to the client
    //when there was a delete operation
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'successful',
      data: {
        tour: null,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: 'error',
    });
  }
};

//aggregation pipeline
exports.getTourStats = async (req, res) => {
  try {
    //similar with Tour.find(), need to await
    const stats = await Tour.aggregate([
      //receive a bunch of stages
      {
        //stage name, match stage, for filtering, do prepare work
        $match: {
          ratingsAverage: { $gte: 4.5 },
        },
      },
      //group stage
      {
        $group: {
          //have all documents in one group by setting null
          // _id: null,
          //group by difficulty
          // _id: '$difficulty',
          //group by difficulty and send difficulty as uppercase format
          _id: { $toUpper: '$difficulty' },
          //count the number of documents
          numTours: { $sum: 1 },
          numRatings: {
            //add each document's field: ratingsQuantity together
            $sum: '$ratingsQuantity',
          },
          avgRating: {
            //use avg operator to calculate field ratingsAverage's average data
            $avg: '$ratingsAverage',
          },
          avgPrice: {
            $avg: '$price',
          },
          minPrice: {
            $min: '$price',
          },
          maxPrice: {
            $max: '$price',
          },
        },
      },
      //sort stage
      {
        //we cam only use filed name defined in the group stage
        //1 for ascending
        $sort: { avgPrice: 1 },
      },
      // {
      //   // match stage
      //   //match document whose _id (now is difficulty) is not 'EASY'
      //   $match: {
      //     _id: { $ne: 'EASY' },
      //   },
      // },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: 'error',
    });
  }
};

//advanced aggregate pipeline
exports.getMonthlyPlan = async (req, res) => {
  try {
    //year comes from url parameter, *1 to make it becomes number
    const year = req.params.year * 1; //2021

    const plan = await Tour.aggregate([
      // each stage works for one document
      //stage 1: unwind
      {
        //deconstruct an array field from the input documents
        //and then output one document for each element of the array.
        //basically we want to have one tour for each of these dates in the array
        $unwind: '$startDates',
      },
      //stage2: match stage
      {
        $match: {
          //choose documents with 2021-01-01 ~ 2021-12-31
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      //stage3: group stage
      //we can add filed, but this field must use aggregate pipeline operator
      {
        $group: {
          //_id is group by what, here we extract month from "startDates"
          _id: {
            $month: '$startDates',
          },
          //how many tours start in that month?
          numTourStarts: {
            $sum: 1,
          },
          //push the name of the documents into an array
          tours: {
            $push: '$name',
          },
        },
      },
      //stage4: addFields stage
      {
        $addFields: {
          month: '$_id',
        },
      },
      //stage5: project stage
      {
        $project: {
          //0 is hidden, 1 is shown
          _id: 0,
        },
      },
      //stage6: sort stage
      {
        $sort: {
          // 1 for ascending, -1 for descending
          numTourStarts: -1,
        },
      },
      //stage7: limit stage
      {
        //return 12 documents
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};
