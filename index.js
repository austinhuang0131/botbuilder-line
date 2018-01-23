const builder = require("botbuilder"),
  Line = require("@line/bot-sdk"),
  http = require("http"),
  https = require("https"),
  crypto = require("crypto"), // DO NOT require this in package.json
  mm = require("musicmetadata"),
  channelId = "directline";
var getDuration = url => {
  var client = http;
  if (a.contentUrl.startsWith("https")) client = https;
  client.get(url, stream => {
    stream.filename =
      "file." + a.contentUrl.split(".")[a.contentUrl.split(".").length - 1];
    mm(stream, { duration: true }, (err, data) => {
      return data.duration * 1000;
    });
  });
};

// options:
// channelAccessToken / channelSecret: why explain
// debug: bool, show a bunch of useless console logs

function Create(options) {
  options = Object.assign({ channelId: channelId }, options);
  if (!options.channelAccessToken || !options.channelSecret)
    throw 'BotBuilder-Line > Options undefined! Define them as the following: {channelAccessToken: "token", channelSecret: "secret"}';
  var line = new Line.Client(options);
  this.send = function(messages, cb) {
    if (messages.length > 5)
      Promise.reject(
        "BotBuilder-Line > No more than 5 messages to 1 reply token! Messages: " +
          JSON.stringify(messages)
      );
    if (options.debug)
      console.log(
        "BotBuilder-Line > Sending messages... " + JSON.stringify(messages)
      );
    line.replyMessage(
      msg.user.id,
      messages.map(msg => {
        if (msg.attachments) {
          return msg.attachments.map(a => {
            switch (a.contentType.split("/")[0]) {
              case "image":
                return {
                  type: "image",
                  originalContentUrl: a.contentUrl,
                  previewImageUrl: a.thumbnailUrl || a.contentUrl
                };
                break;
              case "video":
                return {
                  type: "video",
                  originalContentUrl: a.contentUrl,
                  previewImageUrl:
                    a.thumbnailUrl ||
                    "https://cdn2.iconfinder.com/data/icons/circle-icons-1/64/video-128.png"
                  // Either you define a thumbnailUrl or I use a stock image
                };
                break;
              case "audio":
                return {
                  type: "audio",
                  originalContentUrl: a.contentUrl,
                  duration: getDuration(a.contentUrl)
                };
                break;
              case "application":
                switch (a.contentType.split("/")[1]) {
                  case "vnd.microsoft.keyboard":
                    break;
                }
                break;
            }
          });
        } else {
          return { type: "text", text: msg.text };
        }
      })
    );
  };
  this.processMessage = function(message) {
    var msg = new builder.Message()
      .address({
        channelId: options.channelId,
        channelName: "line",
        msg: message,
        user: { id: message.replyToken, name: message.source.userId },
        bot: { id: "placeholder", name: "placeholder" },
        conversation: { id: message.source.userId }
      })
      .timestamp(message.date * 1000)
      .entities();
    if (message.type === "message") line.handler([msg.toMessage()]);
    return this;
  };
  this.listen = function(req, res) {
    const signature = createHmac("SHA256", optionschannelSecret)
      .update(req.body)
      .digest("base64");
    if (signature !== req.get("X-Line-Signature")) {
      return console.error(
        "BotBuilder-Line > Request trashed due to signature mismatch. Body: " +
          res.body
      );
    } else {
      if (options.debug) console.log("BotBuilder-Line > Request received", res);
      return Promise.all(req.body.events.map(line.processMessage)).then(
        result => res.json(result)
      );
    }
  };
  Object.assign(line, options);
  return this;
}
module.exports = Create;
