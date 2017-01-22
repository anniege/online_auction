(function(global) {
  var routes = {};
  var paths = ['header', 'auctions', 'home', 'single-auction', 'error'];


  //creating templates array
  if (Handlebars.templates === undefined) Handlebars.templates = {};
  paths.forEach(function(name) {
    Handlebars.templates[name] = Handlebars.getTemplate(name);
  });


  //Router interface: create route by adding handler, callback and template name
  function route(path, templateName, controller, callback) {
    if (!routes[path])
    routes[path] = {templateName: templateName, controller: controller, callback: callback};
  }

  var header = null;
  var main = null;

  //parsing hash and render page
  //---------------------Start: router-----------------------------------------
  function router() {
    header = header || document.getElementById('header');
    main = main || document.getElementById('main');

    var params = {};
    var url = location.hash;


    //if url is an anchor on same page then return
    if (url.indexOf('#') !== -1  &&  url.indexOf('/') === -1) {
      params = {
        "hash": url
      }
      url = '/';
    }

    //getting rid of # sybol
    url = url.slice(1) || '/';


    //parsing params after ? symbol
    if (url !== '/' && url.indexOf('?') !== -1) {
      var hashArray = url.split('?');
      if (hashArray.length > 1) {
        url = hashArray[0];
        var urlParams = hashArray[1].split('&');
        urlParams.forEach(function(param){
          var args = param.split('=');
          if (args.length > 1) {
            if (!params[args[0]]) {
              params[args[0]] = [args[1]];
            } else {
              params[args[0]].push(args[1]);
            }
          }
        });
      } else {
        return;
      }
    }

    //get route from the array accoding to hash value, unless it will be error page
    var route = routes[url] || routes['*'];
    if (isEmpty(params) && url !== '/') route = routes['*'];


    if (main && header && route.controller) {
      // var menuLink = $('a[href$="'+ tempUrl +'"]');
      // setActiveMenu(menuLink);

      var promiseHeader = Handlebars.templates['header'];
      var promiseMain = Handlebars.templates[route.templateName];
      var promiseData = route.controller(params);

      promiseData.then(function(data) {
        if (!data || data['error']) promiseMain = Handlebars.templates['error'];

        $.when(promiseHeader, promiseMain).then(function(templateHeader, templateMain) {
          var htmlHeader = templateHeader({
            "isLoggined": global.isLoggined,
            "isMenuLarge": global.isMenuLarge,
            "user": global.session.getLogginedUser() || {}
          });
          var htmlMain = templateMain(data);

          header.innerHTML = htmlHeader;
          main.innerHTML= htmlMain;

          if (route.callback) route.callback(params, location.hash);
        });
      });
    }
  }
  //-----------------------End: router-----------------------------------------

  function isEmpty(obj) {
    for(var prop in obj) {
      if(obj.hasOwnProperty(prop))
      return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
  }

  global.router =  {
    addRoute: route,
    render: router
  };

})(window);
