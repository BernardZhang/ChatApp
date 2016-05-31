var express = require('express');
var router = express.Router();
var userDao = require('../dao/UserDao');

/* GET users listing. */
router.get('/', function(req, res, next) {
    userDao.fetch(function (users) {
        res.send(users);
    });
});

router.get('/search', function (req, res, next) {
    console.log('search', req.query.name);
    userDao.getUserByName(req.query.name, function (user) {
        res.send(user);
    });
});

router.get('/:id', function(req, res, next) {
    userDao.getUserById(req.params.id, function (user) {
        res.send(user);
    });
});

router.post('/', function (req, res, next) {
    userDao.create(req.body, function (user) {
        res.send(user);
    });
});

module.exports = router;
