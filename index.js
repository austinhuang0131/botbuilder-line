const builder = require('botbuilder'),
      Line = require('@line/bot-sdk'),
      channelId = "directline";

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
                user: { id: message.peer_id, name: "@id" + message.peer_id },
                bot: { id: options.group_id, name: "@club" + options.group_id},
                conversation: { id: "vk" + options.group_id }
            })
            .timestamp(message.date * 1000)
            .entities()
            .text(message.body);
        vk.handler([msg.toMessage()]);
        return vk;
    };
    vk.on("message",function (e, msg) {
        e.ok();
        vk.processMessage(msg);
    });
    Object.assign(vk, options);
    return vk;
}
module.exports = Create;
