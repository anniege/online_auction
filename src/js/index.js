(function(global, domIsReady, undefined) {


  //global veriables
  global.timerId = null;
  global.isLoggined = false;
  global.isMenuLarge = false;
  global.latitude = 37.598303;
  global.longitude = -77.483225;
  var perPage = 8;
  var selectedPage = 0;


  //global events
  addEvent(global, 'load', global.loadMap);
  addEvent(global, 'hashchange', global.router.render);
  addEvent(global, 'load', global.router.render);
  addEvent(global, 'load', facebookInit);
  addEvent(global, 'scroll', parallax);
  // addEvent(global, 'scroll', fixedHeaderLargeToggle);
  domIsReady(ready);


  //DOMContentLoaded handler
  function ready() {
    if (global.session.getLogginedUser()) {
      isLoggined = true;
    }
    createRoutes();
    loadHandlers();
  }

  //============================ROUTES=========================================
  //create routes, register controllers and callbacks
  //---------------------Start: Create routes----------------------------------
  function createRoutes() {
    //------------------------------Register all routes------------------------
    global.router.addRoute('/', 'home', homeRouteController, homeRouteCallback);
    global.router.addRoute('/auctions', 'auctions', auctionsRouteController, auctionsRouteCallback);
    global.router.addRoute('/auctions/lot', 'single-auction', singlelotRouteController, singlelotRouteCallback);
    global.router.addRoute('*', 'error', errorRouteController, errorRouteCallback);


    // -----------------------Start: Home route--------------------------------
    function homeRouteController() {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      };
      isMenuLarge = true;

      return global.data.getLots().then(function(data) {

        var finishedAuctions = data.filter(function(item, index) {
          return !item.isActive;
        }).filter(function(item, index, array){
          return array.length - 1 - index <= 7;
        });

        var activeAuctions = data.filter(function(item, index) {
          return item.isActive;
        }).sort(function (a, b) {
          var dateA = new Date(a.ends);
          var dateB = new Date(b.ends);
          if (dateA < dateB) {
            return 1;
          }
          if (dateA > dateB) {
            return -1;
          }
          return 0;
        }).filter(function(item, i){
          return i <= 5;
        });

        var renderData = {
          "finishedAuctions": finishedAuctions,
          "activeAuctions": activeAuctions
        }
        return renderData;
      });
    }

    function homeRouteCallback(params) {
      loadLargeHeader();
      $('html,body').scrollTop(0);
      global.loadMap(global.latitude, global.longitude);

      if (params && params.hash) {
        var target = document.getElementById(params.hash.slice(1));
        scrollTo(target);
      }

      new global.carousel().start({
        container: '.carousel__container--finished',
        list: '.carousel__container--finished .carousel__l',
        item: '.carousel__container--finished .carousel__i',
        navRight: '.carousel__container--finished .carousel__right',
        navLeft: '.carousel__container--finished .carousel__left'
      });

      new global.carousel().start({
        container: '.carousel__container--recent',
        list: '.carousel__container--recent .carousel__l',
        item: '.carousel__container--recent .carousel__i',
        navRight: '.carousel__container--recent .carousel__right',
        navLeft: '.carousel__container--recent .carousel__left'
      });

      loadHandlers();
    }
    // -----------------------End: Home route----------------------------------



    //---------------------- Start: Auctions browse route----------------------
    function auctionsRouteController(params) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      };
      isMenuLarge = false;
      return global.data.getLots().then(function(data) {
        var lots = data;

        if (params && params['filter']) {
          var filters = params['filter'];
          var lotsRender = lots.filter(function(lot) {
            var isMatched = false;
            var matched = filters.filter(function(filter) {
              var tagPresent = false;
              lot['tags'].forEach(function(tag) {
                if (tag === filter) {
                  tagPresent = true;
                }
              });
              return tagPresent;
            });
            if (matched.length === filters.length) isMatched = true;
            return isMatched;
          });
        }

        var selectedPage = (params && params['page']) ? parseInt(params['page'][0]) : 0;

        if (!lotsRender) {
          lotsRender = lots;
        }

        var lotsPage = lotsRender.slice(selectedPage * perPage, selectedPage * perPage + perPage);

        var renderData = {
          "auctions": lotsPage,
          "count": (lotsPage.length > 0) ? navigationCount(lotsRender) : 0,
          "selected": selectedPage
        }
        return renderData;
      });
    }

    function auctionsRouteCallback() {
      loadSmallHeader();
      $('html,body').scrollTop(0);
      loadHandlers();
      subscribeAuctionNavHandler();
      subscribeAuctionMenuHandler();
    }

    function navigationCount(auctions) {
      return Math.ceil( auctions.length / perPage );
    }
    //---------------------- End: Auctions browse route------------------------



    //----------------------Start: Single lot browse---------------------------
    function singlelotRouteController(params) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      };
      isMenuLarge = false;

      return $.when(global.data.getLot(+params['id']), global.data.getUsers()).then(function(dataLot, dataUsers) {
        var lot = dataLot;
        var users = dataUsers[0];
        console.log('lot: ', lot);
        console.log('users:', users);

        if (!lot) return {
          'error': true
        };

        var user = users.filter(function(user) {
          return lot.userId === user._id;
        })[0];

        var isCurrentUserLot = false;
        var currentUser = global.session.getLogginedUser();
        if (currentUser && currentUser._id == lot.userId) isCurrentUserLot = true;

        return {
          "lot": lot,
          "user": user,
          "isLoggined": isLoggined,
          "isCurrentUserLot": isCurrentUserLot
        };
      });
    }

    function singlelotRouteCallback(params) {
      loadSmallHeader();
      $('html,body').scrollTop(0);
      loadHandlers();
      global.data.getLot(+params['id'][0]).then(function(lot) {
        setTimer(lot.registered, lot.ends);
        global.data.getUser(lot.userId).then(function(user) {
          loadMap(user.latitude, user.longitude);
        });
      });
    }
    //----------------------End: Single lot browse-----------------------------



    //----------------------Start: Error page----------------------------------
    function errorRouteController(params) {
      isMenuLarge = false;
      var promise = jQuery.Deferred();
      promise.resolve({});
      return promise;
    }

    function errorRouteCallback() {
      loadSmallHeader();
      $('html,body').scrollTop(0);
      loadHandlers();
    }
    //----------------------End: Error page------------------------------------
  }
  //----------------------End: Create routes-----------------------------------
  //=========================ROUTES============================================



  //=========================FORMS=============================================
  // registation and authorization forms view manager
  //----------------------Start: authFormsManager -----------------------------
  var authFormsManager =  {
    showError: function(selector, text) {
      $(selector).addClass('invalid');
      $(selector).focus();
      $(selector).on('input', function() {
        $(this).removeClass('invalid');
      });
    },

    registerShow: function(e) {
      e = e || event;
      e.preventDefault();
      document.body.style.overflow = 'hidden';
      document.querySelectorAll('.register-overlay')[0].style.display = 'block';
    },

    registerHide: function(e) {
      document.body.style.overflow = 'auto';
      document.querySelectorAll('.register-overlay')[0].style.display = 'none';
    },

    loginShow: function(e) {
      e = e || event;
      e.preventDefault();
      document.querySelectorAll('.login-overlay')[0].style.display = 'block';
    },

    loginHide: function() {
      document.querySelectorAll('.login-overlay')[0].style.display = 'none';
    },

    closeOverlay: function(e) {
      e = e || event;
      var target = e.target || e.srcElement;
      var modalRegister = document.querySelectorAll('.register-overlay')[0];
      var modalLogin = document.querySelectorAll('.login-overlay')[0];
      var modalAddLot = document.querySelectorAll('.add-lot-overlay')[0];
      if (target == modalRegister) {
        modalRegister.style.display = "none";
        if (document.querySelector('body').style.overflow === 'hidden')
        document.querySelector('body').style.overflow = 'auto';
      }
      if (target == modalLogin) {
        modalLogin.style.display = "none";
        if (document.querySelector('body').style.overflow === 'hidden')
        document.querySelector('body').style.overflow = 'auto';
      }
    }
  }
  //----------------------End: authFormsManager -------------------------------



  // lot adding form view manager
  //----------------------Start: lotFormManager -------------------------------
  var lotFormManager = {
    showError: function(selector, text) {
      $(selector).addClass('invalid');
      $(selector).focus();
      $(selector).on('input', function() {
        $(this).removeClass('invalid');
      });
      console.log(text);
    },

    addLotShow: function(e) {
      e = e || event;
      e.preventDefault();
      document.body.style.overflow = 'hidden';
      document.querySelectorAll('.add-lot-overlay')[0].style.display = 'block';
    },

    addLotHide: function() {
      document.body.style.overflow = 'auto';
      document.querySelectorAll('.add-lot-overlay')[0].style.display = 'none';
    },

    closeOverlay: function(e) {
      e = e || event;
      var target = e.target || e.srcElement;
      var modalAddLot = document.querySelectorAll('.add-lot-overlay')[0];
      if (target == modalAddLot) {
        modalAddLot.style.display = "none";
        if (document.querySelector('body').style.overflow === 'hidden')
        document.querySelector('body').style.overflow = 'auto';
      }
    }
  }
  //----------------------End: lotFormManager ---------------------------------



  // registration form submit handler
  //----------------------Start: registration----------------------------------
  function registerHandler(e) {
    e = e || event;
    e.preventDefault();
    e.stopImmediatePropagation();

    var formInput = {
      username: document.querySelectorAll('.register__username')[0],
      surname: document.querySelectorAll('.register__surname')[0],
      gender: document.querySelectorAll('.register__gender')[0],
      email: document.querySelectorAll('.register__email')[0],
      address: document.querySelectorAll('.register__address')[0],
      phone: document.querySelectorAll('.register__phone')[0],
      about: document.querySelectorAll('.register__about')[0],
      password: document.querySelectorAll('.register__password')[0],
      confirmPassword: document.querySelectorAll('.register__cpassword')[0]
    }

    if (formInput['password'].value !== formInput['confirmPassword'].value) {
      authFormsManager.showError(formInput['password'], "Error in " + 'password/or confirm password');
      return;
    }

    var valid = true;
    for (var name in formInput) {
      if (formInput.hasOwnProperty(name)) {
        var flag = true;
        if (formInput[name].getAttribute('pattern'))
        flag = new RegExp(formInput[name].getAttribute('pattern'), 'ig').test(formInput[name].value);
        if (!flag) {
          authFormsManager.showError(formInput[name], "Error in " + name);
          valid = flag;
        }
      }
    }

    if (!valid) return;

    var newUser = {};
    for (var prop in formInput) {
      if (formInput.hasOwnProperty(prop) && prop !== 'confirmPassword') {
        newUser[prop] = formInput[prop].value;
      }
    }

    $.ajax({
      url: "/register",
      type: "POST",
      data: newUser
    }).done(function(msg, textStatus) {
      console.log(textStatus + ': ' + msg);
      authFormsManager.registerHide();
      createDialog('You sussecfully registered!');
      setTimeout(function() {
        removeDialog();
      }, 2000);
    }).fail(function(err) {
      console.log("Error: ", err.status + " "+ err.statusText);
    });
  }
  //-----------------------End: registration-----------------------------------



  // logging form submit handler
  //----------------------Start: logging---------------------------------------
  function loginHandler(e) {
    e = e || event;
    e.preventDefault();
    e.stopImmediatePropagation();
    var email = document.querySelectorAll('.login__email')[0].value;
    var password = document.querySelectorAll('.login__password')[0].value;
    var emailPattern = document.querySelectorAll('.login__email')[0].getAttribute('pattern');
    var passwordPattern = document.querySelectorAll('.login__password')[0].getAttribute('pattern');


    var validEmail = true;
    var validPassword = true;

    if (emailPattern) validEmail = new RegExp(emailPattern, 'ig').test(email);
    if (passwordPattern) validPassword = new RegExp(passwordPattern, 'ig').test(password);

    if (!validEmail || !validPassword) {
      if (!validEmail)
      authFormsManager.showError(document.querySelectorAll('.login__email')[0], "Error in email!");

      if (!validPassword)
      authFormsManager.showError(document.querySelectorAll('.login__password')[0], "Error in password!");

      return;
    }

    var promiseLogin = $.ajax({
      url: "/login",
      type: "POST",
      data: {
        email: email,
        password: password
      }
    }).done(function(user) {
      global.session.setLogginedUser(user);
      global.location.reload();
      scrollTo(document.querySelectorAll('.header'));
    }).fail(function(err) {
      console.log("Error: ", err.status + " "+ err.statusText);
      $('.login__msg').addClass('login__msg--active').text('E-mail or password is invalid.');
      $('.login__email, .login__password').on('input', function() {
        $('.login__msg').removeClass('login__msg--active').text('');
      });
    });
  }
  //----------------------End: logging-----------------------------------------



  //logout handler
  //--------------------Start: Logging out-------------------------------------
  function logoutHandler(e) {
    e = e || event;
    e.preventDefault();
    global.session.removeLogginedUser();
    global.location.reload();
    scrollTo(document.querySelectorAll('.header'));
  }
  //--------------------End: Logging out---------------------------------------



  //adding new lot form submit handler
  //--------------------Start: add new lot handler-----------------------------
  function addLotHandler(e) {
    e = e || event;
    e.preventDefault();
    e.stopImmediatePropagation();

    var formInput = {
      category: document.querySelectorAll('.add-lot__category')[0],
      startbid: document.querySelectorAll('.add-lot__startbid')[0],
      title: document.querySelectorAll('.add-lot__title')[0],
      image: document.querySelectorAll('.add-lot__image')[0],
      date: document.querySelectorAll('.add-lot__date')[0],
      description: document.querySelectorAll('.add-lot__description')[0]
    };


    var valid = true;
    for (var name in formInput) {
      if (formInput.hasOwnProperty(name)) {
        var flag = true;
        if (formInput[name].getAttribute('pattern'))
        flag = new RegExp(formInput[name].getAttribute('pattern'), 'ig').test(formInput[name].value);
        if (!flag) {
          lotFormManager.showError(formInput[name], "Error in " + name);
          valid = flag;
        }
      }
    }

    //end date of lot should be at least 3 days later then now
    var numberOfDays = 3;
    var now = new Date();
    now.setDate(now.getDate() + numberOfDays);
    console.log('now = ', now);
    console.log('new Date(formInput[\'date\'].value', new Date(formInput['date'].value));
    if (+new Date(formInput['date'].value) < +now) {
      lotFormManager.showError(formInput['date'], 'Error in ended date: final date should be 3 days from submiting');
      valid = false;
    }

    console.log('image', formInput.image.files[0]);
    console.log('if( window.FormData !== undefined ) ', ( global.FormData !== undefined ) );

    if (valid && (global.FormData !== undefined )) {
      var formData = new global.FormData();

      for (var name in formInput) {
        if (formInput.hasOwnProperty(name)) {
          if (name === 'image') {
            var image = formInput.image.files[0];
            // if (!image.type.match('image.*') && (image.size > 1048576)) {
            //   lotFormManager.showError(formInput.image, 'Error in image file: file is not image or exeeds 1M size');
            // } else {
            formData.append('image', image, image.name);
            // }
          } else {
            formData.append(name, formInput[name].value);
          }
        }
      }

      var user = global.session.getLogginedUser();
      formData.append('userId', user._id);
      formData.append('latitude', user.latitude);
      formData.append('longitude', user.longitude);

      console.log(formData.entries());

      $.ajax({
        url: "/addlot",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false
      }).done(function(data) {
        console.log(data);
        lotFormManager.addLotHide();
        createDialog('Lot added sussecfully!');
        setTimeout(function() {
          removeDialog();
        }, 2000);
        global.location.reload();
      }).fail(function(err) {
        console.log("from error ", err);
      });
    }

    return false;
  }
  //--------------------End: add new lot handler-------------------------------



  //adding new lot form submit handler
  //--------------------Start: add new bid-------------------------------------
  function addBidHandler(e) {
    e = e || event;
    e.preventDefault();
    e.stopImmediatePropagation();
    var bidInput = document.querySelectorAll('.lot__input')[0];
    var isValid = new RegExp(bidInput.getAttribute('pattern'), 'ig').test(bidInput.value);
    if (isValid) {
      var currentBid = parseInt(document.querySelectorAll('.lot__input')[0].value);
      var currentPrice = parseInt((document.querySelectorAll('.lot__price')[0].innerText).slice(1));
      if (currentBid > currentPrice && (currentBid - currentPrice) >= 5) {
        var lotId = parseInt(bidInput.getAttribute('data-lotid'));
        $.ajax({
          url: "/addbid",
          type: "POST",
          data: {
            lotId: lotId,
            price: '$'+ bidInput.value,
            buyerId: global.session.getLogginedUser()._id
          }
        }).done(function(data, textStatus) {
          console.log(data);
          console.log(textStatus);
          bidInput.value = "";
          createDialog('Bid added sussecfully!');
          setTimeout(function() {
            removeDialog();
            global.location.reload();
          }, 2000);
        }).fail(function(err) {
          console.log("from error ", err);
        });
      } else {
        addBidWarningShow('Current bid is too low! Should on $5 higher then current');
      }
    } else {
      addBidWarningShow('Invalid input. Please, input a number!');
    }
  }
  //--------------------End: add new bid---------------------------------------



  //error massage show (while add bid)
  //--------------------Start: show error msg----------------------------------
  function addBidWarningShow(text) {
    var bidInput = document.querySelectorAll('.lot__input')[0];
    var warning = document.querySelectorAll('.lot__warning')[0];
    warning.classList.remove('lot__warning--hidden');
    warning.innerText = text;
    addEvent(bidInput, 'focus', function() {
      warning.classList.add('lot__warning--hidden');
      warning.innerText = '';
    });
  }
  //--------------------End: show error msg------------------------------------



  //auction search input handler
  //--------------------Start: search handler----------------------------------
  var auctionSearchHandler = debounce(function(e) {
    e = e || event;
    var target = e.target || e.srcElement;
    var val = target.value;
    var lots = document.querySelectorAll('.auction__item');

    if (val === '') {
      Array.prototype.forEach.call(lots, function(lot) {
        if (lot.classList.contains('auction__item--filtered'))
        lot.classList.remove('auction__item--filtered');
        if (lot.classList.contains('auction__item--filtered-hidden'))
        lot.classList.remove('auction__item--filtered-hidden');
      });
    }

    Array.prototype.forEach.call(lots, function(lot) {
      var tags = lot.querySelectorAll('.auction-tags__link');
      var filtered = Array.prototype.filter.call(tags, function(tag) {
        return tag.innerText.indexOf(val) !== -1;
      });

      if (filtered.length === 0) {
        if (!lot.classList.contains('auction__item--filtered'))
        lot.classList.add('auction__item--filtered');
        setTimeout(function() {
          lot.classList.add('auction__item--filtered-hidden');
        }, 300);
      } else {
        if (lot.classList.contains('auction__item--filtered'))
        lot.classList.remove('auction__item--filtered');
        lot.classList.remove('auction__item--filtered-hidden');
      }
    });
  }, 300);
  //--------------------End: search handler------------------------------------


  //clear forms
  //-------------------Start: clear form---------------------------------------
  function clearFormInput() {
    //TODO: add function to clear forms input after submit
  }
  //--------------------End: clear form----------------------------------------
  //=========================FORMS=============================================



  //=======================AUXILIARY===========================================
  // create google map
  //----------------------Start: Google map------------------------------------
  global.loadMap = function(lat, lng) {
    if (lat && lng) {
      var uluru = {lat: +lat, lng: +lng};

      var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: uluru,
        scrollwheel: false,
        styles: [{
          stylers: [{
            saturation: -100
          }]
        }],
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });

      var marker = new google.maps.Marker({
        position: uluru,
        map: map
      });
    }
  }
  //----------------------End: Google map--------------------------------------


  //facebook
  //-------------------Start: facebook init------------------------------------
  function facebookInit() {
    FB.init({
      appId      : '1664005267231227',
      xfbml      : true,
      version    : 'v2.8'
    });
    FB.AppEvents.logPageView();
  }
  //-------------------End: facebook init--------------------------------------



  //--------------------Start: facebook share handler--------------------------
  function facebookShare(e) {
    e = e || event;
    e.preventDefault();
    FB.ui({
      method: 'feed',
      link: 'www.onlineauctionusa.com',
      picture: 'http://image.prntscr.com/image/71266fce5c1f45bbb744314894efcf8d.jpg',
      name: 'Online Auction joins customers and buyers!',
      caption: 'Online Auction www.onlineauctionusa.com',
      description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Totam, ratione.'
    },
    function(response) {
      if (response && !response.error_message) {
        console.log('Facebook share completed.');
      } else {
        console.log('Post wasn\'t shared to facebook.');
      }
    });
  }
  //--------------------End: facebook share handler----------------------------



  //timer for single lot page
  //-----------------------Start: Timer ---------------------------------------
  function setTimer(start, end) {
    var startDate = new Date(start);
    var endDate = new Date(end);
    var currentDate = new Date();
    var delta = endDate - currentDate;
    var elem = document.querySelectorAll('.lot__end')[0];

    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    };

    if (elem) {
      if (delta > 0) {
        timerId = global.setTimeout(function run() {
          currentDate = new Date;
          delta = endDate - currentDate;

          if (delta > 0) {
            var diffDays = Math.round(Math.abs((endDate.getTime() - currentDate.getTime())/(24*60*60*1000)));
            elem.innerText = diffDays + ' days ' + new Date(delta).toUTCString().replace(/.*([0-9][0-9]):([0-9][0-9]):([0-9][0-9]).*/,'$1 hours $2 minutes $3 seconds');
            timerId = global.setTimeout(run, 1);
          } else {
            clearTimeout(timerId);
          }
        }, 1);
      }
    }
  }
  //------------------------End: Timer-----------------------------------------



  //debounce for search input event (auctions search)
  //-----------------Start: debounce-------------------------------------------
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    }
  }
  //-----------------End: debounce---------------------------------------------



  // animate scroll to element
  //----------------Start: scroll to specific element--------------------------
  function scrollTo(selector) {
    if (selector) {
      $('html, body').animate({ scrollTop: $(selector).offset().top }, 500);
      return false;
    }
  }
  //----------------End: scroll to specific element----------------------------



  //calculate the offset of element from top and left incl. scroll value
  //----------------Start: scroll to specific element--------------------------
  function offset(elem) {
    if (!elem) return;
    var rect = elem.getBoundingClientRect();

    return {
      top: rect.top + document.body.scrollTop,
      left: rect.left + document.body.scrollLeft
    }
  }
  //----------------End: scroll to specific element----------------------------



  //animate show images on load
  //-------------------Start: fade in images-----------------------------------
  function imagesFadeIn() {
    [].forEach.call(document.querySelectorAll('img[data-src]'), function(img) {
      img.setAttribute('src', img.getAttribute('data-src'));
      img.onload = function() {
        img.removeAttribute('data-src');
      };
    });
  }
  //-------------------End: fade in images-------------------------------------



  //parallax effect
  //-------------------Start: parallax-----------------------------------------
  function parallax() {
    var ypos, bg, content, join, joinMain;
    ypos = global.pageYOffset;
    bg = document.querySelectorAll('.header__bg')[0];
    join = document.querySelectorAll('.join')[0];
    joinMain = document.querySelectorAll('.join .wrapper')[0];
    if (bg && join) {
      bg.style.top = -ypos * 0.3 + 'px';
      content = document.querySelectorAll('.header__content')[0];
      content.style.top = (90 + ypos * 0.1) + 'px';
      if ((ypos - offset(join).top + global.innerHeight - 100) > 500) {
        joinMain.classList.add('wrapper--show');
      } else {
        joinMain.classList.remove('wrapper--show');
      }
    }
  }
  //-------------------End: parallax-------------------------------------------


  // create dialog with message
  //---------------------Start: create dialog----------------------------------
  function createDialog(message) {
    var dialog = document.createElement('DIV');
    var text = document.createElement('P');
    dialog.appendChild(text);
    text.innerText = message;
    dialog.className = 'popup';
    document.querySelectorAll('.wrap')[0].appendChild(dialog);
  }
  //---------------------End: create dialog------------------------------------


  // remove dialog
  //---------------------Start: remove dialog----------------------------------
  function removeDialog() {
    if (document.querySelectorAll('.wrap .popup').length > 0)
    document.querySelectorAll('.wrap')[0].removeChild(document.querySelectorAll('.wrap .popup')[0]);
  }
  //---------------------End: remove dialog------------------------------------



  //load styles for header of home page view
  //----------------------Start: home header styles----------------------------
  function loadLargeHeader() {
    var header = document.querySelectorAll('.header')[0];
    if (header.classList.contains('header__small'))
    header.classList.remove('header__small');

    if (!header.classList.contains('header__large'))
    header.classList.add('header__large');
  }
  //----------------------End: home header styles------------------------------



  //load styles for header of other pages view
  //----------------------Start: small header styles---------------------------
  function loadSmallHeader() {
    var header = document.querySelectorAll('.header')[0];
    if (header.classList.contains('header__large'))
    header.classList.remove('header__large');

    if (!header.classList.contains('header__small'))
    header.classList.add('header__small');
  }
  //----------------------End: small header styles-----------------------------



  //adding handlers on auctions browse navigation
  //----------------------Start: nav handlers subscribe------------------------
  function subscribeAuctionNavHandler() {
    var navItems = document.querySelectorAll('.auction__nav__link');
    Array.prototype.forEach.call(navItems, function(nav) {
      addEvent(nav, 'click', function(e) {
        e = e || event;
        e.preventDefault();
        var target = e.target || e.srcElement;
        var selected = parseInt(target.dataset.num)-1;
        selectedPage = selected;
        global.location.hash = global.location.hash.replace(/auctions\?(page=[0-9]+)?/ig,'auctions?page=' + selectedPage);
      });
    });
  }
  //----------------------End: nav handlers subscribe--------------------------



  //adding handlers on auctions main menu navigation
  //----------------------Start: manu handlers subscribe------------------------
  function subscribeAuctionMenuHandler() {
    var menuItems = document.querySelectorAll('.auction-menu__item .auction-menu__link');
    Array.prototype.forEach.call(menuItems, function(link) {
      addEvent(link, 'click', function(e) {
        e = e || event;
        var target = e.target || e.srcElement;
        var menuLinks = document.querySelectorAll('.auction-menu__link');
        Array.prototype.forEach.call(menuLinks, function(link) {
          if (target !== link && link.classList.contains('auction-menu__link--active')) {
            link.classList.remove('auction-menu__link--active');
            if (link.parentNode.querySelectorAll('.auction-submenu').length > 0)
            link.parentNode.querySelectorAll('.auction-submenu')[0].classList.add('auction-submenu--hidden');
          }
        });
        target.classList.toggle('auction-menu__link--active');
        if (target.parentNode.querySelectorAll('.auction-submenu').length > 0) {
          e.preventDefault();
          target.parentNode.querySelectorAll('.auction-submenu')[0].classList.toggle('auction-submenu--hidden');
        }
      });
    });
  }
  //----------------------End: nav handlers subscribe--------------------------
  //=======================AUXILIARY===========================================



  //=======================ADDING HANDLERS=====================================
  //Load main handlers
  //-------------------Start: load handlers------------------------------------
  function loadHandlers() {
    //animate opacity on load images
    imagesFadeIn();

    //on anchor click scroll to top
    $(".gotop a").on('click', function(e) {
      e.preventDefault();
      var header = document.querySelectorAll('.header');
      scrollTo(header);
      //   if ("replaceState" in history) {
      //     history.replaceState({}, document.title, "/");
      //   } else {
      //     global.location.hash = '';
      //   }
    });

    //on menu click scroll to anchor of section
    $('.menu__link').on('click', function(e) {
      if (e.target.getAttribute('href').indexOf('/') === -1) {
        // console.log('e.target.href.slice(1)', e.target.getAttribute('href').slice(1));
        scrollTo(document.getElementById(e.target.getAttribute('href').slice(1)));
      }
    });

    //responsive menu show
    $('.menu__icon').on('click', function() {
      $('.menu__list').toggleClass('menu__list--show');
      $('.auction').toggleClass('auction-lower');
    });


    //authorization handlers
    // register form show/hide
    $('.register').on('click', authFormsManager.registerShow);

    $('.authorize__sign-in').on('click', authFormsManager.registerShow);
    $('.register-overlay .close-overlay').on('click', authFormsManager.registerHide);

    // login form show/hide
    $('.authorize__log-in').on('click', authFormsManager.loginShow);
    $('.login-overlay .close-overlay').on('click', authFormsManager.loginHide);

    //register and login
    $('.register__form').on('submit', registerHandler);
    $('.login__form').on('submit', loginHandler);
    $('.logout__link').on('click', logoutHandler);
    $(global).on('click', authFormsManager.closeOverlay);

    //add new lot form show/hide
    $('.new-lot').on('click', lotFormManager.addLotShow);
    $('.add-lot-overlay .close-overlay').on('click', lotFormManager.addLotHide);
    $(global).on('click', lotFormManager.closeOverlay);

    //add new lot data
    $('.add-lot__form').on('submit', addLotHandler);

    //add new bid
    $('.lot__form').on('submit', addBidHandler);

    //search lot on current page
    $('.auction__input').on('input', auctionSearchHandler);

    //facebook share
    $('.share__btn--facebook').click(facebookShare);
  }
  //-------------------End: load handlers--------------------------------------
  //=======================ADDING HANDLERS=====================================


})(window, domIsReady);
