var mongoose = require('mongoose');

// Remember to add your MongoDB information in one of the following ways!
if (! process.env.MONGODB_URI) {
  console.log('Error: MONGODB_URI is not set. Did you run source env.sh ?');
  process.exit(1);
}

var connect = process.env.MONGODB_URI;
mongoose.connect(connect, { useNewUrlParser: true });

var eventSchema = new mongoose.Schema({
  host: {
    type: String,
  },
  task: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  invitees: Array,
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
var User = mongoose.model('User', userSchema)

module.exports = {
  Event: Event,
  User: User
};
