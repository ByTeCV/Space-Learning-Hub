// Constellation Game Logic
(function () {
  const canvas = document.getElementById('constellation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hintEl = document.getElementById('constellation-hint');
  const resultMessage = document.getElementById('result-message');
  const btnStart = document.getElementById('btn-start');
  const btnCheck = document.getElementById('btn-check');
  const btnSkip = document.getElementById('btn-skip');
  const btnReset = document.getElementById('btn-reset');

  // Define constellations with star positions (normalized coordinates 0-1 for responsiveness)
  const constellations = [
    {
      name: "Orion",
      hint: "This constellation represents a hunter in Greek mythology",
      stars: [
        {x: 0.2, y: 0.2},
        {x: 0.4, y: 0.3},
        {x: 0.5, y: 0.5},
        {x: 0.6, y: 0.3},
        {x: 0.75, y: 0.2},
        {x: 0.6, y: 0.6},
        {x: 0.45, y: 0.7},
        {x: 0.3, y: 0.6}
      ],
      lines: [
        [0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[7,0]
      ]
    },
    {
      name: "Cassiopeia",
      hint: "Forms a distinctive 'W' shape in the northern sky",
      stars: [
        {x: 0.2, y: 0.5},
        {x: 0.35, y: 0.3},
        {x: 0.5, y: 0.5},
        {x: 0.65, y: 0.3},
        {x: 0.8, y: 0.5}
      ],
      lines: [
        [0,1],[1,2],[2,3],[3,4]
      ]
    }
    // Add more constellations here if desired
  ];

  let currentIndex = 0;
  let stars = [];
  let lines = [];
  let connectedPoints = [];
  let isGameActive = false;
  let constellation;

  function toCanvasCoords(point) {
    return {x: point.x * canvas.width, y: point.y * canvas.height};
  }

  function drawStar(x, y, highlight=false) {
    ctx.beginPath();
    ctx.arc(x, y, highlight ? 10 : 6, 0, Math.PI * 2);
    ctx.fillStyle = highlight ? '#facc15' : 'white';
    ctx.shadowColor = highlight ? 'yellow' : 'transparent';
    ctx.shadowBlur = highlight ? 15 : 0;
    ctx.fill();
    ctx.closePath();
  }

  function drawLine(p1, p2) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.closePath();
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawStars() {
    stars.forEach((star, i) => {
      const highlighted = connectedPoints.includes(i);
      drawStar(star.x, star.y, highlighted);
    });
  }

  function drawConnectedLines() {
    for (let i = 0; i < connectedPoints.length - 1; i++) {
      const from = stars[connectedPoints[i]];
      const to = stars[connectedPoints[i+1]];
      drawLine(from, to);
    }
  }

  function redraw() {
    clearCanvas();
    drawStars();
    drawConnectedLines();
  }

  function getStarIndexAtCoord(x, y) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const dist = Math.hypot(s.x - x, s.y - y);
      if (dist < 15 && !connectedPoints.includes(i)) {
        return i;
      }
    }
    return null;
  }

  function handleCanvasClick(e) {
    if (!isGameActive) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const starIndex = getStarIndexAtCoord(clickX, clickY);
    if (starIndex !== null) {
      if (connectedPoints.length === 0 || 
          constellation.lines.some(line => 
            (line[0] === connectedPoints[connectedPoints.length-1] && line[1] === starIndex) ||
            (line[1] === connectedPoints[connectedPoints.length-1] && line[0] === starIndex)
          )
        ) {
        connectedPoints.push(starIndex);
        redraw();
        btnReset.disabled = false;

        if (connectedPoints.length === stars.length) {
          btnCheck.disabled = false;
          btnSkip.disabled = true;
          resultMessage.textContent = "All stars connected! Click Check Answer.";
        } else {
          resultMessage.textContent = "";
        }
      } else {
        alert("Please select the correct next star to form the constellation!");
      }
    }
  }

  function setupConstellation(index) {
    currentIndex = index;
    connectedPoints = [];
    resultMessage.textContent = "";
    btnReset.disabled = true;
    btnCheck.disabled = true;
    btnSkip.disabled = false;
    constellation = constellations[currentIndex];
    stars = constellation.stars.map(toCanvasCoords);
    lines = constellation.lines;
    hintEl.textContent = constellation.hint;
    isGameActive = true;
    redraw();
  }

  btnStart.onclick = () => {
    setupConstellation(0);
    btnStart.disabled = true;
    btnCheck.disabled = true;
    btnSkip.disabled = false;
    btnReset.disabled = true;
    resultMessage.textContent = "";
  };

  btnReset.onclick = () => {
    connectedPoints = [];
    resultMessage.textContent = "";
    btnCheck.disabled = true;
    btnReset.disabled = true;
    redraw();
  };

  btnCheck.onclick = () => {
    isGameActive = false;
    const edges = new Set();
    for (let i = 0; i < connectedPoints.length -1; i++) {
      const a = connectedPoints[i];
      const b = connectedPoints[i+1];
      edges.add(`${Math.min(a,b)}-${Math.max(a,b)}`);
    }

    let allLinesMatched = constellation.lines.every(line => {
      const key = `${Math.min(line[0], line[1])}-${Math.max(line[0], line[1])}`;
      return edges.has(key);
    });

    if (allLinesMatched && connectedPoints.length === stars.length) {
      resultMessage.textContent = `Correct! You formed the ${constellation.name} constellation!`;
      btnCheck.disabled = true;
      btnSkip.disabled = false;
      btnReset.disabled = true;
    } else {
      resultMessage.textContent = "Not quite right. Try again or skip.";
      isGameActive = true;
    }
  };

  btnSkip.onclick = () => {
    currentIndex++;
    if (currentIndex >= constellations.length) {
      alert("You have completed all constellations! Restarting...");
      currentIndex = 0;
    }
    setupConstellation(currentIndex);
    btnCheck.disabled = true;
    btnReset.disabled = true;
    btnSkip.disabled = false;
    resultMessage.textContent = "";
    btnStart.disabled = true;
  };

  canvas.addEventListener('click', handleCanvasClick);

  btnStart.disabled = false;
  btnCheck.disabled = true;
  btnSkip.disabled = true;
  btnReset.disabled = true;
  resultMessage.textContent = "Click 'Start Game' to begin!";
})();
