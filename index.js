const { Client, LocalAuth } = require("whatsapp-web.js");
const puppeteer = require("puppeteer-core");

const questions = ["Do you believe in life on other planets?",
"Would you travel back in time if given a chance?",
"Do you think dreams can predict the future?",
"Would you choose to live forever if you could?",
"Do you believe in the existence of a parallel universe?"]
const client = new Client({
  puppeteer: {
    args: ["--no-sandbox"],
  },
  authStrategy: new LocalAuth(),
});
client.initialize();
const fs = require("fs");
const { send } = require("process");

client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
});

client.on("ready", () => {
  console.log("Client is ready!");
});
// takes in whatsapp id and message to send
async function sendMessage(uniqueID, message) {
    try {
      const msg = await client.sendMessage(uniqueID, message);
    } catch (e) {
      console.error(e);
    }
  }
  
// check if user is in db
function checkUserExists(userId, data) {
    const keys = Object.keys(data);
    return keys.includes(userId);
  }
  // add user to db
function addUserToData(data, userID, name) {
    if (!data) {
      data = {};
    }
    const 
    data[userID] = [name, {"yes_no" : [], "other_interests" : "", "flight_no" : "", "is_chatting" : false, "matching_users":[], "bio_entered" : ""}];
    fs.writeFile("data.json", JSON.stringify(data), (err) => {
      if (err) throw err;
      console.log("Data written to file");
    });
    return "User added successfully!";
}
  
function updateUserData(data, userID, userResponse) {
    let userData = data[userID]
    userData[1]["yes_no"].push(userResponse)
    data[userID] = userData
    fs.writeFile("data.json", JSON.stringify(data), (err) => {
      if (err) throw err;
      console.log("Data written to file");
    });
    return "User Data updated successfully!";
}

function updateUserDataFlight(data, userID, userResponse) {
    let userData = data[userID]
    userData[1]["flight_no"] = userResponse
    data[userID] = userData
    fs.writeFile("data.json", JSON.stringify(data), (err) => {
      if (err) throw err;
      console.log("Data written to file");
    });
    return "User Flight Data updated successfully!";
}
function getScore(user_1_answers, user_2_answers){
  let score = 0;
  for(let i = 0; i< user_1_answers.length;i=i+1){
    score += user_1_answers[i]*user_2_answers[i]
  }
  return score/user_1_answers.length;
}

function matchingAlgo(data, available_users, newUserID){
  //TBD use sophistcated algo to figure out threshold
  const threshholdValue = 0.2
  // base case 1 person, rno change
  let keys = Object.keys(available_users);
  if(keys > 1){
    for(let uniqueID of keys){
      if(uniqueID != newUserID){
        if(getScore(available_users[uniqueID][1]["yes_no"], available_users[newUserID][1]["yes_no"]) >= threshholdValue){
          data[newUserID][1]["matching_users"].push(uniqueID)
          data[uniqueID][1]["matching_users"].push(newUserID)
          fs.writeFile("data.json", JSON.stringify(data), (err) => {
            if (err) throw err;
            console.log("Data written to file");
          });
          return "User Flight Data updated successfully!";          
        }
      }
    }

  }


}


function checkForMatch(newUserID, data, flight_no) {
  let data = JSON.parse(fs.readFileSync("data.json", "utf8"));
  let keys = Object.keys(data);
  let available_users = {}
  for (let uniqueID of keys) {
    // TBD: include people that did one conversation but didn't conitnue the match
    if(!data[uniqueID][1]["is_chatting"] && data[uniqueID][1]["flight_no"] === flight_no) {
      available_users[uniqueID] = data[uniqueID]
    }
  }
  matchingAlgo(data, available_users, newUserID )
  // TBD: handle multiple matches (sorry players)
  // TBD refresh function
  var data = JSON.parse(fs.readFileSync("data.json", "utf8"));

  if(data[newUserID][1]["matching_users"][0]){
    // TBD: handling two side consent
    const matchedUserID = data[newUserID][1]["matching_users"][0]
    sendMessage(newUserID, "We've got a match! Our intelligent agents are sending your match's bio to you now. Stay tuned!")
    sendMessage(newUserID,data[data[newUserID][1]["matching_users"][0]][1]["bio_entered"] )
    
    sendMessage(matchedUserID, "We've got a match! Our intelligent agents are sending your match's bio to you now. Stay tuned!")
    sendMessage(matchedUserID,data[newUserID][1]["bio_entered"] )
    sendMessage(newUserID, "If you'd like to chat with this person, send a message to this very number and we'll connect you both!")
    
  }

}

function updateUserDataBio(data, userID, messageBody) {
  let userData = data[userID]
  userData[1]["bio_entered"] = messageBody
  data[userID] = userData
  fs.writeFile("data.json", JSON.stringify(data), (err) => {
    if (err) throw err;
    console.log("Data written to file");
  });
  return "User Flight Data updated successfully!";  
}

function updateUserChattingStatus(data, userID) {
  let userData = data[userID]
  userData[1]["is_chatting"] = true
  data[userID] = userData
  fs.writeFile("data.json", JSON.stringify(data), (err) => {
    if (err) throw err;
    console.log("Data written to file");
  });
  return "User Flight Data updated successfully!";    
}

client.on("message", (message) => {
    try{
        var data = JSON.parse(fs.readFileSync("data.json", "utf8"));
        const userID = message.from;
        const messageBody = message.body;
        const name = message._data.notifyName;
        if(checkUserExists(userID,data)){
            const numOfQuesAsked = data[userID][1]["yes_no"].length
            if(numOfQuesAsked != questions.length){
                if(messageBody.toLowerCase() == "yes" || messageBody.toLowerCase() == "y"){
                    updateUserData(data,userID,1);
                }else if(messageBody.toLowerCase() == "no" || messageBody.toLowerCase() == "n"){
                    updateUserData(data,userID,0);

                }else{
                    sendMessage(userID, "Please enter yes or no only. ")
                    break;
                }
                if(numOfQuesAsked === questions.length -1){
                    // TBD : repeat user
                    // sendMessage(userID, "And you're all set! Now just enter your flight number to find your matches")
                    sendMessage(userID, "And you're all set! Please tell us 1 line about yourself (this will be shown to a prospective match before they accept)")
                } else {
                    sendMessage(userID, questions[numOfQuesAsked+1])
                }

            } else if(data[userID][1]["bio_entered"] == "") {

              updateUserDataBio(data, userID, messageBody)
              sendMessage(userID, "Awesome! Now just enter your flight number to find your matches")

            } else if(data[userID][1]["flight_no"] == ""){
                // TBD : flight number validation
                updateUserDataFlight(data, userID, messageBody.toLowerCase())
                sendMessage(userID, "Great! We'll send you a message when we find you a match!")
                checkForMatch(data,messageBody)
            }  else if(!data[userID][1]["is_chatting"] && data[userID][1]["matching_users"].length > 0) {
                updateUserChattingStatus(data, userID)
                updateUserChattingStatus(data, data[userID][1]["matching_users"][0])
                sendMessage(data[uniqueID][1]["matching_users"][0], messageBody)
            } else if(data[userID][1]["is_chatting"] && data[userID][1]["matching_users"].length > 0) {
              sendMessage(data[uniqueID][1]["matching_users"][0], messageBody)
            }

        }else{
            addUserToData(data,userID,name );
            sendMessage(userID, "Welcome to Gate No.12, where we help you match you with your future partner, co-founder, mentor or just a new friend who's on your flight! To do this, we'll ask you 5 questions. You just have to reply with Yes or No. \n Yup, it's that easy. Your first questions is on its way." )
            sendMessage(userID, questions[0])
        }
    }

    catch(err){
      console.log(err)
    }
})