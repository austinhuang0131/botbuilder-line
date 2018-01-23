const builder = require('botbuilder'),
      Line = require('@line/bot-sdk'),
      crypto = require('crypto'), // DO NOT require this in package.json
      channelId = "directline";

// options:
// channelAccessToken / channelSecret: why explain
// debug: bool, show a bunch of useless console logs

function Create(options) {
    options = Object.assign({channelId: channelId}, options);
    if (!options.channelAccessToken || !options.channelSecret) throw "BotBuilder-Line > Options undefined! Define them as the following: {channelAccessToken: \"token\", channelSecret: \"secret\"}";
    var line = new Line.Client(options);
    vk.send = function(messages, cb){
        Promise.all(
            messages.forEach(msg => {
                if (msg.attachments) {
                    msg.attachments.filter(attachment => {
                        return attachment.contentType.match(/^image\//) && typeof attachment.contentUrl === "string"
                    }).forEach(a => {
                        var client = http;
                        if (a.contentUrl.match(/^https:\/\//g)) client = https;
                        client.get(a.contentUrl,function(stream){
                            stream.filename = "filename.png";
                            vk.upload.messagesPhoto(stream, {peer_id: msg.address.user.id}).then(p => {
                                vk.messages.send({peer_id: msg.address.user.id, attachment: "photo"+p[0].owner_id+"_"+p[0].id});
                            }, console.error);
                        });
                    });
                }
                vk.messages.send({peer_id: msg.address.user.id, message: msg.text});
            })
        ).then(cb.bind(this, null), cb);
    };
    line.processMessage = function(message){
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
        if (message.type === "message")
        line.handler([msg.toMessage()]);
        return line;
    };
    line.listen = function(req, res) {
        const signature = createHmac('SHA256', optionschannelSecret).update(req.body).digest('base64');
        if (signature !== req.get("X-Line-Signature")) {
              return console.error("BotBuilder-Line > Request trashed due to signature mismatch! Body: "+res.body);
        }
        else {
              if (debug) console.log("BotBuilder-Line > Request received", res);
              return Promise.all(req.body.events.map(line.processMessage)).then((result) => res.json(result));
        }
    });
    Object.assign(line, options);
    return line;
}
module.exports = Create;
