
      target.data.marriageProposal = {
        from: uid,
        threadID,
        date: Date.now()
      };

      user.data.marriageInvitations = [
        ...(user.data.marriageInvitations || []),
        targetID
      ];

      await saveUser(targetID, target);
      await saveUser(uid, user);

      return sendText(
        `🎲 ✨ LE DESTIN A CHOISI !\n\n` +
        `💘 Ton partenaire mystère est : ${target.name}\n` +
        `💌 La demande a été envoyée.\n\n` +
        `La personne peut utiliser $mariage accept ou $mariage refuse.`
      );
    }

    // DIVORCE
    if (sub === "divorce") {
      const user = await getData(uid);

      if (!user.data.spouse) {
        return sendText("🥀 Tu n'es pas marié(e).");
      }

      const partnerID = String(user.data.spouse);
      const partner = await getData(partnerID);

      const wallet = Number(
        user.data.marriageWallet ??
        partner.data.marriageWallet ??
        (Number(user.money || 0) + Number(partner.money || 0))
      );

      const half = Math.floor(wallet / 2);

      user.money = half;
      partner.money = wallet - half;

      delete user.data.spouse;
      delete partner.data.spouse;

      delete user.data.marriageSince;
      delete partner.data.marriageSince;

      delete user.data.marriageFamilyName;
      delete partner.data.marriageFamilyName;

      delete user.data.marriageWallet;
      delete partner.data.marriageWallet;

      await saveUser(uid, user);
      await saveUser(partnerID, partner);

      return sendText(
        `🥀 𝗗𝗜𝗩𝗢𝗥𝗖𝗘 𝗖𝗢𝗡𝗦𝗢𝗠𝗠𝗘́\n\n` +
        `💔 Votre union est terminée.\n` +
        `💰 Fortune répartie : ${formatMoney(wallet)}\n` +
        `👤 Ta part : ${formatMoney(half)}`
      );
    }

    // DEMANDE PAR MENTION
    const mentions = Object.keys(event.mentions || {});

    if (mentions.length > 0) {
      const targetID = String(mentions[0]);

      if (targetID === uid) {
        return sendText("Tu ne peux pas te demander en mariage. 😭");
      }

      const user = await getData(uid);
      const target = await getData(targetID);

      if (user.data.spouse) {
        return sendText("💍 Tu es déjà marié(e).");
      }

      if (target.data.spouse) {
        return sendText("💔 Cette personne est déjà mariée.");
      }

      if (target.data.marriageProposal) {
        return sendText("💌 Cette personne a déjà une demande en attente.");
      }

      user.data.marriageInvitations =
        user.data.marriageInvitations || [];

      target.data.marriageProposal = {
        from: uid,
        threadID,
        date: Date.now()
      };

      user.data.marriageInvitations.push(targetID);

      await saveUser(targetID, target);
      await saveUser(uid, user);

      return sendText(
        `💍 ━━━ 𝗗𝗘𝗠𝗔𝗡𝗗𝗘 𝗘𝗡 𝗠𝗔𝗥𝗜𝗔𝗚𝗘 ━━━ 💍\n\n` +
        `💌 ${user.name} demande ${target.name} en mariage !\n\n` +
        `♡ Pour accepter : $mariage accept\n` +
        `♡ Pour refuser : $mariage refuse\n\n` +
        `✦ Cette demande est valable dans tous les groupes.`
      );
    }

    return help();
  }
};
