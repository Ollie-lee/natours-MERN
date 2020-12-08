const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

//the third parameter of middleware is next
exports.aliasTopTours = (req, res, next) => {
  //add query params to request manually
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

// exports.getAllTours = catchAsync(async (req, res) => {
//   //access all methods in the class
//   // (Tour.find():from mongoose,req.query: from express)
//   //add filter() functionality to APIFeatures instance
//   //filter() also instantiate a new APIFeatures() obj, so can chain on the method

//   // populate reviews
//   // const features = new APIFeatures(Tour.find().populate('reviews'), req.query)

//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .pagination();

//   //return back  all documents
//   const tours = await features.query;

//   //route handler
//   //send response
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
});

// exports.getTour = catchAsync(async (req, res, next) => {
//   // id from url parameter
//   //Tour.findById is shorthand for Tour.findOne({_id:req.params.id}),inside is filter obj

//   //only populate review field for getTour route
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     //stop execution, not move on to the next line
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.createTour = factory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//   //return a promise as well
//   //using data comes from post request
//   //newTour:  the newly created document already with the ID and everything
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

exports.patchTour = factory.updateOne(Tour);

// exports.patchTour = catchAsync(async (req, res, next) => {
//   //you would have to get tour from the JSON file,
//   // than change that tour and then save it again to the file.
//   // const { id } = req.params; // id is string

//   const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     // the new updated document is the one that will be returned.
//     new: true,
//     //run validators in the schema
//     runValidators: true,
//   });

//   if (!updatedTour) {
//     //stop execution, not move on to the next line
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'successful',
//     data: {
//       tour: updatedTour,
//     },
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   // const { id } = req.params; // id is string

//   // in a RESTful API, it is a common practice not
//   // to send back any data to the client
//   //when there was a delete operation
//   const tour = await Tour.findByIdAndDelete(r  eq.params.id);

//   if (!tour) {
//     //stop execution, not move on to the next line
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'successful',
//     data: {
//       tour: null,
//     },
//   });
// });

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
        //we can only use filtered name defined in the group stage
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
        //   // match stage
        //   //match document whose _id (now
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
      //we can add field, but this field must use aggregate pipeline operator
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
      //stage4: addFields stage, add a field which name is month
      {
        $addFields: {
          month: '$_id',
        },
      },
      //stage5: project stage
      {
        $project: {
          //0 is hidden, 1 is shown
          //not showing id
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

//'/tours-within/:distance/center/:latlng/unit/:unit'
//another format: /tours-within?distance=233&center=-40,45&unit=mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //the radius is basically the distance that we want to have as the radius,
  //but converted to a special unit called radians.
  //And in order to get the radians, we need to divide our distance by the radius of the earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //radius of the earth by mile/kilometer

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  // start location field is what holds the geospatial point where each tour starts
  //And so that's exactly what we're searching for.
  const tours = await Tour.find({
    //remember to add an index to the field where the geospatial data that we're searching for is stored.
    startLocation:
      //the value that we're searching for
      {
        $geoWithin: {
          $centerSphere:
            //center sphere operator takes an array of the coordinates and the single radius.
            [[lng, lat], radius],
        },
      },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//'/distances/:latlng/unit/:unit'
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //mile OR kilometer
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    //geoNear stage
    //this is the only geospatial aggregation pipeline stage that actually exists.
    //This one always needs to be the first one in the pipeline.
    {
      //we're using this startLocation in order to calculate the distances,
      $geoNear: {
        //it requires that at least one of our fields contains a geospatial index.
        //If there's only one field with a geospatial index, then this geoNear stage here will automatically use
        //that index in order to perform the calculation.
        //But if you have multiple fields with geospatial indexes, then you need to use the keys parameter
        //in order to define the field that you want to use for calculations.

        // near is the point from which to calculate the distances.
        //So all the distances will be calculated from this point
        //that we define here, and then all the start locations.
        //here is the point we pass in url, in the format of geoJson
        near: {
          type: 'Point',
          //convert to numbers
          coordinates: [lng * 1, lat * 1],
        },
        //this is the name of the field that will be created and where all the calculated distances will be stored.
        distanceField: 'distance',
        //specify a number which is then going to be multiplied with all the distances.
        //default res is meter, convert to mile OR kilometer
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        // select distance and name field
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
