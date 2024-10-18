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


//**********************
// Cookie Functions
//**********************
// "sessionId=aoisdfhuwia"
// setCookie("sessionId", returned.sessionId)
// new Date(Date.now() + 60*60*1000)
// sessionId="oaiejgoiwjaf";

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  
function getCookie(cname) {
let name = cname + "=";
let ca = document.cookie.split(';');
for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
    c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
    return c.substring(name.length, c.length);
    }
}
return "";
}
  
  function checkCookie() {
    let user = getCookie("username");
    if (user != "") {
      alert("Welcome again " + user);
    } else {
      user = prompt("Please enter your name:", "");
      if (user != "" && user != null) {
        setCookie("username", user, 365);
      }
    }
  }