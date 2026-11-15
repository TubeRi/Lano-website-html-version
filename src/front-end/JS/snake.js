(() => {
  const panel = document.querySelector("#game-snake");
  const board = panel.querySelector("#snake-board");
  const context = board.getContext("2d");
  if (!context) return;

  const score = panel.querySelector("#snake-score");
  const status = panel.querySelector("#snake-status");
  const startButton = panel.querySelector("#snake-start");
  const result = panel.querySelector("#snake-result");
  const resultTitle = panel.querySelector("#snake-result-title");
  const retryButton = panel.querySelector("#snake-retry");
  const exitButton = panel.querySelector("#snake-exit");
  const columns = 20;
  const cellSize = board.width / columns;
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const keys = new Map([
    ["ArrowUp", directions.up],
    ["ArrowDown", directions.down],
    ["ArrowLeft", directions.left],
    ["ArrowRight", directions.right]
  ]);

  let snake;
  let food;
  let direction;
  let nextDirection;
  let timer;
  let state;

  function sameCell(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function placeFood() {
    const openCells = [];
    for (let y = 0; y < columns; y++) {
      for (let x = 0; x < columns; x++) {
        const cell = { x, y };
        if (!snake.some(segment => sameCell(segment, cell))) openCells.push(cell);
      }
    }
    return openCells[Math.floor(Math.random() * openCells.length)];
  }

  function draw() {
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "#101d26";
    for (let y = 0; y < columns; y++) {
      for (let x = y % 2; x < columns; x += 2) {
        context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    snake.forEach(({ x, y }, index) => {
      context.fillStyle = index === 0 ? "#adffc9" : "#65e59b";
      context.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
    if (food) {
      context.beginPath();
      context.fillStyle = "#ff6678";
      context.arc((food.x + 0.5) * cellSize, (food.y + 0.5) * cellSize, cellSize * 0.36, 0, Math.PI * 2);
      context.fill();
    }
  }

  function reset() {
    clearInterval(timer);
    state = "ready";
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    direction = directions.right;
    nextDirection = null;
    food = placeFood();
    score.textContent = "0";
    status.textContent = "Press Start or use the arrow keys.";
    startButton.textContent = "Start";
    draw();
  }

  function finish(title) {
    clearInterval(timer);
    state = "finished";
    status.textContent = title;
    resultTitle.textContent = title;
    result.showModal();
  }

  function tick() {
    direction = nextDirection ?? direction;
    nextDirection = null;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const hitsWall = head.x < 0 || head.x >= columns || head.y < 0 || head.y >= columns;
    const eatsFood = sameCell(head, food);
    // A move into the current tail cell is legal when the tail moves away.
    const occupied = eatsFood ? snake : snake.slice(0, -1);
    if (hitsWall || occupied.some(segment => sameCell(segment, head))) {
      finish("Game Over");
      return;
    }

    snake.unshift(head);
    if (eatsFood) {
      score.textContent = String(snake.length - 3);
      food = placeFood();
    } else {
      snake.pop();
    }
    draw();
    if (!food) finish("You filled the board!");
  }

  function start() {
    state = "playing";
    startButton.textContent = "Restart";
    status.textContent = "Use the arrow keys or direction buttons.";
    timer = setInterval(tick, 125);
  }

  function steer(turn) {
    if (state === "finished" || nextDirection) return;
    if (turn.x + direction.x === 0 && turn.y + direction.y === 0) return;
    if (turn !== direction) nextDirection = turn;
    if (state === "ready") start();
  }

  panel.addEventListener("beforetoggle", event => {
    if (event.newState === "open") {
      reset();
    } else {
      clearInterval(timer);
      if (result.open) result.close();
    }
  });
  function restart() {
    reset();
    start();
  }

  function exit() {
    result.close();
    panel.hidePopover();
  }

  startButton.addEventListener("click", restart);
  retryButton.addEventListener("click", () => {
    result.close();
    startButton.focus();
    restart();
  });
  exitButton.addEventListener("click", exit);
  result.addEventListener("cancel", event => {
    event.preventDefault();
    exit();
  });
  panel.addEventListener("keydown", event => {
    const turn = keys.get(event.key);
    if (!turn || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    steer(turn);
  });
  panel.querySelectorAll("[data-direction]").forEach(button => {
    button.addEventListener("click", () => steer(directions[button.dataset.direction]));
  });
})();
