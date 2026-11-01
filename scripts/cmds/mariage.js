
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "mariage",
    aliases: ["marriage", "marier"],
    version: "3.1.0",
    author: "ヾΩ.Ꭰꪖꪹӄ 命༘",
    countDown: 5,
    role: 0,
    shortDescription: "Système de mariage mondial",
    category: "fun",
    guide: {
      en: "{pn} @mention | accept | refuse | destin | top | divorce"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    try {
      const uid = String(event.senderID);
      const threadID = event.threadID;
      const sub = (args[0] || "").toLowerCase();

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const getUser = async id => {
        const user = await usersData.get(String(id));
        return user || {
          userID: String(id),
          name: "Inconnu",
          money: 0,
          exp: 0,
          data: {}
        };
      };

      const getData = async id => {
        const user = await getUser(id);
        return {
          ...user,
          data: user.data || {}
        };
      };

      const saveUser = async (id, user) => {
        await usersData.set(String(id), user);
      };

      const getName = async id => {
        const user = await getUser(id);
        return user.name || "Joueur";
      };

      const getSurname = name => {
        const words = String(name || "Joueur").trim().split(/\s+/);
        return words[words.length - 1] || "Joueur";
      };

      const makeFamilyName = (name1, name2) => {
        const a = getSurname(name1).replace(/[^a-zA-ZÀ-ÿ]/g, "");
        const b = getSurname(name2).replace(/[^a-zA-ZÀ-ÿ]/g, "");

        if (!a) return b.toUpperCase();
        if (!b) return a.toUpperCase();

        const halfA = a.slice(0, Math.ceil(a.length / 2));
        const halfB = b.slice(Math.floor(b.length / 2));

        return (halfA + halfB).toUpperCase();
      };

      const formatMoney = value => {
        const n = Math.max(0, Number(value) || 0);
        return n.toLocaleString("fr-FR") + " $";
      };

      const formatDate = value => {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          return "Date inconnue";
        }

        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        });
      };

      const getAllUsers = async () => {
        const all = await usersData.getAll();

        if (!Array.isArray(all)) return [];

        return all
          .filter(user =>
            user &&
            user.userID !== undefined &&
            user.userID !== null &&
            String(user.userID).trim() !== ""
          )
          .map(user => ({
            id: String(user.userID),
            user
          }));
      };

      const sendText = body => message.send(body);

      // DESSIN DES AFFICHES
      const drawHeart = (ctx, x, y, size, color) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 100, size / 100);

        ctx.beginPath();
        ctx.moveTo(50, 88);
        ctx.bezierCurveTo(-35, 30, 10, -15, 50, 20);
        ctx.bezierCurveTo(90, -15, 135, 30, 50, 88);

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fill();

        ctx.restore();
      };

      const roundedRect = (ctx, x, y, w, h, r, fill, stroke) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x, y + h, x, y + h, r);
        ctx.arcTo(x, y, x + w, y + h, r);
        ctx.arcTo(x + w, y, x + w, y, r);
        ctx.closePath();

        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }

        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      };

      const drawBackground = (ctx, width, height) => {
        const bg = ctx.createLinearGradient(0, 0, width, height);

        bg.addColorStop(0, "#08080c");
        bg.addColorStop(0.5, "#17131d");
        bg.addColorStop(1, "#050507");

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 100; i++) {
          const x = (i * 137) % width;
          const y = (i * 223) % height;

          ctx.beginPath();
          ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);

          ctx.fillStyle = i % 2 ? "#e8c36c" : "#a88cff";
          ctx.globalAlpha = 0.35 + (i % 4) * 0.12;
          ctx.fill();
        }

        ctx.globalAlpha = 1;

        roundedRect(ctx, 24, 24, width - 48, height - 48, 28, null, "#9c7735");
        roundedRect(ctx, 38, 38, width - 76, height - 76, 22, null, "#46371f");

        drawHeart(ctx, 90, 100, 48, "#d94b87");
        drawHeart(ctx, width - 140, 160, 35, "#b28cff");
        drawHeart(ctx, width - 110, height - 160, 45, "#d94b87");
      };

      const drawCentered = (ctx, text, y, size, color, font = "bold") => {
        ctx.textAlign = "center";
        ctx.fillStyle = color;
        ctx.font = `${font} ${size}px Arial`;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillText(text, 540, y);
        ctx.shadowBlur = 0;
      };

      const getAvatar = async id => {
        try {
          if (!api.getUserInfo) return null;

          const info = await new Promise(resolve => {
            api.getUserInfo(String(id), (err, result) => {
              if (err) return resolve(null);
              resolve(result && result[id] ? result[id] : result);
            });
          });

          const url = info && (
            info.thumbSrc ||
            info.profileUrl ||
            info.avatar ||
            info.image
          );

          if (!url) return null;

          return await loadImage(url);
        } catch {
          return null;
        }
      };

      const drawAvatar = async (ctx, id, x, y, size, name) => {
        ctx.save();

        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const avatar = await getAvatar(id);

        if (avatar) {
          ctx.drawImage(
            avatar,
            x - size / 2,
            y - size / 2,
            size,
            size
          );
        } else {
          const gradient = ctx.createLinearGradient(
            x - size / 2,
            y - size / 2,
            x + size / 2,
            y + size / 2
          );

          gradient.addColorStop(0, "#f4c96b");
          gradient.addColorStop(1, "#9b4d9c");

          ctx.fillStyle = gradient;
          ctx.fillRect(
            x - size / 2,
            y - size / 2,
            size,
            size
          );

          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${size / 2}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((name || "?").charAt(0).toUpperCase(), x, y);
        }

        ctx.restore();

        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#e9bd62";
        ctx.lineWidth = 5;
        ctx.stroke();
      };

      const sendPoster = async (canvas, filename, caption) => {
        const filePath = path.join(cacheDir, filename);

        await fs.writeFile(filePath, canvas.toBuffer("image/png"));

        try {
          await new Promise((resolve, reject) => {
            message.send(
              {
                body: caption,
                attachment: fs.createReadStream(filePath)
              },
              err => err ? reject(err) : resolve()
            );
          });
        } finally {
          await fs.remove(filePath).catch(() => {});
        }
      };

      // AFFICHE DE MARIAGE
      const makeMarriagePoster = async (id1, id2, familyName, date) => {
        const width = 1080;
        const height = 1350;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        drawBackground(ctx, width, height);

        const name1 = await getName(id1);
        const name2 = await getName(id2);

        drawCentered(ctx, "✦ THE ROYAL UNION ✦", 180, 42, "#e8c36c");
        drawCentered(ctx, "MARIAGE CÉLÉBRÉ", 310, 76, "#ffffff");

        await drawAvatar(ctx, id1, 320, 540, 210, name1);
        await drawAvatar(ctx, id2, 760, 540, 210, name2);

        drawCentered(ctx, "♡", 565, 90, "#e85d9e");
        drawCentered(ctx, name1.toUpperCase(), 700, 34, "#ffffff");
        drawCentered(ctx, "ET", 760, 25, "#c6a7e8");
        drawCentered(ctx, name2.toUpperCase(), 820, 34, "#ffffff");

        roundedRect(ctx, 100, 900, 880, 190, 25, "#15121b", "#bd9650");

        drawCentered(ctx, "NOM DE FAMILLE", 965, 27, "#d6b56b");
        drawCentered(ctx, familyName, 1035, 65, "#f7d889");

        drawCentered(ctx, `Mariés le ${formatDate(date)}`, 1175, 29, "#d8d2e2");
        drawCentered(ctx, "✦ POUR TOUJOURS ✦", 1260, 30, "#e8c36c");

        return canvas;
      };

      // AFFICHE DE REFUS
      const makeRefusalPoster = async (fromID, toID) => {
        const width = 1080;
        const height = 1350;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        drawBackground(ctx, width, height);

        const fromName = await getName(fromID);
        const toName = await getName(toID);

        drawCentered(ctx, "A ROYAL PROPOSAL", 230, 45, "#d7b66e");
        drawCentered(ctx, "DEMANDE REFUSÉE", 390, 75, "#ffffff");

        await drawAvatar(ctx, fromID, 320, 620, 190, fromName);
        await drawAvatar(ctx, toID, 760, 620, 190, toName);

        drawCentered(ctx, "♡", 650, 75, "#d94b87");
        drawCentered(ctx, fromName.toUpperCase(), 790, 36, "#ffffff");
        drawCentered(ctx, "→", 850, 35, "#c5a0df");
        drawCentered(ctx, toName.toUpperCase(), 910, 36, "#ffffff");

        roundedRect(ctx, 100, 1020, 880, 140, 25, "#15121b", "#795c68");

        drawCentered(ctx, "Le destin en a décidé autrement.", 1105, 31, "#e5c9d8");
        drawCentered(ctx, "✦ UNE AUTRE HISTOIRE ATTEND ✦", 1240, 26, "#d7b66e");

        return canvas;
      };

      // CLASSEMENT MONDIAL
      const makeLeaderboard = async () => {
        const all = await getAllUsers();
        const couples = [];

        for (const entry of all) {
          const id = entry.id;
          const user = entry.user || {};
          const data = user.data || {};
          const spouseID = data.spouse && String(data.spouse);

          if (!spouseID || id >= spouseID) continue;

          const partner = await getData(spouseID);

          if (String(partner.data.spouse || "") !== id) continue;

          const since = Number(
            data.marriageSince ||
            partner.data.marriageSince ||
            0
          );

          const familyName =
            data.marriageFamilyName ||
            partner.data.marriageFamilyName ||
            makeFamilyName(user.name, partner.name);

          const wallet = Number(
            data.marriageWallet ??
            partner.data.marriageWallet ??
            (Number(user.money || 0) + Number(partner.money || 0))
          );

          couples.push({
            id1: id,
            id2: spouseID,
            name1: user.name || "Joueur",
            name2: partner.name || "Joueur",
            familyName,
            since,
            wallet
          });
        }

        couples.sort((a, b) => {
          if (b.wallet !== a.wallet) {
            return b.wallet - a.wallet;
          }

          return a.since - b.since;
        });

        const width = 1080;
        const height = 1600;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        drawBackground(ctx, width, height);

        drawCentered(ctx, "✦ ROYAL COUPLES ✦", 150, 58, "#f1ca70");
        drawCentered(ctx, "CLASSEMENT DES MARIAGES", 220, 34, "#ffffff");
        drawCentered(ctx, "GLOBAL LEADERBOARD", 275, 24, "#a99bbd");

        roundedRect(ctx, 65, 330, 950, 1150, 24, "#101014", "#725a32");

        ctx.fillStyle = "#202027";
        ctx.fillRect(80, 350, 920, 80);

        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#d8bd7a";
        ctx.textAlign = "left";

        ctx.fillText("RANG", 110, 400);
        ctx.fillText("COUPLE", 220, 400);
        ctx.fillText("UNION", 700, 400);
        ctx.fillText("FORTUNE", 850, 400);

        if (!couples.length) {
          drawCentered(ctx, "AUCUN COUPLE POUR LE MOMENT", 800, 34, "#ffffff");
        }

        for (let i = 0; i < Math.min(couples.length, 10); i++) {
          const couple = couples[i];
          const y = 510 + i * 95;

          const rankColor =
            i === 0 ? "#ffd45e" :
            i === 1 ? "#c8d1dc" :
            i === 2 ? "#d99a5d" :
            "#aaa6b2";

          if (i % 2 === 0) {
            roundedRect(ctx, 90, y - 48, 900, 82, 12, "#18181e", null);
          }

          ctx.textAlign = "left";
          ctx.fillStyle = rankColor;
          ctx.font = "bold 32px Arial";
          ctx.fillText(String(i + 1).padStart(2, "0"), 115, y + 8);

          await drawAvatar(ctx, couple.id1, 230, y - 5, 58, couple.name1);
          await drawAvatar(ctx, couple.id2, 290, y - 5, 58, couple.name2);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 20px Arial";

          ctx.fillText(
            `${couple.name1} ♡ ${couple.name2}`.slice(0, 35),
            340,
            y - 3
          );

          ctx.fillStyle = "#e4bd68";
          ctx.font = "bold 21px Arial";
          ctx.fillText(couple.familyName.slice(0, 22), 340, y + 27);

          ctx.fillStyle = "#c6bdcf";
          ctx.font = "17px Arial";

          ctx.fillText(
            couple.since ? formatDate(couple.since) : "Date inconnue",
            700,
            y + 8
          );

          ctx.fillStyle = "#f2d17d";
          ctx.font = "bold 19px Arial";
          ctx.fillText(formatMoney(couple.wallet), 850, y + 8);

          ctx.strokeStyle = "#302a24";
          ctx.beginPath();
          ctx.moveTo(100, y + 48);
          ctx.lineTo(980, y + 48);
          ctx.stroke();
        }

        drawCentered(
          ctx,
          "✦ DEUX CŒURS • UN NOM • UNE FORTUNE ✦",
          1530,
          25,
          "#e6c36e"
        );

        return canvas;
      };

      // ANNULER LES ANCIENNES DEMANDES
      const cancelOutgoing = async senderID => {
        const sender = await getData(senderID);
        const outgoing = sender.data.marriageInvitations || [];

        for (const targetID of outgoing) {
          const target = await getData(targetID);

          if (
            target.data.marriageProposal &&
            String(target.data.marriageProposal.from) === String(senderID)
          ) {
            delete target.data.marriageProposal;
            await saveUser(targetID, target);
          }
        }

        sender.data.marriageInvitations = [];
        await saveUser(senderID, sender);
      };

      // AIDE
      const help = () => sendText(
        "💍 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘𝗦 𝗠𝗔𝗥𝗜𝗔𝗚𝗘 💍\n\n" +
        "💌 ¥mariage @mention : demander quelqu'un en mariage\n" +
        "💖 ¥mariage accept : accepter une demande\n" +
        "💔 ¥mariage refuse : refuser une demande\n" +
        "🎲 ¥mariage destin : rencontrer un partenaire au hasard\n" +
        "🏆 ¥mariage top : classement mondial des couples\n" +
        "👑 ¥mariage : voir son mariage et son nom de famille\n" +
        "🥀 ¥mariage divorce : mettre fin au mariage\n\n" +
        "✦ Les mariages sont mondiaux et restent identiques dans tous les groupes."
      );

      // CLASSEMENT
      if (sub === "top") {
        const poster = await makeLeaderboard();

        return sendPoster(
          poster,
          `marriage_top_${Date.now()}.png`,
          "🏆 𝗖𝗟𝗔𝗦𝗦𝗘𝗠𝗘𝗡𝗧 𝗠𝗢𝗡𝗗𝗜𝗔𝗟 𝗗𝗘𝗦 𝗖𝗢𝗨𝗣𝗟𝗘𝗦"
        );
      }

      // PROFIL
      if (
        !sub &&
        (!event.mentions || Object.keys(event.mentions).length === 0)
      ) {
        const user = await getData(uid);
        const spouseID = user.data.spouse;

        if (!spouseID) {
          if (user.data.marriageProposal) {
            const from = await getName(user.data.marriageProposal.from);

            return sendText(
              `💌 Tu as une demande en mariage de ${from} !\n\n` +
              `Utilise ¥mariage accept ou ¥mariage refuse.`
            );
          }

          return sendText(
            "💔 Tu n'es pas encore marié(e).\n" +
            "Utilise ¥mariage @mention pour faire une demande."
          );
        }

        const partner = await getData(spouseID);

        const familyName =
          user.data.marriageFamilyName ||
          partner.data.marriageFamilyName ||
          makeFamilyName(user.name, partner.name);

        const wallet = Number(
          user.data.marriageWallet ??
          partner.data.marriageWallet ??
          (Number(user.money || 0) + Number(partner.money || 0))
        );

        return sendText(
          
          `💍 𝗩𝗢𝗧𝗥𝗘 𝗨𝗡𝗜𝗢𝗡\n\n` +
          `👑 ${user.name} ♡ ${partner.name}\n` +
          `🏰 Nom familial : ${familyName}\n` +
          `📅 Mariage : ${formatDate(user.data.marriageSince)}\n` +
          `💰 Fortune commune : ${formatMoney(wallet)}`
        );
      }

      // ACCEPTER UNE DEMANDE
      if (sub === "accept") {
        const user = await getData(uid);
        const proposal = user.data.marriageProposal;

        if (!proposal) {
          return sendText("💌 Tu n'as aucune demande en attente.");
        }

        if (user.data.spouse) {
          return sendText("💍 Tu es déjà marié(e).");
        }

        const partnerID = String(proposal.from);
        const partner = await getData(partnerID);

        if (partner.data.spouse) {
          delete user.data.marriageProposal;
          await saveUser(uid, user);

          return sendText(
            "💔 Cette personne est déjà mariée. La demande est devenue invalide."
          );
        }

        const date = Date.now();
        const familyName = makeFamilyName(user.name, partner.name);
        const wallet = Number(user.money || 0) + Number(partner.money || 0);

        user.data.spouse = partnerID;
        partner.data.spouse = uid;

        user.data.marriageSince = date;
        partner.data.marriageSince = date;

        user.data.marriageFamilyName = familyName;
        partner.data.marriageFamilyName = familyName;

        user.data.marriageWallet = wallet;
        partner.data.marriageWallet = wallet;

        delete user.data.marriageProposal;
        delete partner.data.marriageProposal;

        await saveUser(uid, user);
        await saveUser(partnerID, partner);

        await cancelOutgoing(uid);
        await cancelOutgoing(partnerID);

        const poster = await makeMarriagePoster(
          uid,
          partnerID,
          familyName,
          date
        );

        return sendPoster(
          poster,
          `marriage_accept_${Date.now()}.png`,
          "💍 𝗠𝗔𝗥𝗜𝗔𝗚𝗘 𝗖𝗘́𝗟𝗘́𝗕𝗥𝗘́ !"
        );
      }

      // REFUSER UNE DEMANDE
      if (sub === "refuse" || sub === "refuser") {
        const user = await getData(uid);
        const proposal = user.data.marriageProposal;

        if (!proposal) {
          return sendText("💌 Tu n'as aucune demande à refuser.");
        }

        const partnerID = String(proposal.from);
        const partner = await getData(partnerID);

        delete user.data.marriageProposal;

        partner.data.marriageInvitations =
          (partner.data.marriageInvitations || [])
            .filter(id => String(id) !== uid);

        await saveUser(uid, user);
        await saveUser(partnerID, partner);

        const poster = await makeRefusalPoster(partnerID, uid);

        return sendPoster(
          poster,
          `marriage_refuse_${Date.now()}.png`,
          "💔 𝗗𝗘𝗠𝗔𝗡𝗗𝗘 𝗥𝗘𝗙𝗨𝗦𝗘́𝗘"
        );
      }

      // DESTIN
      if (sub === "destin") {
        const user = await getData(uid);
        const spouseID = user.data.spouse;

        if (!spouseID) {
          return sendText("💔 Tu n'es pas encore marié(e).");
        }

        const partner = await getData(spouseID);
        const destin = [
          "❤️ Votre amour semble écrit dans les étoiles.",
          "🌙 Deux âmes, un seul destin.",
          "🖤 Même dans les ténèbres, votre union reste intacte.",
          "👑 Votre histoire pourrait devenir une légende.",
          "💍 Votre lien est solide, mais prenez-en soin.",
          "🥀 Le destin vous a réunis. À vous de faire durer cette histoire."
        ];

        const result = destin[Math.floor(Math.random() * destin.length)];

        return sendText(
          `🔮 𝗩𝗢𝗧𝗥𝗘 𝗗𝗘𝗦𝗧𝗜𝗡\n\n` +
          `👑 ${user.name} ♡ ${partner.name}\n\n` +
          `${result}`
        );
      }

      // DIVORCE
      if (sub === "divorce") {
        const user = await getData(uid);
        const spouseID = user.data.spouse;

        if (!spouseID) {
          return sendText("💔 Tu n'es pas marié(e).");
        }

        const partner = await getData(spouseID);
        const familyName =
          user.data.marriageFamilyName || "Inconnu";

        delete user.data.spouse;
        delete partner.data.spouse;

        delete user.data.marriageSince;
        delete partner.data.marriageSince;

        delete user.data.marriageFamilyName;
        delete partner.data.marriageFamilyName;

        delete user.data.marriageWallet;
        delete partner.data.marriageWallet;

        await saveUser(uid, user);
        await saveUser(spouseID, partner);

        const poster = await makeDivorcePoster(
          uid,
          spouseID,
          familyName,
          Date.now()
        );

        return sendPoster(
          poster,
          `marriage_divorce_${Date.now()}.png`,
          "💔 𝗗𝗜𝗩𝗢𝗥𝗖𝗘"
        );
      }

      // DEMANDE EN MARIAGE PAR MENTION
      if (sub === "propose" || sub === "demande") {
        const user = await getData(uid);

        if (user.data.spouse) {
          return sendText("💍 Tu es déjà marié(e).");
        }

        const mentions = Object.keys(event.mentions || {});

        if (!mentions.length) {
          return sendText(
            "💌 Mentionne la personne à qui tu souhaites faire ta demande.\n\n" +
            `Exemple : ${global.GoatBot.config.prefix}mariage propose @nom`
          );
        }

        const partnerID = String(mentions[0]);

        if (partnerID === uid) {
          return sendText("🤨 Tu ne peux pas te demander en mariage toi-même.");
        }

        const partner = await getData(partnerID);

        if (partner.data.spouse) {
          return sendText("💔 Cette personne est déjà mariée.");
        }

        if (partner.data.marriageProposal) {
          return sendText("💌 Cette personne a déjà une demande en attente.");
        }

        user.data.marriageInvitations =
          user.data.marriageInvitations || [];

        if (user.data.marriageInvitations.includes(partnerID)) {
          return sendText("💌 Tu as déjà envoyé une invitation à cette personne.");
        }

        partner.data.marriageProposal = {
          from: uid,
          date: Date.now()
        };

        user.data.marriageInvitations.push(partnerID);

        await saveUser(uid, user);
        await saveUser(partnerID, partner);

        return sendText(
          `💍 𝗗𝗘𝗠𝗔𝗡𝗗𝗘 𝗘𝗡 𝗠𝗔𝗥𝗜𝗔𝗚𝗘\n\n` +
          `👑 ${user.name} souhaite épouser ${partner.name} !\n\n` +
          `💌 Pour accepter : ${global.GoatBot.config.prefix}mariage accept\n` +
          `💔 Pour refuser : ${global.GoatBot.config.prefix}mariage refuse`
        );
      }

      // COMMANDE INCONNUE
      return sendText(
        "💍 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘 𝗠𝗔𝗥𝗜𝗔𝗚𝗘 𝗩𝟯\n\n" +
        `👑 ${global.GoatBot.config.prefix}mariage profil\n` +
        `💌 ${global.GoatBot.config.prefix}mariage propose @mention\n` +
        `💍 ${global.GoatBot.config.prefix}mariage accept\n` +
        `💔 ${global.GoatBot.config.prefix}mariage refuse\n` +
        `🔮 ${global.GoatBot.config.prefix}mariage destin\n` +
        `🥀 ${global.GoatBot.config.prefix}mariage divorce`
      );

    } catch (error) {
      console.error("Erreur commande mariage :", error);
      return sendText(
        "❌ Une erreur est survenue pendant l'exécution de la commande."
      );
    }
  }
};
