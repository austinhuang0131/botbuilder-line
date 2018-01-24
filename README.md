# botbuilder-line
Bot Framework connector to Line, just better.

## Setup
```js
const express = require('express'),
      builder = require('botbuilder'),
	    bodyParser = require('body-parser');
var connector = new builder.ChatConnector({
    appId: process.env.appid,
    appPassword: process.env.appkey
}),
    bot = new builder.UniversalBot(connector);
    
const lineConnector = require("botbuilder-line")({
    channelSecret: "channel secret",
    channelAccessToken: "access token",
	  debug: false // Switch to true for a bunch of console spam
});
bot.connector("directline", lineConnector); // Use "directline" so we can cheat BotBuilder

var server = express();
server.use(bodyParser.json({type: "*/*"})); // Required
server.post('/api/messages', connector.listen());
server.post('/linebot', lineConnector.listen);

bot.dialog('/', function (session) {
	if (session.message.source === "line") session.endDialog("This is working.");
});
```

## What works
### Receiving events
Just the `message` event.

### Sending messages
* Image, Video, Audio as attachments
* Hero card
* Keyboard buttons

## Note
Line API has a lot of super tight limits (Such as: Max 4 buttons on a "Buttons" message, or Max 3 buttons on each card of a "carousel" message, maximum 10 cards per carousel, etc). You will need to change your code (This connector can't convert everything) according to the [documentation](https://developers.line.me/en/docs/messaging-api/reference/).
