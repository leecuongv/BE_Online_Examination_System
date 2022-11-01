var admin = require("firebase-admin");

var serviceAccount = require("./be-oes.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://be-oes-default-rtdb.firebaseio.com"
});
const messaging = admin.messaging();

const sendNotificationToClient = (tokens, data) => {
    // Send a message to the devices corresponding to the provided
    // registration tokens.
    messaging
      .sendMulticast({ tokens, data })
      .then(response => {
        // Response is an object of the form { responses: [] }
        const successes = response.responses.filter(r => r.success === true)
          .length;
        const failures = response.responses.filter(r => r.success === false)
          .length;
        console.log(
          'Notifications sent:',
          `${successes} successful, ${failures} failed`
        );
      })
      .catch(error => {
        console.log('Error sending message:', error);
      });
  };

const addMessage = async (req, res) => {
    const { name, message } = req.body;
    const columns = 'name, message';
    const values = `'${name}', '${message}'`;
    try {
      const data = await messagesModel.insertWithReturn(columns, values);
      const tokens = [];
      const notificationData = {
        title: 'New message',
        body: message,
      };
      sendNotificationToClient(tokens, notificationData);
      res.status(200).json({ messages: data.rows });
    } catch (err) {
      res.status(200).json({ messages: err.stack });
    }
  };
module.exports = {addMessage,messaging,sendNotificationToClient}