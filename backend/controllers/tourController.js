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

  // const { id } = req.params;
  // console.log(typeof id); //string
  // console.log(typeof (id * 1)); //number
  // const tour = tours.find((element) => element.id === id * 1);
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour,
  //   },
  // });
};

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'missing name or price',
//     });
//   }
//   next();
// };

exports.createTour = async (req, res, next) => {
  //using a better way instead
  // const newTour = new Tour({});
  // newTour.save() // return a promise

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
      message: 'error!!',
    });
  }

  //handle post request, for REST definition, endpoint should not change
  // send data from the client to the server
  //data should on the request
  // console.log(req.body); //body is available cuz we use the middleware
  // const newId = tours[tours.length - 1].id + 1;
  // //merge two existing objects into one new object
  // const newTour = { id: newId, ...req.body };
  // //update data to fictional database
  // tours.push(newTour);
  // //put a callback func that is gonna be processed in the background
  // //and as soon as it's ready, it's gonna put its event in one of the event loop queue,
  // fs.writeFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours),
  //   () => {
  //     //What do we want to do as soon as the file is written?
  //     //send the newly created object as the response.
  //     //201 means created, 200 means ok
  //     res.status(201).json({
  //       status: 'success',
  //       data: {
  //         tour: newTour,
  //       },
  //     });
  //   }
  // );
  // // res.send("Done"); //always need to send sth to finish request/response cycle
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
      message: 'error!!',
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
