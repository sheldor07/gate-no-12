const { Client, LocalAuth } = require("whatsapp-web.js");
const puppeteer = require("puppeteer-core");
const questions = ["Do you believe in life on other planets?",
"Would you travel back in time if given a chance?",
"Do you think dreams can predict the future?",
"Would you choose to live forever if you could?",
"Do you believe in the existence of a parallel universe?",
"Would you take a trip to Mars if it was safe and affordable?",
"Do you think every person has a soulmate?",
"Would you want to know the exact date and time of your future significant life events?",
"Do you believe that some people have supernatural abilities?",
"Would you switch lives with someone for a day if you could?"]
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
    data[userID] = [name, {"yes_no" : [], "other_interests" : ""}];
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
client.on("message", (message) => {
    try{
        var data = JSON.parse(fs.readFileSync("data.json", "utf8"));
        const userID = message.from;
        const messageBody = message.body;
        const name = message._data.notifyName;
        const validResponse = [
            "yes","y","no","n"
        ]
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
                    sendMessage(userID, "And you're all set!, tell us your flight number and we'll notify you with a match. ")

                }
                sendMessage(userID, questions[numOfQuesAsked+1])

            }else{
            }

        }else{
            addUserToData(data,userID,name );
            sendMessage(userID, "Welcome to Gate No.12, where you're one flight away from changing your life." )
            sendMessage(userID, "To match you with your future partner, co-founder, mentor or just a new friend, we'll ask you 5 questions." + " You just have to reply with Yes or No. \n Yup, it's that easy." )
            sendMessage(userID, questions[0])
        }
    }
})