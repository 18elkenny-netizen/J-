
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "4.0.0",
    author: "Dark",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "NEON SYSTEM command center"
    },
    longDescription: {
      en: "Display all available commands and their information"
    },
    category: "info",
    guide: {
      en: "{pn} | {pn} commandName"
    },
    priority: 1
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);
    const botName = global.GoatBot.config.nickNameBot || "NEON SYSTEM";

    const visibleCommands = [...commands.entries()]
      .filter(([name, command]) => {
        const config = command.config || {};
        return (config.role ?? 0) <= role;
      });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //       NEON SYSTEM MAIN MENU
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (args.length === 0) {
      const categories = {};

      for (const [name, command] of visibleCommands) {
        const category = (
          command.config?.category || "OTHER"
        ).toUpperCase();

        if (!categories[category]) {
          categories[category] = [];
        }

        categories[category].push(name);
      }

      const categoryNames = Object.keys(categories).sort(
        (a, b) => a.localeCompare(b)
      );

      const icons = {
        "BOX": "▣",
        "BOX CHAT": "▣",
        "ECONOMY": "◈",
        "WALLET": "◈",
        "GAME": "⚔",
        "GAMES": "⚔",
        "FUN": "✧",
        "FUN & GAME": "✧",
        "ADMIN": "♜",
        "OWNER": "♛",
        "INFO": "◉",
        "INFORMATION": "◉",
        "UTILITY": "⌘",
        "TOOLS": "⚙",
        "IMAGE": "▧",
        "MEDIA": "♫",
        "ANIME": "✿",
        "CHAT": "◌",
        "SYSTEM": "⌬",
        "MUSIC": "♫",
        "AI": "⌘",
        "SOCIAL": "♡",
        "RANK": "▤",
        "EDUCATION": "▣",
        "DOWNLOAD": "⇩",
        "OTHER": "✦"
      };

      let msg = "";

      msg += "╔══════════════════════════════╗\n";
      msg += "       ⟦ 𝗡𝗘𝗢𝗡 𝗦𝗬𝗦𝗧𝗘𝗠 ⟧\n";
      msg += "╚══════════════════════════════╝\n\n";

      msg += "       𖤐 𝗗𝗔𝗥𝗞 𝗡𝗘𝗧𝗪𝗢𝗥𝗞 𖤐\n";
      msg += "  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n";
      msg += `  ◈ 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 : ${botName}\n`;
      msg += "  ◈ 𝗦𝗧𝗔𝗧𝗨𝗦 : SYSTEM ONLINE\n";
      msg += "  ◈ 𝗔𝗖𝗖𝗘𝗦𝗦 : GRANTED\n";
      msg += "  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n";

      for (const category of categoryNames) {
        const names = categories[category].sort(
          (a, b) => a.localeCompare(b)
        );

        const icon = icons[category] || "◆";

        msg += "\n\n";
        msg += `╭━━〔 ${icon} 𝗡𝗘𝗢𝗡_${category.replace(/[^A-Z0-9]/g, "_")} 〕\n`;

        for (let i = 0; i < names.length; i += 2) {
          const first = names[i];
          const second = names[i + 1];

          let line = `┃ ▸ ${first}`;

          if (second) {
            line += `  ⟡  ${second}`;
          }

          msg += line + "\n";
        }

        msg += "╰━━━━━━━━━━━━━━━━━━━━━━";
      }

      msg += "\n\n";
      msg += "╔══════════════════════════════╗\n";
      msg += "       ⟦ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢 ⟧\n";
      msg += "╠══════════════════════════════╣\n";
      msg += `┃ ◈ TOTAL CMDS : ${visibleCommands.length}\n`;
      msg += `┃ ◈ PREFIX : ${prefix}\n`;
      msg += `┃ ◈ BOT : ${botName}\n`;
      msg += "╠══════════════════════════════╣\n";
      msg += `┃ ▸ HELP : ${prefix}help <commande>\n`;
      msg += `┃ ▸ EXAMPLE : ${prefix}help work\n`;
      msg += `┃ ▸ EXAMPLE : ${prefix}help mariage\n`;
      msg += "╠══════════════════════════════╣\n";
      msg += "┃ 𖤐 POWERED BY DARK SYSTEM\n";
      msg += "┃ ⚡ CONNECTION : STABLE\n";
      msg += "╚══════════════════════════════╝\n";
      msg += "\n       𖤐 END OF COMMAND LIST 𖤐";

      return message.reply({ body: msg });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //       COMMAND INFORMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const commandName = args[0].toLowerCase();
    const aliasName = aliases.get(commandName);

    const command =
      commands.get(commandName) ||
      (aliasName ? commands.get(aliasName) : null);

    if (!command) {
      return message.reply(
        "╔══════════════════════════════╗\n" +
        "       ⟦ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗘𝗥𝗥𝗢𝗥 ⟧\n" +
        "╠══════════════════════════════╣\n" +
        "┃ ✖ COMMAND NOT FOUND\n" +
        "┃\n" +
        "┃ Cette commande est introuvable.\n" +
        "┃ Vérifie son nom et réessaie.\n" +
        "╚══════════════════════════════╝"
      );
    }

    const config = command.config || {};

    if ((config.role ?? 0) > role) {
      return message.reply(
        "⛔ ACCESS DENIED\n\nTu n'as pas la permission d'utiliser cette commande."
      );
    }

    const getText = (value, fallback) => {
      if (typeof value === "string") {
        return value;
      }

      if (value && typeof value === "object") {
        return value.fr || value.en || value.vi || fallback;
      }

      return fallback;
    };

    const description = getText(
      config.longDescription || config.shortDescription,
      "Aucune description disponible"
    );

    const guide = getText(
      config.guide,
      "Aucune utilisation disponible"
    );

    const usage = guide
      .replace(/{pn}/g, prefix + config.name)
      .replace(/{p}/g, prefix)
      .replace(/{n}/g, config.name);

    const aliasesList = config.aliases
      ? Array.isArray(config.aliases)
        ? config.aliases.join(", ")
        : config.aliases
      : "Aucun";

    const response =
      "╔══════════════════════════════╗\n" +
      "       ⟦ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗗𝗔𝗧𝗔 ⟧\n" +
      "╚══════════════════════════════╝\n\n" +

      "╭━━〔 ◈ 𝗜𝗗𝗘𝗡𝗧𝗜𝗧𝗬 〕\n" +
      `┃ ▸ NAME : ${config.name}\n` +
      `┃ ▸ ALIAS : ${aliasesList}\n` +
      `┃ ▸ VERSION : ${config.version || "1.0"}\n` +
      `┃ ▸ CATEGORY : ${(config.category || "OTHER").toUpperCase()}\n` +
      "╰━━━━━━━━━━━━━━━━━━━━━━\n\n" +

      "╭━━〔 ⌬ 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 〕\n" +
      `┃ ▸ DESCRIPTION : ${description}\n` +
      `┃ ▸ AUTHOR : ${config.author || "Unknown"}\n` +
      `┃ ▸ PERMISSION : ${roleTextToString(config.role ?? 0)}\n` +
      `┃ ▸ COOLDOWN : ${config.countDown || 1}s\n` +
      "╰━━━━━━━━━━━━━━━━━━━━━━\n\n" +

      "╭━━〔 ⚡ 𝗨𝗦𝗔𝗚𝗘 〕\n" +
      `┃ ${usage}\n` +
      "╰━━━━━━━━━━━━━━━━━━━━━━\n\n" +

      "       ⟦ 𝗡𝗘𝗢𝗡 𝗦𝗬𝗦𝗧𝗘𝗠 ⟧\n" +
      "       𖤐 ACCESS GRANTED 𖤐";

    return message.reply(response);
  }
};

function roleTextToString(role) {
  switch (role) {
    case 0:
      return "Tout le monde";
    case 1:
      return "Administrateurs du groupe";
    case 2:
      return "Administrateurs du bot";
    default:
      return "Permission " + role;
  }
}
