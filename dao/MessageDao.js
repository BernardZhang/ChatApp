var db = require('../db');

var conn = db.getConnection();

function fetch(callback) {
    var sql = 'select * from message';

    conn.query(sql, function (err, res) {
        if (!err) {
            callback && callback(res);
        }
    });
}

function create(msg, callback) {
    var sql = 'insert into message(content, type, fromUserId, conversationId) values(?, ?, ?, ?)';
    var params = [msg.content, msg.type, msg.from.id, msg.conversationId];

    conn.query(sql, params, function (err, res) {
        if (!err) {
            msg.id = res.insertId;
            callback && callback(msg);
        }
    });
}

function search(param, callback) {
    var sql = 'select message.*, user.name as username from message join user on (message.fromUserId = user.id) where message.conversationId = ?';
    var params = [param.conversationId];

    conn.query(sql, params, function (err, res) {
        if (!err) {
            res.forEach(function (message) {
                message.from = {
                    id: message.fromUserId,
                    name: message.username
                };
            });
            callback && callback(res);
        }
    });
}

function getUnreadMsg(params, callback) {
    var sql = 'select count(id) as count, message.conversationId from message '
            + 'where message.readFlag = false and message.fromUserId <> ? group by conversationId';
    var params = [params.userId];

    conn.query(sql, params, function (err, res) {
        if (!err) {
            callback && callback(res);
        }
    });
}

function setMsgStatus(params) {
    search(params, function (messages) {
        messages.forEach(function (msg) {
            msg.read = true;
            update(msg);
        });
    });
}

function getNotesByUserId(userId, callback) {

}

function remove(id, callback) {
    var sql = 'delete from message where message.id = ' + id;

    conn.query(sql, function (err, res) {
        if (!err) {
            callback && callback({ status: true });
        }
    });
}

function update(msg, callback) {
    var sql = 'update message';
    var con = '';
    var params = [];

    if (msg.content) {
        con += ' set content = ?,';
        params.push(msg.content);
    }

    if (msg.readFlag) {
        con += ' readFlag = ?';
        params.push(msg.readFlag);
    }

    sql += con + ' where id = ?';

    params.push(msg.id);

    conn.query(sql, params, function (err, res) {
        if (!err) {
            callback && callback(res);
        }
    });
}

module.exports = {
    fetch: fetch,
    create: create,
    search: search,
    remove: remove,
    update: update,
    getUnreadMsg: getUnreadMsg
};