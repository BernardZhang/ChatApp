var db = require('../db');

var conn = db.getConnection();

function fetch(callback) {
    var sql = 'select * from conversation';

    conn.query(sql, function (err, res) {
        if (!err) {
            callback && callback(res);
        }
    });
}

function create(conv, callback) {
    var sql = 'insert into conversation(members, name, createTime) values(?, ?, ?)';
    var params = [JSON.stringify(conv.members), conv.name, new Date()];

    conn.query(sql, params, function (err, res) {
        console.log(err, res);
        if (!err) {
            conv.id = res.insertId;
            conv.createTime = params[2];
            callback && callback(conv);
        }
    });
}

function search(param, callback) {
    var sql = 'select * from conversation where conversation.members = ?';
    var con = '';
    var params = [JSON.stringify(param.members)];

    if (param.members) {
        con += 'conversation.members = ?';
        params.push(JSON.stringify(param.members));
    }

    if (param.name) {
        con += 'conversation.name = ?';
        params.push(param.name);
    }

    if (param.id) {
        con += 'conversation.id = ?';
        params.push(param.id);
    }
    
    conn.query(sql, params, function (err, res, next) {
        console.log(err, res);
        if (!err) {
            console.log(res);
            callback && callback(res);
        } else {
            next(err);
        }
    });
}

function searchConvsByUserId(userId, callback) {
    fetch(function (convs) {
        callback(convs.filter(function (conv) {
            return JSON.parse(conv.members).indexOf(userId.toString()) > -1;
        }));
    });
}

function remove(id, callback) {
    var sql = 'delete from conversation where message.id = ' + id;

    conn.query(sql, function (err, res) {
        if (!err) {
            callback && callback({ status: true });
        }
    });
}

module.exports = {
    fetch: fetch,
    create: create,
    search: search,
    remove: remove
};