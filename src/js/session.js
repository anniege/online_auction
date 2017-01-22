//logging and logout of user -  localStorage read/write
(function(global) {

  function hasLocalStorage() {
    if (typeof(Storage) === "undefined") {
      console.log('Browser dosen\'t support localStorage!');
      return;
    }
    return true;
  }

  function setLogginedUser(user) {
    if (!hasLocalStorage()) return;
    localStorage.setItem("user", JSON.stringify(user));
    isLoggined = true;
  }

  function removeLogginedUser() {
    if (!hasLocalStorage() || !getLogginedUser()) return;
    localStorage.removeItem("user");
    isLoggined = false;
  }

  function getLogginedUser() {
    if (!hasLocalStorage()) return;
    if (!localStorage.getItem("user")) return;
    return JSON.parse(localStorage.getItem("user"));
  }

  function checkLogginedUser(user) {
    if (!hasLocalStorage()) return;
    var currentUser = JSON.parse(localStorage.getItem("user"));
    if (user._id === currentUser._id) return true;
    return false;
  }

  global.session = {
    setLogginedUser: setLogginedUser,
    getLogginedUser: getLogginedUser,
    checkLogginedUser: checkLogginedUser,
    removeLogginedUser: removeLogginedUser
  }

})(window);
