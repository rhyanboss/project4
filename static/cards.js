$(document).ready(function(){
	// $('.card').click(function(){
 //        $(this).find('.faces').addClass('flipped').mouseleave(function(){
 //            $(this).removeClass('flipped');
 //        });
 //        return false;
 //    });
	game =  new Game();
 	game.setUp();
	game.addPlayer("Player 1");
	game.start();
});
	

function Card(rank, suit,html){
	this.rank = rank;
	this.suit = suit;
	this.matched = false;
	this.card_id = null;
	this.flipped = false;
	this.match = function(card){
		return card.rank == this.rank && card.suit == this.suit;
	};
	this.clone = function(){
		return new Card(this.rank,this.suit);
	}
	this.flip = function(){
		$("#"+this.card_id).find(".faces").addClass("flipped");
		this.flipped = true;
	}
	this.unFlip = function(){
		$("#"+this.card_id).find(".faces").removeClass("flipped");
		this.flipped = false;
	}
	this.animate = function(){
		var card = this;
		$("#"+this.card_id).click(function(){
		
				var cardObj = card;
				$(this).find(".faces").addClass("flipped");
				$(this).trigger("flipped",[cardObj]);
				
				console.log(this);
		});
		
	}
	this.getHtml = function(){
		frontHtml = $("<div class='face front'>").html(this.rank).append(this.suit);
		backHtml = $("<div class='face back'>");
		facesHtml = $("<div class='faces'>").html(frontHtml).append(backHtml);
		html = $("<div class='card' id='"+this.card_id+"'>").html(facesHtml);
		return html;
	}
}


function Board(rows,columns,deck){
	this.rows = rows;
	this.columns=columns;
	this.cards = [];
	this.generalDeck = deck;
	this._randomDeck = [];
	this.deck = [];
	this.flippedCards = [];
	this.timeout = null;
	this.html=null;
	this.randomCards = function(){
		if(this._randomDeck.length==0){
			card_nums = this.rows*this.columns;
			if(card_nums%2==0){
				unique=card_nums/2;
				for(u=0;u<unique;u++){
					this._randomDeck.push(this.getRandomCard());
				}

			}else{
				console.log("Cannot build board with "+(this.rows*this.columns)+" cards.");
				return;
			}
		}
		return this._randomDeck;		
	}

	this.build = function(element){
		deck = this.randomCards();
		console.log(deck);
		for(d=0;d<deck.length;d++){
			card = deck[d];
			match = card.clone();
			this.deck.push(card);
			this.deck.push(match);
			console.log(card);
		}
		this.shuffle();
		this.shuffle();
		this.display(element);
	}

	this.display = function(element){
		html = this.getHtml();
		element.append(html);
		for(c=0;c<deck.length;c++){
			card = deck[c];
			card.card_id = "card-"+c;
			console.log(card.getHtml());
			html.append(card.getHtml());
			card.animate();
		}
		console.log(html.get(0));
		
		
	}
	
	this.getHtml = function(){
		if(!this.html){
			this.html = $("<div class='board'>").css("width",(columns*200)+"px").css("height",(rows*200)+"px");
		}
		return this.html;
	}

	this.shuffle = function(){
		deck=this.deck;
		for(s=0;s<deck.length;s++){
			random = Math.floor((Math.random() * deck.length));
			card1 = deck[s];
			card2 = deck[random];
			deck[s] = card2;
			deck[random] = card1;
		}
		
	}

	this.getRandomCard= function(){
		return this.generalDeck.randomCard();
	}

	this.hasMatch = function(card,cards){
		if (!cards){
			cards = this.deck;
		}
		for(c=0;c<cards.length;c++){
			if (card.match(cards[c])){
				return true;
			}
		}
		return false;
	}
	this.makeMove = function(){
		var unmatched = [];
		var flippedCards = this.flippedCards;
		for(f=0;f<flippedCards.length;f++){
			card = flippedCards[f];
			if(!card.matched){
				unmatched.push({"card":card,"pos":f});
			}
		}
		console.log(unmatched);
		if(unmatched.length==2){
			card1 = unmatched[0].card;
			pos1 = unmatched[0].pos;
			card2 = unmatched[1].card;
			pos2 = unmatched[1].pos;
			if(card1.match(card2)){
				card1.matched=true;
				card2.matched=true;
				this.getHtml().trigger("match");
				
			}else{
				this.flippedCards.splice(pos2,1);
				this.flippedCards.splice(pos1,1);
				card1.unFlip();
				card2.unFlip();
				this.getHtml().trigger("miss");
				
			}
			this.getHtml().trigger("turnEnded");
		}
		this.timeout = null;
		return false;
	}
	this.flipCard = function(card){
		for(f=0;f<this.flippedCards.length;f++){
			if (card.card_id==this.flippedCards[f].card_id){
				return;
			}
		}
		this.flippedCards.push(card);
	}
	this.flipAll = function(){
		for(d=0;d<deck.length;d++){
			card = this.deck[d];
			card.flip();
		}
	}
	this.unFlipAll = function(){
		for(d=0;d<deck.length;d++){
			card = this.deck[d];
			card.unFlip();
		}
	}
}

function Deck(){
	this.suits = ["spade","clubs","hearts","diamonds"];
	this.ranks = ["1","2","3","4","5","6","7","8","9","J","Q","K","A"];
	this.deck=[];
	this.cards = function(){
		if (this.deck.length==0){
			for(s=0;s<this.suits.length;s++){
				for(r=0;r<this.ranks.length;r++){
					this.deck.push(new Card(this.ranks[r],this.suits[s]));
				}
			}
		}
		return this.deck;
	}
	this.randomCard = function(){
		random = Math.floor((Math.random() * 52 ));
		return this.cards()[random];
	}
}
function Game(){
	MODES = {
		"network":"network",
		"single":"single",
		"double":"double"
	};
	this.mode = MODES.single;
	this.players = [];//list of players
	this.turn = null;//stores whoes turn it is
	this.html = null;
	this.timeout=null;
	this.turnMax=1;
	this.updateTurn = function(game){
		board.getHtml().on("turnEnded",function(){
			
			game.turn.addTurn();
			if (game.mode == MODES.network){
			}
			else if(game.mode == MODES.single){
				if(game.turn.turns==game.turnMax){
					board.flipAll();
					alert("GAME OVER");
				}
			}
			else if (game.mode == MODES.double){
				game.changeTurn();
			}
			
		});
	}
	this.changeTurn = function(){
		if (this.players[0].name == this.turn.name){
				this.turn = this.players[1];
		}
		else{
			this.turn = this.players[0];
		}
		this.html.find("#game-turn").html(this.turn.name);
	}
	this.getHtml = function(){
		if(!this.html){
			modesHtml = $("<select id='game-modes'>");
			modes = Object.keys(MODES);
			for(m=0;m<modes.length;m++){
				mode =  modes[m];
				modeHtml = $("<option value="+mode+" class='game-mode'>").html(mode);
				modesHtml.append(modeHtml);
			}
			modesHtml.find("[value="+this.mode+"]").attr("selected","selected");
			playersHtml = $("<div id='game-players'>");
      netPlayers = $("<div id='network-players'>");
			gameHtml = $("<div id='game' >");
      gameHtml.append(netPlayers);
			gameHtml.append(modesHtml);
			gameHtml.append(playersHtml);
     
			this.html = gameHtml;
			turnHtml = $("<h1 id='game-turn'>");
			gameHtml.append(turnHtml);
		}
		return this.html;
	}
	this.setUp = function(){
		deck = new Deck();
		board = new Board(4,4,deck);
		gameHtml = this.getHtml();
		$("body").append(gameHtml);
		board.build(gameHtml);
		this.listen();
		
	}
	this.start = function(){
		this.turn = this.players[0];
		turnHtml = this.getHtml().find("#game-turn").html(this.turn.name);
	}
	this.clear = function(){
		this.getHtml().remove();
		this.html=null;
	}
	
	this.modeChanged = function(game){
		$("#game-modes").change(function(){
			game.changeMode($(this).val())
		});
	}
	this.changeMode = function(mode){
		this.mode = mode;
		if (mode == MODES.network){
			this.restoreSingle();
			gameMessage(board.deck);
		}
		else if(mode == MODES.single){
			this.restoreSingle();
		}
		else if (mode == MODES.double){
			this.addPlayer("Player 2");
		}
		this.reset();
		
	}
	this.restoreSingle = function(){
		if(this.players.length>1){
			this.players.splice(1,1);
		}
	}
	this.reset = function(){
		this.clear();
		this.setUp();
		for(p=0;p<this.players.length;p++){
			this.displayPlayer(this.players[p]);
		}
		this.start();
		board.unFlipAll();
	
	}
	this.addPlayer = function(playerName){
		player = new Player(playerName);
		this.players.push(player);
		this.displayPlayer(player);
	}
	this.displayPlayer = function(player){
	this.html.find("#game-players").append(player.getHtml())	;
	}
	this.cardFlipped = function(game){
		$(".card").on("flipped",function(e,card){
			board.flipCard(card);
			if(game.timeout){
				clearTimeout(game.timeout);
				game.timeout=null;
			}
			game.timeout = setTimeout(function(){board.makeMove();},1000);
		});
	}
	this.listen = function(){
		var game = this;
		this.modeChanged(game);
		this.cardFlipped(game);
		this.updateTurn(game);
		this.score(game);
	}
	this.playSound = function(effect){
		$("#sound").remove();
		sound = $("<embed id='sound' autostart='true' hidden='true'>");
		if(effect == "match"){
			sound.attr("src","./match.mp3");
		}else if (effect == "miss"){
			sound.attr("src","./miss.mp3");
		}else if (effect=="win"){
			sound.attr("src","./win.mp3");
		}
		$("body").append(sound);
	}
	this.score = function(game){
		board.getHtml().on("match",function(){
			game.turn.addScore();
			game.playSound("match");
		});
		board.getHtml().on("miss",function(){
			game.playSound("miss");
		});
		
	}
	this.playerName = function(){
		player = this.players[0];
		return player.name;1
	}
  this.addNetworkPlayer =function(playerId,playerName){
    playerHtml = $("<div class='network-player' id='player"+playerId+"'>").html(playerName);
    this.getHtml().find("#network-players").append(playerHtml);
  }
}
function Player(name){
	this.name = name;
	this.score = 0;
	this.html = null;
	this.turns = 0;
	this.getHtml = function(){
		if(!this.html){
			var name = $("<div class='player-name'>").html("Name: "+this.name);
			var score = $("<div class='player-score'>").html("Score: "+this.score);
			var turn = $("<div class='player-turn'>").html("Turns: "+this.turns);
			this.html = $("<div class='player' id='player-"+player.name+"'>").html(name).append(score).append(turn);
		}
		return this.html;
	}
	this.addScore = function(){
		this.score+=1;
		this.getHtml().find(".player-score").html("Score: "+this.score);
	}
	this.addTurn = function(){
		this.turns+=1;
		this.getHtml().find(".player-turn").html("Turns: "+this.turns);
	}
		
}   
gameMessage = function(msg){
   msg= JSON.stringify(msg);
  $.post("/",{"data":msg});
}

onOpened = function(){
  message={"player_id":$("#player-id").val()};
  gameMessage(message);
}

onMessage = function(message){
 data = eval("("+message.data+")");
  console.log("Got The Message");
  console.log(data);
  $.each(data,function(key,value){
    console.log(key);
    if(key=="addNetWorkPlayer"){
      console.log("add");
      game.addNetworkPlayer(value.id,value.name);
      
    }
  });
  
}
onError = function(e){
  alert("error:"+e);
}
onClose = function(e){
  alert("closed");
}