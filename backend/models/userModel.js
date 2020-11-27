const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    //transform email to lowercase
    lowercase: true,
    //add custom validators
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    //password's minimal length is 8
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    // it's a required input, not required to be persisted to the database
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        //a call back return true or false
        //el is passwordConfirm
        //only useful(this points to current doc) for create a NEW user,
        //using SAVE/CREATE
        // so that not for update
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
});

//document pre save hook
//the encryption is happened Between getting the data and saving it to the database.
userSchema.pre('save', async function (next) {
  //"this" is current user document, isModified() receives a field
  //only run this function when the password field is modified
  if (!this.isModified('password')) {
    //stop the following code, just jump to the next middleware
    return next();
  }

  //hash password
  this.password = await bcrypt.hash(this.password, 12);

  //delete passwordConfirm field
  //we only need user inputted two equal passwords
  //so that he doesn't make any mistakes with his password.
  //after this validation was successful,
  //we actually no longer need this field
  this.passwordConfirm = undefined;
  next();
});

//an instance method to check if the given password is the same as the one stored in the document.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //"this" points to the current document
  //since we hide password schema in the model, so can't use this.password
  //that's why need passing userPassword(encrypted one)
  //candidatePassword is not hashed
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
