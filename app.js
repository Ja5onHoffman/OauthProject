const path = require("path")
const express = require("express")
const bodyparser = require("body-parser")
const AWS = require("aws-sdk")
const app = express() 

app.use(express.static(path.join(__dirname, '/')))
app.get('/', function(req, res, next) {
    res.status(200)
    res.render('index')
})




app.listen(3000)



