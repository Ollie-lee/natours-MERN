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

// middleware runs always in sequence, and router here is mini application
//we can use middleware on this router as well.
//here is to basically protect all the routes that come after this point.
//after middlewares above, then the next middleware in the stack is this protect.
//so middlewares below are now protected
userRouter.use(authController.protect);

userRouter.patch('/updateMyPassword', authController.updatePassword);

userRouter.get(
  '/me',
  //faking id comes from url
  userController.getMe,
  userController.getUser
);
userRouter.patch('/updateMe', userController.updateMe);
userRouter.delete('/deleteMe', userController.deleteMe);

//only admin can delete and create user... below
userRouter.use(authController.restrictTo('admin'));

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
