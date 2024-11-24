// File System (allows us to read files)
const fs = require("fs")

// Express local server-hosting library
const express = require('express')

// Express auth library (prompts for user/pass on admin page)
const auth = require("basic-auth")

// Validation library for checking client requests
const validation = require("./validation-library")

// Persistent File Database:  https://www.npmjs.com/package/nedb
const Datastore = require("nedb")

// Templating engine (renders .ejs files)
const ejs = require("ejs")

/**
 * See userData.description for info about properties
 */
var usersDb = new Datastore(
  {filename: "./datastores/userData.db", autoload: true})

/**
 * See payments.description for info about properties
 */
var paymentsDb = new Datastore(
  {filename: "./datastores/payments.db", autoload: true})


const app = express()
app.use(express.json())
const port = 3000

// Starts the server.
app.listen(port, function(){
  console.log("Example app listening on port " + port
    + "\n" + "Use [CTRL]+[C] to stop server."
  )
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

app.get("/requests", function(req,res){
  res.send(fs.readFileSync("./websites/requests.html", "utf-8"))
  res.end() // End response.
})

app.get("/inspector/:transactionId", function(req,res){
  
  var html = ejs.render(fs.readFileSync("./websites/inspector.ejs", "utf-8"), 
  {id: "12344", name: "Name", amount: "13492", approved: "True", time: "12:54PM"})



  res.send(html)
  res.end() // End response.
})

/**
 * This page displays information for the
 * system administrator, including the last
 * 10 transactions.
 */
app.get("/admin", function(req,res){
  let user = auth(req)

  if(user == undefined 
    || user['name'] != 'admin' 
    || user['pass'] != 'password') {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="Node"')
    res.end('Unauthorized')
    return
  }

  // Get the transactions
  paymentsDb.find({}).sort({time: -1}).limit(10).exec(function(err,paymentsList){
    usersDb.find({}, function(err, usersList){
      let cleanPaymentList = paymentsList.map(function(paymentObj){
        return {
          sender: usersList.find(function(obj){
            return obj._id == paymentObj.senderId
          }).username,
          receiver: usersList.find(function(obj){
            return obj._id == paymentObj.receiverId
          }).username,
          amount: paymentObj.amount,
          approved: paymentObj.approved,
          time: new Date(paymentObj.time)
        }
      })

      var html = ejs.render(fs.readFileSync("./websites/admin.ejs", "utf-8"), 
      {recentTransactions: cleanPaymentList,
        numberOfUsers: usersList.length
      })
      res.send(html);
      res.end();
    })
  })
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

// Input/Output JSON document
// https://docs.google.com/document/d/1e9s9r5Pgr8ZN5dboi88qjAtcl5HRmjKyGr_VkoZ1sQ8/edit
// Cookies
// https://www.w3schools.com/js/js_cookies.asp
// NeDB library reference
// https://github.com/louischatriot/nedb?tab=readme-ov-file#updating-documents

/**
 * Sign In
 * Input: {username, password}
 * Output: {success, message, sessionId}
 */
app.post("/endpoint/sign-in", function(req,res){
  let requestJson = req.body
  console.log("Sign In Request!")
  console.log(requestJson)
  // recieve username and password

  // get session id and store it to user in database
  // usersDb.findOne({username: requestJson.username, 
  // password: requestJson.password}, function(err,doc){  
  // })

  // Validate that the JSON is correct

  if(validation.signIn.validate(requestJson).error){
    res.json({
      success: false,
      message: validation.signIn.validate(requestJson).error.message
    })
    return
  }

  // Generates Session ID
  const sessionId = generateSessionId();

  // Adds Session ID to User Object
  usersDb.update(
    { username: requestJson.username },
    { $set: { sessionId: sessionId } },
    function(updateErr) {
      if (updateErr) {
        console.error("Failed to update session ID:", updateErr);
        return res.status(500).json({
          success: false, 
          message: "Could not create session"
        })
      }

      // Respond with the session ID
      res.json(
        {
          success: true, 
          message: "Signed in successfully", 
          sessionId: sessionId 
        });
      res.end()
    }
  );
});



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
    if(senderErr){res.json({success: false, 
      message: "Error in getting sender info"})}
    let senderId = senderDoc._id

    // Get the Receiver's ID by their username

    usersDb.findOne({username: requestJson.toUsername}, function(receiverErr,receiverDoc){
      if(receiverErr){res.json({success: false, 
        message: "Error in getting receiver info"})}
      let receiverId = receiverDoc._id

      /*
        Now add this transaction to the database.
        We approve the payment immediately since it is user-initiated.
      */

      addPaymentToDb(senderId, receiverId, requestJson.amount, true, function(err, doc){
        if(err){res.json({success: false, message: "Error in adding the payment to the database"})}
        res.json({success: true, transactionId: doc._id})
      })
    })
  })
})

// TODO: Get Transaction by ID POST
// TODO: Approve someone's request for money POST

/**
 * Adds a payment to the database. If approved=true, 
 * it updates the user's balance too.
 * @param {string} senderId _id of Sender
 * @param {string} receiverId _id of Receiver
 * @param {number} amount Amount to pay the receiver <-- positive
 * @param {boolean} approved Has this transaction gone through?
 * @param {function(err, doc)} callback Function callback
 */
function addPaymentToDb(senderId, receiverId, amount, approved, callback){

  amount = Number(amount) // Ensure the amount is a number

  paymentsDb.insert({
    senderId: senderId,
    receiverId: receiverId,
    amount: amount,
    time: Date.now(),
    approved: approved
  }, callback)

  // We want to update the recieving user's balance if it is
  // initially approved.
  if(approved == true){

    // TODO: Handle not enough balance problems. Would require 
    // very deep nesting of database calls

    usersDb.findOne({_id: receiverId}, function(err,doc){
      if(err){throw new Error("Unexpected error. The receiverId should be valid.")}
      /** The current balance of the user */
      let currentReceiverBalance = doc.balance 
      usersDb.update({_id: receiverId}, 
        {$set: {balance: currentReceiverBalance + amount}}, function(err,n){
        if(err){throw new Error("Unexpected error - could not update balance of user.")}
      })
    })

    // Now set the sending user's balance (which we will subtract from)
    //usersDb

    usersDb.findOne({_id: senderId}, function(err, doc){
      if(err){throw new Error("Unexpected err. senderId should be valid.")}
      // Current balance of sending user.
      let currentSenderBalance = doc.balance
      usersDb.update({_id: senderId}, 
        {$set: {balance: currentSenderBalance - amount}}, function(err, n){
          if(err){throw new Error("Unexpected error - could not update balance of user.")}
        }
      )
    })
  }
}

// // Add to db example
// addPaymentToDb("DhxvBWwvWAlp3Hqi", "DTpay85J6fGKEpCf", 5, true)

/**
 * Request Money From Another User
 * Input: {fromUsername, sessionId, amount}
 *                                       ^ negative number
 * Output: {success, transactionId}
 * 
 * Note: The sender is sending debt to the recieving user, so the
 * sender's balance will go up when approved and the
 * receiver's balance will go down.
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

    // Get the Receiver's ID by their username

    usersDb.findOne({username: requestJson.fromUsername}, function(receiverErr,receiverDoc){
      if(receiverErr){res.json({success: false, message: "Error in getting receiver info"})}
      let receiverId = receiverDoc._id

      /*
        Add transaction to database, but do NOT approve immediately.
        The sender is sending debt to the recieving user, so the recieving
        user must be able to deny the request from the sender.
      */

      addPaymentToDb(senderId, receiverId, requestJson.amount, false, function(err, doc){
        if(err){res.json({success: false, message: "Error in adding the payment to the database"})}
        res.json({success: true, transactionId: doc._id})
      })
    })
  })
})

/**
 * AARON
 * 
 * Accept or deny a payment request
 * from another user
 * Input: {sessionId, paymentId, accept (true/false)}
 * Output: {success, message}
 */
app.post("/endpoint/accept-deny-request", function(req,res){
  let requestJson = req.body
  console.log(requestJson)

  // TODO: Josh - Add validation

  /*
  If request is accepted (requestJson.accept == true), 
  deduct the balance form the current user and give the
  requesting user the money. 
  
  Otherwise, if denied, delete the request.

  */

  paymentsDb.findOne({_id: requestJson.paymentId}, function(err, paymentDoc){
    if(err || paymentDoc == null){
      res.json({success: false, message: "Error finding user"})
      return res.end()
    }

    let senderAmountToAdd = paymentDoc.amount * -1
    let receiverAmountToAdd = paymentDoc.amount

    usersDb.findOne({_id: paymentDoc.senderId}, function(err, senderDoc){
      if(err || senderDoc == null){
        res.json({success: false, message: "Error finding user"})
        return res.end()
      }

      usersDb.update({_id: paymentDoc.senderId}, 
        {$set: {balance: senderDoc.balance + senderAmountToAdd}})

      console.log(senderDoc.username)
    })
  })



})

/**
 * JOSH
 * 
 * Lists all of the requests for a
 * user with their session ID
 * Input: {sessionId}
 * Output: {success, message, requests[Array of transactions]}
 */
app.post("/endpoint/list-requests-for-user", function(req,res){
  let requestJson = req.body
  console.log(requestJson)
  
  // Find the user we want to see request for
  usersDb.findOne({sessionId: requestJson.sessionId}, function(err, user){
    if(err || user == null){
      res.json({success: false, message: "Error finding user"})
      return res.end()
    }
    console.log("Found user")

    let userId = user._id
    // We look for payment requests where userId == receiverId that are not approved.
    // (Payment requests have negative balance with the debt recieving
    // user in the receiverId field)

    paymentsDb.find({receiverId: userId, approved: false}, function(err,userRequestDocs){
      if(err){
        res.json({success: false, message: err})
        return res.end()
      }

      console.log("Found request " )


      /*
        We want to return
        - requestor username
        - amount they want
        - time of request
        for each of the requests.

      */

      // Get all users so we can map
      usersDb.find({}, function(err, usersList){

        if(err){
          res.json({success: false, message: "Error getting user list"})
          return res.end()
        }

        // Map user request docs
        let requests = userRequestDocs.map(function(paymentObj){
          return {
            sender: usersList.find(function(obj){return obj._id == paymentObj.senderId}).username,
            receiver: usersList.find(function(obj){return obj._id == paymentObj.receiverId}).username,
            amount: paymentObj.amount,
            approved: paymentObj.approved,
            time: new Date(paymentObj.time),
            paymentId: paymentObj._id
          }
        })

        res.json({
          success: true,
          message: "Success!",
          requests: requests,
        })
        res.end()
      })
    })
  })
})

/**
 * Gets the username and balance of the user
 * Input: {sessionId}
 * Output: {username, balance}
 */
app.post("/endpoint/get-user-info", function(req,res){

  let requestJson = req.body
  console.log(requestJson)

  // Validate that it is correct
  
  if(validation.getUserInfo.validate(requestJson).error){
    res.json({
      success: false,
      message: validation.getUserInfo.validate(requestJson).error.message
    })
    return
  }
  usersDb.findOne({sessionId: requestJson.sessionId}, function(err,doc){
    if(err){res.json({success: false, message: err.message});return;}
    // We return true because it successfully ensured the session Id does not exist anymore
    if(doc == null){res.json({success: true, message: `SessionId ${requestJson.sesionId} is already not active`});return;}
    res.json({username: doc.username, balance: doc.balance})
    res.end()
  })
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
        // name: requestJson.name,
        username: requestJson.username,
        password: requestJson.password,
        balance: 0,
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

// Give all users a balance of 50.
// usersDb.update({}, {$set: {balance: 50}}, {multi: true}, function(err, n){
//   console.log(`${n} users' balances were updated to 50 (USD)`)
//   if(err){
//     throw new Error(err.message)
//   }
// })

// Our client functions
app.use(express.static('static'))


//Helper function to generate SessionID:
function generateSessionId() {
  // Generates a 9-digit random number as a string
  return Math.floor(100000000 + Math.random() * 900000000).toString(); 
}

//Log out the user by destroying their sessionId
/**
 * Log out the user by destroying their sessionId
 * Input: {sessionId}
 * Output: {success, message}
 */
app.post("/endpoint/log-out", function(req, res) {
  let requestJson = req.body;
  console.log("Log Out Request:", requestJson);
  // Find the user with the given sessionId
  usersDb.update(
    { sessionId: requestJson.sessionId },
    { $unset: { sessionId: "" } },
    {},
    function(err, numAffected) {
      if (err) {
        console.error("Error in logging out:", err);
        return res.status(500).json({ success: false, message: "Failed to log out" });
      }
      
      // We just want to ensure they are logged out
      // if (numAffected === 0) {
      //   // No user with the sessionId was found
      //   return res.json({ success: false, message: "Invalid session ID" });
      // }

      // Successfully removed the sessionId
      res.json({ success: true, message: "Logged out successfully" });
      res.end()
    }
  );
});

/**
 * Gets the last 10 transactions (where they
 * either sent or received money) of the
 * user identified by sessionId.
 * Input: { sessionId }
 * Output: { success, transactions: Array }
 */
app.post("/endpoint/get-last-10-transactions", function(req, res) {
  const requestJson = req.body;
  console.log("Request for last 10 transactions:", requestJson);

  // TODO: Add validation for get-last-10-transactions endpoint

  // // Validate the sessionId
  // if (validation.getLast10Transactions.validate(requestJson).error) {
  //   return res.json({
  //     success: false,
  //     message: validation.getLast10Transactions.validate(requestJson).error.message
  //   });
  // }

  // Find the user by sessionId to get their user ID
  usersDb.findOne({ sessionId: requestJson.sessionId }, function(err, userDoc) {
    if (err) {
      console.error("Error finding user:", err);
      return res.status(500).json({ success: false, message: "Error finding user" });
    }

    if (!userDoc) {
      return res.json({ success: false, message: "Invalid user" });
    }


    const userId = userDoc._id;

    // Find the last 10 transactions for this user as either sender or receiver
    paymentsDb.find({ $or: [{ senderId: userId }, { receiverId: userId }], approved: true })
      .sort({ time: -1 }) 
      .limit(10)          
      .exec(function(err, transactions) {
        if (err) {
          console.error("Error retrieving transactions:", err);
          return res.status(500).json(
            { success: false, message: "Error retrieving transactions" });
        }

        // Return the transactions array
        res.json({
          success: true,
          transactions: transactions.map(transaction => ({
            transactionId: transaction._id,
            amount: transaction.amount,
            time: new Date(transaction.time).toLocaleString(),
            approved: transaction.approved,
            type: transaction.senderId == userId ? "sent" : "received",
            otherUser: transaction.senderId == userId ? transaction.receiverId : transaction.senderId
          }))
        })
        res.end()
      });
  });
});
