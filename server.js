const { createMessageAdapter } = require('@slack/interactive-messages');
const { WebClient, RTMClient } = require('@slack/client');
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
import dialogflow from './dialog'
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const opn = require('opn');
const User = require('./models').User;
const Event = require('./models').Event;
const Reminder = require('./models').Reminder;

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.BOT_TOKEN;

const web = new WebClient(token);
const rtm = new RTMClient(token);
rtm.start()

// Listen function for message
rtm.on('message', (event) => {
  if (event.username === 'HotPotBot') { return }  //message is sent from app to client
  if (event.username !== 'HotPotBot') {  //message is sent from client to app
    console.log("THIS IS THE EVENT !!!!!!!!", event)
    User.findOne({slackId: event.user}, (err, user) => {
      console.log("the user being found is:",user)
      if (!user) {  // sender of message is not in database
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
          state: event.user //slackId when a user sends a message
        });
        web.chat.postMessage({"channel": event.channel, "text": `Authorize HotPotBot to access your Google Calendar here: \n ${authUrl}`})
      } else {  //sender of message already exists in database- check if their token is valid or expired
        oAuth2Client.setCredentials(user.token)
        console.log('User exists')
      }
    })
  }

  dialogflow(event.text, (obj) => {
    console.log('DIALOGFLOW FUNCTION start')
    console.log(obj)
    if (obj.intent === 'Event') { // user wants to schedule an event with a start and end time
      var start = new Date(obj.start)
      start.setHours(start.getHours() - 7);
      var end = new Date(obj.end)
      end.setHours(end.getHours() - 7);
      web.chat.postMessage(
        {
          "channel": event.channel,
          "text": "Is this correct?",
          "attachments": [
            {
              "text": `${obj.intent}: ${obj.subject} from ${start.toUTCString()} to ${end.toUTCString()}`, // obj.task + ' ' + obj.subject + ' from ' + obj.date + ' to ' +  obj.end,
              "fallback": "You are unable to choose a game",
              "callback_id": obj._id,
              "color": "#3AA3E3",
              "attachment_type": "default",
              "actions": [
                {
                  "name": "yes",
                  "text": "Yes",
                  "style": "primary",
                  "type": "button",
                  "value": "true"
                },
                {
                  "name": "no",
                  "text": "No",
                  "style": "danger",
                  "type": "button",
                  "value": "false",
                }
              ]
            }
          ]
        })
        .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
        .catch(console.error);
      } else {  // user wants to schedule a reminder on obj.day
        web.chat.postMessage(
          {
            "channel": event.channel,
            "text": "Is this correct?",
            "attachments": [
              {
                "text": `${obj.intent}: ${obj.task} on ${obj.day}`, // obj.task + ' ' + obj.subject + ' from ' + obj.date + ' to ' +  obj.end,
                "fallback": "You are unable to choose a game",
                "callback_id": obj._id,
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                  {
                    "name": "yes",
                    "text": "Yes",
                    "style": "primary",
                    "type": "button",
                    "value": "true"
                  },
                  {
                    "name": "no",
                    "text": "No",
                    "style": "danger",
                    "type": "button",
                    "value": "false",
                  }
                ]
              }
            ]
        })
        .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
        .catch(console.error);
      }
  })
})

  // Create the adapter using the app's verification token, read from environment variable
  // const slackInteractions = createMessageAdapter(process.env.SLACK_VERIFICATION_TOKEN);
  // const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

  // Initialize an Express application ////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.json())

  const SCOPES = ['https://www.googleapis.com/auth/calendar'];
  const TOKEN_PATH = 'token.json';
  const credentials = require('./credentials.json')
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[1]+redirect_uris[0]);

    /*
    function authorize(callback, event) {
      // Check if we have previously stored a token.
      User.findOne({slackId: event.user}, (err, user) => {
        console.log(user)
        if (!user.token) {
          getAccessToken(oAuth2Client, (token) => {
            var update = { token: token }
            User.findOneAndUpdate({slackId: event.user}, update, (err, user) => {
              console.log(user)
              if (err) {
                console.log('Find Error line 125: ' + err)
              }
            })
          });
        } else {
          oAuth2Client.setCredentials(user.token);
        }
        // fs.readFile(TOKEN_PATH, (err, token) => {
        //   if (err) return getAccessToken(oAuth2Client, callback);
        //   oAuth2Client.setCredentials(JSON.parse(token));
        //callback(oAuth2Client);
        // });
      })
    }

    function getAccessToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      opn(authUrl);
      app.get("/auth", function(req,res){
        var code = req.query.code
        console.log("this is the code!: ", code)
        oAuth2Client.getToken(code, (err, token) => {
          console.log('this is the token: ' + token)
          if (err) console.log("theres an error with getting the token: " + err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          /*
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        //callback(oAuth2Client);
      });
      callback(token);
      res.send("token created! You can close this now")
        })
      })
    */

    function createEvent(auth, id, call){
      Event.findById(id, (err, success) => {
        if (err) {
          console.log(err)
        } else {
          console.log(success.start)
          var event = {
            'summary': success.subject,
            'start': {
              'dateTime': success.start,
            },
            'end': {
              'dateTime': success.end,
            },
            // 'recurrence': [
            //   'RRULE:FREQ=DAILY;COUNT=2'
            // ],
            // 'attendees': [
            //   {'email': 'lpage@example.com'},
            //   {'email': 'sbrin@example.com'},
            // ],
            // 'reminders': {
            //   'useDefault': false,
            //   'overrides': [
            //     {'method': 'email', 'minutes': 24 * 60},
            //     {'method': 'popup', 'minutes': 10},
            //   ],
            // },
          };
          const calendar = google.calendar({version: 'v3', auth});

          calendar.events.insert({
            auth: auth,
            calendarId: 'primary',
            resource: event,
          }, function(err) {
            call(err)
          });
        }
      })
    }

    function createReminder(auth, id, call){
      Reminder.findById(id, (err, success) => {
        if (err) {
          console.log(err)
        } else {
          console.log(success.day)
          var reminder = {
            'summary': success.task,
            'start': {
              'date': success.day,
            },
            'end': {
              'date': success.day,
            },
            // 'recurrence': [
            //   'RRULE:FREQ=DAILY;COUNT=2'
            // ],
            // 'attendees': [
            //   {'email': 'lpage@example.com'},
            //   {'email': 'sbrin@example.com'},
            // ],
            // 'reminders': {
            //   'useDefault': false,
            //   'overrides': [
            //     {'method': 'email', 'minutes': 24 * 60},
            //     {'method': 'popup', 'minutes': 10},
            //   ],
            // },
          };
          const calendar = google.calendar({version: 'v3', auth});

          calendar.events.insert({
            auth: auth,
            calendarId: 'primary',
            resource: reminder,
          }, function(err) {
            call(err)
          });
        }
      })
    }

// Post "Thanks" to channelid of request
app.post('/slack/actions', (req, res) => {
  const payload = JSON.parse(req.body.payload)
  const conversationId = payload.channel.id;

  // See: https://api.slack.com/methods/chat.postMessage
  web.chat.postMessage({ channel: conversationId, text: 'Thanks for saying hello' })
  .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
  .catch(console.error);
})

app.post('/slack/confirm', (req, res) => {
  const payload = JSON.parse(req.body.payload)
  var messText = payload.original_message.attachments[0].text
  var messArr = messText.split(':')
  var intent = messArr[0]
  const conversationId = payload.channel.id;
  if (intent === 'Event') {
    if (payload.actions[0].value === 'true') {
      createEvent(oAuth2Client, payload.callback_id, (err) => {
        if (err) {
          console.log('this is the error !!1!', err)
          web.chat.postMessage({ channel: conversationId, text: 'There was an error creating your event!' })
          .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
          .catch(console.error);
        } else {
          web.chat.postMessage({ channel: conversationId, text: 'Your event has been created!' })
          .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
          .catch(console.error);
        }

      })
      web.chat.postMessage({ channel: conversationId, text: 'Your event is being created' })
      .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
      .catch(console.error);
    } else {
      Event.findByIdAndDelete(payload.callback_id, (err, success) => {
        if (err) {
          console.log(err)
        } else {
          web.chat.postMessage({ channel: conversationId, text: 'Creation canceled!' })
          .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
          .catch(console.error);
        }
      })
    }
  } else {
    if (payload.actions[0].value === 'true') {
      createReminder(oAuth2Client, payload.callback_id, (err) => {
        if (err) {
          console.log('this is the error !!1!', err)
          web.chat.postMessage({ channel: conversationId, text: 'There was an error creating your event!' })
          .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
          .catch(console.error);
        } else {
          web.chat.postMessage({ channel: conversationId, text: 'Your event has been created!' })
          .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
          .catch(console.error);
        }

      })
      web.chat.postMessage({ channel: conversationId, text: 'Your event is being created' })
      .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
      .catch(console.error);
    } else {
      Reminder.findByIdAndDelete(payload.callback_id, (err, success) => {
        if (err) {
          console.log(err)
        } else {
          web.chat.postMessage({ channel: conversationId, text: 'Creation canceled!' })
          .then((res) => { console.log('Message sent: ', res); })// res contains information about the posted message
          .catch(console.error);
        }
      })
    }
  }

})

// URL_verification to test events
app.post('/slack/events', (req, res) => {
  console.log(req.body)
  res.send(req.body.challenge)
})

app.get("/auth", function(req,res) {
  var id = req.query.state;
  var code = req.query.code
  //console.log("this is the code!: ", code)

  oAuth2Client.getToken(code, (err, token) => {
    console.log('this is the token: ' + token)
    if (err) console.log("theres an error with getting the token: " + err);
    oAuth2Client.setCredentials(token);
    // In user in DB, store the token to disk for later program executions
    //console.log("Event user is !!!!!!!!!!!!!!!1 :", event.user)
    //console.log("Event is !!!!!!!!!!!!!!!1 :", event)
    var newUser = new User ({
      slackId: id,
      token: token
    })
    newUser.save((err, resp) => {
      if (err) console.log(err)
      else console.log('USER SAVED: ' + resp)
      })
    });
  res.send("token created! You can close this now")
  })

const port = process.env.PORT || 3005;

http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});
