
const { getTime, drive } = global.utils;

module.exports = {
  config: {
    name: "leave",
    version: "2.0",
    author: "ヾΩ.Ꭰꪖꪹӄ 命༘",
    category: "events"
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;

      const { threadID } = event;
      const threadData = await threadsData.get(threadID);

      if (!threadData.settings.sendLeaveMessage) return;

      const { leftParticipantFbId } = event.logMessageData;

      // Ne pas annoncer le départ du bot lui-même
      if (leftParticipantFbId == api.getCurrentUserID()) return;

      const hours = Number(getTime("HH"));
      const fullTime = getTime("DD/MM/YYYY HH:mm");

      const threadName = threadData.threadName || "Groupe inconnu";
      const userName = await usersData.getName(leftParticipantFbId);

      // Départ volontaire ou expulsion
      const leftAlone = event.author === leftParticipantFbId;

      const voluntaryMessages = [
        `🦇 ${userName} vient de quitter le groupe...\n\n💀 Les poules ont enfin retrouvé le silence. Même les fantômes vont nous manquer moins que toi. 🥀`,
        `🚪 ${userName} s'est enfui du groupe !\n\n🤣 Même son courage a quitté la conversation avant lui. Quel spectacle !`,
        `🩸 ${userName} a pris la fuite !\n\n🐀 Un lâche de moins dans le territoire. La sortie est par là, champion. 🚪`,
        `⚰️ Avis de disparition : ${userName} a quitté le groupe.\n\n🥳 Personne n'a pleuré. Même le bot n'a pas remarqué ton absence. 💀`,
        `👋 ${userName} vient de se dégager du groupe.\n\n🤡 Il a cru que son départ allait bouleverser nos vies. Quelle imagination !`,
        `🦇 ${userName} a quitté le groupe.\n\n🗑️ Le groupe vient de perdre un membre... mais pas forcément quelque chose de précieux. 💀`,
        `🏃 ${userName} a fui comme un personnage secondaire !\n\n⚔️ La légende raconte qu'il n'a jamais osé revenir.`
      ];

      const kickedMessages = [
        `💀 ${userName} vient de se faire expulser !\n\n🗑️ Même la porte ne voulait plus le garder. Bon débarras !`,
        `⚔️ ${userName} a été jeté dehors !\n\n🤡 Il a perdu sa place avant même de comprendre les règles.`,
        `🚫 ${userName} vient de recevoir son billet de sortie !\n\n🦇 Une nuisance en moins dans le territoire. 🩸`,
        `⚰️ Fin de carrière pour ${userName} !\n\n🤣 Expulsé du groupe avec succès. Même son ombre a honte.`,
        `🧹 ${userName} vient d'être nettoyé du groupe !\n\n💀 Le ménage est enfin terminé. Quel soulagement !`,
        `👑 Le verdict est tombé !\n\n🩸 ${userName} a été banni du territoire. Ici, les faibles ne restent pas.`,
        `🚪 ${userName} a été expulsé !\n\n🐀 Même les rats ont plus de dignité. Bon voyage !`
      ];

      const randomMessage = array =>
        array[Math.floor(Math.random() * array.length)];

      const leaveMessage = randomMessage(
        leftAlone ? voluntaryMessages : kickedMessages
      );

      const session =
        hours <= 10
          ? "🌅 ᴍᴏʀɴɪɴɢ"
          : hours <= 12
          ? "☀️ ɴᴏᴏɴ"
          : hours <= 18
          ? "🌇 ᴀꜰᴛᴇʀɴᴏᴏɴ"
          : "🌙 ᴇᴠᴇɴɪɴɢ";

      const type = leftAlone
        ? "🚪 ᴀ ǫᴜɪᴛᴛᴇ́ ʟᴇ ɢʀᴏᴜᴘᴇ"
        : "💀 ᴀ ᴇ́ᴛᴇ́ ᴇxᴘᴜʟꜱᴇ́";

      let body = `
╔══════════════════════════╗
       🦇 𝐊&𝐀 𝐃𝐀𝐑𝐊 𝐒𝐘𝐒𝐓𝐄𝐌
╚══════════════════════════╝

${leaveMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐔𝐓𝐈𝐋𝐈𝐒𝐀𝐓𝐄𝐔𝐑 : ${userName}
❌ 𝐄́𝐕𝐄́𝐍𝐄𝐌𝐄𝐍𝐓 : ${type}
💬 𝐆𝐑𝐎𝐔𝐏𝐄 : ${threadName}
⏰ 𝐇𝐄𝐔𝐑𝐄 : ${fullTime}
🌙 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 : ${session}
━━━━━━━━━━━━━━━━━━━━━━━━━━

       🩸 𝐓𝐇𝐄 𝐒𝐇𝐀𝐃𝐎𝐖 𝐍𝐄𝐕𝐄𝐑 𝐒𝐋𝐄𝐄𝐏𝐒
      `;

      const form = {
        body,
        mentions: [
          {
            id: leftParticipantFbId,
            tag: userName
          }
        ]
      };

      // Pièces jointes personnalisées du groupe
      if (threadData.data?.leaveAttachment) {
        const files = threadData.data.leaveAttachment;

        const attachments = files.map(file =>
          drive.getFile(file, "stream")
        );

        const results = await Promise.allSettled(attachments);

        form.attachment = results
          .filter(result => result.status === "fulfilled")
          .map(result => result.value);
      }

      await message.send(form);

    } catch (err) {
      console.error("❌ Leave event error:", err);
    }
  }
};
