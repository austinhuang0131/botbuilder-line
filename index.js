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
  this.startConversation = () => {if (options.debug) console.log("BotBuilder-Line > startConversation", arguments)};
  this.onInvoke = () => {if (options.debug) console.log("BotBuilder-Line > onInvoke", arguments)};
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
      var body = [];
      messages.map(msg => {
        if (msg.attachments && msg.attachments.map(t => t.contentType).filter((value, index, self) => {return self.indexOf(value) === index;}).length > 1) throw "BotBuilder-Line > All attachments in one message must have the same ContentType."
        else if (msg.attachments && msg.attachments.length > 1 && msg.attachments.length < 11 && msg.attachmentLayout === "carousel" && msg.attachments[0].contentType === "application/vnd.microsoft.card.hero") {
          body.push({
            type: "template",
            altText: getAltText(msg.text || msg.title + " " + msg.subtitle || "Please select an action."),
            template: {
              type: "carousel",                        
              columns: msg.attachments.map(a => {
                var m = {
                  text: a.content.text,
                  title: a.content.title || null,
                  actions: a.content.buttons.map(b => getButtonTemp(b))
                }
                if (a.images) m.thumbnailImageUrl = m.content.images[0].url;
                return m;
              })
            }
          });
        }
        else if (msg.attachments) {
          return msg.attachments.map(a => {
            switch (a.contentType.split("/")[0]) {
              case "image":
                body.push({
                  type: "image",
                  originalContentUrl: a.contentUrl,
                  previewImageUrl: a.thumbnailUrl || a.contentUrl
                });
                break;
              case "video":
                body.push({
                  type: "video",
                  originalContentUrl: a.contentUrl,
                  previewImageUrl:
                    a.thumbnailUrl ||
                    "https://cdn2.iconfinder.com/data/icons/circle-icons-1/64/video-128.png"
                  // Either you define a thumbnailUrl or I use a stock image
                });
                break;
              case "audio":
                body.push({
                  type: "audio",
                  originalContentUrl: a.contentUrl,
                  duration: getDuration(a.contentUrl)
                });
                break;
              case "application":
                switch (a.contentType.split("/")[1]) {
                  case "vnd.microsoft.keyboard":
                    if (a.content.buttons.length < 5) body.push({
                      type: "template",
                      altText: getAltText(msg.text || msg.title + " " + msg.subtitle || "Please select an action."),
                      template: {
                        type: "buttons",
                        title: msg.title || null,
                        text: msg.text || "Please select an action.",
                        actions: a.content.buttons.map(b => getButtonTemp(b))
                      }
                    })
                    else throw "BotBuilder-Line > If you have more than 4 buttons, use a carousel of hero cards instead (Up to 10 cards with 3 buttons each)."
                    break;
                  case "vnd.microsoft.card.hero":
                    if (a.content.buttons.length < 5) body.push({
                      type: "template",
                      altText: getAltText(a.content.text || a.content.title + " " + a.content.subtitle || "Please select an action."),
                      template: {
                        type: "buttons",
                        title: a.content.title || null,
                        text: a.content.text || "Please select an action.",
                        actions: a.content.buttons.map(b => getButtonTemp(b))
                      }
                    })
                    else throw "BotBuilder-Line > If you have more than 4 buttons, use a carousel of hero cards instead (Up to 10 cards with 3 buttons each)."
                    break;
                }
                break;
            }
          });
        } else {
          body.push({ type: "text", text: msg.text });
        }
      });
    line.replyMessage(
      messages[0].address.user.name,
      body
    );
  };
  this.processMessage = function(message) {
    if (message.type === "message") {
      var msg = {
          timestamp: message.timestamp,
          source: "line",
          replyToken: message.replyToken,
          entities: [],
          address: {
              bot: { name: "placeholder", id: "placeholder" },
              user: { name: message.replyToken, id: message.source.userId },
              channelId: "directline",
              channelName: "line",
              msg: message,
              conversation: {id: message.source.groupId ? message.source.groupId : "1", isGroup: message.source.type === "group" ? true : false}
          },
      };
      if (message.message.type === "text") msg.text = message.message.text;
      this.handler([msg]);
      if (options.debug) console.log("BotBuilder-Line > Message processed", msg);
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
        result => res.json({})
      );
    }
  };
  Object.assign(line, options);
  return this;
}
module.exports = Create;
