const COIN = "₩";

const RANKS = [
  { name: "Petit voyou", exp: 0 },
  { name: "Délinquant", exp: 100 },
  { name: "Gangster", exp: 300 },
  { name: "Capo", exp: 700 },
  { name: "Parrain", exp: 1500 },
  { name: "Roi de la ville", exp: 3000 }
];

const SHOP = {
  knife: { name: "🔪 Couteau", price: 500, attack: 5 },
  pistol: { name: "🔫 Pistolet", price: 1500, attack: 15 },
  armor: { name: "🦺 Gilet pare-balles", price: 1000, defense: 10 },
  vest: { name: "🛡️ Armure renforcée", price: 2500, defense: 25 }
};

function getGang(user) {
  if (!user.data) user.data = {};
  if (!user.data.darkCity) {
    user.data.darkCity = {
      cash: 1000,
      exp: 0,
      reputation: 0,
      health: 100,
      energy: 10,
      inventory: [],
      weapon: null,
      armor: null,
      lastActions: {},
      lastDaily: 0
    };
  }

  const g = user.data.darkCity;
  g.cash ??= 1000;
  g.exp ??= 0;
  g.reputation ??= 0;
  g.health ??= 100;
  g.energy ??= 10;
  g.inventory ??= [];
  g.lastActions ??= {};
  return g;
}

function getRank(exp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (exp >= r.exp) rank = r;
  }
  return rank.name;
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(ms) {
  const minutes = Math.ceil(ms / 60000);
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  }
  return `${minutes}min`;
}

module.exports = {
  config: {
    name: "gang",
    aliases: ["gangster", "darkcity"],
    version: "1.0.0",
    author: "DARK SYSTEM",
    countDown: 3,
    role: 0,
    shortDescription: "Jeu de gangster multijoueur",
    longDescription: "Deviens le gangster le plus puissant de DARK CITY.",
    category: "GAME",
    guide: {
      en: "{pn} | profile | work | rob | attack | mission | daily | shop | buy | inventory | top"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const uid = event.senderID;
    const user = await usersData.get(uid);
    const g = getGang(user);
    const action = (args[0] || "profile").toLowerCase();

    const save = async () => {
      await usersData.set(uid, {
        money: user.money,
        exp: user.exp,
        data: user.data
      });
    };

    const getTarget = () => {
      if (event.messageReply) return event.messageReply.senderID;
      if (event.mentions && Object.keys(event.mentions).length) {
        return Object.keys(event.mentions)[0];
      }
      return null;
    };

    const useEnergy = async (cost = 1) => {
      if (g.energy < cost) {
        message.reply("⚡ Tu es épuisé ! Attends de récupérer de l'énergie.");
        return false;
      }
      g.energy -= cost;
      return true;
    };

    const cooldown = (name, duration) => {
      const now = Date.now();
      const last = g.lastActions[name] || 0;
      if (now - last < duration) {
        message.reply(`⏳ Attends encore ${formatTime(duration - (now - last))} avant de recommencer.`);
        return false;
      }
      g.lastActions[name] = now;
      return true;
    };

    // PROFIL
    if (action === "profile" || action === "profil") {
      const name = await usersData.getName(uid);
      const nextRank = RANKS.find(r => r.exp > g.exp);

      return message.reply(
`╔═══━━━〔 🩸 DARK CITY 〕━━━═══╗
       👑 PROFIL GANGSTER
╚══════════════════════════════╝

👤 Nom : ${name || event.senderID}
💀 Rang : ${getRank(g.exp)}
⭐ EXP : ${g.exp}${nextRank ? ` / ${nextRank.exp}` : " (MAX)"}
💰 Argent : ${g.cash.toLocaleString("fr-FR")} ${COIN}
🔥 Réputation : ${g.reputation}
❤️ Santé : ${g.health}/100
⚡ Énergie : ${g.energy}/10

🔫 Arme : ${g.weapon || "Aucune"}
🛡️ Protection : ${g.armor || "Aucune"}

       🖤 DARK SYSTEM 🖤`
      );
    }

    // TRAVAIL
    if (action === "work" || action === "travail") {
      if (!cooldown("work", 30000)) return;
      if (!await useEnergy(1)) return;

      const jobs = [
        "Tu as livré un colis mystérieux.",
        "Tu as travaillé pour un commerçant du quartier.",
        "Tu as effectué une mission de livraison.",
        "Tu as aidé un contact à organiser son business.",
        "Tu as récupéré une dette dans le jeu."
      ];

      const gain = random(150, 450);
      const exp = random(10, 25);

      g.cash += gain;
      g.exp += exp;
      g.reputation += random(1, 4);

      await save();
      return message.reply(
`💼 ━━━ TRAVAIL TERMINÉ ━━━

${jobs[random(0, jobs.length - 1)]}

💰 Gain : +${gain} ${COIN}
⭐ EXP : +${exp}
⚡ Énergie : ${g.energy}/10`
      );
    }

    // VOL VIRTUEL
    if (action === "rob" || action === "vol") {
      const targetID = getTarget();
      if (!targetID) return message.reply("Mentionne un joueur ou réponds à son message.\nExemple : ¥gang rob @joueur");
      if (targetID === uid) return message.reply("Tu ne peux pas te voler toi-même.");
      if (!cooldown("rob", 60000)) return;
      if (!await useEnergy(2)) return;

      const target = await usersData.get(targetID);
      const tg = getGang(target);

      if (tg.cash < 100) return message.reply("Cette cible n'a presque plus d'argent !");
      const success = Math.random() < 0.55;

      if (success) {
        const stolen = Math.min(tg.cash, random(100, 500));
        tg.cash -= stolen;
        g.cash += stolen;
        g.exp += 15;
        g.reputation += 5;

        await usersData.set(targetID, {
          money: target.money,
          exp: target.exp,
          data: target.data
        });
        await save();

        return message.reply(
`🩸 ━━━ VOL RÉUSSI ━━━

💰 Tu as volé ${stolen} ${COIN}.
⭐ +15 EXP
🔥 +5 réputation`
        );
      }

      const fine = Math.min(g.cash, random(50, 200));
      g.cash -= fine;
      g.health = Math.max(0, g.health - 15);
      await save();

      return message.reply(
`🚨 ━━━ VOL RATÉ ━━━

La cible t'a repéré !
💸 Amende : -${fine} ${COIN}
❤️ Santé : ${g.health}/100`
      );
    }

    // COMBAT
    if (action === "attack" || action === "attaquer") {
      const targetID = getTarget();
      if (!targetID) return message.reply("Mentionne un joueur à combattre.");
      if (targetID === uid) return message.reply("Tu ne peux pas te combattre toi-même.");
      if (!cooldown("attack", 45000)) return;
      if (!await useEnergy(2)) return;

      const target = await usersData.get(targetID);
      const tg = getGang(target);

      if (g.health <= 0) return message.reply("Tu es KO. Récupère ta santé avec `¥gang rest`.");
      if (tg.health <= 0) return message.reply("Ce joueur est déjà KO.");

      const myPower = random(10, 25) + (g.weapon ? (SHOP[Object.keys(SHOP).find(k => SHOP[k].name === g.weapon)]?.attack || 0) : 0);
      const enemyPower = random(10, 25) + (tg.armor ? 5 : 0);

      if (myPower >= enemyPower) {
        const damage = random(15, 30);
        tg.health = Math.max(0, tg.health - damage);
        g.exp += 20;
        g.reputation += 8;
        const reward = random(50, 200);
        g.cash += reward;

        await usersData.set(targetID, {
          money: target.money,
          exp: target.exp,
          data: target.data
        });
        await save();

        return message.reply(
`⚔️ ━━━ VICTOIRE ━━━

💀 Tu as remporté le combat !
❤️ Dégâts infligés : ${damage}
💰 Récompense : +${reward} ${COIN}
⭐ EXP : +20
❤️ Santé adverse : ${tg.health}/100`
        );
      }

      const damage = random(10, 25);
      g.health = Math.max(0, g.health - damage);
      await save();

      return message.reply(
`💥 ━━━ DÉFAITE ━━━

Ton adversaire a gagné le combat.
❤️ Dégâts reçus : ${damage}
❤️ Ta santé : ${g.health}/100`
      );
    }

    // MISSION
    if (action === "mission") {
      if (!cooldown("mission", 60000)) return;
      if (!await useEnergy(2)) return;

      const missions = [
        "Tu as récupéré une mallette dans une ruelle.",
        "Tu as aidé ton contact à retrouver un objet.",
        "Tu as protégé un commerce fictif.",
        "Tu as terminé une livraison secrète.",
        "Tu as récupéré des informations pour ton équipe."
      ];

      const gain = random(300, 700);
      const exp = random(20, 40);
      g.cash += gain;
      g.exp += exp;
      g.reputation += random(5, 12);

      await save();
      return message.reply(
`🎯 ━━━ MISSION TERMINÉE ━━━

${missions[random(0, missions.length - 1)]}

💰 Récompense : +${gain} ${COIN}
⭐ EXP : +${exp}
🔥 Réputation : ${g.reputation}`
      );
    }

    // RÉCOMPENSE QUOTIDIENNE
    if (action === "daily") {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      if (now - g.lastDaily < day) {
        return message.reply(`⏳ Tu as déjà récupéré ta récompense.\nReviens dans ${formatTime(day - (now - g.lastDaily))}.`);
      }

      const reward = random(500, 1000);
      g.cash += reward;
      g.exp += 30;
      g.energy = 10;
      g.health = Math.min(100, g.health + 30);
      g.lastDaily = now;

      await save();
      return message.reply(
`🎁 ━━━ RÉCOMPENSE QUOTIDIENNE ━━━

💰 +${reward} ${COIN}
⭐ +30 EXP
⚡ Énergie restaurée
❤️ +30 santé`
      );
    }

    // BOUTIQUE
    if (action === "shop" || action === "boutique") {
      return message.reply(
`🛒 ━━━ DARK CITY SHOP ━━━

🔪 knife : Couteau | 500 ${COIN}
🔫 pistol : Pistolet | 1 500 ${COIN}
🦺 armor : Gilet pare-balles | 1 000 ${COIN}
🛡️ vest : Armure renforcée | 2 500 ${COIN}

💰 Ton argent : ${g.cash} ${COIN}

Pour acheter :
¥gang buy knife`
      );
    }

    // ACHETER
    if (action === "buy" || action === "acheter") {
      const itemID = (args[1] || "").toLowerCase();
      const item = SHOP[itemID];

      if (!item) return message.reply("Objet inconnu. Utilise `¥gang shop`.");
      if (g.cash < item.price) return message.reply("💸 Tu n'as pas assez d'argent.");

      if (g.inventory.includes(itemID)) {
        return message.reply("Tu possèdes déjà cet objet.");
      }

      g.cash -= item.price;
      g.inventory.push(itemID);

      if (item.attack) g.weapon = item.name;
      if (item.defense) g.armor = item.name;

      await save();
      return message.reply(
`🛍️ ━━━ ACHAT RÉUSSI ━━━

${item.name}
💰 Prix : ${item.price} ${COIN}
💵 Solde : ${g.cash} ${COIN}`
      );
    }

    // INVENTAIRE
    if (action === "inventory" || action === "inventaire") {
      const items = g.inventory.length
        ? g.inventory.map(id => SHOP[id]?.name || id).join("\n")
        : "Ton inventaire est vide.";

      return message.reply(
`🎒 ━━━ INVENTAIRE ━━━

${items}

🔫 Arme équipée : ${g.weapon || "Aucune"}
🛡️ Protection : ${g.armor || "Aucune"}`
      );
    }

    // REPOS
    if (action === "rest" || action === "repos") {
      const oldHealth = g.health;
      const oldEnergy = g.energy;
      g.health = Math.min(100, g.health + 30);
      g.energy = Math.min(10, g.energy + 3);

      await save();
      return message.reply(
`🛌 ━━━ REPOS ━━━

❤️ Santé : ${oldHealth} → ${g.health}
⚡ Énergie : ${oldEnergy} → ${g.energy}`
      );
    }

    // CLASSEMENT
    if (action === "top" || action === "rank") {
      const allUsers = await usersData.getAll();
      const players = [];

      for (const u of allUsers) {
        if (!u.userID) continue;
        const data = u.data?.darkCity;
        if (!data) continue;

        players.push({
          id: u.userID,
          cash: data.cash || 0,
          exp: data.exp || 0,
          reputation: data.reputation || 0
        });
      }

      players.sort((a, b) => b.reputation - a.reputation);

      const top = players.slice(0, 10);
      if (!top.length) return message.reply("Aucun gangster dans le classement.");

      let result = "👑 ━━━ TOP GANGSTERS ━━━\n\n";
      for (let i = 0; i < top.length; i++) {
        result += `${i + 1}. ${top[i].id === uid ? "⭐ Toi" : "Gangster"}\n`;
        result += `🔥 REP : ${top[i].reputation} | ⭐ EXP : ${top[i].exp}\n\n`;
      }

      return message.reply(result);
    }

    // AIDE
    return message.reply(
`🩸 ━━━ DARK CITY : AIDE ━━━

👤 ¥gang profile : Profil
💼 ¥gang work : Travailler
💰 ¥gang rob @user : Voler virtuellement
⚔️ ¥gang attack @user : Combattre
🎯 ¥gang mission : Mission
🎁 ¥gang daily : Récompense quotidienne
🛒 ¥gang shop : Boutique
🛍️ ¥gang buy knife : Acheter
🎒 ¥gang inventory : Inventaire
🛌 ¥gang rest : Se reposer
👑 ¥gang top : Classement

🖤 Deviens le roi de DARK CITY.`
    );
  }
};
  
