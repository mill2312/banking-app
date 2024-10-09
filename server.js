
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

/**
 * Contains user account information.
 * - _id     (unique)
 * - name         Full name of user
 * - username     Username
 * - password     Password
 * - sessionId    Session ID user's browser has stored in cookie
 *                which is used for requests (rather than a username
 *                which could be spoofed)
 */
var usersDb = new Datastore({filename: "./userData.db", autoload: true})

/**
 * Contains transaction information (for payments and requests)
 * - _id          (unique)
 * - senderId     _id of sender in userData.db
 * - recieverId   _id of reciever in userData.db  (the account targeted by amount)
 * - time         epoch time
 * - amount       Amount of money (negative = request for money, positive = send money)
 * - approved     Has this transaction been applied to the recievers account?
 */
var paymentsDb = new Datastore({filename: "./payments.db", autoload: true})


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
    <a href="/login">Login Page</a>
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
  //console.log("here"); //also true. This is just temporary
  res.end() // End response.
})

app.get("/login", function(req,res){
  res.send(fs.readFileSync("./websites/login-page.html", "utf-8"))
  res.end() // End response.
})


app.get("/payment-page", function(req,res){
  res.send(fs.readFileSync("./websites/payment-page.html", "utf-8"))
  res.end() // End response
})


app.get("/home", function(req,res){
  /*
    Not implemented yet, but /login should go here
  */
})
// https://docs.google.com/document/d/1e9s9r5Pgr8ZN5dboi88qjAtcl5HRmjKyGr_VkoZ1sQ8/edit Input/Output JSON document
// https://www.w3schools.com/js/js_cookies.asp Cookies
// https://github.com/louischatriot/nedb?tab=readme-ov-file#updating-documents NeDB library reference

/**
 * Sign In
 * Input: {username, password}
 * Output: {success, message, sessionId}
 */
app.post("/endpoint/sign-in", function(req,res){
  let requestJson = req.body
  console.log(requestJson)
  // recieve username and password

  // get session id and store it to user in database
  usersDb.findOne({username: requestJson.username, password: requestJson.password}, function(err,doc){  
  })

  //Generates Session ID
  const sessionId = generateSessionId();

  //Adds Session ID to User Object
  usersDb.update(
    { username: requestJson.username },
    { $set: { sessionId: sessionId } },
    function(updateErr) {
      if (updateErr) {
        console.error("Failed to update session ID:", updateErr);
        return res.status(500).json({success: false, message: "Could not create session" });
      }

      // Respond with the session ID
      res.status(200).json({success: true, message: "Signed in successfully", sessionId: sessionId });
    }
  );
});
  

  // res.json({success: false})
  // res.end()



// Josh will work on this
// Accepts 'toUsername' 'sessionId'  'amount'
// payments db format {sender, receiver, time, requestApproved, amount}

/**
 * Pay Another User
 * Input: {toUsername, sessionId, amount}
 *                                  ^ positive number
 * Output: {success, transactionId}
 */
app.post("/endpoint/pay", function(req,res){
  let requestJson = req.body
  console.log(requestJson)

  // Validate

  if(validation.pay.validate(requestJson).error){
    res.json({
      success: false,
      message: validation.pay.validate(requestJson).error.message
    })
    return
  }

  // Get the User's ID by their Session ID

  usersDb.findOne({sessionId: requestJson.sessionId}, function(senderErr,senderDoc){
    if(senderErr){res.json({success: false, message: "Error in getting sender info"})}
    let senderId = senderDoc._id

    // Get the Reciever's ID by their username

    usersDb.findOne({username: requestJson.toUsername}, function(recieverErr,recieverDoc){
      if(recieverErr){res.json({success: false, message: "Error in getting reciever info"})}
      let recieverId = recieverDoc._id

      /*
        Now add this transaction to the database.
        We approve the payment immediately since it is user-initiated.
      */

      addPaymentToDb(senderId, recieverId, requestJson.amount, true, function(err, doc){
        if(err){res.json({success: false, message: "Error in adding the payment to the database"})}
        res.json({success: true, transactionId: doc._id})
      })
    })
  })
})

// TODO: Get Transaction by ID POST
// TODO: Approve someone's request for money POST

/**
 * Adds a payment to the database.
 * @param {string} senderId _id of Sender
 * @param {string} recieverId _id of Reciever
 * @param {number} amount Amount to pay the reciever
 * @param {boolean} approved Has this transaction gone through?
 * @param {function(err, doc)} callback Function callback
 */
function addPaymentToDb(senderId, recieverId, amount, approved, callback){
  paymentsDb.insert({
    senderId: senderId,
    recieverId: recieverId,
    amount: amount,
    time: Date.now(),
    approved: approved
  }, callback)
}

/**
 * Request Money From Another User
 * Input: {fromUsername, sessionId, amount}
 *                                       ^ negative number
 * Output: {success, transactionId}
 * 
 * Note: The sender is sending debt to the recieving user, so the
 * sender's balance will go up when approved and the
 * reciever's balance will go down.
 */
app.post("/endpoint/request", function(req,res){
  let requestJson = req.body
  console.log(requestJson)

  // Validate

  if(validation.request.validate(requestJson).error){
    res.json({
      success: false,
      message: validation.request.validate(requestJson).error.message
    })
    return
  }

  // Get the User's ID by their Session ID

  usersDb.findOne({sessionId: requestJson.sessionId}, function(senderErr,senderDoc){
    if(senderErr){res.json({success: false, message: "Error in getting sender info"})}
    let senderId = senderDoc._id

    // Get the Reciever's ID by their username

    usersDb.findOne({username: requestJson.fromUsername}, function(recieverErr,recieverDoc){
      if(recieverErr){res.json({success: false, message: "Error in getting reciever info"})}
      let recieverId = recieverDoc._id

      /*
        Add transaction to database, but do NOT approve immediately.
        The sender is sending debt to the recieving user, so the recieving
        user must be able to deny the request from the sender.
      */

      addPaymentToDb(senderId, recieverId, requestJson.amount, false, function(err, doc){
        if(err){res.json({success: false, message: "Error in adding the payment to the database"})}
        res.json({success: true, transactionId: doc._id})
      })
    })
  })

})


app.post("/endpoint/login-user", function(req,res){
  console.log("Signing In");
  let requestJson = req.body
  console.log(requestJson);
  usersDb.findOne({username: requestJson.username}, function(err,doc){ 
    if (doc) {
      console.log("success")
      res.json({success: true})
      res.end()
    }
    else {
      console.log("failure");
      res.json({success: false})
      res.end()
    }
    //console.log("test")
  })
  return
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

  //userDb.exist({})

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


//Helper function to generate SessionID:
function generateSessionId() {
  return Math.floor(100000000 + Math.random() * 900000000).toString(); // Generates a 9-digit random number as a string
}
