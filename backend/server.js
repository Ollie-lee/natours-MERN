//the environment variables
//imports Express application
//start server
//config mongoDB

const dotenv = require('dotenv');
const mongoose = require('mongoose');
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
app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});
