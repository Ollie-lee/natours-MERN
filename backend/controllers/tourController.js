const Tour = require('../models/tourModel');

// // readfile outside the callback(top-level), not blocking event-loop
// const tours = JSON.parse(
//   //parse json to an array of js object
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkId = (req, res, next, val) => {
//   //val is the value of 'id', the param of url
//   console.log(`Tour id is ${val}`);

//   //if invalid, stop the req/res cycle
//   if (val * 1 > tours.length) {
//     //without return, function will not stop running invalid request
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }

//   next();
// };

exports.getAllTours = async (req, res) => {
  try {
    //find(): when we don't pass anything into it,will query for all the documents
    //we can also pass a filter object
    //first method
    // 1) filtering
    const queryObj = { ...req.query };
    //these elements will not be used for query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //remove the above fields in the query obj
    excludedFields.forEach((element) => delete queryObj[element]);

    // 2) advanced filtering
    //advanced filter obj(correct version)
    //{difficulty:'easy',duration:{$gte:5}}
    //but what we get: { difficulty: 'easy', duration: { gte: '5' } }
    //so we need handle gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    //match one of these four words and then replace it with the same words
    //but with the dollar sign in front.
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));

    //build query
    let query = Tour.find(JSON.parse(queryStr));

    //second method
    // const query =  Tour.find()
    //   .where('duration')
    //   .lt(5) //less than
    //   .where('difficulty')
    //   .equals('easy');

    // console.log(req.query);

    //3) sorting
    //checking if having sort in query param
    if (req.query.sort) {
      // console.log('req.query', req.query);
      //split in to an array using comma as a separator than join by space to a new string
      const sortBy = req.query.sort.split(',').join(' ');
      // console.log('sortBy', sortBy);
      //cuz it's a query obj, it has a bunch of built-in methods
      //default is ascending
      query = query.sort(sortBy);
    } else {
      // if no sorting field is specified, the latest createdAt document will come up first
      query = query.sort('-createdAt');
    }

    // 4) field limiting(projecting)
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      //if user not specifying fields, remove some field such as "__v"
      //add prefix "-", so it will not send __v to client
      query = query.select('-__v');
    }

    //5) pagination
    //skip: the amount of results that should be skipped before actually querying data.
    //limit: amount of results that we want in the query.
    // user wants page number two with 10 results per page.
    //?page=2&limit=10 => 11~20
    // skip first 10 pages, limit as 11~20

    //when put a number in a query string,it will then be a string in a query object,
    //so we need to fix that simply by multiplying by one.
    //by default, we want page number one.
    const page = req.query.page * 1 || 1; //convert string to number

    query = query.skip(10).limit(10);

    //execute query
    const tours = await query;

    //return an object nicely formatted with the data
    //from the query string.
    // console.log(req.query);

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
