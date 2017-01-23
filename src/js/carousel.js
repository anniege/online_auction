var carousel = function() {
  this.opts = {};

  var widthElem;
  var widthElemWithMargin;
  var carouselContainer;
  var carouselContainerWidth;
  var carouselHidden;
  var carouselList;
  var carouselItems;
  var left;
  var right;
  var sliderTotalLength;
  var sliderPageLength;
  var currentLeftValue = 0;
  var timerId = null;
  var startRight = false;
  var startLeft = false;
  var elemCount;

  this.init = function() {
    var self = this;

    if (!window.getComputedStyle) { // старые IE
      carouselContainerWidth = getIEComputedStyle(carouselContainer, 'width');
    } else {
      carouselContainerWidth = window.getComputedStyle(carouselContainer, "").width;
    }
    // carouselContainerWidth = getStyle(carouselContainer).width;
    widthElem = 300;
    widthElemWithMargin = widthElem + 10;
    this.opts.count = Math.floor(parseInt(carouselContainerWidth)/widthElemWithMargin);

    Array.prototype.forEach.call(carouselItems, function(el) {
      el.style.width = widthElem + 'px';
    });

    if (carouselList.querySelectorAll('.cloned').length !== 0) {
      Array.prototype.forEach.call(carouselList.querySelectorAll('.cloned'), function(el) {
        carouselList.removeChild(el);
      });
    }

    Array.prototype.forEach.call(carouselItems, function(el, i) {
      if (i < self.opts.count) {
        var elem = el.cloneNode(true);
        elem.classList.add('cloned');
        carouselList.appendChild(elem);
      }
    });

    var before = carouselList.firstChild;
    Array.prototype.forEach.call(carouselItems, function(el, i) {
      if ((carouselItems.length - 1 - i) < self.opts.count) {
        var elem = el.cloneNode(true);
        elem.classList.add('cloned');
        carouselList.insertBefore(elem, before);
      }
    });

    sliderTotalLength = (widthElemWithMargin)*carouselItems.length;
    sliderPageLength = (widthElemWithMargin)*this.opts.count;

    carouselHidden.style.width = sliderPageLength + 'px';

    currentLeftValue = -sliderPageLength;
    carouselList.style.left = currentLeftValue + 'px';
  }

  this.start = function(options) {
    this.opts.width = options.width || 300;
    this.opts.count = options.count || 4;
    this.opts.container = options.container || '.carousel__container';
    this.opts.hidden = options.hidden || '.carousel__hidden';
    this.opts.list = options.list || '.carousel__l';
    this.opts.item = options.item || '.carousel__i';
    this.opts.navRight = options.navRight || '.carousel__right';
    this.opts.navLeft = options.navLeft || '.carousel__left';
    this.opts.speed = options.speed || 5000;
    this.opts.animate = (options.animate === true) || false;

    carouselContainer = document.querySelectorAll(this.opts.container)[0];
    carouselHidden = document.querySelectorAll(this.opts.hidden)[0];
    carouselList = document.querySelectorAll(this.opts.list)[0];
    carouselItems = document.querySelectorAll(this.opts.item);

    left = document.querySelectorAll(this.opts.navLeft)[0];
    right = document.querySelectorAll(this.opts.navRight)[0];

    if (carouselContainer && carouselList && carouselItems && right && left) {
      var self = this;
      // left.addEventListener('click', function() {
      //   self.pauseTimer(self.slideLeft);
      // });
      addEvent(left, 'click', function() {
        self.pauseTimer(self.slideLeft);
      });
      addEvent(right, 'click', function() {
        self.pauseTimer(self.slideRight);
      });


      this.init();

      $(window).on('resize', function() {
        self.init();
      });


      if (this.opts.animate) this.startTimer();
    }
  }

  this.slideRight = function() {
    currentLeftValue -= widthElemWithMargin;

    if (startRight) {
      carouselList.style.left = currentLeftValue + 'px';
      currentLeftValue -= widthElemWithMargin;
      startRight = false;
    }

    animate(carouselList, 'left', 'px', parseInt(carouselList.style.left), currentLeftValue, 500);

    if (Math.abs(currentLeftValue) === (sliderTotalLength+(widthElemWithMargin))) {
      currentLeftValue = 0;
      startRight = true;
    }
  }

  this.slideLeft = function() {
    currentLeftValue += widthElemWithMargin;
    if (startLeft) {
      carouselList.style.left = currentLeftValue - widthElemWithMargin + 'px';
      startLeft = false;
    }

    animate(carouselList, 'left', 'px', parseInt(carouselList.style.left), currentLeftValue, 500);

    if (Math.abs(currentLeftValue) === (widthElemWithMargin)) {
      currentLeftValue = -sliderTotalLength - widthElemWithMargin;
      startLeft = true;
    }
  }

  this.startTimer = function() {
    var self = this;
    timerId = setTimeout(function tick() {
      self.slideRight();
      timerId = setTimeout(tick, self.opts.speed);
    }, self.opts.speed);
  }

  this.stopTimer = function() {
    if (timerId) clearTimeout(timerId);
  }

  this.pauseTimer = function(func) {
    if ((this.opts.animate)&&(timerId)) {
      this.stopTimer();
      timerId = null;
    }
    func();
    if (this.opts.animate) {
      this.startTimer();
    }
  }

  function animate(elem,style,unit,from,to,time) {
    if( !elem) return;
    var start = new Date().getTime(),
    timer = setInterval(function() {
      var step = Math.min(1,(new Date().getTime()-start)/time);
      elem.style[style] = (from+step*(to-from))+unit;
      if( step == 1) clearInterval(timer);
    },25);
    elem.style[style] = from+unit;
  }

  function getStyle(elem) {
    return window.getComputedStyle ? window.getComputedStyle(elem, "") : elem.currentStyle;
  }

  function getIEComputedStyle(elem, prop) {
  var value = elem.currentStyle[prop] || 0;

  // we use 'left' property as a place holder so backup values
  var leftCopy = elem.style.left;
  var runtimeLeftCopy = elem.runtimeStyle.left;

  // assign to runtimeStyle and get pixel value
  elem.runtimeStyle.left = elem.currentStyle.left;
  elem.style.left = (prop === "fontSize") ? "1em" : value;
  value = elem.style.pixelLeft + "px";

  // restore values for left
  elem.style.left = leftCopy;
  elem.runtimeStyle.left = runtimeLeftCopy;

  return value;
}
};
