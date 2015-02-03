/*global console */
var PI = Math.PI;

function Point(x, y) {
    "use strict";
    this.x = x;
    this.y = y;
}


function Padle(game, /* Point */ center, radius, starting_angle, ending_angle) {
    "use strict";
    this.game = game;
    this.center = center;
    this.radius = radius;
    this.start = starting_angle;
    this.end = ending_angle;
}

Padle.prototype.update = function () {
    "use strict";
    var increment = this.game.mouse.y - this.game.mouse_old.y;
    increment *= 25;
    this.start = ((this.start * 1000 + increment) % (2 * PI * 1000)) / 1000;
    this.end = ((this.end * 1000 + increment) % (2 * PI * 1000)) / 1000;
    
    this.game.mouse_old.y = this.game.mouse.y;
};

Padle.prototype.draw = function () {
    "use strict";
    
    this.game.ctx.beginPath();
    this.game.ctx.arc(this.center.x, this.center.y, this.radius, this.start, this.end, false);
    this.game.ctx.lineWidth = 5;
    this.game.ctx.strokeStyle = this.game.skin.padle;
    this.game.ctx.stroke();
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
    this.padle = new Padle(this, new Point(150, 150), 100, 6 * PI / 4, 7 * PI / 4);
    
    this.loop();
};

GyroGame.prototype.update = function () {
    "use strict";
    
    this.padle.update();
};

GyroGame.prototype.draw = function () {
    "use strict";
    var i, j;
    
    this.ctx.fillStyle = this.skin.field;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.save();
    
    this.padle.draw();
    
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






