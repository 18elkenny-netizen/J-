
const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "info",
        aliases: ["inf", "in4"],
        version: "3.0",
        author: "Dark",
        countDown: 5,
        role: 0,
        shortDescription: {
            fr: "Informations du bot et de son propriétaire."
        },
        longDescription: {
            fr: "Affiche les informations du bot, de son propriétaire et son statut."
        },
        category: "Information",
        guide: {
            fr: "{pn}"
        }
    },

    onStart: async function ({ message }) {
        return this.sendInfo(message);
    },

    onChat: async function ({ event, message }) {
        if (
            event.body &&
            event.body.trim().toLowerCase() === "info"
        ) {
            return this.sendInfo(message);
        }
    },

    sendInfo: async function (message) {
        const waitMsg = await message.reply(
            "🖤 𝑰𝒏𝒊𝒕𝒊𝒂𝒍𝒊𝒔𝒂𝒕𝒊𝒐𝒏 𝒅𝒖 𝑫𝑨𝑹𝑲 𝑺𝒀𝑺𝑻𝑬𝑴... 🦇"
        );

        setTimeout(() => {
            if (waitMsg?.messageID) {
                message.unsend(waitMsg.messageID);
            }
        }, 4000);

        const botName = "ヾΩ.Ꭰꪖꪹӄ 命༘";
        const botPrefix = global.GoatBot.config.prefix || "¥";

        const authorName = "ヾΩ.Ꭰꪖꪹӄ 命༘";
        const authorFB = "À AJOUTER";
        const authorInsta = "À AJOUTER";
        const status = "À PERSONNALISER";

        const now = moment().tz("Indian/Antananarivo");
        const date = now.format("DD/MM/YYYY");
        const time = now.format("HH:mm:ss");

        const uptime = process.uptime();

        const seconds = Math.floor(uptime % 60);
        const minutes = Math.floor((uptime / 60) % 60);
        const hours = Math.floor((uptime / 3600) % 24);
        const days = Math.floor(uptime / 86400);

        const uptimeString =
            `${days}j ${hours}h ${minutes}m ${seconds}s`;

        try {
            const videoResponse = await axios.get(
                "https://mahabub-apis.vercel.app/info",
                { timeout: 15000 }
            );

            if (
                !videoResponse.data ||
                !videoResponse.data.data
            ) {
                throw new Error("API vidéo indisponible");
            }

            let videoUrl = videoResponse.data.data;

            if (videoUrl.includes("drive.google.com")) {
                const match = videoUrl.match(/[-\w]{25,}/);

                if (match) {
                    videoUrl =
                        `https://drive.google.com/uc?id=${match[0]}`;
                }
            }

            const attachment =
                await global.utils.getStreamFromURL(videoUrl);

            return message.reply({
                body:
`╔════════════════════════════════╗
       🦇 𝑲&𝑨 𝑫𝑨𝑹𝑲 𝑺𝒀𝑺𝑻𝑬𝑴 🦇
╚════════════════════════════════╝

       𓆩 🖤 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 🖤 𓆪

👑 𝐏𝐫𝐨𝐩𝐫𝐢𝐞́𝐭𝐚𝐢𝐫𝐞 : ${authorName}
🤖 𝐍𝐨𝐦 𝐝𝐮 𝐛𝐨𝐭 : ${botName}
🔰 𝐏𝐫𝐞́𝐟𝐢𝐱 : ${botPrefix}
⚙️ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧 : 3.0.0
🩸 𝐒𝐭𝐚𝐭𝐮𝐭 : 𝐎𝐍𝐋𝐈𝐍𝐄

       𓆩 ⚜️ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎 ⚜️ 𓆪

📅 𝐃𝐚𝐭𝐞 : ${date}
⏰ 𝐇𝐞𝐮𝐫𝐞 : ${time}
⏳ 𝐔𝐩𝐭𝐢𝐦𝐞 : ${uptimeString}

       𓆩 🌐 𝐒𝐎𝐂𝐈𝐀𝐋 𝐈𝐍𝐅𝐎 🌐 𓆪

📘 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : ${authorFB}
📸 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 : ${authorInsta}
❤️ 𝐒𝐭𝐚𝐭𝐮𝐭 : ${status}

╔════════════════════════════════╗
       🩸 𝐓𝐇𝐄 𝐒𝐇𝐀𝐃𝐎𝐖 𝐍𝐄𝐕𝐄𝐑 𝐒𝐋𝐄𝐄𝐏𝐒
╚════════════════════════════════╝`,
                attachment
            });

        } catch (error) {
            console.error("Erreur INFO :", error);

            return message.reply(
                `🖤 𝗞&𝗔 𝗗𝗔𝗥𝗞 𝗦𝗬𝗦𝗧𝗘𝗠\n\n` +
                `👑 Propriétaire : ${authorName}\n` +
                `🤖 Bot : ${botName}\n` +
                `🔰 Préfixe : ${botPrefix}\n` +
                `⏳ Uptime : ${uptimeString}\n\n` +
                `⚠️ La vidéo est momentanément indisponible.`
            );
        }
    }
};
