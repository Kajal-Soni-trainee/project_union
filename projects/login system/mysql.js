const mysql = require('mysql');
const conn = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"Kajal@123",
    database:"login_system"
});
module.exports=conn;