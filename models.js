var mongoose = require('mongoose');

// Remember to add your MongoDB information in one of the following ways!
if (! process.env.MONGODB_URI) {
  console.log('Error: MONGODB_URI is not set. Did you run source env.sh ?');
  process.exit(1);
}

var connect = process.env.MONGODB_URI;
mongoose.connect(connect, { useNewUrlParser: true });

var reminderSchema = new mongoose.Schema({
  intent: {
    type: String,
  },
  task: {
    type: String,
    required: true
  },
  day: {
    type: String,
    required: true
  }
})

var eventSchema = new mongoose.Schema({
  host: {
    type: String,
  },
  intent: {
    type: String,
  },
  subject: {
    type: String,
    required: true
  },
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  invitees: {
    type: Array,
  },
  eventId: String,
  requestId: String
});

var userSchema = new mongoose.Schema({
  token: {
    type: Object
  },
  slackId: {
    type: String
  },
  slackUsername: {
    type: String
  },
  slackEmail: {
    type: String
  },
  slackChannel: {
    type: String
  }
})

var Event = mongoose.model('Event', eventSchema);
var User = mongoose.model('User', userSchema);
var Reminder = mongoose.model('Reminder', reminderSchema)

module.exports = {
  Event: Event,
  User: User,
  Reminder: Reminder
};
