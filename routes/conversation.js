var express = require('express');
var router = express.Router();
var messageDao = require('../dao/MessageDao');

/* GET users listing. */
router.get('/', function(req, res, next) {
    messageDao.fetch(function (messages) {
        res.send(messages);
    });
});

router.get('/search', function(req, res, next) {
    messageDao.search(function (messages) {
        res.send(messages);
    });
});

router.post('/', function (req, res, next) {
    messageDao.create(req.body, function (message) {
        res.send(message);
    });
});

module.exports = router;
