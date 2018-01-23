const builder = require("botbuilder"),
  Line = require("@line/bot-sdk"),
  http = require("http"),
  https = require("https"),
  crypto = require("crypto"), // DO NOT require this in package.json
  bodyParser = require("body-parser"),
  mm = require("musicmetadata"),
  channelId = "directline";
var getDuration = (url) => {
  var client = http;
  if (a.contentUrl.startsWith("https")) client = https;
  client.get(url, stream => {
    stream.filename =
      "file." + a.contentUrl.split(".")[a.contentUrl.split(".").length - 1];
    mm(stream, { duration: true }, (err, data) => {
      return data.duration * 1000;
    });
  });
},
getButtonTemp = function (b) {
  if (b.type === 'postBack') {
      return {
          "type": "postback",
          "label": b.title,
          "data": b.value,
      };
  }
  else if (b.type === 'openUrl') {
      return {
          "type": "uri",
          "label": b.title ? b.title : "open url",
          "uri": b.value
      };
  }
  else if (b.type === 'datatimepicker') {
      // console.log("datatimepicker")
      return {
          "type": "datetimepicker",
          "label": b.title,
          "data": "storeId=12345",
          "mode": "datetime",
          "initial": new Date(new Date().getTime() - (1000 * 60 * new Date().getTimezoneOffset())).toISOString().substring(0, new Date().toISOString().length - 8),
          "max": new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 30 * 12)).toISOString().substring(0, new Date().toISOString().length - 8),
          "min": new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 30 * 12)).toISOString().substring(0, new Date().toISOString().length - 8),
      };
  }
  else {
      return {
          "type": "message",
          "label": b.title,
          "text": b.value
      };
  }
},
getAltText = (s) => {return s.substring(0, 400);};

// options:
// channelAccessToken / channelSecret: why explain
// debug: bool, show a bunch of useless console logs

function Create(options) {
  options = Object.assign({ channelId: channelId }, options);
  if (!options.channelAccessToken || !options.channelSecret)
    throw 'BotBuilder-Line > Options undefined! Define them as the following: {channelAccessToken: "token", channelSecret: "secret"}';
  var line = new Line.Client(options);
  this.onEvent = (handler) => this.handler = handler;
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
      messages[0].address.user.name,
      messages.map(msg => {
        if (msg.attachments && msg.attachments.filter((value, index, self) => {return self.indexOf(value) === index;}).length > 1) throw "BotBuilder-Line > All attachments in one message must have the same ContentType."
        else if (msg.attachments && msg.attachments.length > 1 && msg.attachments.length < 11 && msg.attachmentLayout === "carousel" && msg.attachments[0].contentType === "application/vnd.microsoft.card.hero") {
          return {
            type: "template",
            altText: getAltText(msg.text || msg.title + " " + msg.subtitle || "Please select an action."),
            template: {
              type: "carousel",                        
              columns: msg.attachments.map(a => {
                return {
                  thumbnailImageUrl: a.images[0].url,
                  text: a.text,
                  title: a.title || null,
                  actions: a.buttons.map(b => getButtonTemp(b))
                }
              })
            }
          }
        }
        else if (msg.attachmentLayout === "list") {
          throw "BotBuilder-Line > We only support carousel layout.";
        }
        else if (msg.attachments) {
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
                    if (a.content.buttons.length < 5) return {
                      type: "template",
                      altText: getAltText(msg.text || msg.title + " " + msg.subtitle || "Please select an action."),
                      template: {
                        type: "buttons",
                        title: msg.title || null,
                        text: msg.text || "Please select an action.",
                        actions: a.content.buttons.map(b => getButtonTemp(b))
                      }
                    }
                    else throw "BotBuilder-Line > If you have more than 4 buttons, use a carousel of hero cards instead (Up to 10 cards with 3 buttons each)."
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
    if (options.debug) console.log("BotBuilder-Line > processMessage", msg);
    if (message.type === "message") {
      var msg = {
          timestamp: message.timestamp,
          source: "line",
          replyToken: message.replyToken,
          address: {
              conversation: { id: message.source.userId },
              bot: { name: "placeholder", id: "placeholder" },
              user: { name: message.replyToken, id: message.source.userId },
              channelId: "line"
          }
      };
      if (message.message.type === "text") msg.text === message.message.text;
      this.handler([msg]);
    }
    return this;
  };
  this.listen = function(req, res) {
    const signature = crypto.createHmac("SHA256", options.channelSecret)
      .update(JSON.stringify(req.body))
      .digest("base64");
    if (options.debug) console.log("BotBuilder-Line > Messages received", req.body);
    if (signature !== req.get("X-Line-Signature")) {
      return console.error(
        "BotBuilder-Line > Request trashed due to signature mismatch. Body: ", req.body
      );
    } else {
      return Promise.all(req.body.events.map(this.processMessage)).then(
        result => res.json(result)
      );
    }
  };
  Object.assign(line, options);
  return this;
}
module.exports = Create;
