var carousel = function() {
  this.opts = {};

  var widthElem;
  var widthElemWithMargin;
  var carouselContainer;
  var carouselContainerWidth;
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

  this.init = function() {
    var self = this;
    carouselContainerWidth = getStyle(carouselContainer).width;
    widthElem = (parseInt(carouselContainerWidth)-30)/this.opts.count-10;
    widthElemWithMargin = widthElem + 10;

    Array.prototype.forEach.call(carouselItems, function(el) {
      el.style.width = widthElem + 'px';
    });

    Array.prototype.forEach.call(carouselItems, function(el, i) {
      if (i < self.opts.count) {
        carouselList.appendChild(el.cloneNode(true));
      }
    });

    var before = carouselList.firstChild;
    Array.prototype.forEach.call(carouselItems, function(el, i) {
      if ((carouselItems.length - 1 - i) < self.opts.count) {
        carouselList.insertBefore(el.cloneNode(true), before);
      }
    });


    sliderTotalLength = (widthElemWithMargin)*carouselItems.length;
    sliderPageLength = (widthElemWithMargin)*this.opts.count;

    currentLeftValue = -sliderPageLength;
    carouselList.style.left = currentLeftValue + 'px';
  }

  this.start = function(options) {
    this.opts.width = options.width || 300;
    this.opts.count = options.count || 4;
    this.opts.container = options.container || '.carousel__container';
    this.opts.list = options.list || '.carousel__l';
    this.opts.item = options.item || '.carousel__i';
    this.opts.navRight = options.navRight || '.carousel__right';
    this.opts.navLeft = options.navLeft || '.carousel__left';
    this.opts.speed = options.speed || 5000;
    this.opts.animate = options.animate || false;

    carouselContainer = document.querySelectorAll(this.opts.container)[0];
    carouselList = document.querySelectorAll(this.opts.list)[0];
    carouselItems = document.querySelectorAll(this.opts.item);

    left = document.querySelectorAll(this.opts.navLeft)[0];
    right = document.querySelectorAll(this.opts.navRight)[0];

    if (carouselContainer && carouselList && carouselItems && right && left) {
      var self = this;
      left.addEventListener('click', function() {
        self.pauseTimer(self.slideLeft);
      });
      right.addEventListener('click', function() {
        self.pauseTimer(self.slideRight);
      });

      // window.addEventListener('resize', function() {
      //   this.init();
      // });

      this.init();

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
};
