'use strict';
/** 
  Notes:
    Considerations if would take if I were to continue to develop without external code:
    - Add support for name spacing
    - Define as an ES6 module
    - Have business logic modules define and enumerate their events
**/

window.publisher = {
  events: {},
  subscribe:function(eventName, cb, context) {
    if(!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push({cb:cb, context:context});
  },
  publish:function(eventName, data) {
    if(this.events[eventName]){
      var subscribers = this.events[eventName];
      // console.info('Event: '+eventName+'  found');
      subscribers.forEach(function(subscriber) {
        setTimeout(
          //Constructring context for async call
          (function(subscriber, eventName, data){
            return function(){
              subscriber.cb.call(subscriber.context, eventName, data);
            };
          })(subscriber, eventName, data), 1);
      });
    } else {
      console.error('Event: '+eventName+' not found');
    }
  },
  remove: function(eventName, cb){
    var eventSubscribers = this.events[eventName];
    if(eventSubscribers) {
      for(var i = 0; i < eventSubscribers.length; i++) {
        if(eventSubscribers[i].cb === cb) {
          eventSubscribers.splice(i,1);
        }
      }
    }
  }
};