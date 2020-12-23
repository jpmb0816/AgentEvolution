const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let gen;
let frameCount = 1;

const target = {
  x: 100,
  y: 100,
  width: 30,
  height: 30,
  color: 'red',

  draw: function(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Agent
function Agent() {
  this.x = 0;
  this.y = 0;
  this.width = 10;
  this.height = 10;
  this.vx = 0;
  this.vy = 0;
  this.speed = 1;
  this.directions = [];
  this.directionIndex = 0;
  this.fitness = 0;
  this.alive = true;
  this.color = 'white';
  
  this.randomize = function() {
    this.x = random(0, canvas.width);
    this.y = random(0, canvas.height);
    const r = random(30, 256);
    const g = random(30, 256);
    const b = random(30, 256);
    this.color = 'rgb(' + r + ', ' + g + ', ' + b + ')';
  };

  this.generateDirections = function(n) {
    for (let i = 0; i < n; i++) {
      this.directions.push(this.getVelocityOfMovement(random(0, 4)));
    }
  };

  this.update = function() {
    if (this.directionIndex === this.directions.length) {
      this.alive = false;
      return;
    }
    
    this.vx = this.directions[this.directionIndex].vx;
    this.vy = this.directions[this.directionIndex].vy;
    this.directionIndex++;

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) {
      this.x = 0;
    }
    else if (this.x + this.width > canvas.width) {
      this.x = canvas.width - this.width;
    }

    if (this.y < 0) {
      this.y = 0;
    }
    else if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
    }
  };

  this.draw = function(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    /*ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = 'white';
    ctx.stroke();*/

    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(Math.floor(this.fitness), this.x, this.y);
  };

  this.getVelocityOfMovement = function(direction) {
    let vx = 0;
    let vy = 0;

    switch (direction) {
      case 0:
        vx = 0;
        vy = -this.speed;
        break;
      case 1:
        vx = this.speed;
        vy = 0;
        break;
      case 2:
        vx = 0;
        vy = this.speed;
        break;
      case 3:
        vx = -this.speed;
        vy = 0;
        break;
    }

    return { dir: direction, vx: vx, vy: vy };
  };

  this.calculateFitness = function() {
    this.fitness = getDistance(this, target);
  };

  this.mate = function(partner) {
    const midIndex = Math.floor(this.directions.length / 2);
    const len = this.directions.length;
    const directions = new Array(len);
    
    for (let i = 0; i < len; i++) {
      if (i < midIndex) {
        directions[i] = this.directions[i];
      }
      else {
        directions[i] = partner.directions[i];
      }
    }
    
    const child = new Agent();
    child.x = this.x;
    child.y = this.y;
    child.color = this.color;
    child.directions = directions;
    
    return child;
  };

  this.mutate = function(mutationRate) {
    for (let i = 0; i < this.directions.length; i++) {
      if (Math.random() <= mutationRate) {
        let dir = this.directions[i].dir;
        const randBits = random(0, 2);

        if (dir === 0 || randBits) {
          dir++;
        }
        else if (dir === 3 || !randBits) {
          dir--;
        }

        this.directions[i] = this.generateDirections(dir);
      }
    }
  };
}

// Generation
function Generation(n) {
  this.noOfAgents = n;
  this.agents = new Array(n);
  this.childs = [];
  this.generationNo = 0;
  this.mutationRate = 0.05;

  this.update = function() {
    this.agents.forEach(agent => {
      agent.update();
    });
  };

  this.draw = function(ctx) {
    this.agents.forEach(agent => {
      agent.draw(ctx);
    });

    ctx.font = '30px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(this.generationNo, 30, 45);
  };

  this.isAgentAllDead = function() {
    for (let i = 0; i < this.agents.length; i++) {
      if (this.agents[i].alive) {
        return false;
      }
    }

    return true;
  };

  this.generatePopulation = function() {
    if (this.generationNo === 0) {
      for (let i = 0; i < this.noOfAgents; i++) {
        this.agents[i] = new Agent();
        this.agents[i].randomize();
        this.agents[i].generateDirections(300);
      }
    }
    else {
      this.agents = this.childs;
    }
    
    this.generationNo++;
  };

  this.calculateFitness = function() {
    for (let i = 0; i < n; i++) {
      this.agents[i].calculateFitness();
    }
  };

  this.naturalSelection = function() {
    this.childs = [];
    
    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      let b = this.agents[random(0, this.agents.length)];
      
      while (b === a) {
        b = this.agents[random(0, this.agents.length)];
      }
      
      let child = a.mate(b);
      child.mutate(this.mutationRate);
      
      this.childs.push(child);
    }
  };
}

function random(min, max) {
  return Math.floor((Math.random() * (max - min) + min));
}

function getDistance(a, b) {
  return Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));
}

function init() {
  gen = new Generation(50);
  gen.generatePopulation();
}

function loop() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  target.draw(ctx);

  gen.calculateFitness();
  
  if (gen.isAgentAllDead()) {
    gen.naturalSelection();
    gen.generatePopulation();
  }
  
  gen.update();
  gen.draw(ctx);

  frameCount++;
  requestAnimationFrame(loop);
}

init();
loop();