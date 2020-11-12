const fs = require("fs");

// readfile outside the callback(top-level), not blocking event-loop
const tours = JSON.parse(
  //parse json to an array of js object
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.checkId = (req, res, next, val) => {
  //val is the value of 'id', the param of url
  console.log(`Tour id is ${val}`);

  //if invalid, stop the req/res cycle
  if (val * 1 > tours.length) {
    //without return, function will not stop running invalid request
    return res.status(404).json({
      status: "fail",
      message: "Invalid ID",
    });
  }

  next();
};

exports.getAllTours = (req, res) => {
  //route handler
  res.status(200).json({
    status: "success",
    results: tours.length,
    requestTime: req.requestTime,
    data: {
      tours,
    },
  });
};

exports.getTour = (req, res) => {
  const { id } = req.params;
  // console.log(typeof id); //string
  // console.log(typeof (id * 1)); //number

  const tour = tours.find((element) => element.id === id * 1);
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: "fail",
      message: "missing name or price",
    });
  }
  next();
};

exports.createTour = (req, res, next) => {
  //handle post request, for REST definition, endpoint should not change
  // send data from the client to the server
  //data should on the request
  // console.log(req.body); //body is available cuz we use the middleware

  const newId = tours[tours.length - 1].id + 1;
  //merge two existing objects into one new object
  const newTour = Object.assign({ id: newId }, req.body);
  //update data to fictional database
  tours.push(newTour);
  //put a callback func that is gonna be processed in the background
  //and as soon as it's ready, it's gonna put its event in one of the event loop queue,
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      //What do we want to do as soon as the file is written?
      //send the newly created object as the response.
      //201 means created, 200 means ok
      res.status(201).json({
        status: "success",
        data: {
          tour: newTour,
        },
      });
    }
  );

  // res.send("Done"); //always need to send sth to finish request/response cycle
};

exports.patchTour = (req, res) => {
  //you would have to get tour from the JSON file,
  // than change that tour and then save it again to the file.
  const { id } = req.params; // id is string

  res.status(200).json({
    status: "successful",
    data: {
      tour: "<Updated tour>",
    },
  });
};

exports.deleteTour = (req, res) => {
  const { id } = req.params; // id is string

  res.status(204).json({
    status: "successful",
    data: null,
  });
};
