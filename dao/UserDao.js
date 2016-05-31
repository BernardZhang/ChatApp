var db = require('../db');

var conn = db.getConnection();

function fetch(callback) {
    var sql = 'select * from user';

    conn.query(sql, function (err, res) {
        if (!err) {
            callback && callback(res);
        }
    });
}

function getUserById(id, callback) {
    var sql = 'select * from user where user.id = ' + id;

    conn.query(sql, function (err, res) {
        if (!err) {
            callback && callback(res);
        }
    });
}

function getUserByName(name, callback) {
    var sql = 'select * from user where user.name = "' + name + '"';
    console.log(sql);

    conn.query(sql, function (err, res, next) {
        console.log('getUserByName', err, res);
        if (!err) {
            callback && callback(res[0] || null);
        } else {
            next(err);    
        }
    });
}

function create(user, callback) {
    var sql = 'insert into user(name) values(?)';
    var params = [user.name];

    conn.query(sql, params, function (err, res) {
        if (!err) {
            user.id = res.insertId;
            callback && callback(user);
        }
    })
}

function update(id, user, callback) {
    var sql = 'update user set name = ? where id = ?';
    var params = [user.name, id];

    conn.query(sql, params, function (err, res) {
        if (!err) {
            callback && callback(res);
        }
    });
}

function remove() {

}

module.exports = {
    fetch: fetch,
    create: create,
    update: update,
    remove: remove,
    getUserById: getUserById,
    getUserByName: getUserByName
};