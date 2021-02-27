"use strict";

require('dotenv').config()

const to = require('await-to-js').default;
const logger = require('./logger')
const alpha = require('alphavantage')({ key: process.env.ALPHA_VANTAGE_API_KEY })

class Bot
{
    constructor()
    {
        this.alpha = alpha
        this.log = logger

        this.pingTag = '$'
        this.commands = [
            { trigger: 'price', function: (argument) => this.commandPrice(argument) },
            { trigger: 'crypto', function: (argument) => this.commandCrypto(argument) },
            { trigger: 'help', function: (argument) => this.commandHelp(argument) },
            { trigger: '^[a-z]+$', function: (argument) => this.commandUnknown(argument), hidden: true },
        ]
    }

    alphaGetLatestOf(key, set)
    {
        return set[key][Object.keys(set[key])[0]]
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
            
            for (let index = 0; index < this.commands.length; index++) {
                const command = this.commands[index];
                
                let trigger = new RegExp(command.trigger)

                if (trigger.test(content.toLowerCase())) {
                    msg.channel.startTyping()

                    let argument = content.replace(trigger, '').replace(' ', '')
                    let answer = await command.function(argument)

                    this.log.info(`Command '$${command.trigger}' with argument '${argument}'`)

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
        let err, result

        [err, result] = await to(this.alpha.data.intraday(stock, 'compact', 'json', '1min'))

        if (err) return `I'm sorry, there's no data for '${stock}'? LOL`

        result = this.alphaGetLatestOf('Time Series (1min)', result)

        return `${stock} price: \`${result['4. close']}\``
    }

    async commandCrypto(argument)
    {
        let [symbol, market] = argument.toUpperCase().split('/')
        let err, result, data

        [err, result] = await to(this.alpha.crypto.daily(symbol, market))

        if (err) return `Is '${argument}' a crypto/fiat combo. I can only convert that way :(`

        result = this.alphaGetLatestOf('Time Series (Digital Currency Daily)', result)
        data = `1 ${symbol}: \`${result[`1a. open (${market})`]}\` ${market}`

        if (result[`1a. open (${market})`] > 1000) {
            return data + `\n\nWow much gains`
        }

        if (symbol == 'DOGE') {
            return data + `\n\nDOGE TO THE MOON! 🚀`
        }

        return data
    }
}

module.exports = new Bot
