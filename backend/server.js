//the environment variables
//imports Express application
//start server
//config mongoDB

const dotenv = require('dotenv');
const mongoose = require('mongoose');

//handle exception globally
process.on('uncaughtException', (err) => {
  console.log('Unhandled Exception!');
  console.log(err);
  // the code zero stands for a success
  //  one stands for uncaught exception.
  process.exit(1);
});

//save environment variable in the process
//so it can accessed in any file
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  // .connect(process.env.DATABASE_LOCAL, { // for connecting local database, but make sure mongod is started
  .connect(DB, {
    // for connecting mongo atlas
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    // console.log(connection.connections);
    console.log('DB connection successful');
  });

const app = require('./app');

//have everything that is not related to express in one file,
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

//handle rejection globally
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection!');
  console.log(err);
  //only when server closes, will run the callback
  //give the server time to finish all the request that are
  // still pending or being handled at the time
  server.close(() => {
    // the code zero stands for a success
    //  one stands for uncaught exception.
    process.exit(1);
  });
});
