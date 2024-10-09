/*
    This file validates JSON requests sent from the
    client to the server. For example, this allows to
    check that required inputs like username, password,
    and name are included in a new user account request.
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
    })
}