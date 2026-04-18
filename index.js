const express = require("express")
const jwt = require("jsonwebtoken")
const secretKey = "smitesh"


const app = express()

let users = []

app.use(express.json())

app.post("/signup",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
      
    users.push({
        username,
        password
    })

    res.json({
        message: "You have logged in "
    })

})
app.post("/signin",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
      
    for(let i = 0; i<username.length; i++){
     if(users[i].username===username && users[i].password===password){
       
     }
      if(!username){
        res.json({
            message:"wrong code"
        })
        return
      }else{
        const  token = jwt.sign({
        username: users[i].username
    },secretKey);
        res.json({
            token: token
        })
    }
} 
})


app.listen(3000);