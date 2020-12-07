const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

//return a filtered obj with only allowed fields
const filterObj = (obj, ...allowedFields) => {
  //uncertain argument, use ..., so allowedFields is an array
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

// exports.getAllUsers = catchAsync(async (req, res) => {
//   //return back  all documents
//   //return a query obj, and we execute directly
//   const users = await User.find();

//   //route handler
//   //send response
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

exports.getMe = (req, res, next) => {
  //getMe do not need to specify id in url, so we add it from req.user
  //add this middleware before calling getOne
  req.params.id = req.user.id;
  next();
};

//update the currently authenticated user's email and
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );
  }

  //one solution
  // const user = await User.findById(req.user.id);
  // await user.save({ validateModifiedOnly: true });

  //jona's solution
  //cuz here is non-sensitive data,we run away the passwordConfirm validator, so we use findByIdAndUpdate
  //imagine user pass body.role = 'admin', it's insecure, so we need to filter the request body
  //until leaving only name and email
  // 2) filter out unwanted fields
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    //return the updated object
    new: true,
    runValidators: true,
  });

  // 3) update user document
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  //204: deleted successfully
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined',
  });
};

// an administrator to update all of the user data,
//not for password
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
