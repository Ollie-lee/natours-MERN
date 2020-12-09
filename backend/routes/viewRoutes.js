const express = require('express');

const viewController = require('../controllers/viewController');

const viewRouter = express.Router();

//make homepage show overview
viewRouter.get('/', viewController.getOverview);

viewRouter.get('/tour', viewController.getTour);

module.exports = viewRouter;
