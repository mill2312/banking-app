/**
 * Creates a request to the local NodeJS server.
 * @param {string} endpoint The endpoint you want to access
 * @param {JSON} json The request to the server
 * @returns {JSON} The response of the server
 */
async function makeServerRequest(endpoint, json){
    return await new Promise(function(resolve,reject){
        
        let requestSettings = {
            method: "POST",     
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'},
            body: JSON.stringify(json)
        }

        fetch(`/endpoint/${endpoint}`, requestSettings)
        .then(function(repsonse){  // Raw text data
            return repsonse.json()
        }).then(function(value){    // Converted to JSON data
            resolve(value)
        }).catch(function(reason){
            alert(`
                An error occured while making a server
                request to ${endpoint}. Reason:
                ${reason}
                `
            )
            throw new Error()
        })

    })
}