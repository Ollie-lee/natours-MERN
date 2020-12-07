const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel.js');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');
//save environment variable in the process
//so it can accessed in any file
dotenv.config({ path: './config.env' });

//long key provided by mongoDB Atlas
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

//read json file
const Tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const Users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const Reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//import data into DB
const importData = async () => {
  try {
    //instead of passing a obj to be create, we insert an array of obj
    await Tour.create(Tours);
    //avoid validator such as confirmPassword
    await User.create(Users, { validateBeforeSave: false });
    await Review.create(Reviews);
    console.log('data successfully loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//delete all data from db
const deleteData = async () => {
  try {
    //pass nothing, delete all documents
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data successfully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
