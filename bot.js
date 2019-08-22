const token = require("./token.json")
const Discord = require("discord.js")
const youtube = require("ytdl-core")

const client = new Discord.Client()
const prefix = "!"

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
            var each = 0
            argument.forEach(element => {
                each++
                fooembed.embed.fields.push({ name: element, value: each })
            });
            message.channel.send(fooembed)
            break

        case "add":
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
            queue.forEach(element => {
                posnum++
                queueembed.embed.fields.push({name: `Position #${posnum}` , value: element})
            })
            message.channel.send(queueembed)
            break
    }
})