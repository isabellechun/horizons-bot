const projectId = process.env.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id';
const languageCode = 'en-US';
import googleCal from './index'
// Instantiate a DialogFlow client
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();
const User = require('./models').User;
const Task = require('./models').Task;


// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

// The text query request.
export default function dflow(query, callback) {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode,
      },
    },
  };

  // Send request and log result
  sessionClient
    .detectIntent(request)
    .then(responses => {
      const result = responses[0].queryResult;
      //console.log(`  Query: ${result.queryText}`);
      //console.log(`  FullResponse: ${result}`);
      if (result.intent) {
        //console.log(`  Intent: ${result.intent.displayName}`);
        //parse result.queryText
        console.log('Detected intent in dialog.js');
        console.log("Text is: " + result.fulfillmentText)
        var resp = result.fulfillmentText.split(',;,');
        //resp[0] = task, resp[1] = subject, resp[2] = date-time
        console.log(resp);
        var obj = {
          intent: result.intent.displayName,
          task: resp[0],
          subject: resp[1],
          date: resp[2]
        };
        var task = new Task({
          task: resp[0],
          subject: resp[1],
          date: resp[2]
        });
        task.save(function(err, success) {
          if (err) {
            console.log('err in saving', err)
          } else {
            callback(success)
          }
        })

        //console.log("Dialog: " + obj)

        //googleCal(obj)
      } else {
        console.log(`  No intent matched.`);
      }
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}
