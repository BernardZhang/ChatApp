var mysql = require('mysql');


function getConnection() {
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database:'chat',
        port: 3306,
        multipleStatements: true
    });
}

module.exports = {
    getConnection: getConnection
};