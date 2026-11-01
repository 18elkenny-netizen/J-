
const MAX_MONEY = Number.MAX_SAFE_INTEGER;

function parseAmount(input) {
  const match = String(input || "").trim().replace(/,/g, ".")
    .match(/^(\d+(?:\.\d+)?)(k|m|b|t)?$/i);

  if (!match) return null;

  const multipliers = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12
  };

  const amount = Number(match[1]) * (multipliers[(match[2] || "").toLowerCase()] || 1);

  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_MONEY) {
    return null;
  }

  return amount;
}

function moneyFormat(value) {
  return Math.floor(value).toLocaleString("fr-FR");
}

module.exports = {
  config: {
    name: "give",
    aliases: ["donner", "transfer"],
    version: "1.0.0",
    author: "DARK SYSTEM",
    countDown: 3,
    role: 0,
    shortDescription: "Transférer de l'argent",
    category: "BANK",
    guide: "{pn} montant @membre ou en répondant à son message"
  },

  onStart: async function ({ event, args, message, usersData }) {
    const senderID = event.senderID;

    // Trouver le destinataire par mention ou réponse
    let targetID = event.messageReply?.senderID;

    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }

    if (!targetID) {
      return message.reply(
`╔═══━━━〔 🏦 DARK BANK 〕━━━═══╗

❌ DESTINATAIRE INTROUVABLE

Mentionne un joueur ou réponds à son message.

💸 Exemple :
¥give 10000 @membre

╚══════════════════════════╝`
      );
    }

    if (targetID === senderID) {
      return message.reply("❌ Tu ne peux pas transférer de l'argent à ton propre compte.");
    }

    // Le montant est le premier argument
    const amount = parseAmount(args[0]);

    if (!amount) {
      return message.reply(
`╔═══━━━〔 💰 TRANSFERT 〕━━━═══╗

❌ MONTANT INVALIDE

Exemples :
¥give 10000
¥give 10K
¥give 2M
¥give 1B

╚══════════════════════════╝`
      );
    }

    try {
      const sender = await usersData.get(senderID);
      const receiver = await usersData.get(targetID);

      const senderMoney = Number(sender.money || 0);
      const receiverMoney = Number(receiver.money || 0);

      if (!Number.isSafeInteger(senderMoney) || senderMoney < 0 ||
          !Number.isSafeInteger(receiverMoney) || receiverMoney < 0) {
        return message.reply("❌ Impossible de vérifier les comptes. Contacte un administrateur.");
      }

      if (senderMoney < amount) {
        return message.reply(
`╔═══━━━〔 🏦 DARK BANK 〕━━━═══╗

❌ SOLDE INSUFFISANT

💰 Ton solde : ${moneyFormat(senderMoney)} ₩
💸 Transfert demandé : ${moneyFormat(amount)} ₩

╚══════════════════════════╝`
        );
      }

      if (receiverMoney + amount > Number.MAX_SAFE_INTEGER) {
        return message.reply("❌ Le compte du destinataire ne peut pas recevoir ce montant.");
      }

      // Débit et crédit
      await usersData.set(senderID, {
        money: senderMoney - amount,
        exp: sender.exp || 0,
        data: sender.data || {}
      });

      try {
        await usersData.set(targetID, {
          money: receiverMoney + amount,
          exp: receiver.exp || 0,
          data: receiver.data || {}
        });
      } catch (error) {
        // Tentative de remboursement si le crédit échoue
        await usersData.set(senderID, {
          money: senderMoney,
          exp: sender.exp || 0,
          data: sender.data || {}
        });
        throw error;
      }

      const senderName = await usersData.getName(senderID);
      const receiverName = await usersData.getName(targetID);

      return message.reply(
`╔═══━━━〔 🩸 DARK BANK 〕━━━═══╗
       👑 TRANSACTION VALIDÉE
╚══════════════════════════╝

💸 MONTANT TRANSFÉRÉ
       +${moneyFormat(amount)} ₩

👤 EXPÉDITEUR
${senderName || "Gangster"}

👤 DESTINATAIRE
${receiverName || "Gangster"}

━━━━━━━━━━━━━━━━━━━━
💰 TON NOUVEAU SOLDE
${moneyFormat(senderMoney - amount)} ₩

<|> 🔒 STATUT : CONFIRMÉ
       🏦 DARK SYSTEM BANK
╚══════════════════════════╝`
      );

    } catch (error) {
      console.error("[DARK BANK GIVE]", error);
      return message.reply("❌ Une erreur est survenue pendant le transfert. Aucun transfert confirmé.");
    }
  }
};
    
