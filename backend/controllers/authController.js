const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign(
    //payload
    { id },
    //secret, our configuration file is a perfect place to store this kind of secret data,
    process.env.JWT_SECRET,
    //pass option
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

//equals to create user in the authentication context
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  //when user signup, we want them sign in automatically, so we issue the token
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    //sending the token to the client
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  //read the email and the password from the body.
  const { email, password } = req.body;
  //check process has a couple of steps,
  //1)check email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  //2)check if user exists && password is correct
  //add password field back to the response(banned in the schema)
  const user = await User.findOne({ email }).select('+password');
  //user now is a document, so it can access instance method defined in the model
  // const correct = await user.correctPassword(password, user.password);

  //avoid error caused by user is undefined
  if (!user || !(await user.correctPassword(password, user.password))) {
    //401 means unauthorized
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) if every thing is ok, send JWT to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});
