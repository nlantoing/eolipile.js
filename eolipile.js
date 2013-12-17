//Strict mode...
 "use strict";

/**
 * Eolipile powered
 * @name Eolipile
 * @class
 * @property {Array} pile Store all pending process
 */
var Eolipile = function(){
    this._ID = 1;
    this._RUNNING = false;
    this._PILE = [];

    //define and build the requestNextLoop, we try to build first with the requestAnimationFrame so the loop can share the same timeloop than any other lib using requestAnimationFrame
    this._requestNextLoop = false;
    if(!!window) this._webContextInit();
    if(!this._requestNextLoop) this._workerContextInit();

    this.lastTime = 0;
    return this;
};

/**
 * Build the requestAnimationFrame from the window context
 * @private
 * @return this
 */
Eolipile.prototype._webContextInit = function(){
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x)
        this._requestNextLoop = window[vendors[x]+'RequestAnimationFrame'];

    return;
};

/**
 * Build the requestAnimationFrame from a worker context or for unsuported browsers.
 * @private
 * @return this
 */
Eolipile.prototype._workerContextInit = function(){
    this._requestNextLoop = function(callback, element) {
        var currTime = Date.now();
        var timeToCall = Math.max(0, 16 - (currTime - this.lastTime));
        setTimeout(function() { callback(currTime + timeToCall); },
                                   timeToCall);
        this.lastTime = currTime + timeToCall;

        return this;
    };
};

/**
 * The loop engine
 * @private
 */
Eolipile.prototype._loop = function(start){
    var newPile = [];
    for(var pileSize = this._PILE.length; pileSize; pileSize--){
        try{
            var process = this._PILE.pop();
            if(process.counter <= start){
                var replay = process.callback();
                if(replay){
                    process.counter = start + process.timer;
                    newPile.push(process);
                }else if(process.endCallback){
                    process.endCallback();
                }
            }else
                newPile.push(process);
        }catch(e){
	    //TODO
            var level = (typeof e.level != 'undefined') ? e.level : 2;
            var message = e.message || e;
            var datas = e.datas || e.stack || e;
            //debug.throw(level,message,datas);
        }
    }

    // sup'da loop!
    if(newPile.length){
	this._PILE = newPile;
	this._requestNextLoop(this._loop.bind(this));
	return;
    }
    this._RUNNING = false;
};

Eolipile.prototype.start = function(){
    if(this._RUNNING || !this._PILE.length) return;

    this._requestNextLoop(this._loop.bind(this));
    this._RUNNING = true;
    return this;
};

/**
 * Add a new process to the pile.
 * @memberof Kernel.Workers
 * @method
 * @param {Object} process The object to append to the pile
 * @param {Function} process.callback The function to launch when the timers is out.
 * @param {Function} process.endCallback Will be called when the callback function return false or the process is ended by the end command.
 * @param {Number} process.timer The time before execution (or between iterations)
 * @return Return true if succeeded, false eitherway.
 */
Eolipile.prototype.append = function(process){
    try{
        if(typeof(process) !== 'object')
            throw 'Not an object!';
        if(!!process.timer && !!process.callback && typeof(process.callback) ==='function'){
	    process.id = this._ID;
            process.counter = Date.now() + process.timer;
	    this._ID++;
            this._PILE.push(process);
	    if(!this._RUNNING) this.start();
	    return process.id;
        }else
            throw 'Missing parameters'
    }catch(e){
	//TODO
        //debug.throw(2,'[WORKER]While trying to append: '.concat(e),process);
    }
    return;
}

/**
 * setTimeout emulator
 * @memberof Kernel.Workers
 * @method
 * @param {Function} callback The function callback
 * @param {Number} duration The time before execution
 */
Eolipile.prototype.setTimeout = function(callback,duration){
    if(typeof(callback) !=='function' || typeof(duration) !=='number'){
	//TODO: catch exception
	return this;
    }
    this.append({
        timer: duration,
        run: callback
    });
    return this;
}

/**
 * Get a process
 * @method
 * @param {Number} id The process id
 * @return False if the process is not found, the process object eitherway.
 */
Eolipile.prototype.get = function(id){
    var pile = this._PILE;
    if(!pile.length) return false;

    var len = pile.length;
    while(len){
	len--;
	if(pile[len].id === id)
	    return this._PILE[len];
    }
    return false;
};

/**
 * End a process, will run the end callback on the next loop if defined.
 * @param {Number} id The process id
 * @method
 */
Eolipile.prototype.end = function(id){
    var process = this.get(id);
    process.callback = function(){ return false};
    process.counter = 0;
    return;
};

/**
 * Kill the procee, same as end but will also prevent the end callback from running
 * @param {Number} id The process id
 * @method
 */
Eolipile.prototype.kill = function(id){
    var process = this.get(id);
    this.end(id);
    process.endCallback = false;
    return;
};

/**
 * Flush the process pile
 * @method
 */
Eolipile.prototype.flush = function(){
    var id, len = this._PILE.length;
    if(!len) return;
    while(len){
	len--;
	console.log(len);
	this.kill(this._PILE[len].id);
    }
    return;
};
