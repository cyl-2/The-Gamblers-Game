let canvas;
let context;

let request_id;
let fpsInterval = 700 / 30;
let now;
let then = Date.now();
let xhttp;

let backgroundImage = new Image();
let playerImage = new Image();
let enemyImage = new Image();
let coinImage = new Image();
let diamondImage = new Image();
let moneyBagImage = new Image();

let bulletAudio = new Audio();
let collectBagAudio = new Audio();
let collectDiamondAudio = new Audio();
let collectCoinAudio = new Audio();
let enemyAudio = new Audio();
let winAudio = new Audio();
let loseAudio = new Audio();

let tilesPerRow = 8; 
let tileSize = 32;

let background = [
    [250,235,250,235,250,235,250,235,250,235,250,235,250,235,250,235,235],
    [201,201,201,201,201,250,250,250,250,250,201,201,201,201,201,201,201],
    [70,70,70,70,70,250,250,250,250,250,70,70,70,70,70,70,70,70],
    [250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250],
    [250,250,250,250,250,250,250,250,250,250,250,250,250,232,233,234,234],
    [250,250,250,250,250,250,250,250,250,250,250,250,250,240,241,242,242],
    [187,188,189,190,191,250,250,250,250,250,250,250,250,250,124,124,124],
    [195,196,197,198,199,250,250,250,250,250,250,250,250,250,124,132,132],
    [203,204,205,206,207,250,250,250,250,250,250,250,250,250,250,250,250],
    [116,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250]
]

let player = {
    x : 0,
    y : 0,
    width : 32,
    height : 47,
    frameX : 0,
    frameY : 0,
    xChange : 0,
    yChange : 0
};

let notFloor = [70,187,188,189,190,191,195,196,197,198,199,201,203,204,205,206,207,232,233,234,235,240,241,242];
let current_tile = 0;
let jump = false;

let shoot_time = 20;
let shoot = [];
let attack = [];
let money = [];
let more_money = [];
let wallet = [];
let current_score = 0;
let motivation = [];
let faster = false;

let maxTicks = 60;
let tickCount = 0;

let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let fire = false;

let up = false;
let right = false;
let left = false;
let down = false;

document.addEventListener("DOMContentLoaded", init, false)

// Restart game when r is pressed
document.addEventListener('keydown', restart, false) 
function restart(r) {
    let key = r.key;
    if (key === "r") {
        location.reload();
        init();
        canvas.removeEventListener('keydown', restart);
    }
}

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    backgroundImage.src = "../static/tiles.png";
    playerImage.src = "../static/player.png";
    enemyImage.src = "../static/enemy.png";
    coinImage.src = "../static/coin.png";
    diamondImage.src = "../static/diamond.png";
    moneyBagImage.src = "../static/moneyBag.png";

    bulletAudio.src='../static/bullet.wav';
    collectBagAudio.src='../static/collect_bag.wav';
    collectDiamondAudio.src='../static/collect_diamond.wav';
    collectCoinAudio.src='../static/collect_coin.wav';
    enemyAudio.src='../static/enemy_cry.wav';
    winAudio.src='../static/win.wav';
    loseAudio.src='../static/lose.wav';

    player.x = canvas.width / 2; 
    player.y = canvas.height / 2; 

    window.addEventListener("keydown",activate,false);
    window.addEventListener("keyup",deactivate,false);

    draw();
}

// Got timer function from Shidersz, link: https://stackoverflow.com/questions/52547625/1-minutes-30-second-countdown-timer-javascript
function tick () {
    if (tickCount >= maxTicks){
        clearInterval(timer);
        return;
    }
    document.getElementById("timer").innerHTML = (maxTicks - tickCount);
    tickCount++;
};
let timer = setInterval(tick, 1000);

function draw() {
    request_id = window.requestAnimationFrame(draw);
    let now = Date.now();
    let elapsed = now - then;
    if (elapsed <= fpsInterval) {
        return;
    }
    then = now - (elapsed % fpsInterval);
    
    // Background
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillRect(0, 0, canvas.width, canvas.height);             
    for (let r = 0; r < 10; r += 1) {
        for (let c = 0; c < 16; c += 1) {
            let tile = background[r][c];
            if (tile >= 0) {
                let tileRow = Math.floor(tile / tilesPerRow);
                let tileCol = Math.floor(tile % tilesPerRow);
                context.drawImage(backgroundImage,
                    tileCol * tileSize, tileRow * tileSize, tileSize, tileSize,
                    c * tileSize, r * tileSize, tileSize, tileSize);
            }
        }
    }
    // Player
    context.drawImage(playerImage,
        player.width * player.frameX, player.height * player.frameY, player.width, player.height,
        player.x, player.y, player.width, player.height);
    if ((moveLeft || moveRight || moveDown || moveUp) && ! (moveLeft && moveRight && moveDown && moveUp)) {
        player.frameX = (player.frameX + 1) % 4;
    }
    // Draw enemy    
    for (let enemy of attack) {
        context.drawImage(enemyImage,
            enemy.width * enemy.frameX, enemy.height * enemy.frameY, enemy.width, enemy.height,
            enemy.x, enemy.y, enemy.width, enemy.height);
    }

    // Bullets
    // Shoot where the player is facing
    for (let bullet of shoot) {
        context.beginPath();
        context.arc(bullet.x,bullet.y, 5, 0, 2 * Math.PI);
        context.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16); // copied the random color thing from https://dev.to/akhil_001/generating-random-color-with-single-line-of-js-code-fhj
        context.fill();
        context.lineWidth = 0.5;
        context.strokeStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
        context.stroke();
    
        if (bullet.direction === "left"){ //Left
            bullet.x -= bullet.xChange;
        } else if (bullet.direction === "right"){ //Right
            bullet.x += bullet.xChange;
        } else if (bullet.direction === "up"){
            bullet.y -= bullet.yChange; //Up
        } else if (bullet.direction === "down"){
            bullet.y += bullet.yChange; //Down
        }

        // Enemies disappear when shot
        attack.forEach((enemy, i) => {
            if(kill(enemy)) {
                    shoot.splice(bullet,1);
                    attack.splice(i,1);
                    deadBird (enemy);
                    enemyAudio.play();
            }
        })
    }
    // Delete bullet if it leaves canvas
    for (let bullet of shoot) {
        if (bullet.x >= canvas.width || bullet.x <= 0 || bullet.y >= canvas.height || bullet.y <= 0) {
            shoot.splice(bullet,1);
        }
    }
    // Draw coins
    for (let coin of money) {
        context.drawImage(coinImage,
            coin.width * coin.frameX, coin.height * coin.frameY, coin.width, coin.height,
            coin.x, coin.y, coin.width, coin.height);
        coin.frameX = (coin.frameX + 1) % 6;
        }    
    // Coins disappear when collected
    money.forEach((coin, index) => {
        if (collect(coin)) {
            money.splice(index,1);
            current_score += 500;
            document.getElementById("score").innerHTML = current_score;
            collectCoinAudio.play();
        }
    })
    // Draw the diamonds you get when you kill an enemy
    for (let diamond of more_money) {
        context.drawImage(diamondImage,
            diamond.x, diamond.y, diamond.width, diamond.height);
        }    
    // Special diamond disappear when collected
    more_money.forEach((diamond, index) => {
        if (collect2(diamond)) {
            more_money.splice(index,1)
            current_score += 2000;
            document.getElementById("score").innerHTML = current_score;
            collectDiamondAudio.play();
        }
    })
    // Draw sacks of gold
    for (let bag of motivation) {
        context.drawImage(moneyBagImage,
            bag.x, bag.y, bag.width, bag.height);
        }
    // Sacks of gold disappear when collected
    motivation.forEach((bag, index) => {
        if (collect3(bag)) {
            motivation.splice(index,1)
            current_score += 1500;
            document.getElementById("score").innerHTML = current_score;
            collectBagAudio.play();
        }
    })

    // When 1 min is up, end game
    if (tickCount === 60) {
        winAudio.play();
        win();
        stop();
        return;
    }

    // Update enemy position based on where the player is suitated - enemies will chase the player!
    for (let enemy of attack) {
        // End game if enemy kills player
        if (player_collides(enemy)) {
            loseAudio.play();
            stop();
            document.getElementById("result").innerHTML = "GAME OVER. YOU LOST!";
            return;
        }
        // Otherwise, chase player
        else if (player.x - enemy.x >= 0 && player.y - enemy.y >= 0) {
            enemy.x += enemy.xChange;
            enemy.y += enemy.yChange;
        } else if (player.x - enemy.x >= 0 && player.y - enemy.y >= -300 &&  player.y - enemy.y < 0) {
            enemy.x += enemy.xChange;
            enemy.y -= enemy.yChange;
        } else if (player.x - enemy.x >= -500 && player.y - enemy.y >= -300 && player.y - enemy.y < 0) {
            enemy.x -= enemy.xChange;
            enemy.y -= enemy.yChange;
        } else { //(player.x - enemy.x >= -500 && player.y - enemy.y >= 0)
            enemy.x -= enemy.xChange;
            enemy.y += enemy.yChange;
        } 
    }
    // Enemy change direction, frames
    for (let enemy of attack) {
        enemy.frameX = (enemy.frameX + 1) % 4;
        if (enemy.x >= canvas.width - enemy.width) {
            enemy.xChange *= -1;
            enemy.frameY = 1;
        } else if (enemy.x <= canvas.width - canvas.width) {
            enemy.xChange *= -1;
            enemy.frameY = 2;
        } else if (enemy.y <= canvas.height - canvas.height) {
            enemy.yChange *= -1;
            enemy.frameY = 0;
        } else if (enemy.y >= canvas.height - enemy.height) {
            enemy.yChange *= -1;
            enemy.frameY = 3;
        }
    }
        
    // Shoot based on the direction the player is facing
    if (fire && shoot_time<=0) {
        if (player.frameY === 1) {
            gun("left");
            shoot_time = 20;
        } else if (player.frameY === 2) {
            gun("right");
            shoot_time = 20;
        } else if (player.frameY === 3) {
            gun("up");
            shoot_time = 20;
        } else {
            gun("down");
            shoot_time = 20;
        }
    } else {
        shoot_time--;
    } 

    // Player moves at normal pace unless it collects a bag of gold
    if (faster) {
        movePlayerFaster();
    } else {    
        movePlayer();
    }

    // Prevents player from going off screen
    if (player.x < -1) {
        player.x = 2;
    } else if (player.x > 485) {
        player.x = 485; 
    } else if (player.y < -1) {
        player.y = 1; 
    } else if (player.y > 300) {
        player.y = 300; 
    }

    // Gets player's position, if player is on an object (such as a table), then the player can't go through that object unless SHIFT is held
    if (player_position() && jump === false) {
        document.getElementById("shift").innerHTML = "Hold the SHIFT key to move onto the object!";
        player.xChange = 0;
        player.yChange = 0;

        if (player.frameY === 1) {
            player.x += 0.8;
            if (moveRight === false && moveLeft === false && moveUp === false && moveDown === false) {
                player.y +=10;
            }
        } else if (player.frameY === 2) {
            player.x -= 0.8;
            if (moveRight === false && moveLeft === false && moveUp === false && moveDown === false) {
                player.y +=10;
            }
        } else if (player.frameY === 3) {
            player.y += 0.8;
            if (moveRight === false && moveLeft === false && moveUp === false && moveDown === false) {
                player.y +=10;
            }
        } else if (player.frameY === 0) {
            player.y -= 10;
            if (moveRight === false && moveLeft === false && moveUp === false && moveDown === false) {
                player.y +=10;
            }
        } 
        setTimeout(function(){ 
            document.getElementById("shift").innerHTML = "";
        }, 5000);  
    }

    // Update the player.
    player.x += player.xChange;
    player.y += player.yChange;
    player.xChange *= 0.250; 
    player.yChange *= 0.250;
}

// Checks if the tile is in the notFloor list
function solidTile(current_tile, notFloor) {
    if (notFloor.includes(current_tile)) {
        return true; // you are standing on an object
    } else {
        return false;
    }
}

// Looks for the tile the player is on
function player_position() {
    let tx = Math.floor(player.x / tileSize);
    let ty = Math.floor(player.y / tileSize);
    current_tile = background[ty+1][tx+1];
    if (solidTile(current_tile, notFloor)) {
        return true;
    } else {
        return false;
    }
}

// Key presses for player
function movePlayer () {
    if (moveLeft) {
        if (player.x <= 0){}
        else {
            player.xChange -= 1;
            player.frameY = 1;
        }
    } 
    if (moveRight) {
        if (player.x >= canvas.width - player.width){}
        else{
            player.xChange += 1;
            player.frameY = 2;
        }
    } 
    if (moveUp) {
        if (player.y <= 0){}
        else{
            player.yChange -= 1;
            player.frameY = 3;
        }
    } 
    if (moveDown) {
        if (player.y >= canvas.height - player.height){}
        else{
            player.yChange += 1;
            player.frameY = 0;
        }
    } 
    draw();
}

// Player moves faster when it collects a bag of gold
function movePlayerFaster () {
    if (moveLeft) {
        if (player.x <= 0){}
        else {
            player.xChange -= 4;
            player.frameY = 1;
        }
    } 
    if (moveRight) {
        if (player.x >= canvas.width - player.width){}
        else{
            player.xChange += 4;
            player.frameY = 2;
        }
    } 
    if (moveUp) {
        if (player.y <= 0){}
        else{
            player.yChange -= 4;
            player.frameY = 3;
        }
    } 
    if (moveDown) {
        if (player.y >= canvas.height - player.height){}
        else{
            player.yChange += 4;
            player.frameY = 0;
        }
    } 
    draw();
 
    setTimeout(function() {
        faster = false;
    }, 5000);
}

// Checks whether player is attacked by enemy
function player_collides(enemy) {
    if (player.x + player.width < enemy.x ||
        enemy.x + enemy.width < player.x ||
        player.y > enemy.y + enemy.width ||
        enemy.y > player.y + player.width) {
        return false;
    } else {
        return true;
    }
}

function randint(min,max) {
    return Math.round(Math.random() * (max-min)) + min;
}

// Bullets
function gun(d) {
    let bullet = {
        x : player.x,
        y : player.y,
        xChange : 3,
        yChange : 3,
        size: 10,
        direction : ""
    };
    bullet.direction = d;
    shoot.push(bullet);
}

// Create new enemies
function spawnEnemy() {
    let enemy = {
        x : randint(1,canvas.width-50),
        y : randint(1,10),
        width : 50,
        height : 50,
        frameX : 0,
        frameY : 0,
        xChange : 0.8,
        yChange : 0.8
    };
    attack.push(enemy);
}
let birth = setInterval(spawnEnemy, 5000);

// Checks whether enemy is hit by bullet
function kill(enemy) {
    for (let bullet of shoot) {
        if (enemy.x + enemy.width < bullet.x ||
            bullet.x + bullet.width < enemy.x ||
            enemy.y > bullet.y + bullet.width ||
            bullet.y > enemy.y + enemy.width) {
            return false;
        } else {
            return true;
        }
    }
}

// Random coins appear
function rich() {
    let coin = {
        x : randint(1,canvas.width-50),
        y : randint(1, canvas.height-50),
        width : 20,
        height : 30,
        frameX : 0,
        frameY : 0
    };
    money.push(coin);
}
let coins = setInterval(rich, 3000);

// Diamonds appear when enemy dies
function deadBird (enemy) {
    let diamond = {
        x : enemy.x,
        y : enemy.y,
        width : 25,
        height : 25
    }
    more_money.push(diamond);
}

// Random sacks of gold appear
function moneyBag () {
    let bag = {
        x : randint(1,canvas.width-50),
        y : randint(1, canvas.height-50),
        width : 30,
        height : 21
    }
    motivation.push(bag);
}
let chunky_bag = setInterval(moneyBag, 20000);

// The following 3 functions checks what objects player collects 
function collect(coin) {
    if (player.x + player.width < coin.x ||
        coin.x + coin.width < player.x ||
        player.y > coin.y + coin.width ||
        coin.y > player.y + player.width) {
        return false;
    } else {
        return true; 
    }
}
function collect2(diamond) {
    if (player.x + player.width < diamond.x ||
        diamond.x + diamond.width < player.x ||
        player.y > diamond.y + diamond.width ||
        diamond.y > player.y + player.width) {
        return false;
    } else {
        return true; 
    }
}
function collect3(bag) {
    if (player.x + player.width < bag.x ||
        bag.x + bag.width < player.x ||
        player.y > bag.y + bag.width ||
        bag.y > player.y + player.width) {
        return false;
    } else {
        faster = true;
        return true; 
    }
}

function activate(event) {
    let key = event.key;
    if (key === "ArrowLeft") {
        moveLeft = true;
    } else if (key === "ArrowRight") {
        moveRight = true;
    } else if (key === "ArrowUp") {
        moveUp = true;
    } else if (key === "ArrowDown") {
        moveDown = true;
    } else if (key === " ") {
        fire = true;
        bulletAudio.play();
    } else if (key === "Shift") {
        jump = true;
    }
    event.preventDefault();
}
function deactivate(event) {
    let key = event.key;
    if (key === "ArrowLeft") {
        moveLeft = false;
    } else if (key === "ArrowRight") {
        moveRight = false;
    } else if (key === "ArrowUp") {
        moveUp = false;
    } else if (key === "ArrowDown") {
        moveDown = false;
    } else if (key === " ") {
        fire = false;
    } else if (key === "Shift") {
        jump = false;
    }
}

function stop() {
    window.removeEventListener("keydown",activate,false);
    window.removeEventListener("keyup",deactivate,false);
    window.cancelAnimationFrame(request_id);
    clearInterval(birth);
    clearInterval(coins);
    clearInterval(timer);
    clearInterval(chunky_bag);

    let player = document.getElementById('music');
    player.pause();
    player.currentTime = 0;
}

function win() {
    let data = new FormData ();
    data.append("current_score", current_score);
    xhttp = new XMLHttpRequest();
    xhttp.addEventListener("readystatechange", handle_response, false);
    xhttp.open("POST", "https://cs1.ucc.ie/~cyl1/cgi-bin/ca2/run.py/store_score_hardlvl", true);
    xhttp.send(data);
    document.getElementById("result").innerHTML = "YOU WON! MONEY COLLECTED: €"+current_score;
}

function handle_response() {
    if ( xhttp.readyState === 4 ) {
        if ( xhttp.status === 200 ) {
            if ( xhttp.responseText === "success" ) {
            } else {
            }
        }
    }
}