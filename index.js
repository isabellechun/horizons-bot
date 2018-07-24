const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const User = require('./models').User;
const Event = require('./models').Event;
const app = require('express')
// const opn = require('opn');
const router = app.Router()
//const opm = require('opm')
export default function googleCal (id, call) {
  console.log("ID: " + id)
  // If modifying these scopes, delete credentials.json.
  const SCOPES = ['https://www.googleapis.com/auth/calendar'];
  const TOKEN_PATH = 'token.json';

  // var client_id = "451652454399-qv2nhnkllt4mfqnt8m14r2b9bpp2hbko.apps.googleusercontent.com"
  // var client_secret="UwmVcm9dYQE1AyBg2Nx3lzQM"
  // var redirect_uris= ["urn:ietf:wg:oauth:2.0:oob","http://localhost"]
  // authorize({client_id,client_secret,redirect_uris},createEvent)
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), createEvent);
  });
  /**
  * Create an OAuth2 client with the given credentials, and then execute the
  * given callback function.
  * @param {Object} credentials The authorization client credentials.
  * @param {function} callback The callback to call with the authorized client.
  */
  function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }
    /**
    * Get and store new token after prompting for user authorization, and then
    * execute the given callback with the authorized OAuth2 client.
    * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
    * @param {getEventsCallback} callback The callback for the authorized client.
    */
    function getAccessToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      /*
      opn(authUrl);
      router.get("/oauthcallback") */

      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return callback(err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) console.error(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });

    };

    function createEvent(auth){
      Event.findById(id, (err, success) => {
        if (err) {
          console.log(err)
        } else {
          console.log(success.date)
          var event = {
            'summary': success.subject,
            'start': {
              'dateTime': success.date,
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
  }
