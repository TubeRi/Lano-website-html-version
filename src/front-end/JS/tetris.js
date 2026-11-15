(() => {
  const panel = document.querySelector("#game-tetris");
  const canvas = panel.querySelector("#tetris-board");
  const context = canvas.getContext("2d");
  if (!context) return;

  const scoreLabel = panel.querySelector("#tetris-score");
  const linesLabel = panel.querySelector("#tetris-lines");
  const status = panel.querySelector("#tetris-status");
  const startButton = panel.querySelector("#tetris-start");
  const columns = 10;
  const rows = 20;
  const cellSize = canvas.width / columns;
  const pieces = [
    { color: "#63d9ff", shape: ["0000", "1111", "0000", "0000"] },
    { color: "#f5d85a", shape: ["11", "11"] },
    { color: "#b47dff", shape: ["010", "111", "000"] },
    { color: "#65e59b", shape: ["011", "110", "000"] },
    { color: "#ff6678", shape: ["110", "011", "000"] },
    { color: "#5998ff", shape: ["100", "111", "000"] },
    { color: "#ff9e59", shape: ["001", "111", "000"] }
  ];
  const linePoints = [0, 100, 300, 500, 800];

  let board;
  let piece;
  let bag;
  let score;
  let lines;
  let timer;
  let playing = false;

  function occupiedCells({ shape, x, y }) {
    const cells = [];
    shape.forEach((row, dy) => {
      [...row].forEach((cell, dx) => {
        if (cell === "1") cells.push({ x: x + dx, y: y + dy });
      });
    });
    return cells;
  }

  function fits(candidate) {
    return occupiedCells(candidate).every(({ x, y }) =>
      x >= 0 && x < columns && y >= 0 && y < rows && !board[y][x]
    );
  }

  function landingPosition() {
    const landing = { ...piece };
    while (fits({ ...landing, y: landing.y + 1 })) landing.y++;
    return landing;
  }

  function drawCell(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    board.forEach((row, y) => {
      row.forEach((color, x) => drawCell(x, y, color || "#101d26"));
    });
    if (playing) {
      occupiedCells(landingPosition()).forEach(({ x, y }) => drawCell(x, y, "#30435a"));
      occupiedCells(piece).forEach(({ x, y }) => drawCell(x, y, piece.color));
    }
    scoreLabel.textContent = String(score);
    linesLabel.textContent = String(lines);
  }

  function emptyRow() {
    return Array(columns).fill(null);
  }

  function stop() {
    clearTimeout(timer);
    playing = false;
  }

  function reset() {
    stop();
    board = Array.from({ length: rows }, emptyRow);
    bag = [];
    score = 0;
    lines = 0;
    startButton.textContent = "Start";
    status.textContent = "Press Start to play.";
    render();
  }

  function spawn() {
    if (!bag.length) {
      bag = [...pieces];
      for (let index = bag.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [bag[index], bag[other]] = [bag[other], bag[index]];
      }
    }
    const next = bag.pop();
    piece = { ...next, x: Math.floor((columns - next.shape.length) / 2), y: 0 };
    if (!fits(piece)) {
      stop();
      status.textContent = "Game Over. Press Restart to play again.";
    }
  }

  function scheduleFall() {
    clearTimeout(timer);
    if (playing) {
      const delay = Math.max(120, 650 - Math.floor(lines / 10) * 65);
      timer = setTimeout(() => fall(false), delay);
    }
  }

  function lock() {
    occupiedCells(piece).forEach(({ x, y }) => { board[y][x] = piece.color; });
    const remaining = board.filter(row => row.some(cell => cell === null));
    const cleared = rows - remaining.length;
    score += linePoints[cleared] * (Math.floor(lines / 10) + 1);
    lines += cleared;
    board = [...Array.from({ length: cleared }, emptyRow), ...remaining];
    spawn();
    scheduleFall();
  }

  function move(dx, dy) {
    const candidate = { ...piece, x: piece.x + dx, y: piece.y + dy };
    if (!fits(candidate)) return false;
    piece = candidate;
    return true;
  }

  function fall(manual) {
    if (move(0, 1)) {
      if (manual) score++;
      scheduleFall();
    } else {
      lock();
    }
    render();
  }

  function rotate() {
    const { shape } = piece;
    const rotated = shape.map((_, x) => shape.map((row, y) => shape[shape.length - 1 - y][x]).join(""));
    // Try nearby positions so pieces can rotate against walls and the floor.
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [0, -2]]) {
      const candidate = { ...piece, shape: rotated, x: piece.x + dx, y: piece.y + dy };
      if (fits(candidate)) {
        piece = candidate;
        return;
      }
    }
  }

  function drop() {
    const landing = landingPosition();
    score += 2 * (landing.y - piece.y);
    piece = landing;
    lock();
  }

  const actions = {
    left: () => move(-1, 0),
    right: () => move(1, 0),
    down: () => fall(true),
    rotate,
    drop
  };
  const keys = new Map([
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"],
    ["ArrowDown", "down"],
    ["ArrowUp", "rotate"],
    [" ", "drop"]
  ]);

  function act(action) {
    actions[action]();
    if (action !== "down") render();
  }

  startButton.addEventListener("click", () => {
    reset();
    playing = true;
    spawn();
    startButton.textContent = "Restart";
    status.textContent = "Playing";
    render();
    scheduleFall();
    canvas.focus({ preventScroll: true });
  });
  panel.addEventListener("beforetoggle", event => {
    if (event.newState === "open") reset();
    else stop();
  });
  panel.addEventListener("keydown", event => {
    const action = keys.get(event.key);
    if (!playing || !action || event.altKey || event.ctrlKey || event.metaKey) return;
    if (action === "drop" && event.target.closest("button")) return;
    event.preventDefault();
    if (action !== "drop" || !event.repeat) act(action);
  });
  panel.querySelectorAll("[data-tetris-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (playing) act(button.dataset.tetrisAction);
    });
  });
})();
