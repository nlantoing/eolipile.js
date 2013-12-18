/*
  BSD-2 license
  Copyright (c) 2013, Nicolas Lantoing
  All rights reserved.

  Redistribution and use in source and binary forms, with or without modification,
  are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

  * Redistributions in binary form must reproduce the above copyright notice, this
  list of conditions and the following disclaimer in the documentation and/or
  other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
  ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
  ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

//Strict mode...
 "use strict";

/**
 * Eolipile 
 * @class
 * @property {Number} _ID Increment after each append, is used to retrieve, end and kill events
 * @property {Boolean} _RUNNING Define if the loop is currently active or not
 * @property {Array} _PILE Store all pending events
 * @property {Function} _requestNextLoop Will define the time to wait until the next loop.
 * @property {Number} lastTime Timestamp of the last loop.
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
 * Build _requestNextLoop from the window context
 * @private
 */
Eolipile.prototype._webContextInit = function(){
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x)
        this._requestNextLoop = window[vendors[x]+'RequestAnimationFrame'];

    return;
};

/**
 * Build _requestNextLoop from a worker context or for unsuported browsers.
 * @private
 */
Eolipile.prototype._workerContextInit = function(){
    this._requestNextLoop = function(callback, element) {
        var currTime = Date.now();
        var timeToCall = Math.max(0, 16 - (currTime - this.lastTime));
        setTimeout(function() { callback(currTime + timeToCall); },
                                   timeToCall);
        this.lastTime = currTime + timeToCall;

        return;
    };
};

/**
 * The loop parser, get all process from _PILE, check if they are ready to go, launch theme and put theme back into the _PILE if they return a true value.
 * @private
 * @parameter {Number} start The begin timestamp, used to define the total execution time and the time before the next iteration.
 */
Eolipile.prototype._loop = function(start){
    var newPile = [];
    for(var pileSize = this._PILE.length; pileSize; pileSize--){
        var process = this._PILE.pop();
        try{
            if(process._COUNTER <= start){
                var replay = process.callback();
                if(replay){
                    process._COUNTER = start + process.timer;
                    newPile.push(process);
                }else if(process.endCallback){
                    process.endCallback();
                }
            }else
                newPile.push(process);
        }catch(e){
	    console.error("[eolipile] The event "+process.id+" couldn't be parsed and have been removed from the pile.", e.message);
        }
    }

    // sup'da loop!
    if(newPile.length){
	this._PILE = newPile;
	this._requestNextLoop(this._loop.bind(this));
	return;
    }
    this._RUNNING = false;
    return;
};

/**
 * Start the loop, will do nothing if the loop is already running or if _PILE is empty.
 * Note : automatically called by this.append if the loop is not running.
 * @method
 */
Eolipile.prototype.start = function(){
    if(this._RUNNING || !this._PILE.length) return;

    this._requestNextLoop(this._loop.bind(this));
    this._RUNNING = true;
    return this;
};

/**
 * Add a new event to _PILE.
 * @method
 * @param {Object} process The object to append to _PILE
 * @param {Number} process.timer The time before next execution (or between iterations)
 * @param {Function} process.callback The function to launch when the timers is out.
 * @param {Function} process.endCallback Will be called when the callback function return false or the process is ended by this.end.
 * @return Return true if succeeded, false eitherway.
 */
Eolipile.prototype.append = function(process){
    try{
        if(typeof(process) !== 'object')
            throw 'Not an object!';
        if(!!process.timer && !!process.callback && typeof(process.callback) ==='function'){
	    process.id = this._ID;
            process._COUNTER = Date.now() + process.timer;
	    this._ID++;
            this._PILE.push(process);
	    if(!this._RUNNING) this.start();
	    return process.id;
        }else
            throw 'Missing parameters'
    }catch(e){
	console.error("[eolipile] Append failed", e.message);
    }
    return;
}

/**
 * setTimeout alias
 * Note : if callback return true this method will work just like setInterval 
 * @method
 * @param {Function} callback The function to launch
 * @param {Number} duration The time before execution
 */
Eolipile.prototype.setTimeout = function(callback,duration){
    if(typeof(callback) !=='function' || typeof(duration) !=='number'){
	console.error("[eolipile] setTimeout failed, wrong parameter's type.");
	return this;
    }
    this.append({
        timer: duration,
        run: callback
    });
    return this;
}

/**
 * Get an event from the _PILE
 * @method
 * @param {Number} id The event id
 * @return False if the event is not found, the event himself eitherway.
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
 * End an event, will run the endCallback on the next loop if defined.
 * @param {Number} id The process id
 * @method
 */
Eolipile.prototype.end = function(id){
    var process = this.get(id);
    process.callback = function(){ return false};
    process._COUNTER = 0;
    return;
};

/**
 * Kill ab event, same as this.end but will also prevent the end callback from running
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
 * Flush _PILE
 * @method
 */
Eolipile.prototype.flush = function(){
    var id, len = this._PILE.length;
    if(!len) return;
    while(len){
	len--;
	this.kill(this._PILE[len].id);
    }
    return;
};
