/*global console */
var PI = Math.PI;
var stages = [{
    name: 'ONE',
    ball_radius: 3,
    padle_size: PI / 4,
    waves: [
        {offset: 2000, angle: 0,            speed: 0.10, ttl: 1},
        {offset: 2500, angle: PI / 8,       speed: 0.10, ttl: 1},
        {offset: 3000, angle: PI / 7,       speed: 0.10, ttl: 1},
        {offset: 3500, angle: PI / 6,       speed: 0.10, ttl: 1},
        {offset: 4000, angle: PI / 5,       speed: 0.10, ttl: 1},
        {offset: 4500, angle: PI,           speed: 0.10, ttl: 1},
        {offset: 5000, angle: 5 * PI / 4,   speed: 0.10, ttl: 1},
        {offset: 5500, angle: 3 * PI / 2,   speed: 0.10, ttl: 1},
        {offset: 5750, angle: 7 * PI / 4,   speed: 0.10, ttl: 2},
        {offset: 6250, angle: PI / 2,       speed: 0.10, ttl: 1},
        {offset: 6500, angle: 3 * PI / 4,   speed: 0.10, ttl: 3},
        {offset: 7000, angle: PI,           speed: 0.10, ttl: 1},
        {offset: 7500, angle: 5 * PI / 4,   speed: 0.10, ttl: 2},
        {offset: 8500, angle: 3 * PI / 2,   speed: 0.10, ttl: 1},
        {offset: 9500, angle: 7 * PI / 4,   speed: 0.10, ttl: 2}
    ]
}];

function normalize(a) {
    "use strict";
    var na = a;
    
    if (a < 0) {
        na = 2 * PI + a;
    } else if (a > 2 * PI) {
        na = (a * 1000) % (2 * PI) / 1000;
    }
    
    return na;
}

function Point(x, y) {
    "use strict";
    this.x = x;
    this.y = y;
}

Point.prototype.distance = function (point) {
    "use strict";
    
    return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));
};

function Ball(game, /* Point */ position, radius, direction, speed, ttl) {
    "use strict";
    this.game = game;
    this.position = position;
    this.radius = radius;
    this.direction = normalize(direction);
    this.speed = speed;
    this.ttl = ttl;
}

Ball.prototype.update = function (delta) {
    "use strict";
    
    this.position.x += this.speed * delta * Math.cos(this.direction);
    this.position.y += this.speed * delta * Math.sin(this.direction);
};

Ball.prototype.draw = function () {
    "use strict";
    this.game.ctx.beginPath();
    this.game.ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * PI, false);
    this.game.ctx.fillStyle = this.game.skin.ball;
    this.game.ctx.fill();
};

function Padle(game, /* Point */ center, radius, start, angle) {
    "use strict";
    this.game = game;
    this.center = center;
    this.width = 5;
    this.distance_to_center = radius;
    this.start = normalize(start);
    this.angle = normalize(angle);
}

Padle.prototype.update = function () {
    "use strict";
    var increment = this.game.mouse.y - this.game.mouse_old.y;
    increment *= 25;
    this.start = normalize(((this.start * 1000 + increment) % (2 * PI * 1000)) / 1000);
    
    this.game.mouse_old.y = this.game.mouse.y;
};

Padle.prototype.draw = function () {
    "use strict";
    
    this.game.ctx.beginPath();
    this.game.ctx.arc(this.center.x, this.center.y, this.distance_to_center, this.start, this.start + this.angle, false);
    this.game.ctx.lineWidth = this.width;
    this.game.ctx.strokeStyle = this.game.skin.padle;
    this.game.ctx.stroke();
};

function Stage(game, descriptor) {
    "use strict";
    this.game = game;
    this.name = descriptor.name;
    this.padle_size = descriptor.padle_size;
    this.ball_radius = descriptor.ball_radius;
    this.waves = descriptor.waves;
    this.wave = 0;
    this.padle = new Padle(this.game, new Point(150, 150), 100, 6 * PI / 4, this.padle_size);
    this.balls = new Array(this.waves.length);
}

Stage.prototype.init = function () {
    "use strict";
    this.start_time = new Date().getTime();
};

Stage.prototype.update = function (delta) {
    "use strict";
    var b, i, wave_conf;
    
    this.padle.update(delta);
    
    this.game.collideAll(this.padle, this.balls);
    
    for (i = this.wave; i < this.waves.length; i = i + 1) {
        wave_conf = this.waves[i];
        if (wave_conf.offset < (new Date().getTime() - this.start_time)) {
            this.wave += 1;
            this.balls[i] = new Ball(this.game, new Point(this.padle.center.x, this.padle.center.y), this.ball_radius, wave_conf.angle, wave_conf.speed, wave_conf.ttl);
            break;
        }
    }
    
    for (b in this.balls) {
        if (this.balls.hasOwnProperty(b)) {
            if (this.balls[b].ttl === 0) {
                this.balls.splice(b, 1);
                this.game.scoring += 1;
            } else if (this.balls[b].position.distance(this.padle.center) > (this.padle.radius + this.padle.width)) {
                this.balls.splice(b, 1);
                // Failure
            } else {
                this.balls[b].update(delta);
            }
        }
    }
    
    if (this.balls.length === 0) {
        this.game.playing = false;
    }
};

Stage.prototype.draw = function () {
    "use strict";
    var b;
    
    this.padle.draw();
    
    for (b in this.balls) {
        if (this.balls.hasOwnProperty(b)) {
            this.balls[b].draw();
        }
    }
};

/**
  * skin: padle, field, ball
  */
function GyroGame(skin, canvasid, score_callback) {
    "use strict";
    this.SIDE = 20;
    this.score_function = score_callback;
    this.skin = skin;
    this.canvas = document.getElementById(canvasid);
    this.ctx = this.canvas.getContext('2d');
    this.width = parseInt(this.canvas.getAttribute("width"), 10);
    this.height = parseInt(this.canvas.getAttribute("height"), 10);
    this.mouse = {x: 0, y: 0};
    this.mouse_old = {x: 0, y: 0};
    
    (function (game) {
        window.addEventListener('mousemove', function (evt) {
            game.mouse_old.y = game.mouse.y;
            game.mouse.y = evt.clientY - game.canvas.getBoundingClientRect().top;
        }, false, this);
    }(this));
}

GyroGame.prototype.init = function () {
    "use strict";
    this.playing = true;
    this.scoring = 0;
    this.current_stage = new Stage(this, stages[0]);
    
    this.current_stage.init();
    
    this.loop();
};

GyroGame.prototype.collide = function (padle, ball) {
    "use strict";
    var distance = padle.center.distance(ball.position),
        ball_border = distance + ball.radius,
        padle_border_int = padle.distance_to_center - padle.width / 2,
        padle_border_ext = padle.distance_to_center + padle.width / 2;
    console.log("start: " + padle.start + " end: " + (padle.start + padle.angle));
    if (ball_border > padle_border_int && ball_border < padle_border_ext) {
        if ((padle.start + padle.angle < 2 * PI && padle.start < ball.direction && ball.direction < padle.start + padle.angle) || (padle.start + padle.angle >= 2 * PI && normalize(padle.start + padle.angle) > ball.direction)) {
            ball.direction = normalize((((ball.direction + PI) * 1000) % (2 * PI * 1000)) / 1000);
            ball.ttl -= 1;
        }
    }
};

GyroGame.prototype.collideAll = function (padle, balls) {
    "use strict";
    var b, collision, collide_balls = [];
    
    for (b in balls) {
        if (balls.hasOwnProperty(b)) {
            collision = this.collide(padle, balls[b]);
            if (collision !== undefined) {
                collide_balls.push();
            }
        }
    }
    
    return collide_balls;
};

GyroGame.prototype.update = function () {
    "use strict";
    var now = new Date().getTime(),
        delta = now - this.lastFrameTime;
    
    this.current_stage.update(delta);
    
    this.lastFrameTime = now;
};

GyroGame.prototype.draw = function () {
    "use strict";
    var i, j;
    
    this.ctx.fillStyle = this.skin.field;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.save();

    this.current_stage.draw();
    this.score_function(this.scoring);
    
    this.ctx.restore();
};

GyroGame.prototype.loop = function () {
    "use strict";
    
    if (this.playing) {
        this.update();
        this.draw();
    }
    
    window.requestAnimationFrame(this.loop.bind(this), this.canvas);
};

GyroGame.prototype.score = function () {
    "use strict";
    this.scoring = 0;
};






