
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Convertit les très grands nombres en BigInt
function toBigInt(value) {
  if (typeof value === "bigint") return value;

  if (typeof value === "number" && !Number.isFinite(value)) {
    return null;
  }

  const str = String(value ?? 0)
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const match = str.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);

  if (!match) return 0n;

  const sign = match[1] === "-" ? "-" : "";
  const integer = match[2];
  const decimal = match[3] || "";
  const exponent = Number(match[4] || 0);

  let digits = integer + decimal;
  const scale = decimal.length - exponent;

  if (scale > 0) {
    digits = digits.slice(0, Math.max(0, digits.length - scale)) || "0";
  } else if (scale < 0) {
    digits += "0".repeat(Math.min(1000, -scale));
  }

  return BigInt(sign + digits);
}

// Format compact : K, M, B, T, Qa, Qi...
function formatMoney(value) {
  const number = toBigInt(value);

  if (number === null) return "∞";

  const negative = number < 0n;
  const amount = negative ? -number : number;

  const units = [
    "",
    "K",
    "M",
    "B",
    "T",
    "Qa",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "No",
    "Dc",
    "Ud",
    "Dd",
    "Td",
    "Qad",
    "Qid",
    "Sxd",
    "Spd",
    "Ocd",
    "Nod",
    "Vg"
  ];

  if (amount < 1000n) {
    return (negative ? "-" : "") +
      amount.toLocaleString("fr-FR") + " $";
  }

  let level = 0;
  let divisor = 1n;

  while (amount >= divisor * 1000n && level < units.length - 1) {
    divisor *= 1000n;
    level++;
  }

  const whole = amount / divisor;
  const remainder = amount % divisor;

  const decimals = (remainder * 100n / divisor)
    .toString()
    .padStart(2, "0")
    .replace(/0+$/, "");

  const formatted = decimals
    ? `${whole}.${decimals}`
    : whole.toString();

  return `${negative ? "-" : ""}${formatted} ${units[level]} $`;
}

module.exports = {
  config: {
    name: "bal",
    version: "2.0.0",
    author: "Dark",
    countDown: 5,
    role: 0,
    shortDescription: "Voir son argent",
    longDescription: "Affiche ton solde total",
    category: "economy",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, event, usersData, api }) {
    try {
      const uid = event.senderID;
      const userData = await usersData.get(uid);

      // Ne pas convertir le solde en Number !
      const balance = userData.money ?? 0;
      const money = formatMoney(balance);

      let name = "Joueur";
      let avatar = null;

      try {
        const info = await api.getUserInfo(uid);
        const profile = info[uid] || info;

        name = profile.name || profile.fullName || name;

        const avatarUrl =
          profile.thumbSrc ||
          profile.profilePic ||
          profile.picture;

        if (avatarUrl) {
          const response = await axios.get(avatarUrl, {
            responseType: "arraybuffer",
            timeout: 10000
          });

          avatar = await loadImage(response.data);
        }
      } catch (e) {
        console.log("Impossible de charger le profil :", e.message);
      }

      const width = 1000;
      const height = 600;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Fond
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#10091f");
      bg.addColorStop(0.5, "#251044");
      bg.addColorStop(1, "#080611");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Bordure dorée
      ctx.strokeStyle = "#d6ad55";
      ctx.lineWidth = 5;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Titre
      ctx.textAlign = "center";
      ctx.fillStyle = "#d6ad55";
      ctx.font = "bold 38px Arial";
      ctx.fillText("♛  DARK CASINO  ♛", 500, 85);

      ctx.fillStyle = "#c7a6ff";
      ctx.font = "bold 25px Arial";
      ctx.fillText("PLAYER BALANCE", 500, 135);

      // Avatar
      if (avatar) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(500, 245, 75, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 425, 170, 150, 150);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(500, 245, 78, 0, Math.PI * 2);
        ctx.strokeStyle = "#e6bd63";
        ctx.lineWidth = 5;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(500, 245, 75, 0, Math.PI * 2);
        ctx.fillStyle = "#382451";
        ctx.fill();

        ctx.strokeStyle = "#e6bd63";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Nom du joueur
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Arial";
      ctx.fillText(name.slice(0, 25), 500, 365);

      // Solde total
      ctx.fillStyle = "#d6ad55";
      ctx.font = "bold 27px Arial";
      ctx.fillText("SOLDE TOTAL", 500, 430);

      // Ajustement automatique du montant
      ctx.fillStyle = "#ffffff";

      let fontSize = 55;

      do {
        ctx.font = `bold ${fontSize}px Arial`;

        if (ctx.measureText(money).width <= 850) {
          break;
        }

        fontSize -= 2;
      } while (fontSize >= 22);

      ctx.fillText(money, 500, 505);

      // Bas de carte
      ctx.fillStyle = "#a58acb";
      ctx.font = "20px Arial";
      ctx.fillText("✦ YOUR FORTUNE, YOUR RULES ✦", 500, 555);

      // Enregistrement
      const folder = path.join(__dirname, "cache");
      await fs.ensureDir(folder);

      const imagePath = path.join(folder, `balance_${uid}.png`);

      await fs.writeFile(
        imagePath,
        canvas.toBuffer("image/png")
      );

      message.reply({
        body: `💰 Voici ton solde total, ${name}.`,
        attachment: fs.createReadStream(imagePath)
      }, () => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });

    } catch (error) {
      console.error("Erreur BAL :", error);
      message.reply("❌ Impossible d'afficher ton solde.");
    }
  }
};
  
