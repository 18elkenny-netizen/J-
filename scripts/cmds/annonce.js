
const axios = require("axios");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "annonce",
    aliases: ["broadcast", "announce"],
    version: "2.0.0",
    author: "Dark System",
    countDown: 30,
    role: 2,
    category: "admin",
    guide: {
      fr: "{pn} <message> : diffuser une annonce officielle"
    }
  },

  onStart: async function ({ api, event, args }) {
    const message = args.join(" ").trim();

    if (!message) {
      return api.sendMessage(
        "╭━━━〔 🖤 DARK SYSTEM 〕━━━╮\n\n" +
        "⚠️ Tu dois écrire un message !\n\n" +
        "✦ Exemple :\n" +
        "¥annonce Le bot sera en maintenance ce soir.\n\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯",
        event.threadID,
        event.messageID
      );
    }

    api.sendMessage(
      "╔══════ 📡 DARK SYSTEM ══════╗\n\n" +
      "⏳ Préparation de l'annonce...\n" +
      "🖤 Récupération du profil administrateur.\n\n" +
      "╚══════════════════════════╝",
      event.threadID,
      async (err) => {
        if (err) return;

        try {
          // Get admin profile
          api.getUserInfo(event.senderID, async (error, userInfo) => {
            let adminName = "Administrateur";
            let avatarBuffer = null;

            if (!error && userInfo && userInfo[event.senderID]) {
              const admin = userInfo[event.senderID];

              adminName = admin.name || adminName;

              const avatarURL = admin.thumbSrc || admin.profileUrl;

              if (avatarURL) {
                try {
                  const response = await axios.get(avatarURL, {
                    responseType: "arraybuffer",
                    timeout: 15000
                  });

                  avatarBuffer = Buffer.from(response.data);
                } catch (imageError) {
                  console.error("Admin avatar error:", imageError.message);
                }
              }
            }

            // Get groups
            api.getThreadList(100, null, ["INBOX"], async (listError, threads) => {
              if (listError || !Array.isArray(threads)) {
                return api.sendMessage(
                  "❌ Impossible de récupérer les groupes.",
                  event.threadID
                );
              }

              const groups = threads.filter(thread =>
                thread.isGroup &&
                thread.threadID &&
                thread.threadID !== event.threadID
              );

              if (groups.length === 0) {
                return api.sendMessage(
                  "❌ Aucun autre groupe trouvé.",
                  event.threadID
                );
              }

              const date = new Date().toLocaleString("fr-FR", {
                timeZone: "Indian/Antananarivo",
                dateStyle: "long",
                timeStyle: "short"
              });

              const announcement =
                "╔══════════════════════╗\n" +
                "       🖤 𝐃𝐀𝐑𝐊 𝐒𝐘𝐒𝐓𝐄𝐌 🖤\n" +
                "╚══════════════════════╝\n\n" +
                "      ✦ 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐀𝐍𝐍𝐎𝐔𝐍𝐂𝐄 ✦\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                `${message}\n\n` +
                "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "👑 𝐀𝐃𝐌𝐈𝐍𝐈𝐒𝐓𝐑𝐀𝐓𝐄𝐔𝐑\n" +
                `𓆩 ${adminName} 𓆪\n\n` +
                `📅 ${date}\n` +
                "⚜️ DARK SYSTEM MANAGEMENT\n\n" +
                "╔══════════════════════╗\n" +
                "       🩸 𝐄𝐍𝐃 𝐎𝐅 𝐌𝐄𝐒𝐒𝐀𝐆𝐄\n" +
                "╚══════════════════════╝";

              let sent = 0;
              let failed = 0;

              // Send one announcement per group
              for (const group of groups) {
                try {
                  await new Promise(resolve => {
                    const callback = error => {
                      if (error) failed++;
                      else sent++;
                      resolve();
                    };

                    if (avatarBuffer) {
                      api.sendMessage(
                        {
                          body: announcement,
                          attachment: Readable.from(avatarBuffer)
                        },
                        group.threadID,
                        callback
                      );
                    } else {
                      api.sendMessage(
                        announcement,
                        group.threadID,
                        callback
                      );
                    }
                  });

                  await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (sendError) {
                  failed++;
                  console.error("Broadcast error:", sendError);
                }
              }

              api.sendMessage(
                "╔══════ 📡 𝐃𝐈𝐅𝐅𝐔𝐒𝐈𝐎𝐍 ══════╗\n\n" +
                "🖤 𝐀𝐍𝐍𝐎𝐍𝐂𝐄 𝐓𝐄𝐑𝐌𝐈𝐍𝐄́𝐄\n\n" +
                `✅ Envoyées : ${sent}\n` +
                `❌ Échecs : ${failed}\n` +
                `📊 Groupes trouvés : ${groups.length}\n\n` +
                "╚══════════════════════════╝",
                event.threadID
              );
            });
          });

        } catch (error) {
          console.error("Announcement error:", error);

          api.sendMessage(
            "❌ Une erreur est survenue pendant la diffusion.",
            event.threadID
          );
        }
      }
    );
  }
};
  
