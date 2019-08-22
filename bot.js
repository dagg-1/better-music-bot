const token = require("./token.json")
const Discord = require("discord.js")
const youtube = require("ytdl-core")

const client = new Discord.Client()
const prefix = "!"

let alreadyactive = false

var queue = [

]

function getColour() {
    return Math.floor(Math.random() * 16777215) + 1
}

client.login(token.discord.bot_token)

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`)
})

client.on("message", message => {
    if (!message.guild) return
    if (!message.content.startsWith(prefix)) return
    let argument = message.content.slice(prefix.length).trim().split(/ +/g)
    let command = argument.shift()
    switch (command) {
        case "foo":
            let fooembed = {
                embed: {
                    title: "bar",
                    author: {
                        name: `${message.author.username}#${message.author.discriminator}`,
                        icon_url: message.author.avatarURL
                    },
                    description: "baz",
                    color: `${getColour()}`,
                    fields: [

                    ]
                }
            }
            message.react("😃")
            let each = 0
            argument.forEach(element => {
                each++
                fooembed.embed.fields.push({ name: element, value: each })
            });
            message.channel.send(fooembed)
            break

        case "add":
            if (!argument[0]) return message.channel.send("No URL provided")
            if (!argument[0].includes("https://www.youtube.com/watch?v=") &&
                !argument[0].includes("https://youtu.be/")) return message.channel.send("Invalid URL")
            youtube.getBasicInfo(argument[0])
                .then(info => {
                    queue.push(argument[0])
                    message.channel.send({
                        embed: {
                            title: `Added "${info.title}" to the queue`,
                            description: `URL: ${info.video_url}`,
                            color: 0xFF0000,
                            image: info.player_response.videoDetails.thumbnail.thumbnails[3],
                            author: {
                                name: info.author.name,
                                icon_url: info.author.avatar,
                                url: info.author.channel_url
                            },
                            footer: {
                                text: `${info.player_response.videoDetails.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} viiews`
                            },
                            fields: [
                                {
                                    name: "Position in Queue",
                                    value: `#${queue.length}`
                                }
                            ]
                        }
                    })
                })
            break

        case "queue":
            let queueembed = {
                embed: {
                    title: "Server Queue",
                    color: 0xFF0000,
                    author: {
                        name: message.author.username,
                        icon_url: message.author.avatarURL,
                    },
                    fields: [

                    ]
                }
            }
            let posnum = 0
            if (queue.length == 0) queueembed.embed.fields.push({ name: "Queue Empty", value: "The queue is empty, try adding something with !add" })
            queue.forEach(element => {
                posnum++
                queueembed.embed.fields.push({ name: `Position #${posnum}`, value: element })
            })
            message.channel.send(queueembed)
            break

        case "start":
            let author = message.author.id
            let dispatch
            let playingembed
            if (alreadyactive == true) return message.channel.send("There's something already playing")
            if (queue.length == 0) return message.channel.send("There's nothing queued")
            if (!message.member.voiceChannel) return message.channel.send("You are not in a voice channel")
            if (!message.member.guild.me.hasPermission("MANAGE_MESSAGES")) return message.channel.send("I do not have message management permissions")
            if (!message.member.voiceChannel.joinable) return message.channel.send("I am not able to join this voice channel")
            alreadyactive = true
            message.channel.send("Starting")
                .then(thismsg => {
                    message.member.voiceChannel.join()
                        .then(connection => {
                            play0()
                            function play0() {
                                youtube.getBasicInfo(queue[0])
                                .then(info => {
                                    playingembed = {
                                        embed: {
                                            title: "Now Playing",
                                            description: info.title,
                                            author: {
                                                name: info.author.name,
                                                icon_url: info.author.avatar,
                                                url: info.author.channel_url
                                            },
                                            footer: {
                                                text: `${info.player_response.videoDetails.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} viiews`
                                            },
                                            color: 0xFF0000,
                                            image: info.player_response.videoDetails.thumbnail.thumbnails[3]
                                        }
                                    }
                                    thismsg.edit(playingembed)
                                })
                                dispatch = connection.playStream(youtube(queue[0], { highWaterMark: 32000000 }))
                                    .on("end", () => {
                                        if (queue.length > 1) {
                                            queue.shift()
                                            play0()
                                        }
                                        else {
                                            queue.shift()
                                            alreadyactive = false
                                            connection.disconnect()
                                        }
                                    })
                            }
                        })
                })
            break
    }
})