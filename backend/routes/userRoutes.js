const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const userRouter = express.Router();

//special route, we can only post data here, for user
//same as login, or for reset password,
userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);

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
