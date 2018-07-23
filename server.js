const { createMessageAdapter } = require('@slack/interactive-messages');
const { WebClient, RTMClient } = require('@slack/client');
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
import dialogflow from './dialog'

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.BOT_TOKEN;

const web = new WebClient(token);
const rtm = new RTMClient(token);
rtm.start()
// Listen function for message
rtm.on('message', (event) => {
  dialogflow(event.text)
  rtm.sendMessage('You said: ' + event.text, event.channel)
    .then((res) => {
      // `res` contains information about the posted message
      console.log('Message sent: ', event.ts);
    })
    .catch(console.error);
})

// Create the adapter using the app's verification token, read from environment variable
// const slackInteractions = createMessageAdapter(process.env.SLACK_VERIFICATION_TOKEN);
// const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

// Initialize an Express application
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json())

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

// URL_verification to test events
app.post('/slack/events', (req, res) => {
  console.log(req.body)
  res.send(req.body.challenge)
})


const port = process.env.PORT || 3005;

http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});
