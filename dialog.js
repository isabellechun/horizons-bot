const projectId = process.env.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id';
const languageCode = 'en-US';
import googleCal from './index'
// Instantiate a DialogFlow client
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();
const User = require('./models').User;
const Event = require('./models').Event;
const Reminder = require('./models').Reminder;


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
      //console.log(`  Query: ${result.queryText}  FullResponse: ${result}`);
      console.log(result.intent)
      if (result.intent) {
        var resp = result.fulfillmentText.split(',;,');
        //resp[0] = Event, resp[1] = subject, resp[2] = date-time

        if (result.intent.displayName === 'event') {
          console.log('responses[0].queryResult.parameters.fields.attendees.listValue.values ---------------', responses[0].queryResult.parameters.fields.attendees.listValue.values)
          var start = new Date(resp[2])
          start.setHours(start.getHours() + start.getTimezoneOffset()/60)
          var end = new Date(resp[2])
          end.setHours(end.getHours() + end.getTimezoneOffset()/60 + 1)
          start = start.toISOString()
          end = end.toISOString()
          // console.log('Start time: ' + start + ' \nEnd time: ' + end);
          var event;
          if (resp[3]) {
            var attendeeArr = responses[0].queryResult.parameters.fields.attendees.listValue.values.slice()
            var attendees = attendeeArr.map((nameObj) => (nameObj.stringValue))
            console.log('attendees array final', attendees)

            var event = new Event({
              intent: resp[0],
              subject: resp[1],
              start: start,
              end: end,
              invitees: attendees // can't use resp[3] bc it's in format "name1, name2, and name3"
            });
          } else {
            var event = new Event({
              intent: resp[0],
              subject: resp[1],
              start: start,
              end: end
            });
          }
          event.save(function(err, success) {
            if (err) {
              console.log('err in saving', err)
            } else {
              console.log('good')
              callback(success)
            }
          })
        } else if (result.intent.displayName === 'reminder') {
          console.log('reminder')
          var reminder = new Reminder({
            intent: resp[0],
            task: resp[1],
            day: resp[2]
          })
          reminder.save(function(err, success) {
            if (err) {
              console.log('err in saving', err)
            } else {
              console.log('good')
              callback(success)
            }
          })
        }
      } else {
        console.log(`  No intent matched.`);
      }
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}
