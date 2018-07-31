import * as mySql from "mysql";

let mysql = mySql;

let connection = mysql.createConnection({
    host: '172.30.0.111',
    user: 'root',
    password: 'Uhope123',
    database: 'hzz_dezhou',
    port: 3306
});

// connection.connect( error => {
//     if (error) {
//         console.log('connection error: ' + error);
//         return;
//     }
// });

connection.query('select * from sm_user', (error, rs) => {
    if (error) {
        console.log('query error: ' + error);
        return;
    }
    for (let i = 0; i < rs.length; i++) {
        console.log(rs[i].NAME);
    }
});

connection.end(error => {
   if (error) {
       console.log('end error: ' + error);
       return;
   }
});
