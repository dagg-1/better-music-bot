const token = require("./token.json")
const Discord = require("discord.js")

const client = new Discord.Client()
const prefix = "!"

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
                    color: `${Math.floor(Math.random() * 16777215) + 1}`,
                    fields: [

                    ]
                }
            }
            message.react("😃")
            var each = 0
            argument.forEach(element => {
                each++
                fooembed.embed.fields.push({name: element, value: each})
            });
            message.channel.send(fooembed)
            break
    }
})