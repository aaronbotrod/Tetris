'use strict';
/** 
  Notes:
    Considerations if would take if I were to continue to develop without external code:
    - Define as an ES6 module
    - Make this a user input module that fires off user events
    - Add other input types mouse, touch, etc.
    - Decouple the publisher
**/

window.userInput = function() {
  var nameSpace = 'user_input';
  document.body.onkeydown = function(event) { 
    switch(event.keyCode)
    {
      //Right Arrow
      case userActions.right:
        window.publisher.publish(nameSpace, {action:'right'});
        break;
      //Left Arrow
      case userActions.left:
        window.publisher.publish(nameSpace, {action:'left'});
        break;
      //Up Arrow
      case userActions.rotate:
        window.publisher.publish(nameSpace, {action:'rotate'});
        break;
      //Down Arrow
      case userActions.down:
        window.publisher.publish(nameSpace, {action:'down'});
        break;
      //Esc
      case userActions.pause:
        window.publisher.publish(nameSpace, {action:'pause'});  
        break;
      //Space
      case userActions.restart:
        window.publisher.publish(nameSpace, {action:'restart'});  
        break;
    }
  };
};

window.userActions = {
  right: 39, // Up Arrow
  left: 37, // Left Arrow
  rotate: 38, // Up Arrow
  down: 40, // Down Arrow
  pause: 27, // Esc 
  restart: 32 //Restart
};