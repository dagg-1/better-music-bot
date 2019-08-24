const token = require("./token.json")
const Discord = require("discord.js")
const youtube = require("ytdl-core")
const searchapi = require("youtube-api-v3-search")

const client = new Discord.Client()
const prefix = "!"

let alreadyactive = {}

var queue = {}
var queue_title = {}
var playingembed = {}
var repeat = false
var dispatch

client.login(token.discord.bot_token)

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`)
    client.guilds.forEach(guild => {
        alreadyactive[guild] = false
        queue[guild] = []
        queue_title[guild] = []
    })
})

client.on("guildCreate", guild => {
    alreadyactive[guild] = false
    queue[guild] = []
    queue_title[guild] = []
})

client.on("guildDelete", guild => {
    alreadyactive[guild] = null
    queue[guild] = null
    queue_title[guild] = null
})

client.on("message", async message => {
    if (!message.guild) return
    if (!message.content.startsWith(prefix)) return
    let argument = message.content.slice(prefix.length).trim().split(/ +/g)
    let command = argument.shift()
    let author = message.author.id
    const filter = (reaction, user) => {
        return [reaction.emoji.name == "⏯", reaction.emoji.name == "⏹", reaction.emoji.name == "⏩"] && user.id == author
    }
    switch (command) {
        case "add":
            if (!argument[0]) return message.channel.send("No URL provided")
            if (!argument[0].includes("https://www.youtube.com/watch?v=") &&
                !argument[0].includes("https://youtu.be/")) {
                let searchcommand = argument.join().replace(/,/gi, " ")
                let result = await searchapi(token.youtube.api_token, { q: searchcommand, type: "video" })
                if (!result.items[0]) return message.channel.send(`No results for "${searchcommand}"`)
                argument[0] = `https://youtu.be/${result.items[0].id.videoId}`
            }
            youtube.getBasicInfo(argument[0])
                .then(info => {
                    queue[message.member.guild].push(argument[0])
                    queue_title[message.member.guild].push(info.title)
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
                                text: `${info.player_response.videoDetails.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} views`
                            },
                            fields: [
                                {
                                    name: "Position in Queue",
                                    value: `#${queue[message.member.guild].length}`
                                }
                            ]
                        }
                    })
                })
            break

        case "queue":
            getqueue(message)
            break

        case "start":
            repeat = false
            if (alreadyactive[message.member.guild] == true) return message.channel.send("There's something already playing")
            if (queue[message.member.guild].length == 0) return message.channel.send("There's nothing queued")
            if (!message.member.voiceChannel) return message.channel.send("You are not in a voice channel")
            if (!message.member.guild.me.hasPermission("MANAGE_MESSAGES")) return message.channel.send("I do not have message management permissions")
            if (!message.member.voiceChannel.joinable) return message.channel.send("I am not able to join this voice channel")
            alreadyactive[message.member.guild] = true
            message.channel.send("Starting")
                .then(thismsg => {
                    message.member.voiceChannel.join()
                        .then(connection => {
                            play0()
                            function play0() {
                                youtube.getBasicInfo(queue[message.member.guild][0])
                                    .then(async info => {
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
                                                    text: `${info.player_response.videoDetails.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} views | Repeat: ${repeat.toString().toUpperCase()}`
                                                },
                                                color: 0xFF0000,
                                                image: info.player_response.videoDetails.thumbnail.thumbnails[3],
                                                fields: []
                                            }
                                        }
                                        currinfo = info
                                        if (queue[message.member.guild].length > 1) {
                                            playingembed.embed.fields[0] = { name: "Up Next", value: queue_title[message.member.guild][1] }
                                        }
                                        thismsg.edit(playingembed)

                                        dispatch = connection.playStream(youtube(queue[message.member.guild][0], { highWaterMark: 32000000 }))
                                            .on("end", () => {
                                                if (repeat == true) return play0()
                                                if (queue[message.member.guild].length > 1) {
                                                    queue[message.member.guild].shift()
                                                    queue_title[message.member.guild].shift()
                                                    play0()
                                                }
                                                else {
                                                    queue[message.member.guild].shift()
                                                    queue_title[message.member.guild].shift()
                                                    alreadyactive[message.member.guild] = false
                                                    connection.disconnect()
                                                }
                                            })
                                        thismsg.createReactionCollector(filter, { time: `${info.player_response.videoDetails.lengthSeconds}000` })
                                            .on("collect", reaction => {
                                                reaction.remove(author)
                                                switch (reaction.emoji.name) {
                                                    case "⏯":
                                                        if (dispatch.paused == false) return dispatch.pause()
                                                        dispatch.resume()
                                                        break
                                                    case "⏹":
                                                        repeat = false
                                                        queue[message.member.guild] = []
                                                        queue_title[message.member.guild] = []
                                                        alreadyactive[message.member.guild] = false
                                                        connection.disconnect()
                                                        break
                                                    case "⏩":
                                                        dispatch.end()
                                                        break
                                                    case "🔁":
                                                        repeat = !repeat
                                                        playingembed.embed.footer.text = `${info.player_response.videoDetails.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} views | Repeat: ${repeat.toString().toUpperCase()}`
                                                        thismsg.edit(playingembed)
                                                        break
                                                }
                                            })
                                        await thismsg.clearReactions()
                                        await thismsg.react("⏯")
                                        await thismsg.react("⏹")
                                        await thismsg.react("⏩")
                                        await thismsg.react("🔁")
                                    })
                            }
                        })
                })
            break

        case "clear":
            queue[message.member.guild] = []
            queue_title[message.member.guild] = []
            message.channel.send("Cleared the queue")
            break

        case "remove":
            if(!argument[0]) return message.channel.send("You did not specify a position to remove!")
            if(argument[0].length > queue[message.member.guild].length || argument[0] < 2) return message.channel.send("Invalid position")
            queue[message.member.guild].splice(argument[0] - 1 , 1)
            queue_title[message.member.guild].splice(argument[0] - 1, 1)
            getqueue(message)
            break
    }
})

function getqueue(message) {
    queueembed = {
        embed: {
            title: "Server Queue",
            color: 0xFF0000,
            author: {
                name: message.author.username,
                icon_url: message.author.avatarURL,
            },
            fields: []
        }
    }
    let posnum = 0
    if (queue[message.member.guild].length == 0) queueembed.embed.fields.push({ name: "Queue Empty", value: "The queue is empty, try adding something with !add" })
    queue[message.member.guild].forEach(element => {
        posnum++
        queueembed.embed.fields.push({ name: `#${posnum} - `, value: element })
    })
    posnum = -1
    queue_title[message.member.guild].forEach(element => {
        posnum++
        queueembed.embed.fields[posnum] = { name: `${queueembed.embed.fields[posnum].name}${element}`, value: queueembed.embed.fields[posnum].value }
    })
    message.channel.send(queueembed)
}