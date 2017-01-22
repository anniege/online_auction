Handlebars.registerHelper('dateFormat', function(data) {
    var dateRander = new Date(data);
    if (isNaN(dateRander)) dateRander = parseISO8601(data);
    return dateRander.toLocaleString();
});

Handlebars.registerHelper('nav', function (options) {
    return Array.apply(null, Array(options.hash.count)).map(function(v,i) {
        return options.fn({
            number: i + 1,
            selected: options.hash.selected == i
        });
    }).join('');
});

function parseISO8601(dateStringInRange) {
  var isoExp = /^\s*(\d{4})-(\d\d)-(\d\d)/,
      date = new Date(NaN), month,
      parts = isoExp.exec(dateStringInRange);

  if(parts) {
    month = +parts[2];
    date.setFullYear(parts[1], month - 1, parts[3]);
    if(month != date.getMonth() + 1) {
      date.setTime(NaN);
    }
  }
  return date;
}
