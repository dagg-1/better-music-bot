const token = require("./token.json")
const Discord = require("discord.js")

const client = new Discord.Client()
const prefix = "!"

client.login(token.discord.bot_token)

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`)
})

client.on("message", message => {
    const argument = message.content.slice(prefix.length).trim().split(/ +/g).shift()
    switch (argument) {
        case "foo":
            message.react("😃")
            message.channel.send({
                embed: {
                    title: "bar",
                    author: {
                        name: `${message.author.username}#${message.author.discriminator}`,
                        icon_url: message.author.avatarURL
                    },
                    description: "baz",
                    color: `${Math.floor(Math.random() * 16777215) + 1}`
                }
            })
            break
    }
})