if (window.top === window) {
  function getAnswer(b, d, c, a) {
    if (b == "Block") {
      window.location.replace(d);
    } else {
      if (b == "Track") {
        startDetectIdleness();
        myextension.sendMessage(null, "checkURL", pageInfo);
      } else {
        if (b == "Allow") {
          stopDetectIdleness();
        } else {
          if (b == "Alert") {
            alert(d);
          }
        }
      }
    }
  }
  myextension.addMessageListener(getAnswer);
  var checkInterval = 1;
  var shouldDetectIdle = false;
  var mousemoveHandlerInstalled = false;
  var pageInfo = {
    url: document.URL,
    referrer: document.referrer,
    idleTime: 0,
  };
  myextension.sendMessage(null, "checkURL", pageInfo);
  function onMouseMove() {
    pageInfo.idleTime = 0;
    if (mousemoveHandlerInstalled) {
      document.removeEventListener("mousemove", onMouseMove, false);
    }
    mousemoveHandlerInstalled = false;
  }
  function _detectIdleness() {
    if (!shouldDetectIdle) {
      return;
    }
    pageInfo.idleTime += checkInterval;
    if (!mousemoveHandlerInstalled) {
      document.addEventListener("mousemove", onMouseMove, false);
    }
    mousemoveHandlerInstalled = true;
    setTimeout("_detectIdleness()", checkInterval * 1000);
  }
  function startDetectIdleness() {
    if (shouldDetectIdle) {
      return;
    }
    shouldDetectIdle = true;
    _detectIdleness();
  }
  function stopDetectIdleness() {
    shouldDetectIdle = false;
    onMouseMove();
  }
}
