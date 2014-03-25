var db = require('../config');
var User = require('../models/user');

var Users = new db.Collection();

Users.model = User;

// Users.tableName = 'users';

module.exports = Users;
