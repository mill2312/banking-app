/*
  https://expressjs.com/en/starter/hello-world.html

  Start the server by running 'node server' 
  in the terminal after installing Node/NPM. Then open
  http://localhost:3000/ on your browser.

  To stop press CTRL-C in terminal.

sudo lof -i :3000
kill -9 [PID]

OR

killall -9 node
  ---------------------------------------------------------

      app.listen(port, function(){
        console.log("Example app listening on port " + port)
      })

  app.listen() starts the server and has a callback function
  where we display a message.

      
      app.get("/", function(req,res){
        res.send("Hello!")
        res.end() // End response
      })

  To serve requests to certain links, we use app.get(link, callback).
  The link is everything after www.google.com. 
  For example www.google.com/search, the link would be /search.
  
  After the request is made to this link, the callback function is called
  with a request (req) and response (res). The request lets us interact
  with the clients web request. The response lets us interact with what
  we will send back.


    1.  res.send("Hello!")
    2.  res.send("<b>Bold Hello</b>")
    3.  res.send(fs.readFileSync("./websites/login-page.html", "utf-8"))

  We use the response parameter's send function (e.g. res.send())
  to send a text response to the client from this server, 
  which is interpreted as HTML. We can send content of file using
  fs.readFileSync("[filelocation]", "utf-8").

*/

// https://github.com/elixs-de/SessionJs

const fs = require("fs") // File System (allows us to read files)
const express = require('express') // Express local server-hosting library
const validation = require("./server-input-validation")
const Datastore = require("nedb") // Persistent File Database:  https://www.npmjs.com/package/nedb
var usersDb = new Datastore({filename: "./userData.db", autoload: true})
var paymentsDb = new Datastore({filename: "./payments.db", autoloda: true})
const app = express()
app.use(express.json())
const port = 3000

// Starts the server.
var server = app.listen(port, function(){
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
    <a href="/signup">Login Page</a>
  `)
  res.end() // End response
})

app.get("/signup", function(req,res){
  /*
    Here we send a response from the content of the file
    signup-page.html in the websites folder.
  */
  //console.log("In signup"); //true
  res.send(fs.readFileSync("./websites/signup-page.html", "utf-8"))
  console.log("here"); //also true. This is just temporary
  res.end() // End response.
})

app.get("/login", function(req,res){
  res.send(fs.readFileSync("./websites/login-page.html", "utf-8"))
  res.end() // End response.
})


app.get("/payments", function(req,res){
  res.send(fs.readFileSync("./websites/payment-page.html", "utf-8"))
  res.end() // End response
})


app.get("/home", function(req,res){
  /*
    Not implemented yet, but /login should go here
  */
})


// https://github.com/louischatriot/nedb?tab=readme-ov-file#updating-documents

app.post("/endpoint/sign-in", function(req,res){
  let requestJson = req.body
  console.log(requestJson)
  // recieve username and password

  // get session id and store it to user in database
  usersDb.findOne({username: requestJson.username, password: requestJson.password}, function(err,doc){  

  })

  // res.json({success: false})
  // res.end()
})

app.post("/endpoint/pay", function(req,res){
  let requestJson = req.body
  console.log(requestJson)

})

app.post("/endpoint/request", function(req,res){
  let requestJson = req.body
  console.log(requestJson)

})


/**
 * Request to this endpoint must have:
 * username : string
 * name : string
 * password : string
 */
app.post("/endpoint/create-new-user", function(req,res){
  console.log("Creating User"); //false
  let requestJson = req.body
  console.log(requestJson)

  // Validate that the request JSON is correct

  if(validation.createNewUser.validate(requestJson).error){
    res.json({
      success: false,
      message: validation.createNewUser.validate(requestJson).error.message
    })
    return
  }

  // If user document does not exist, create it


  usersDb.findOne({username: requestJson.username}, function(err,doc){  
    if(err){throw new Error("Error in checking if username already exists")}
      console.log("Found result")  
    if(!doc){
      usersDb.insert({
        name: requestJson.name,
        username: requestJson.username,
        password: requestJson.password
      })
      console.log("Success")
      res.json({success: true})
      res.end()
    } else {
      console.log("Fail")
      res.json({success: false, message: "User already exists"})
      res.end()
    }
  })
})

// Our client functions
app.use(express.static('static'))
