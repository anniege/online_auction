Handlebars.getTemplate = function(name) {
  var promise = $.ajax({
    url: 'views/' + name + '.hbs'
  }).then(function(data) {
    return Handlebars.compile(data);
  });
  return promise;
};
