var timeoutTest = function(){
    var process = {
	'timer': 100,
	'callback': function(){
	    console.log('timeout test ok.');
	    results.timeout = true;
	}
    };
    pile.append(process);
};

var intervalTest = function(){
    var process = {
	'timer': 100,
	'callback': function(){
	    console.log('interval test');
	    results.interval = true;
	    results.flush = false;
	    return true;
	}
    };
    pile.append(process);
};

var getTest = function(){
    var process = {
	'timer': 100,
	'callback': function(){
	    console.log('get test.');
	    return true;
	}
    };
    var id = pile.append(process);
    var get = pile.get(id);
    if(get.id === id){
	console.log('get test ok');
	results.get = true;
    }
};

var endTest = function(){
    var process = {
	'timer': 100,
	'callback': function(){
	    console.log('end test');
	    return true;
	},
	'endCallback': function(){
	    console.log('End callback test');
	    results.end = true;
	}
    };
    var id = pile.append(process);
    pile.end(id);
};

var killTest = function(){
    var process = {
	'timer': 100,
	'callback': function(){
	    console.log('kill test');
	    return true;
	},
	'endCallback': function(){
	    console.log('Kill callback test');
	    results.kill = false;
	}
    };
    var id = pile.append(process);
    pile.kill(id);
    results.kill = true;
};

var flushTest = function(){
    pile.flush();
    results.flush = true;
};

var parseResults = function(){
    var content = document.getElementById('content');
    for(var label in results){
	var p = document.createElement('p');
	var color = (results[label]) ? 'green': 'red';
	p.setAttribute('style','color:'+color);
	var text = document.createTextNode(label+' : '+results[label]);
	p.appendChild(text);
	content.appendChild(p);
    };
};

var results = {
    'create': false,
    'timeout': false,
    'interval': false,
    'get': false,
    'end': false,
    'kill': false,
    'flush': false
};

(function(){
    try{
	this.pile = new Eolipile();
	results.create = true;

	timeoutTest();
	intervalTest();
	getTest();
	endTest();
	killTest();

	setTimeout(function(){
	    flushTest();
	    parseResults();
	    console.log(results);
	}, 500);
    }
    catch(e){
	console.log(e);
    }
})();
