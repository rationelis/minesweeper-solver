// ==UserScript==
// @name         Minesweeper Solver
// @version      1.0
// @description  A solver that uses logical deductions to solve Minesweeper puzzles 💣
// @author       Rationelis
// @license      MIT
// @supportURL   https://github.com/rationelis
// @match        https://minesweeperonline.com/**
// @grant        none
// ==/UserScript==

const ROWS = 16;
const COLUMNS = 30;

const FAST_MODE = false;
const TICK_INTERVAL_MS = 50;

function startGame() {
  console.log("Locked and loaded! 🔥 Click the yellow face!");
  const faceElement = document.getElementById("face");
  faceElement.addEventListener("mousedown", () => {
    setTimeout(() => {
      solve();
    }, 500);
  });
}

function initializeField() {
  const field = [];

  for (let x = 1; x <= ROWS; x++) {
    const row = [];

    for (let y = 1; y <= COLUMNS; y++) {
      const cellId = `${x}_${y}`;

      const cellElement = document.getElementById(cellId);
      row.push(cellElement);
    }

    field.push(row);
  }

  return field;
}

function isGameOver() {
  const gameOver = document.getElementsByClassName("facedead")[0];
  if (gameOver) {
    console.log("Game over :(");
    return true;
  }

  const gameWin = document.getElementsByClassName("facewin")[0];
  if (gameWin) {
    console.log("You win :)");
    return true;
  }

  return false;
}

function dispatchClickEvent(cellElement, button = 0) {
  const mousedownEvent = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    view: window,
    button: button,
  });

  const mouseupEvent = new MouseEvent("mouseup", {
    bubbles: true,
    cancelable: true,
    view: window,
    button: button,
  });

  cellElement.dispatchEvent(mousedownEvent);
  cellElement.dispatchEvent(mouseupEvent);
}

function getRandomCell(field) {
  const randomRow = Math.floor(Math.random() * field.length);
  const randomColumn = Math.floor(Math.random() * field[0].length);
  return field[randomRow][randomColumn];
}

function randomlyClickCell(field) {
  let cellElement = getRandomCell(field);

  while (!cellElement.classList.contains("blank")) {
    cellElement = getRandomCell(field);
  }

  dispatchClickEvent(cellElement);
}

function getAdjacentCells(field, cellElement) {
  const adjacentCells = [];

  const cellId = cellElement.id;
  const [x, y] = cellId.split("_").map(Number);

  const offsets = [
    { dx: -1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
  ];

  for (const offset of offsets) {
    const newX = x + offset.dx;
    const newY = y + offset.dy;

    if (
      newX >= 1 &&
      newX <= field.length &&
      newY >= 1 &&
      newY <= field[0].length
    ) {
      adjacentCells.push(field[newX - 1][newY - 1]);
    }
  }

  return adjacentCells;
}

function getAllNumberedCells(field) {
  const numberedCells = [];

  for (const row of field) {
    for (const cellElement of row) {
      const classListArray = Array.from(cellElement.classList);

      const numberClass = classListArray.find((className) =>
        className.startsWith("open")
      );

      if (numberClass) {
        const number = Number(numberClass.slice(4));
        if (number > 0) {
          numberedCells.push({ cellElement, number });
        }
      }
    }
  }

  return numberedCells;
}

function flagFlaggableCells(field, numberedCells) {
  let hasFlagged = false;

  for (const { cellElement, number } of numberedCells) {
    const adjacentCells = getAdjacentCells(field, cellElement);
    const closedCells = adjacentCells.filter(
      (adjacentCell) =>
        adjacentCell.classList.contains("blank") ||
        adjacentCell.classList.contains("bombflagged")
    );

    if (closedCells.length === number) {
      for (const closedCell of closedCells) {
        if (closedCell.classList.contains("bombflagged")) {
          continue;
        }

        hasFlagged = true;
        dispatchClickEvent(closedCell, 2);
      }
    }
  }

  return hasFlagged;
}

function clickDeducibleCells(field, numberedCells) {
  let hasClicked = false;

  for (const { cellElement, number } of numberedCells) {
    const adjacentCells = getAdjacentCells(field, cellElement);

    const closedCellsWithoutFlag = adjacentCells.filter(
      (adjacentCell) =>
        adjacentCell.classList.contains("blank") &&
        !adjacentCell.classList.contains("bombflagged")
    );

    const flaggedCells = adjacentCells.filter((adjacentCell) =>
      adjacentCell.classList.contains("bombflagged")
    );

    if (number - flaggedCells.length === 0) {
      const cells = closedCellsWithoutFlag.filter(
        (closedCell) => !closedCell.classList.contains("bombflagged")
      );

      for (const cell of cells) {
        hasClicked = true;
        dispatchClickEvent(cell);
      }
    }
  }

  return hasClicked;
}

function solve() {
  const field = initializeField();

  randomlyClickCell(field);

  if (FAST_MODE) {
    while (!isGameOver()) {
      if (!tick(field)) {
        break;
      }
    }
  } else {
    const interval = setInterval(() => {
      if (!tick(field)) {
        clearInterval(interval);
      }
    }, TICK_INTERVAL_MS);
  }
}

function tick(field) {
  if (isGameOver()) {
    return false;
  }

  let numberedCells = getAllNumberedCells(field);
  let hasFlagged = flagFlaggableCells(field, numberedCells);
  let hasClicked = clickDeducibleCells(field, numberedCells);

  if (!hasClicked && !hasFlagged) {
    console.log("No deducible cells found. Clicking random cell.");
    randomlyClickCell(field);
  }
  return true;
}

(function () {
  "use strict";

  if (
    document.readyState == "complete" ||
    document.readyState == "loaded" ||
    document.readyState == "interactive"
  ) {
    startGame();
  } else {
    document.addEventListener("DOMContentLoaded", function (event) {
      startGame();
    });
  }
})();
