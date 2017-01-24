
// addEventListener polyfill
function addEvent(elem, type, handler) {
  if (elem.addEventListener){
    elem.addEventListener(type, handler, false)
  } else {
    elem.attachEvent("on" + type, handler)
  }
}



// DOMContentLoaded polyfill
var domIsReady = (function(domIsReady) {
  var isBrowserIeOrNot = function() {
    return (!document.attachEvent || typeof document.attachEvent === "undefined" ? 'not-ie' : 'ie');
  }

  domIsReady = function(callback) {
    if(callback && typeof callback === 'function'){
      if(isBrowserIeOrNot() !== 'ie') {
        document.addEventListener("DOMContentLoaded", function() {
          return callback();
        });
      } else {
        document.attachEvent("onreadystatechange", function() {
          if(document.readyState === "complete") {
            return callback();
          }
        });
      }
    } else {
      console.error('The callback is not a function!');
    }
  }
  return domIsReady;
})(domIsReady || {});


//querySelectorAll/querySelector polyfill
if (!document.querySelectorAll) {
  document.querySelectorAll = function (selectors) {
    var style = document.createElement('style'), elements = [], element;
    document.documentElement.firstChild.appendChild(style);
    document._qsa = [];

    style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
    window.scrollBy(0, 0);
    style.parentNode.removeChild(style);

    while (document._qsa.length) {
      element = document._qsa.shift();
      element.style.removeAttribute('x-qsa');
      elements.push(element);
    }
    document._qsa = null;
    return elements;
  };
}

if (!document.querySelector) {
  document.querySelector = function (selectors) {
    var elements = document.querySelectorAll(selectors);
    return (elements.length) ? elements[0] : null;
  };
}

//adding bind
if (!('bind' in Function.prototype)) {
  Function.prototype.bind= function(owner) {
    var that= this;
    if (arguments.length<=1) {
      return function() {
        return that.apply(owner, arguments);
      };
    } else {
      var args= Array.prototype.slice.call(arguments, 1);
      return function() {
        return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
      };
    }
  };
}

// Add string trim if not supported natively
if (!('trim' in String.prototype)) {
  String.prototype.trim= function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  };
}

// Add Array methods if not supported natively
if (!('indexOf' in Array.prototype)) {
  Array.prototype.indexOf= function(find, i /*opt*/) {
    if (i===undefined) i= 0;
    if (i<0) i+= this.length;
    if (i<0) i= 0;
    for (var n= this.length; i<n; i++)
    if (i in this && this[i]===find)
    return i;
    return -1;
  };
}

if (!('forEach' in Array.prototype)) {
  Array.prototype.forEach = function(action, that /*opt*/) {
    for (var i = 0, n = this.length; i<n; i++)
    if (i in this)
    action.call(that, this[i], i, this);
  };
}

if (!('map' in Array.prototype)) {
  Array.prototype.map = function(mapper, that /*opt*/) {
    var other= new Array(this.length);
    for (var i = 0, n = this.length; i<n; i++)
    if (i in this)
    other[i]= mapper.call(that, this[i], i, this);
    return other;
  };
}

if (!('filter' in Array.prototype)) {
  Array.prototype.filter = function(filter, that /*opt*/) {
    var other= [], v;
    for (var i = 0, n = this.length; i<n; i++)
    if (i in this && filter.call(that, v= this[i], i, this))
    other.push(v);
    return other;
  };
}

if (!('every' in Array.prototype)) {
  Array.prototype.every = function(tester, that /*opt*/) {
    for (var i = 0, n = this.length; i<n; i++)
    if (i in this && !tester.call(that, this[i], i, this))
    return false;
    return true;
  };
}

if (!('some' in Array.prototype)) {
  Array.prototype.some= function(tester, that /*opt*/) {
    for (var i= 0, n= this.length; i<n; i++)
    if (i in this && tester.call(that, this[i], i, this))
    return true;
    return false;
  };
}
