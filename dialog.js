const projectId = process.env.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id';
const languageCode = 'en-US';
import googleCal from './index'
// Instantiate a DialogFlow client
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();

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
        var resp = result.fulfillmentText.split(',');
        //resp[0] = task, resp[1] = subject, resp[2] = date-time
        var obj = {
          intent: result.intent.displayName,
          task: resp[0],
          subject: resp[1],
          date: resp[2]
        };
        callback(obj);
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
