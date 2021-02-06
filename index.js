#!/usr/bin/env node
require('dotenv').config()

const Discord = require('discord.js')
const client = new Discord.Client()
const bot = require('./src/bot')

// Login
client.on('ready', () => {
    bot.setClient(client)
    bot.log.info(`Bot connected to ${client.user.tag}`)
})

// Bot actions
client.on('message', async (msg) => {
    await bot.ping(msg)
})

client.login(process.env.DISCORD_BOT_TOKEN)
