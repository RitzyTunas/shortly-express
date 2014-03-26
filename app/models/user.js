var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  hashPassword: function(password){

    var crypter = Promise.promisify(bcrypt.hash);
    crypter(password, null, null).bind(this).then(function(hash){
        this.set('password', hash);
        this.save();
      });
  }
});

module.exports = User;

