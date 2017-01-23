(function(global) {


  var promiseAuctions = $.ajax({
    url: "/lots",
    type: "GET",
    dataType: "json"
  });

  var promiseUsers = $.ajax({
    url: "/users",
    type: "GET",
    dataType: "json"
  });

  var Data = {
    getUser: function(userId) {
      var promise = promiseUsers.then(function(users) {
        return users.filter(function (user) {
          return user._id === userId;
        })[0];
      });
      return promise;
    },

    getLot: function(id) {
      if (!id) return;
      var promise = promiseAuctions.then(function(auctions) {
        return auctions.filter(function(auction) {
          return auction._id === id;
        })[0];
      });
      return promise;
    },

    getLots: function() {
      return promiseAuctions;
    },

    getUsers: function() {
      return promiseUsers;
    }
  }

  global.data = Data;
})(window);
