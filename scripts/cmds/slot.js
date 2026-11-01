
function drawSlotSymbol(ctx, x, y, symbol) {
  ctx.save();
  ctx.translate(x, y);

  // Ombre lumineuse
  function glow(color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
  }

  function gradient(color1, color2) {
    const g = ctx.createLinearGradient(-45, -45, 45, 45);
    g.addColorStop(0, color1);
    g.addColorStop(1, color2);
    return g;
  }

  function polygon(points, fill, stroke = "#ffffff") {
    ctx.beginPath();
    points.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 7️⃣ : symbole rouge et or
  if (symbol === "7️⃣") {
    glow("#ff315d");

    ctx.beginPath();
    ctx.roundRect(-39, -42, 78, 84, 12);
    ctx.fillStyle = gradient("#ff315d", "#a90045");
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ffd36b";
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = "bold 76px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("7", 0, 2);
  }

  // ⭐ : étoile dorée
  else if (symbol === "⭐") {
    glow("#ffcf45");

    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 === 0 ? 46 : 21;
      points.push([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ]);
    }

    polygon(
      points,
      gradient("#fff59a", "#ff9f00"),
      "#fff2b0"
    );
  }

  // 💎 : diamant bleu
  else if (symbol === "💎") {
    glow("#00d9ff");
    polygon(
      [[0,-48],[43,-20],[30,34],[0,49],[-30,34],[-43,-20]],
      gradient("#a4f7ff", "#008cff"),
      "#e4ffff"
    );

    ctx.beginPath();
    ctx.moveTo(-43, -20);
    ctx.lineTo(43, -20);
    ctx.lineTo(0, 49);
    ctx.closePath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 🍒 : cerises rouges
  else if (symbol === "🍒") {
    glow("#ff245e");

    ctx.strokeStyle = "#70ef9a";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.quadraticCurveTo(-20, -55, 15, -49);
    ctx.moveTo(10, -10);
    ctx.quadraticCurveTo(25, -55, 15, -49);
    ctx.stroke();

    [-18, 19].forEach((cx, i) => {
      ctx.beginPath();
      ctx.arc(cx, 19, 25, 0, Math.PI * 2);
      ctx.fillStyle = i === 0
        ? gradient("#ff668c", "#d60038")
        : gradient("#ff315d", "#9e002f");
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ffd2df";
      ctx.stroke();
    });
  }

  // 🍋 : citron jaune
  else if (symbol === "🍋") {
    glow("#ffe94f");

    ctx.beginPath();
    ctx.ellipse(0, 0, 45, 28, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = gradient("#fff875", "#ffb900");
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#fff4b0";
    ctx.stroke();
  }

  // 🍇 : raisins violets
  else if (symbol === "🍇") {
    glow("#bd62ff");

    const grapes = [
      [-20,-22], [10,-25], [30,-5],
      [-30,5], [0,5], [20,25], [-5,35]
    ];

    grapes.forEach(([gx, gy]) => {
      ctx.beginPath();
      ctx.arc(gx, gy, 16, 0, Math.PI * 2);
      ctx.fillStyle = gradient("#e5a0ff", "#7315ce");
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#f2d2ff";
      ctx.stroke();
    });

    ctx.strokeStyle = "#75ed91";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(10, -48);
    ctx.stroke();
  }

  // 🍉 : pastèque
  else if (symbol === "🍉") {
    glow("#ff507b");

    ctx.beginPath();
    ctx.moveTo(-43, -30);
    ctx.quadraticCurveTo(0, 65, 43, -30);
    ctx.closePath();
    ctx.fillStyle = gradient("#ff5479", "#e90050");
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#80ef91";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    [-18, 0, 18].forEach(sx => {
      ctx.beginPath();
      ctx.ellipse(sx, 0, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 🔔 : cloche dorée
  else if (symbol === "🔔") {
    glow("#ffbd35");

    ctx.beginPath();
    ctx.moveTo(-35, 25);
    ctx.quadraticCurveTo(-25, 5, -25, -15);
    ctx.arc(0, -15, 25, Math.PI, 0);
    ctx.quadraticCurveTo(25, 5, 35, 25);
    ctx.closePath();
    ctx.fillStyle = gradient("#fff19a", "#d88a00");
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#fff0b0";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 35, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ffcf47";
    ctx.fill();
  }

  // 🍀 : trèfle vert
  else if (symbol === "🍀") {
    glow("#45ff9a");

    [[0,-22],[-22,0],[22,0],[0,22]].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fillStyle = gradient("#a4ff9e", "#00a94f");
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#d5ffcf";
      ctx.stroke();
    });

    ctx.strokeStyle = "#a4ff9e";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(18, 47);
    ctx.stroke();
  }

  ctx.restore();
}
