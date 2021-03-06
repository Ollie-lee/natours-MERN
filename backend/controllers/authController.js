const util = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

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

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    //the browser or the client in general will delete the cookie after it has expired.
    //1s = 1000 milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    // cookie cannot be accessed or modified in any way by the browser.
    //prevent those cross-site scripting attacks.
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    //the cookie will only be sent on an encrypted connection. So basically, we're only using HTTPS
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  //some user comes from create, not select, so hide password in the schema have no effect
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

//equals to create user in the authentication context
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  //when user signup, we want them sign in automatically, so we issue the token
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   //sending the token to the client
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });

  createSendToken(newUser, 201, res);
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
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! please logged in to get access', 401)
    );
  }

  //2) Verification token
  //check if is modified or expired
  const decoded = await util.promisify(
    //grab token's head and payload with env's secret to check
    //verify received the third argument which is a callback, we
    //use promisefy to avoid callback hell
    jwt.verify
  )(token, process.env.JWT_SECRET);

  //3) check if user still exists
  //verify process make sure the id is correct
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  //4) check if user changed password after JWT was issued
  //iat: issue at
  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again!', 401)
    );
  }

  //grant access to the protected route
  req.user = freshUser; //can be used in the other middleware
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array, ['admin','lead-guide]
    //only specified roles can access protected routes
    //req.user.role is exposed by the above middleware
    if (!roles.includes(req.user.role)) {
      return next(
        //403 means forbidden
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address'), 404);
  }
  //2) generate the random reset token
  //has to do with user data itself, so put a instance method in model
  //set passwordResetExpires btw
  const resetToken = user.createPasswordResetToken();
  //we just modify the document's data, but not save into the database, so save it
  //deactivate all the validators, so no need to provide required field
  await user.save({ validateBeforeSave: false });
  // await user.save();

  // 3)send it to user's email
  //So we're basically preparing this one here to work both in development and in production.
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passConfirm to: 
  ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  //do more than send a error back
  try {
    //pass option
    sendEmail({
      email: user.email,
      subject: 'Your password reset token(Valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    //reset both the token and the expires property.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // save data in database
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  //hash the token in the url parameter to check the equality in database
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //token is the only thing we can query user
  //find the user for the token and also check if the token has not yet expired at the same time
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    //great than now means future
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //we did not turn off validators here, cuz we need it, e.g. password = passwordConfirm
  //we use save() to trigger "save" hook
  await user.save();
  // 3) update changePasswordAt property for the current user
  //implemented by pre save hook in model

  //4) log the user in, send JWT to client
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //only for logged in users
  // 1) get user from collection
  //req.user.id is also available
  const user = await User.findById(req.user._id).select('+password');
  // 2) if the posted password is correct.
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) update password
  user.password = req.body.passwordCurrent;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //why not using findByIdAndUpdate()?
  //1 passwordConfirm customer validator will not be triggered
  //2 pre save hook will not work
  // 4) log user in, send JWT, logged in with the new password that was just updated.

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});
