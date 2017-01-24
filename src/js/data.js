(function(global) {

  var Data = function() {
    var promiseAuctions;
    var promiseUsers;

    this.load = function() {
      promiseAuctions = $.ajax({
        url: "/lots",
        type: "GET",
        dataType: "json"
      });

      promiseUsers = $.ajax({
        url: "/users",
        type: "GET",
        dataType: "json"
      });
    }

    this.getUser = function(userId) {
      var promise = promiseUsers.then(function(users) {
        return users.filter(function (user) {
          return user._id === userId;
        })[0];
      });
      return promise;
    }

    this.getLot = function(id) {
      if (!id) return;
      var promise = promiseAuctions.then(function(auctions) {
        return auctions.filter(function(auction) {
          return auction._id === id;
        })[0];
      });
      return promise;
    }

    this.getLots = function() {
      return promiseAuctions;
    }

    this.getUsers = function() {
      return promiseUsers;
    }
  }


  global.data = new Data();
})(window);
