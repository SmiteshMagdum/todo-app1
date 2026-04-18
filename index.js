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
      
     if(users.username===username && users.password===password)
     {
        res.json({
            message:"signin"
        })
     }else{
        res.json({
            message: "wrong credentials"
        })
     }

    const  token = jwt.sign({
        username: users.username
    },secretKey);

      
})

app.listen(3000);