module.exports = {
    name: 'ping',
    desc: 'Checks the bot latency with Optimus Prime quotes',
    aliases: ['pong'],
    category: 'General',
    cooldown: 5,
    dmUser: true,
    permission: 0,
    run: async ({ sock, m }) => {
        try {
            const start = Date.now();
            await m.reply('🏓 Pinging...');
            const end = Date.now();
            
            const latency = end - start;
            
            const optimusQuotes = [
                "Freedom is the right of all sentient beings.",
                "Autobots, roll out!",
                "One shall stand, one shall fall.",
                "Till all are one!",
                "We are autonomous robotic organisms from the planet Cybertron.",
                "Fate rarely calls upon us at a moment of our choosing.",
                "There's more to them than meets the eye.",
                "Sometimes the paths we wish we desire most are not always the ones we should take.",
                "Above all, do not lose hope.",
                "Victory will not come through force, but through our unity."
            ];
            
            const randomQuote = optimusQuotes[Math.floor(Math.random() * optimusQuotes.length)];
            
            const pingMessage = `╭────❒ *🤖 EF-PRIME-MD v2* ❒
├⬡ 🏓 *Ping: ${latency}ms*
├⬡ 🔥 *${randomQuote}*
╰────────────❒`;
            
            try {
                
                await sock.sendMessage(m.chat, {
                    text: pingMessage
                }, {
                    quoted: m
                });
            } catch (error) {
                console.error("Error sending ping message:", error);
                await m.reply('⚠️ An error occurred while checking ping');
            }
        } catch (err) {
            console.error('Error in ping command:', err);
            await m.reply('⚠️ Ping check failed');
        }
    } 
};