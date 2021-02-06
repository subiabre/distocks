"use strict";

require('dotenv').config()

const logger = require('./logger')
const Stocks = require('stocks.js')

class Bot
{
    constructor()
    {
        this.stocks = new Stocks(process.env.ALPHA_VANTAGE_API_KEY)
        this.log = logger

        this.pingTag = '$'
        this.commands = [
            { trigger: 'price', function: (argument) => this.commandPrice(argument) },
            { trigger: 'help', function: (argument) => this.commandHelp(argument) },
            { trigger: '[^ ]*', function: (argument) => this.commandUnknown(argument), hidden: true },
        ]
    }

    /**
     * Set the discord.js client object
     * @param {Client} client a discord.js client object
     */
    setClient(client)
    {
        this.client = client
    }

    /**
     * Format into a string the json result of an stocks api call
     * @param {String} stock 
     * @param {JSON} data
     */
    formatStockPrice(stock, data)
    {
        return `${stock} last minute price:\nopening: ${data.open}\nclosing: ${data.close}`
    }

    /**
     * Remove the bot ping tag from a message
     * @param {Object} msg Msg object from Discord.js
     * @returns {String}
     */
    removePingTag(msg)
    {
        return msg.content.replace(this.pingTag, '')
    }

    /**
     * Dispatch a message pinging the bot
     * @param {Object} msg Msg object from Discord.js
     */
    async ping(msg)
    {
        if (msg.content.startsWith(this.pingTag)) {
            let content = this.removePingTag(msg);

            msg.channel.startTyping()
            
            for (let index = 0; index < this.commands.length; index++) {
                const command = this.commands[index];
                
                let trigger = new RegExp(command.trigger)

                if (trigger.test(content.toLowerCase())) {
                    let argument = content.replace(trigger, '').replace(' ', '')

                    this.log.info(`Command '$${command.trigger}' with argument '${argument}'`)

                    let answer = await command.function(argument)

                    msg.channel.stopTyping()
                    msg.channel.send(answer)
                    break;
                }
            }
        }
    }

    async commandUnknown()
    {
        return "I don't know what you want. Type `$help`"
    }

    async commandHelp()
    {
        let result = "Available commands are:\n"
        this.commands.forEach(command => {
            if (!command.hidden) {
                result += "`$" + command.trigger + "`\n"
            }
        });

        return result
    }

    async commandPrice(argument)
    {
        let stock = argument.toUpperCase()
        let result = await this.stocks.timeSeries({
            symbol: stock,
            interval: '1min',
            amount: 1
        })

        return this.formatStockPrice(argument, result[0])
    }

}

module.exports = new Bot
