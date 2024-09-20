/*
The express library handles server communication 
and hosts to http://localhost:3000/

https://expressjs.com/en/starter/hello-world.html

Start the server by running 'node server' 
in the terminal after installing Node/NPM. Then open
http://localhost:3000/ on your browser.
*/

const express = require('express')
const app = express()
const port = 3000

app.get('/', function(req,res){
  res.send('Hello World!!!')
})

app.listen(port, function(){
  console.log(`Example app listening on port ${port}`)
})