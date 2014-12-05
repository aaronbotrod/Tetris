'use strict';
/** 
  Notes:
    Considerations if would take if I were to continue to develop without external code:
    - Define as an ES6 module
    - Handle shape movement and repesentation without having to deal with extra slack
      around the shape
**/
function Shape(blocks) {
  this.blocks = blocks;
  //Starting position
  this.state = {
    left: 5,
    bottom: 22
  };
  this.previewEl = document.getElementById('shape-preview');
  this.calculateBounds();
  this.render();
}

Shape.prototype.calculateBounds = function(){
  var bounds = {};
  bounds.left = this.blocks.length;
  bounds.right = 0;
  bounds.top = 0;
  bounds.bottom = this.blocks.length;

  for(var j = this.blocks.length - 1; j >= 0 ; j--) {
    for(var i = 0; i < this.blocks.length  ; i++) {
      var value = this.blocks[i][j];
      if(value){
        bounds.left = i < bounds.left ? i : bounds.left;
        bounds.right = i > bounds.right ? i : bounds.right;
        bounds.bottom = j < bounds.bottom ? j : bounds.bottom;
        bounds.top = j > bounds.top ? j : bounds.top;
      }
    }
  }
  this.bounds = bounds;
};

Shape.prototype.swap = function(x, y, x2, y2) {
    var temp = this.blocks[x][y];
    this.blocks[x][y] = this.blocks[x2][y2];
    this.blocks[x2][y2] = temp;
};

Shape.prototype.rotate = function(clockwise){
    //When rotate recalculate bounds
    var lvls = Math.floor(this.blocks.length/2);
    for(var y = 0; y < lvls; y++) {
      for(var x = y; x < this.blocks.length - y - 1; x++) {
        var n = this.blocks.length-1;
        if(clockwise) {
          this.swap(x, y, n-y , x);
          this.swap(n-y, x, n-x, n-y);
          this.swap(y, n-x, n-x, n-y);
        } else {
          this.swap(x, y, n-y, x);
          this.swap(x, y, y , n-x);
          this.swap(y, n-x, n-x,n-y);         
        }

      }
    }
    this.updateView();
};

//The string is appended so that the y values grow towards the top of the screen.
Shape.prototype.toString = function() {
  var str = '';
  for(var j = this.blocks.length - 1; j >= 0 ; j--) {
    for(var i = 0; i < this.blocks.length; i++) {
      str = str + this.blocks[i][j] + ' ';
    }
    str = str + '\n ';
  }
  return str;
};

Shape.prototype.updateView = function(){
  var len = this.blocks.length;
  for(var j = len - 1; j >= 0; j--) {
    for(var i = 0; i < len; i++) {
      var y = len - j - 1;
      var x = i;
      var blockEl = this.el.children[len*y+x];
      if( this.blocks[i][j] === 1) {
        //New apis I didn't know about
        blockEl.classList.add('on');
      } else {
        blockEl.classList.remove('on');
      }
    }
  }
  this.calculateBounds();
};
Shape.prototype.render = function(){
  var len = this.blocks.length;
  var ShapeContainer = document.createElement('div');
  ShapeContainer.className = 'block-container square-'+len;
  for(var j = len - 1; j >= 0; j--) {
    for(var i = 0; i < len; i++) {
      var block = document.createElement('img');
      block.src = 'block_sprite.png';
      block.className = 'block';
      block.style.width = (1/len)*100+'%';
      //I used an image to get around all of the css math. I just wanted percentage scaling with aspect ratio.
      if(this.blocks[i][j] === 1) {
        block.className += ' on';
      }
      ShapeContainer.appendChild(block);
    }
  }
  this.el = ShapeContainer;
  while (this.previewEl.firstChild) {
    this.previewEl.removeChild(this.previewEl.firstChild);
  }
  this.previewEl.appendChild(this.el);
};

window.ShapeFactory = function() {
  //Used function to create new instance of the 2d arrays
  //so that I can freely manipulate the values
  var getLShape = function(){
    return [[0,0,0],[1,1,1], [1,0,0]];
  };
  var getSquareShape = function() {
    return [[1,1],[1,1]];
  };
  var getReverseLShape = function() {
    return [[1,0,0], [1,1,1], [0,0,0]];
  };
  var getZshape = function() {
    return [[0,1,0],[1,1,0], [1,0,0]];
  };
  var getReverseZShape = function() {
    return [[1,0,0], [1,1,0],[0,1,0]];
  };
  var getIShape = function() {
    return [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]];
  };
  var getTShape = function() {
    return [[1,0,0],[1,1,0],[1,0,0]];
  };
  var  matrixConstructors = [getLShape, getSquareShape, getReverseLShape, getZshape, getReverseZShape, getIShape, getTShape];
  //Generates the next random shape from list of constructors
  this.generateShape = function() {
    // Pick a random shape
    var i = Math.floor(Math.random()*matrixConstructors.length);
    var matrixConstructor = matrixConstructors[i];
    var shape = new Shape(matrixConstructor());
    return shape;
  };
};