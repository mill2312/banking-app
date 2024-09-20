/*
  The express library handles server communication 
  and hosts to http://localhost:3000/

  https://expressjs.com/en/starter/hello-world.html

  Start the server by running 'node server' 
  in the terminal after installing Node/NPM. Then open
  http://localhost:3000/ on your browser.

  ---------------------------------------------------------

  app.listen() starts the server and has a callback argument
  where we display a message.

  To serve requests to certain links, we use app.get(link, callback).
  The link is everything after www.google.com. 
  For example www.google.com/search, the link would be /search.

  After the request is made to this link, the callback function is called
  with a request (req) and response (res). The request lets us interact
  with the clients web request. The response lets us interact with what
  we will send back.

  We use the response arameter's send function (e.g. res.send())
  to send a text response to the client from this server, 
  which is interpreted as HTML.
*/

const fs = require("fs") // File System (allows us to read files)
const express = require('express') // Express local server-hosting library
const app = express()
const port = 3000

// Starts the server.
app.listen(port, function(){
  console.log("Example app listening on port " + port)
})

app.get("/", function(req,res){
  /*
    Sends HTML with link (a href) to login page
    https://www.w3schools.com/tags/att_a_href.asp

    Accent (`) allows for multiple lines
  */
  res.send(`
    Hello World!!!<br>
    <a href="/login">Login Page</a>
  `)
  res.end() // End response
})

app.get("/login", function(req,res){
  /*
    Here we send a response from the content of the file
    login-page.html in the websites folder.
  */
  res.send(fs.readFileSync("./websites/login-page.html", "utf-8"))
  res.end() // End response
})