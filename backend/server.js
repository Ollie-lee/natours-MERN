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

// const tourSchema = new mongoose.Schema({
//   //schema use native JS data type
//   name: {
//     type: String,
//     required: [true, 'A tour must have name'],
//     // we can not now have two tour documents with the same name
//     unique: true,
//   },
//   rating: {
//     type: Number,
//     default: 4.5,
//   },
//   price: { type: String, required: [true, 'A tour must have price'] },
// });

// //convention in programming to always use uppercase on model names and variables.
// //name, schema
// const Tour = mongoose.model('Tour', tourSchema);

// //use model to create a new document
// // testTour is an instance of the tour model,
// //so it has a couple of methods on it
// // to interact with the database.
// const testTour = new Tour({
//   name: 'The Park',
//   price: 997,
// });

// //save instance to the tours collection in the database
// //return a promise that we can then consume, resolved value
// // is the final document as it is in the database
// testTour
//   .save()
//   .then((doc) => {
//     console.log('doc', doc);
//   })
//   .catch((err) => {
//     console.log('ERROR:', err);
//   });
//have everything that is not related to express in one file,
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});
