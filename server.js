const { createMessageAdapter } = require('@slack/interactive-messages');
const { WebClient, RTMClient } = require('@slack/client');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.BOT_TOKEN;

const web = new WebClient(token);
const rtm = new RTMClient(token);
rtm.start()
// Listen function for message
rtm.on('message', (event) => {
  rtm.sendMessage('You said: ' + event.text, event.channel)
    .then((res) => {
      // `res` contains information about the posted message
      console.log('Message sent: ', event.ts);
    })
    .catch(console.error);
})

// Create the adapter using the app's verification token, read from environment variable
const slackInteractions = createMessageAdapter(process.env.SLACK_VERIFICATION_TOKEN);

// Initialize an Express application
app.use(bodyParser.urlencoded({ extended: false }));

// Attach the adapter to the Express application as a middleware
app.use('/slack/actions', slackInteractions.expressMiddleware());

slackInteractions.action('say_hello', (payload, respond) => {
  // `payload` is an object that describes the interaction
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} pressed a button`);
  respond('Thanks for saying hello!');
});

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

const port = process.env.PORT || 3005;

http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});
