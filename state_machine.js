'use strict';
/** 
  Notes:
    Considerations if would take if I were to continue to develop without external code:
    - Decouple the publisher.
    - Create a transitionDefinition constructor function
    - Define as an ES6 module
**/

// var transitionDefinition = {
//   startingState: 'loaded',
//   transition:
//   {
//     name: 'start_game',
//     fn: startGame
//   },
//   endingState: 'game_running'
// }

window.StateMachine = function(transitionDefinitions, startingStateName, publisherNameSpace) {
  var stateMachine = {};
  var i, transitionDefinition;
  var currentState = startingStateName;
  for(i = 0; i < transitionDefinitions.length; i++) {
    transitionDefinition = transitionDefinitions[i];
    
    if(!stateMachine[transitionDefinition.startingState]) {
      stateMachine[transitionDefinition.startingState] = {};
    }
    if(stateMachine[transitionDefinition.startingState][transitionDefinition.transition.name]) {
      console.error('Transition '+transitionDefinition.transition.name+' already leads to a state');
    } else {
      stateMachine[transitionDefinition.startingState][transitionDefinition.transition.name] = {
        endState: transitionDefinition.endingState,
        fn: transitionDefinition.transition.fn
      };
    }

  }

  return {
    transition:function(transitionName) {
      var transition = stateMachine[currentState][transitionName];
      if(transition) {
        transition.fn(currentState, transitionName, transition.endState, function() {
          window.publisher.publish(publisherNameSpace, { currentState: currentState, transitionName: transitionName, endState:transition.endState });
          currentState = transition.endState;
        });
      } else {
        console.error('Current State: '+currentState+' with transition: '+transitionName+' does not have an end state');
      }
    },
    reset: function(){
      currentState = startingState;
    }
  };
};