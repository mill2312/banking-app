/*
    This file validates JSON requests sent from the
    client to the server. For example, this allows to
    check that required inputs like username, password,
    and name are included in a new user account request.

    We store these validation objects (created by 
    the Joi.object() function) here and call on them
    in our server code to validate the request JSON
    before going forward in the code.
    
    It's imported in server.js like this:

        const validation = require("./validation-library")

    And we test inputs like this, for example:

        if(validation.signIn.validate(requestJson).error){
            // Respond to client with error
            return
        }
*/

const Joi = require("joi")

module.exports = {

    createNewUser: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().required(),
        name: Joi.string().max(100).required()
    }),

    pay: Joi.object({
        toUsername: Joi.string().required(),
        sessionId: Joi.number().required(),
        amount: Joi.number().required().multiple(0.01).greater(0)
    }),

    request: Joi.object({
        fromUsername: Joi.string().required(),
        sessionId: Joi.number().required(),
        amount: Joi.number().required().multiple(0.01).less(0)
    }),

    getUserInfo: Joi.object({
        sessionId: Joi.string().required()
    }),

    signIn: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    })
}