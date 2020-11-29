const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const userRouter = express.Router();

//special route, we can only post data here, for user
//same as login, or for reset password,
userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);

//only receive the email address
userRouter.post('/forgotPassword', authController.forgetPassword);
//receive the token as well as the new password.
userRouter.patch('/resetPassword/:token', authController.resetPassword);

//User Route
//can be used for admin
userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
