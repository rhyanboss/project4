"""`main` is the top level module for your Flask application."""
import json, datetime
from datetime import timedelta
from google.appengine.api import channel
from google.appengine.ext import db
from google.appengine.ext.db import polymodel
# Import the Flask Framework
from flask import Flask, render_template, request, session
app = Flask(__name__)
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'
# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.

class Player(polymodel.PolyModel):
  name = db.StringProperty()
  token = db.StringProperty()
  
  @property
  def json(self):
    return {"name":self.name}
  
  def create_channel(self):
    self.token = channel.create_channel(self.name)
    return self.token
  
  def send_message(self,msg):
    print "SEND MESSAGE NAME YAMS"
    print self.name
    channel.send_message(self.name,json.dumps(msg))
  

class AnonPlayer(Player):
  ip_address = db.StringProperty()

  
           
class User(Player):
  online = db.BooleanProperty()
  
  @property
  def games(self):
    return GamePlayer.all().filter("player =",self)
    
  @property
  def scores(self):
    return [game.score for game in self.games ]
  
  @property
  def week(self):
    today = datetime.datetime.today()
    week_day = today.weekday()
    sunday = today - timedelta(days = week_day)#Start of the week
    games = self.games
    return sum(game.score for game in games.filter("date >", sunday))

  @property
  def top(self):
    return max(self.scores if self.scores else [0])

  @property
  def total(self):
    return sum(game.score for game in self.games)

  @property
  def played(self):
    return self.games.count()

  @property
  def won(self):
    return self.games.filter("status = ","WON").count()

  @property
  def lost(self):
    return self.games.filter("status = ","LOST").count()

  @property
  def draw(self):
    return self.games.filter("status = ","DRAW").count()

  @staticmethod
  def create_player(id):
    player_id = Player.all().count()
    player_name = "player-%s"%player_id
    token = channel.create_channel(player_name)
    player = Player(key_name=player_name, name=player_name,online=True,token=token)
    player.put()
    return player

  @property
  def json(self):
    return {
      "name": self.name,
      "online":True,
      "top":self.top,
      "week":self.week,
      "all_time_score":self.total,
      "won":self.won,
      "played":self.played,
      "lost":self.lost,
      "draw":self.draw
    };
  



class Game(polymodel.PolyModel):
  date = db.DateTimeProperty()
  
class GamePlayer(polymodel.PolyModel):
  game = db.ReferenceProperty(Game)
  player = db.ReferenceProperty(Player)
  matches = db.IntegerProperty()
  misses = db.IntegerProperty()
  turns = db.IntegerProperty()
  status = db.StringProperty(choices=("WON","LOST","DRAW"))

def today():
  return datetime.datetime.today()

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404
"""
@app.route('/')
def game(name=None):
  player = Player.create_player()
  online_players = Player.get_online()
  players = Player.all()
  player_str = json.dumps(player.json)
  for player in players:
    player.event(channel,player_str)
  player.put()
  return render_template('cards.html',token=player.token,player_id=player.name,online_players=online_players)

 
@app.route('/request',methods=['POST'])
def game_request():
  if request.method == 'POST':
    post = json.loads(request.form['data'])
    player_id = post["player_id"]
    this_player = Player.get_by_key_name(player_id)
    request = {"request":this_player.json}
    str_message = json.dumps(request)
    player.send_message(channel,str_message)
    return "200"
  

@app.route('/new-game', methods=['POST'])
def game_accept():
  if request.method == 'POST':
    game = Game()"""

@app.route('/',methods=['GET'])
def card_game():
  if request.method=="GET":
    #Create anonymous player using their ip address
    ip_address = request.remote_addr
    #anon = AnonPlayer.get_or_insert(ip_address)
    anon = AnonPlayer(ip_address=ip_address)
    if not anon.ip_address:
      anon.ip_address = ip_address
    if not anon.name:
      anon.name = "Player %s"%AnonPlayer.all().count()
    anon.put()
    #request.remote_addr
    #Add a session for the anonymous player
    session["ip_address"] = anon.ip_address
    anon.create_channel()
    #Get online players
    players = Player.all()
    players_json = []
    for player in players:
        player.send_message(json.dumps(anon.json))
        players_json+=[player.json]
    return render_template('cards.html',token=anon.token,player_id=anon.name,players=players_json)

@app.route('/event',methods=['POST'])
def game_request():
  if request.method == 'POST':
    print request.form
    event = request.form.get('event')
    if event:
      card_request = json.loads(event)
      sender = card_request.get("sender")
      receiver = card_request.get("receiver")
      event_type = card_request.get("type")
      if sender and receiver and event_type :
        player = Player.all().filter("name = ",receiver).get();
        player.send_message({"event":card_request})
        return ""
      else:
        return "Please supply a request with a requester and requestee"
    else:
      return "Not an event"
      