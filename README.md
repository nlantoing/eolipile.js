eolipile.js
===========

A small and portable timing-events helper, compatible with document (requestAnimationFrame) and workers environments.


Usage
=====

    var pile = new Eolipile();

setTimeout
----------

    pile.append({
      'timer': 100,
      'callback': function(){
         //do something in 100ms
      }
    });
    
or you can use the alias

    pile.setTimeout(function(){},100);

setInterval
-----------

The time-event will automatically restart with the same timer if the callback return is true.

    pile.append({
      'timer': 100,
      'callback': function(){
        //do something every 100ms
        return true;
      }
    })

Editing and stoping events
--------------------------

append method return the event's id which can be used with get, end and kill methods (see below).

    var id = pile.append({
      'timer': 100,
      'callback': function(){
        return true;
      },
      'endCallback': function(){
        //do something when callback return false or the end method is called on this event
      }
    });

Get and update an event

    //change the loop interval to 200ms
    pile.get(id).timer = 200;

Terminate an interval event, will throw the endCallback on the next loop if defined

    pile.end(id);

Kill an event, preventing the endCallback to be called

    pile.kill(id);

Flush the event list (kill all events so no endCallback is called)

    pile.flush();

Custom property
-------------------

    pile.append({
      'timer': 1000,
      'countdown': 4,
      'callback': function(){
        this.countdown--;
        if(this.countdown)
          console.log(this.countdown);
        return this.countdown;
      },
      'endCallback': function(){
        console.log('GO!');
      }
    });

Notes
-----

If no events are active the timeloop will stop, the timeloop will automaticly (re)start when a new event have been added.
You can bind callback and endCallback to another context with the Function bind methode
