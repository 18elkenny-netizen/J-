
const jobs = {
  debutant: {
    name: "Employé débutant",
    level: 1,
    min: 100,
    max: 250,
    exp: 15
  },
  medecin: {
    name: "Médecin",
    level: 2,
    min: 250,
    max: 500,
    exp: 25
  },
  policier: {
    name: "Policier",
    level: 4,
    min: 400,
    max: 700,
    exp: 30
  },
  mecanicien: {
    name: "Mécanicien",
    level: 6,
    min: 550,
    max: 900,
    exp: 35
  },
  hacker: {
    name: "Hacker",
    level: 8,
    min: 800,
    max: 1400,
    exp: 45
  },
  ingenieur: {
    name: "Ingénieur",
    level: 10,
    min: 1200,
    max: 1800,
    exp: 55
  },
  assassin: {
    name: "Assassin",
    level: 12,
    min: 1500,
    max: 2500,
    exp: 65
  }
};

const missions = [
  {
    name: "Livraison urgente",
    min: 300,
    max: 600,
    exp: 25,
    success: 90
  },
  {
    name: "Mission secrète",
    min: 600,
    max: 1200,
    exp: 40,
    success: 75
  },
  {
    name: "Opération spéciale",
    min: 1000,
    max: 2000,
    exp: 60,
    success: 60
  },
  {
    name: "Contrat légendaire",
    min: 2000,
    max: 4000,
    exp: 100,
    success: 40
  }
];

const getLevel = (xp) => {
  let level = 1;
  let required = 100;
  let remaining = Number(xp || 0);

  while (remaining >= required) {
    remaining -= required;
    level++;
    required = level * 100;
  }

  return level;
};

const getNextLevelXP = (xp) => {
  let level = getLevel(xp);
  let total = 0;

  for (let i = 1; i < level; i++) {
    total += i * 100;
  }

  return {
    current: Number(xp || 0) - total,
    required: level * 100
  };
};

const formatMoney = (amount) => {
  return Number(amount || 0).toLocaleString("fr-FR");
};

module.exports = {
  config: {
    name: "work",
    version: "1.0",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    description: {
      en: "Work, choose a career and complete missions",
      vi: "Làm việc, chọn nghề nghiệp và hoàn thành nhiệm vụ"
    },
    category: "game",
    guide: {
      en:
        "{pn}: Work and earn money" +
        "\n{pn} jobs: View available careers" +
        "\n{pn} choose <job>: Choose a career" +
        "\n{pn} mission: Complete a random mission" +
        "\n{pn} profile: View your career profile" +
        "\n{pn} promote: Get a promotion",
      vi:
        "{pn}: Làm việc kiếm tiền" +
        "\n{pn} jobs: Xem danh sách nghề nghiệp" +
        "\n{pn} choose <job>: Chọn nghề nghiệp" +
        "\n{pn} mission: Làm nhiệm vụ" +
        "\n{pn} profile: Xem hồ sơ nghề nghiệp" +
        "\n{pn} promote: Thăng chức"
    }
  },

  onStart: async function ({
    args,
    message,
    event,
    usersData
  }) {
    const uid = event.senderID;
    const userData = await usersData.get(uid);

    userData.data = userData.data || {};

    let work = userData.data.workRpg || {
      job: null,
      xp: 0,
      rank: 0,
      lastWork: 0,
      lastMission: 0,
      totalEarned: 0,
      totalWorks: 0,
      totalMissions: 0
    };

    const save = async () => {
      userData.data.workRpg = work;

      await usersData.set(uid, {
        money: Number(userData.money || 0),
        exp: Number(userData.exp || 0),
        data: userData.data
      });
    };

    const sub = (args[0] || "").toLowerCase();

    // AFFICHER LES MÉTIERS
    if (sub === "jobs") {
      let text = "💼 ━━━ 𝗟𝗜𝗦𝗧𝗘 𝗗𝗘𝗦 𝗠𝗘́𝗧𝗜𝗘𝗥𝗦 ━━━ 💼\n\n";

      for (const [key, job] of Object.entries(jobs)) {
        const status = getLevel(work.xp) >= job.level
          ? "✅ Disponible"
          : `🔒 Niveau ${job.level}`;

        text +=
          `✦ ${job.name}\n` +
          `   🪙 Salaire : ${formatMoney(job.min)} à ${formatMoney(job.max)}\n` +
          `   ⭐ XP : ${job.exp}\n` +
          `   ${status}\n` +
          `   🔑 Identifiant : ${key}\n\n`;
      }

      return message.reply(text);
    }

    // CHOISIR UN MÉTIER
    if (sub === "choose") {
      const jobKey = (args[1] || "").toLowerCase();
      const job = jobs[jobKey];

      if (!job) {
        return message.reply(
          "❌ Métier introuvable.\nUtilise : work jobs"
        );
      }

      const level = getLevel(work.xp);

      if (level < job.level) {
        return message.reply(
          `🔒 Tu dois atteindre le niveau ${job.level} pour devenir ${job.name}.\n` +
          `⭐ Ton niveau actuel : ${level}`
        );
      }

      work.job = jobKey;
      await save();

      return message.reply(
        `💼 ━━━ 𝗡𝗢𝗨𝗩𝗘𝗔𝗨 𝗠𝗘́𝗧𝗜𝗘𝗥 ━━━ 💼\n\n` +
        `🎉 Tu es maintenant ${job.name} !\n` +
        `🪙 Salaire : ${formatMoney(job.min)} à ${formatMoney(job.max)}\n` +
        `⭐ XP par travail : ${job.exp}\n\n` +
        `Utilise "work" pour commencer à travailler.`
      );
    }

    // PROFIL PROFESSIONNEL
    if (sub === "profile") {
      const level = getLevel(work.xp);
      const xpInfo = getNextLevelXP(work.xp);
      const job = work.job ? jobs[work.job] : null;

      const rankNames = [
        "Stagiaire",
        "Employé confirmé",
        "Professionnel",
        "Expert",
        "Directeur",
        "Légende"
      ];

      const rank = rankNames[
        Math.min(work.rank || 0, rankNames.length - 1)
      ];

      return message.reply(
        `💼 ━━━ 𝗣𝗥𝗢𝗙𝗜𝗟 𝗣𝗥𝗢𝗙𝗘𝗦𝗦𝗜𝗢𝗡𝗡𝗘𝗟 ━━━ 💼\n\n` +
        `👤 Joueur : ${userData.name || "Inconnu"}\n` +
        `💼 Métier : ${job ? job.name : "Aucun métier"}\n` +
        `🏅 Rang : ${rank}\n` +
        `⭐ Niveau : ${level}\n` +
        `✨ Expérience : ${xpInfo.current}/${xpInfo.required} XP\n\n` +
        `💰 Argent gagné : ${formatMoney(work.totalEarned)}\n` +
        `🔨 Travaux effectués : ${work.totalWorks}\n` +
        `🎯 Missions terminées : ${work.totalMissions}`
      );
    }

    // PROMOTION
    if (sub === "promote") {
      if (!work.job) {
        return message.reply(
          "❌ Tu dois d'abord choisir un métier avec work choose."
        );
      }

      const level = getLevel(work.xp);
      const promotionLevels = [3, 5, 8, 12, 16];

      const nextRank = (work.rank || 0) + 1;
      const requiredLevel = promotionLevels[nextRank - 1];

      if (!requiredLevel) {
        return message.reply(
          "👑 Tu as déjà atteint le rang professionnel maximum !"
        );
      }

      if (level < requiredLevel) {
        return message.reply(
          `🔒 Promotion refusée !\n\n` +
          `⭐ Niveau requis : ${requiredLevel}\n` +
          `⭐ Ton niveau : ${level}`
        );
      }

      work.rank = nextRank;
      await save();

      const rankNames = [
        "Stagiaire",
        "Employé confirmé",
        "Professionnel",
        "Expert",
        "Directeur",
        "Légende"
      ];

      return message.reply(
        `🏆 ━━━ 𝗣𝗥𝗢𝗠𝗢𝗧𝗜𝗢𝗡 ━━━ 🏆\n\n` +
        `🎉 Félicitations ! Tu as été promu(e) !\n` +
        `💼 Métier : ${jobs[work.job].name}\n` +
        `🏅 Nouveau rang : ${rankNames[nextRank]}\n` +
        `⭐ Niveau : ${level}\n` +
        `💰 Bonus salarial : +${nextRank * 15}%`
      );
    }

    // MISSIONS
    if (sub === "mission") {
      if (!work.job) {
        return message.reply(
          "❌ Tu dois choisir un métier avant de faire des missions.\nUtilise work jobs."
        );
      }

      const now = Date.now();
      const cooldown = 5 * 60 * 1000;
      const remaining = cooldown - (now - work.lastMission);

      if (remaining > 0) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.ceil((remaining % 60000) / 1000);

        return message.reply(
          `⏳ Tu dois attendre ${minutes} min ${seconds} sec avant ta prochaine mission.`
        );
      }

      const mission = missions[
        Math.floor(Math.random() * missions.length)
      ];

      const success = Math.random() * 100 < mission.success;

      work.lastMission = now;

      if (success) {
        const reward = Math.floor(
          Math.random() * (mission.max - mission.min + 1)
        ) + mission.min;

        const bonus = 1 + (work.rank || 0) * 0.15;
        const finalReward = Math.floor(reward * bonus);

        userData.money = Number(userData.money || 0) + finalReward;
        work.xp += mission.exp;
        work.totalEarned += finalReward;
        work.totalMissions++;

        await save();

        return message.reply(
          `🎯 ━━━ 𝗠𝗜𝗦𝗦𝗜𝗢𝗡 𝗥𝗘́𝗨𝗦𝗦𝗜𝗘 ━━━ 🎯\n\n` +
          `📌 Mission : ${mission.name}\n` +
          `💰 Récompense : ${formatMoney(finalReward)}\n` +
          `⭐ XP gagnée : ${mission.exp}\n` +
          `🏅 Rang : ${work.rank || 0}\n\n` +
          `💼 Continue à progresser dans ta carrière !`
        );
      }

      const penalty = Math.floor(mission.min * 0.1);

      userData.money = Math.max(
        0,
        Number(userData.money || 0) - penalty
      );

      await save();

      return message.reply(
        `💥 ━━━ 𝗠𝗜𝗦𝗦𝗜𝗢𝗡 𝗘́𝗖𝗛𝗢𝗨𝗘 ━━━ 💥\n\n` +
        `📌 Mission : ${mission.name}\n` +
        `🥀 Tu as échoué dans ta mission.\n` +
        `💸 Pénalité : ${formatMoney(penalty)}\n` +
        `⏳ Tu pourras réessayer dans 5 minutes.`
      );
    }

    // TRAVAIL CLASSIQUE
    if (!work.job) {
      return message.reply(
        `💼 Tu n'as pas encore de métier !\n\n` +
        `Utilise "work jobs" pour voir les métiers.\n` +
        `Puis "work choose debutant" pour commencer.`
      );
    }

    const now = Date.now();
    const cooldown = 60 * 1000;
    const remaining = cooldown - (now - work.lastWork);

    if (remaining > 0) {
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.ceil((remaining % 60000) / 1000);

      return message.reply(
        `⏳ Tu es fatigué(e) !\nAttends encore ${minutes} min ${seconds} sec avant de retravailler.`
      );
    }

    const job = jobs[work.job];

    const baseReward = Math.floor(
      Math.random() * (job.max - job.min + 1)
    ) + job.min;

    const bonus = 1 + (work.rank || 0) * 0.15;
    const reward = Math.floor(baseReward * bonus);

    const gainedXP = job.exp;

    userData.money = Number(userData.money || 0) + reward;

    work.xp += gainedXP;
    work.lastWork = now;
    work.totalEarned += reward;
    work.totalWorks++;

    const oldLevel = getLevel(work.xp - gainedXP);
    const newLevel = getLevel(work.xp);

    await save();

    return message.reply(
      `💼 ━━━ 𝗧𝗥𝗔𝗩𝗔𝗜𝗟 𝗧𝗘𝗥𝗠𝗜𝗡𝗘́ ━━━ 💼\n\n` +
      `👤 Employé : ${userData.name || "Inconnu"}\n` +
      `💼 Métier : ${job.name}\n` +
      `💰 Salaire reçu : ${formatMoney(reward)}\n` +
      `⭐ XP gagnée : ${gainedXP}\n` +
      `🏅 Rang : ${work.rank || 0}\n\n` +
      `📈 Niveau : ${newLevel}` +
      (newLevel > oldLevel
        ? `\n🎉 NOUVEAU NIVEAU ATTEINT !`
        : "") +
      `\n💵 Ton argent : ${formatMoney(userData.money)}`
    );
  }
};
    
