var carousel = function() {
  var opts = {};

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

  var init = function() {

    if (!window.getComputedStyle) { // old IE
      carouselContainerWidth = getIEComputedStyle(carouselContainer, 'width');
    } else {
      carouselContainerWidth = window.getComputedStyle(carouselContainer, "").width;
    }

    widthElem = 300;
    widthElemWithMargin = widthElem + 10;
    opts.count = Math.floor(parseInt(carouselContainerWidth)/widthElemWithMargin);

    Array.prototype.forEach.call(carouselItems, function(el) {
      el.style.width = widthElem + 'px';
    });

    if (carouselList.querySelectorAll('.cloned').length !== 0) {
      Array.prototype.forEach.call(carouselList.querySelectorAll('.cloned'), function(el) {
        carouselList.removeChild(el);
      });
    }

    Array.prototype.forEach.call(carouselItems, function(el, i) {
      if (i < opts.count) {
        var elem = el.cloneNode(true);
        elem.classList.add('cloned');
        carouselList.appendChild(elem);
      }
    });

    var before = carouselList.firstChild;
    Array.prototype.forEach.call(carouselItems, function(el, i) {
      if ((carouselItems.length - 1 - i) < opts.count) {
        var elem = el.cloneNode(true);
        elem.classList.add('cloned');
        carouselList.insertBefore(elem, before);
      }
    });

    sliderTotalLength = (widthElemWithMargin)*carouselItems.length;
    sliderPageLength = (widthElemWithMargin)*opts.count;

    carouselHidden.style.width = sliderPageLength + 'px';

    currentLeftValue = -sliderPageLength;
    carouselList.style.left = currentLeftValue + 'px';
  }

  this.start = function(options) {
    opts.width = options.width || 300;
    opts.count = options.count || 4;
    opts.container = options.container || '.carousel__container';
    opts.hidden = options.hidden || '.carousel__hidden';
    opts.list = options.list || '.carousel__l';
    opts.item = options.item || '.carousel__i';
    opts.navRight = options.navRight || '.carousel__right';
    opts.navLeft = options.navLeft || '.carousel__left';
    opts.speed = options.speed || 5000;
    opts.animate = (options.animate === true) || false;

    carouselContainer = document.querySelectorAll(opts.container)[0];
    carouselHidden = document.querySelectorAll(opts.hidden)[0];
    carouselList = document.querySelectorAll(opts.list)[0];
    carouselItems = document.querySelectorAll(opts.item);

    left = document.querySelectorAll(opts.navLeft)[0];
    right = document.querySelectorAll(opts.navRight)[0];

    if (carouselContainer && carouselList && carouselItems && right && left) {


      addEvent(left, 'click', function() {
        pauseTimer(slideLeft);
      });
      addEvent(right, 'click', function() {
        pauseTimer(slideRight);
      });


      init();

      $(window).on('resize', function() {
        init();
      });


      if (opts.animate) startTimer();
    }
  }

  function slideRight() {
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

  function slideLeft() {
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

  function startTimer() {

    timerId = setTimeout(function tick() {
      slideRight();
      timerId = setTimeout(tick, opts.speed);
    }, opts.speed);
  }

  function stopTimer() {
    if (timerId) clearTimeout(timerId);
  }

  function pauseTimer(func) {
    if ((opts.animate)&&(timerId)) {
      stopTimer();
      timerId = null;
    }
    func();
    if (opts.animate) {
      startTimer();
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
