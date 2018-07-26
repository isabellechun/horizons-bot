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
const fetch = require('node-fetch')

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.BOT_TOKEN;
const slackToken = process.env
const web = new WebClient(token);
const rtm = new RTMClient(token);
rtm.start()

// Listen function for message
rtm.on('message', (event) => {
  console.log(event)
  if (event.username === 'HotPotBot') { return }
  if (event.username !== 'HotPotBot') {
    User.findOne({slackId: event.user}, (err, user) => {
      if (!user) {
        fetch(`https://slack.com/api/users.info?token=${token}&user=${event.user}`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }).then(function(response) {
            return response.json();
          })
          .then(function(myJson) {
            var nameArr = myJson.user.profile.real_name.split(' ')
            var newUser = new User ({
              slackId: event.user,
              slackUsername: myJson.user.profile.display_name,
              email: myJson.user.profile.email,
              first_name: nameArr[0],
              last_name: nameArr[1]
            })
            newUser.save((err, resp) => {
              if (err) {
                console.log(err)
              } else {
                console.log('user saved: ' + resp)
                authorize(null, event);
              }
            })
          });
      } else {
        authorize(null, event);
        console.log('User exists')
      }
    })
    dialogflow(event.text, (obj) => {
      var start = new Date(obj.date)
      start = start.toUTCString();
      var end = new Date(obj.end)
      end = end.toUTCString();

      web.chat.postMessage(
        {
          "channel": event.channel,
          "text": "Is this correct?",
          "attachments": [
            {
              "text": `${obj.task} ${obj.subject} from ${start} to ${end}`, // obj.task + ' ' + obj.subject + ' from ' + obj.date + ' to ' +  obj.end,
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
        .then((res) => {
          // `res` contains information about the posted message
          // googleCal(res.message.attachments[0].callback_id, )
          console.log('Message sent: ', event.ts);
        })
        .catch(console.error);
      })
    }
  })

// Create the adapter using the app's verification token, read from environment variable
// const slackInteractions = createMessageAdapter(process.env.SLACK_VERIFICATION_TOKEN);
// const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

// Initialize an Express application ////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json())

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';
const credentials = require('./credentials.json')
const {client_secret, client_id, redirect_uris} = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[1]+redirect_uris[0]);

function authorize(callback, event) {
  console.log("authorize")

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
    */
      callback(token);
      res.send("token created! You can close this now")
    })
  })
}


function createEvent(auth, id, call){
  Event.findById(id, (err, success) => {
    if (err) {
      console.log(err)
    } else {
      console.log(success.date)
      var event = {
        'summary': success.subject,
        'start': {
          'dateTime': success.start,
        },
        'end': {
          'dateTime': success.end,
        },
        /*'recurrence': [
        'RRULE:FREQ=DAILY;COUNT=2'
          ],
      'attendees': [
      {'email': 'lpage@example.com'},
      {'email': 'sbrin@example.com'},
    ],
    'reminders': {
    'useDefault': false,
    'overrides': [
    {'method': 'email', 'minutes': 24 * 60},
    {'method': 'popup', 'minutes': 10},
  ],
}, */
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

// Post "Thanks" to channelid of request
app.post('/slack/actions', (req, res) => {
  const payload = JSON.parse(req.body.payload)
  const conversationId = payload.channel.id;

  // See: https://api.slack.com/methods/chat.postMessage
  web.chat.postMessage({ channel: conversationId, text: 'Thanks for saying hello' })
  .then((res) => {
    // `res` contains information about the posted message
    console.log('Message sent: ', res.ts);
  })
  .catch(console.error);
})

app.post('/slack/confirm', (req, res) => {
  const payload = JSON.parse(req.body.payload)
  console.log(payload.actions[0].value)
  const conversationId = payload.channel.id;
  if (payload.actions[0].value === 'true') {
    createEvent(oAuth2Client, payload.callback_id, (err) => {
      if (err) {
        web.chat.postMessage({ channel: conversationId, text: 'There was an error creating your event!' })
        .then((res) => {
          // `res` contains information about the posted message
          console.log('Message sent: ', res.ts);
        })
        .catch(console.error);
      } else {
        web.chat.postMessage({ channel: conversationId, text: 'Your event has been created!' })
        .then((res) => {
          // `res` contains information about the posted message
          console.log('Message sent: ', res.ts);
        })
        .catch(console.error);
      }

    })
    web.chat.postMessage({ channel: conversationId, text: 'Your event is being created' })
    .then((res) => {
      // `res` contains information about the posted message
      console.log('Message sent: ', res.ts);
    })
    .catch(console.error);
  } else {
    Event.findByIdAndDelete(payload.callback_id, (err, success) => {
      if (err) {
        console.log(err)
      } else {
        web.chat.postMessage({ channel: conversationId, text: 'Creation canceled!' })
        .then((res) => {
          // `res` contains information about the posted message
          console.log('Message sent: ', res.ts);
        })
        .catch(console.error);
      }
    })
  }
})

// URL_verification to test events
app.post('/slack/events', (req, res) => {
  console.log(req.body)
  res.send(req.body.challenge)
})


const port = process.env.PORT || 3005;

http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});
