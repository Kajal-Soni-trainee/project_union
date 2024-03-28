const express = require("express");
const app = express();
const md5 = require('md5');
const conn = require("./mysql.js");
const path = require('path');
const fs = require('fs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended :true}));
app.use(bodyParser.json());
require('dotenv').config();
const jwt=require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
app.use(session({resave:false, saveUninitialized:true, secret:"your secret key"}));
app.use(cookieParser());
const SECRET_KEY="Kajal123";
//const functions =require("./projects/component_grid/middleware.js");
//const functions_df= require('./projects/dynamic_form_creation/middleware.js');
const {PORT} = process.env;
console.log(PORT);
app.set("view engine", "ejs");
let filename = path.join(__dirname, 'views/dynamic_job_form_views');

//login system router
app.get('/login_system',(req,res)=>{
    res.render('login_system_views/index',{errMsg:"",id:0,otp:0,isReg:false});
    res.end();

});
app.post('/action', (req, res) => {
    console.log("here its server");
    console.log(req.body);
    let u_name=req.body.uname;
    let u_email=req.body.uemail;
    let u_contact = req.body.ucontact;
    let u_salt = Math.floor(Math.random() * 9000 + 1000);
    let otp= Math.floor(Math.random() * 900000000000 + 100000000000);
    let query1= `select * from users where u_name="${u_name}" and u_email="${u_email}";`;
    conn.query(query1,(err,result)=>{
        if(result.length==0){
          let query =`insert into users (u_name, u_email, u_contact, u_salt, u_otp) values ("${u_name}", "${u_email}", "${u_contact}",${u_salt},${otp});`;
          conn.query(query,(err,result)=>{
             if(err) throw err;
             console.log("success fully inserted");
             let id=result.insertId;
             console.log(id,otp);
               res.render('login_system_views/index', {errMsg:"",id:id,otp:otp,isReg:true});
               res.end();
          });
        }
        else{
          res.render('login_system_views/index', {errMsg:"User Already registered",id:0,otp:otp,isReg:false});
          res.end();
        }
    });
   
 });
 app.get('/pass',(req,res)=>{
    let id=req.query.id;
    let otp=req.query.otp;
    res.render('login_system_views/password',{id:id,otp:otp,isSuccess:false,errMsg:""});
    res.end();
 });
 app.post('/pass',(req,res)=>{
    console.log(req.body);
    console.log(req.body)
    let id= req.body.id;
    let pass = req.body.upass;
    let u_otp=req.body.otp;
   console.log(u_otp);
    let query1=`select * from  users where user_id=${id};`;
    conn.query(query1,(err,result)=>{
       if(err) throw err;
        if(result.length==0){
          res.render('login_system_views/password',{id:0,otp:u_otp,isSuccess:false,errMsg:"user does not exist please register first"});
          res.end();
        }
        else{
          let query = `select u_salt from users where user_id=${id};`;
          conn.query(query,(err,result)=>{
               if(err) throw err;
               let password=md5(result[0].u_salt+pass);
               let query2=`update users set u_pass="${password}" where user_id=${id} and u_otp=${u_otp};`;
               conn.query(query2,(err,result)=>{
                if(err) throw err;
                console.log("update successfully");
                res.render('login_system_views/password',{id:0,otp:u_otp,isSuccess:true,errMsg:""});
                res.end();
               });
       });
        }
    })
 });
 
 app.get('/login',(req,res)=>{
 res.render('login_system_views/login',{email:"",errMsg:"",successMsg:""});
 res.end();
 });
 app.post('/login',(req,res)=>{
    let email=req.body.email;
    let pass=req.body.pass;
    let query=`select * from users where u_email="${email}";`;
    conn.query(query,(err,result)=>{
          if(err) throw err;
          if(!result|| result.length==0){
             let errMsg='invalid username or password';
             res.render('login_system_views/login',{email:email,errMsg:errMsg,successMsg:""});
             res.end();
          }
          else{
             let dbpass=result[0].u_pass;
             let salt=result[0].u_salt;
             let u_email=result[0].u_email;
             let u_name=result[0].u_name;
             let newPass = md5(salt+pass);
             if(dbpass!=newPass){
                let errMsg='invalid username or password';
                res.render('login_system_views/login',{email:email,errMsg:errMsg,successMsg:""});
                res.end();
             }
             else{
                let successMsg="Logged in Successfully";
                const token = jwt.sign({email:u_email},SECRET_KEY);
                res.cookie('token',token,{
                    maxAge:1000*60*60*2,
                   httpOnly:true,
                });
                res.render('login_system_views/home',{u_name:u_name});
                res.end();
             }
          }
    });
 });
 app.get("/checkdb",(req,res)=>{
    let id=req.query.id;
    let query =`select * from users where user_id=${id};`;
     conn.query(query,(err,result)=>{
       console.log(result);
       if(result[0].u_pass==null){
          let query2=`delete from users where user_id=${id};`;
          conn.query(query2,(err,result1)=>{
             console.log(result1);
          })
       }
     })
 });
 app.get('/forget_Pass',(req,res)=>{
       let email = req.query.email;
       if(email==""){
          let errMsg="please try first";
          res.render('login_system_views/login',{email:"",errMsg:errMsg,successMsg:""});
          res.end();
       }
       else{
          let query=`select * from users where u_email="${email}";`;
          conn.query(query,(err,result)=>{
           if(err) throw err;
           console.log(result);
           if(result.length!=0){
             let id = result[0].user_id;
             let otp=result[0].u_otp;
             if(result[0].u_pass!=null){
                res.render('login_system_views/password',{id:id,otp:otp,isSuccess:false,errMsg:""});
                res.end();
             }
           }
           else{
             let errMsg="Invalid credentials";
             res.render('login_system_views/login',{email:"",errMsg:errMsg,successMsg:""});
             res.end();
           }
          });
       }
 });
 app.get('/list',(req,res)=>{
    let token = req.headers.cookie.split("=")[1];
    if(token){
       console.log(token);
       let query=`select * from users;`;
       conn.query(query,(err,result)=>{
         if(err) throw err;
         res.render('login_system_views/list',{result:result});
         res.end();
   });
    }
  else{
    let errMsg="You need to login first";
    res.render('login_system_views/login',{email:"",errMsg:errMsg,successMsg:""});
    res.end();
  }
 });

 app.get('/home',(req,res)=>{
   res.render('home');
   res.end();
 });

 app.get('/logout',(req,res)=>{
    res.clearCookie("token");
    res.render('login_system_views/login',{email:"",errMsg:"",successMsg:""});
    res.end();
 });

app.listen(8080);