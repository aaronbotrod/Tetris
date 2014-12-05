'use strict';
/** 
  Notes:
    Considerations if would take if I were to continue to develop without external code:
    - Define as an ES6 module
    - Move helper functions to a utility class
    - Handle shape movement and repesentation without having to deal with extra slack
      around the shape
    - Push all shape logic to this module and have the game manager only deal with the board
      and application UI
    - Create a custom map function to run a cb on each of the blocks
**/

function matrix( rows, cols, defaultValue){
  var arr = [];
  for(var i=0; i < cols; i++){
    arr.push([]);
    for(var j=0; j < rows; j++){
      arr[i][j] = defaultValue;
    }
  }
  return arr;
}

// Handles logic related to shape movement and collision detection in addition to rendering the tetris wall view.
function Wall(width, height) {
  this.height = width ? width : 22;
  this.width = height ? height: 10;
  this.blocks = matrix(this.height, this.width, 0);
  this.render();
}

var boundValue = function(value, lowerBound, upperBound) {
  if(value >= lowerBound ) {
    if(value <= upperBound) {
      return value;
    } else {
      return upperBound;
    }
  } else {
    return lowerBound;
  }
};

Wall.prototype.moveShape = function(shape, action) {
  var units = 1;
  //Attempts to move the shape in the desired direction
  //Dealing with collisions accordingly
  if(action === 'left'){
      var prevLeft = shape.state.left;
      shape.state.left = boundValue(prevLeft - units, 0 - shape.bounds.left, 10);
      if(this.collidesWith(shape)){
        shape.state.left = prevLeft;
      }
  } else if(action === 'right') {
      var prevRight = shape.state.left;
      shape.state.left = boundValue(prevRight + units, 0, 10 - (shape.bounds.right + 1));
      if(this.collidesWith(shape)){
        shape.state.left = prevRight;
      }
  } else if (action === 'down') {
      var prevBottom = shape.state.bottom;
      shape.state.bottom = prevBottom - units;
      if( shape.state.bottom + shape.bounds.bottom < 0 || this.collidesWith(shape)){
        shape.state.bottom = prevBottom;
        var linesCompleted = this.place(shape);
        if(linesCompleted === null) {
          return true;
        }
        this.removeLines(linesCompleted);
        window.publisher.publish('shape_placed', linesCompleted);
        
      }
  } else if (action === 'rotate') {
      shape.rotate(true);
      if(this.collidesWith(shape)){
        shape.rotate();
      }
  }

  shape.el.style.left  = (shape.state.left/this.width)*100+'%';
  shape.el.style.bottom  = (shape.state.bottom/this.height)*100+'%';
  return false;
};

Wall.prototype.place = function(shape) {
  var shapeLeft = shape.state.left;
  var shapeBottom = shape.state.bottom;
  var lines = [];
  var block = null;
  for(var y = shape.blocks.length - 1; y >= 0 ; y--) {
    for(var x = 0; x <  shape.blocks.length ; x++) {
      block = shape.blocks[x][y];
      if(block){
        this.blocks[shapeLeft+x][shapeBottom+y] = 1;
        if(this.height < shapeBottom+y) {
          // It was placed beyond the scope of the wall
          return null;
        }
      }
    }
    var lineCompleted = true;
    for(var i = 0; i < this.width; i++) {
      block = this.blocks[i][shapeBottom+y];
      if(!block) {
        lineCompleted = false;
      }
    }
    if(lineCompleted){
      lines.push(shapeBottom+y);
    }
  }
  this.updateView();
  return lines;
};

Wall.prototype.removeLines = function(completeLines) {
  var skippingJ = 0;
  for(var j = 0; j < this.height; j++) {
    while(completeLines.indexOf(skippingJ) !== -1) {
      skippingJ++;
    }
    for(var i = 0; i < this.width; i++) {
      if(skippingJ < this.height) {
        this.blocks[i][j] = this.blocks[i][skippingJ];
      } else {
        this.blocks[i][j] = 0;
      } 
    }
    skippingJ++;
  }
  if(completeLines.length){
    window.publisher.publish('linesCompleted', {linesCompleted: completeLines});
  }
  this.updateView();
};

//The string is appended so that the y values grow towards the top of the screen.
Wall.prototype.toString = function() {
  var str = '';
  for(var j = this.height - 1; j >= 0; j--) {
    for(var i = 0; i < this.width; i++) {
      str = str + this.blocks[i][j] + ' ';
    }
    str = str + '\n ';
  }
  return str;
};

Wall.prototype.render = function(){
  this.el = document.getElementById('wall');
  for(var j = this.height - 1; j >= 0; j--) {
    for(var i = 0; i < this.width; i++) {
      var block = document.createElement('img');
      block.src = 'block_sprite.png';
      block.className = 'block';
      block.style.width = (1/this.width)*100+'%';
      this.el.appendChild(block);
    }
  }
};

Wall.prototype.placeAtTop = function(shape) {
  //Hackish. Less so if I would have used web componenets
  shape.el.style.left = (shape.state.left/this.width)*100+'%';
  shape.el.style.bottom = ((shape.state.bottom-shape.bounds.bottom)/this.height)*100+'%';
  this.el.appendChild(shape.el);
  return this.collidesWith(shape);
};

Wall.prototype.updateView = function(){
  for(var j = this.height - 1; j >= 0; j--) {
    for(var i = 0; i < this.width; i++) {
      var y = this.height - j - 1;
      var x = i;
      var blockEl = this.el.children[this.width*y+x];
      if( this.blocks[i][j] === 1) {
        //New apis I didn't know about
        blockEl.classList.add('on');
      } else {
        blockEl.classList.remove('on');
      }
    }
  }
};

Wall.prototype.collidesWith = function(shape){
  var shapeLeft = shape.state.left;
  var shapeBottom = shape.state.bottom;
  for(var y = shape.bounds.top; y >= shape.bounds.bottom ; y--) {
    for(var x = shape.bounds.left; x <=  shape.bounds.right ; x++) {
      var block = shape.blocks[x][y];
      if(shapeLeft+x< 0 || shapeLeft+x>=10){
        return true;
      }
      if(block === 1 && this.blocks[shapeLeft+x][shapeBottom+y] === 1){
        return true;
      }
    }
  }
  return false;
};

