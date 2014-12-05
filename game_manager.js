'use strict';
/** 
  Notes:
    Considerations if would take if I were to continue to develop without external code:
    - Define as an ES6 module
    - Separate controller management, state management, and view management
    - Push all game logic to the tetris wall
**/

//In charge of maintaining the views and their controllers
window.GameManager = (function() {
  //Initializing the keyboardHandler
  var userInputEventEmitter = new window.userInput();

  var Game = {
    currentView: document.getElementById('menu-view'),
    gameState : 'loaded',
    //Game loop keeps track of the id of scheduled callback
    gameLoopId : null,
    currentShape: null,
    nextShape: null,
    stats: {
      level: 0,
      score: 0,
      lines: 0
    },
    views: {
      scoreEl: document.getElementById('score'),
      linesEl: document.getElementById('lines'),
      msgContainer: document.getElementById('notification-message-container'),
      gameOverStats: document.getElementById('game-over-stats'),
      gameOverVideo: document.getElementById('game-over-video')
    },
    shapeFactory : new window.ShapeFactory(),
    wall : new window.Wall(),
    setView: function(newViewName) {
      //Remove Current View from being displayed
      this.currentView.style.display = 'none';
      //Remove its user input listeners
      var currentViewName = this.currentView.id.replace('-', '_');
      var suffix = '_user_input_controller';
      var userInputControllerName = currentViewName+suffix;
      var userInputControllerFunction = this[userInputControllerName];
      window.publisher.remove('user_input', userInputControllerFunction);

      //Display new view and add user_input controllers
      userInputControllerName = newViewName.replace(/-/g, '_')+suffix;
      userInputControllerFunction = this[userInputControllerName];
      window.publisher.subscribe('user_input', userInputControllerFunction, this);
     
      this.currentView = document.getElementById(newViewName);
      this.currentView.style.display = 'block';
    },
    menu_view_user_input_controller: function() {
      this.gameStateMachine.transition('start_game');
    },
    game_view_user_input_controller : function(eventName, data) {
      if(data.action === 'pause') {
        this.pauseGameLoop();
      } else {
        if(this.gameLoopId && data.action in window.userActions)  {
          var gameOver = this.wall.moveShape(this.currentShape, data.action);
          if(gameOver) {
            this.stopGameLoop();
            window.publisher.publish('game_over');
          }
        }
      }
    },
    game_over_view_user_input_controller : function(eventName, data) {
      if(data.action === 'restart'){
        window.location.reload();
      }
    },
    runGameLoop : function loop() {
      var gameOver = this.wall.moveShape(this.currentShape, 'down');
      if(gameOver) {
        this.stopGameLoop();
        window.publisher.publish('game_over');
      } else {
        this.gameLoopId = window.setTimeout(loop.bind(this), 500);
      }
    },
    pauseGameLoop : function() {
      if(this.gameLoopId) {
        this.stopGameLoop();
        this.messageUser('Paused');
      } else {
        this.runGameLoop();
        this.messageUser('');
      }
    },
    stopGameLoop: function() {
      window.clearTimeout(this.gameLoopId);
      this.gameLoopId = null;
    },
    calculateScore: function(linesCompleted) {
      var multiplier = 0;
      var lines = linesCompleted.length;
      this.stats.level = 0;
      switch(lines){
        case 1:
          multiplier = 40;
          break;
        case 2:
          multiplier = 100;
          break;
        case 3:
          multiplier = 300;
          break;
        case 4:
          multiplier = 1200;
          break;
      }
      return multiplier*(this.stats.level + 1);
    },
    updateStats: function(linesCompleted){
      this.stats.score += this.calculateScore(linesCompleted);
      this.stats.lines += linesCompleted.length;
      this.updateStatsView();
    },
    updateStatsView: function() {
      this.views.scoreEl.innerHTML = this.stats.score;
      this.views.linesEl.innerHTML = this.stats.lines;
    },
    updateShapes: function() {
      if( !this.nextShape ) {
        this.nextShape = this.shapeFactory.generateShape();
      }
      if(this.currentShape){
        this.currentShape.el.parentElement.removeChild(this.currentShape.el);
      }
      this.currentShape = this.nextShape;
      var gameOver = this.wall.placeAtTop(this.currentShape);
      if(gameOver) {
        this.stopGameLoop();
        window.publisher.publish('game_over');
      }
      this.nextShape = this.shapeFactory.generateShape();
    },
    messageUser: function(message) {
      var msgContainer = this.views.msgContainer;
      if(message === "") {
        msgContainer.style.display = 'none';  
      } else {
        msgContainer.style.display = 'block';
      }
      msgContainer.firstElementChild.innerHTML = message;
    }
  };

  //Setting up the UI statemachine transition functions
  var startGame = (function (startState, transition, endingState, cb) {
    this.setView('game-view');
    this.updateShapes();
    this.updateStatsView();
    this.messageUser("");
    this.runGameLoop();

    window.publisher.subscribe('shape_placed', this.updateShapes, this);

    window.publisher.subscribe('game_over', function() {
      this.gameStateMachine.transition('end');
    }, this);

    window.publisher.subscribe('linesCompleted', function(eventName, data) {
      this.updateStats(data.linesCompleted);
    }, this);

    cb();// When the transition is finished it is automatically updated to running
  }).bind(Game);

  var endGame = (function(startState, transition, endingState, cb) {
      this.stopGameLoop();
      this.setView('game-over-view');
      this.views.gameOverStats.innerHTML = 'You completed '+this.stats.lines+' lines and scored '+this.stats.score+' points.';
      this.views.gameOverVideo.play();
      cb();// When the transition is finished it is automatically updated to running
  }).bind(Game);

  //Define game UI states and transition functions
  var transitionDefinitions = [
    {
      startingState: 'loaded',
      transition:
      {
        name: 'start_game',
        fn: startGame
      },
      endingState: 'game_running'
    },
    {
      startingState: 'game_running',
      transition: {
        name: 'end',
        fn: endGame
      },
      endingState: 'game_ended'
    }
  ];

  var stateMachinePublisherNamespace = 'gameState';
  Game.gameStateMachine = new window.StateMachine(transitionDefinitions, 'loaded', stateMachinePublisherNamespace);
  window.publisher.subscribe(stateMachinePublisherNamespace, function(event, data) {
    this.currentState = data.endState;
  }, Game);

  Game.setView('menu-view');
  return Game;
})();
