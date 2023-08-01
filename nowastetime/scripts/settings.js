var weekday = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
function TimeRange(b, a) {
  this.start = b;
  this.end = a;
}
function perSiteOption(b, c, a) {
  this.option = b;
  if (b == "useCustom") {
    if (typeof c != "object" || c.length != 2) {
      throw (
        "Invalid quota for useCustom option. Type:" +
        typeof c +
        " Length: " +
        c.length
      );
    }
    this.quota = c;
  }
  this.includeChildren = a;
}
function setPerSiteOption(e, b, d, f, a) {
  var c = trim(b);
  if (d == "useGlobal" && !a) {
    delete e.perSiteOptions[c];
  } else {
    e.perSiteOptions[c] = new perSiteOption(d, f, a);
  }
}
function getPerSiteOption(b, a) {
  return b.perSiteOptions[trim(a)];
}
function rebuildPerSiteOptions(d) {
  var b = new Object();
  for (var c in d.blacklist) {
    var a = trim(d.blacklist[c]);
    if (d.perSiteOptions[a]) {
      b[a] = d.perSiteOptions[a];
    }
  }
  d.perSiteOptions = b;
}
function shouldIncludeChildren(b, a) {
  var c = b.perSiteOptions[trim(a)];
  return c && c.includeChildren;
}
function shouldAlwaysBlock(b, a) {
  var c = b.perSiteOptions[trim(a)];
  if (c && c.option == "alwaysBlock") {
    return true;
  }
  return false;
}
function exportSettings(a) {
  return JSON.stringify(a);
}
function chromeSyncLoad(b, c, a) {
  window.console.log("Chrome sync load settings.");
  chrome.storage.sync.get(b.keys, function (d) {
    if (isOK(d)) {
      window.console.log("Successfully loaded settings from chrome storage");
      c(d);
    } else {
      window.console.log("Failed to load settings from chrome storage");
      a();
    }
  });
}
function chromeSyncSave(b, c) {
  window.console.log("Chrome sync save settings.");
  if (DEBUG) {
    for (var a in b) {
      window.console.log("Save key: " + a + " value:" + b[a]);
    }
  }
  chrome.storage.sync.set(b, function () {
    window.console.log(
      "Settings have been sync'ed to Chrome storage successfully."
    );
    if (c) {
      c();
    }
  });
}
function saveSettings(b, c) {
  b.isDefault = false;
  var a = exportSettings(b);
  if (SAFARI) {
    safari.extension.secureSettings.json = a;
  } else {
    chromeSyncSave(b, c);
  }
}
function parseSettings(a) {
  var b = null;
  try {
    b = JSON.parse(a);
  } catch (c) {
    return null;
  }
  return b;
}
function isOK(a) {
  return "name" in a && a.name == "default";
}
function reconcileWithExisting(b, a) {
  if (a) {
    a.isDefault = false;
    if (!a.time_ranges) {
      a.time_ranges = [new TimeRange(a.workhour_start, a.workhour_end)];
      delete a.workhour_start;
      delete a.workhour_end;
    }
    if (a.allowed_minutes) {
      if (!a.enableTimeRange) {
        a.allowed_minutes_wh = a.allowed_minutes;
      }
      delete a.allowed_minutes;
    }
    if (!("blockurlUseDefault" in a)) {
      if (
        a.blockurl != "about:blank" &&
        a.blockurl != "Default Block Landing Page"
      ) {
        a.blockurlUseDefault = false;
      } else {
        a.blockurlUseDefault = true;
        a.blockurl = "http://";
      }
    }
    for (var c in a) {
      b[c] = a[c];
    }
  }
  return b;
}
function getSettings(c) {
  var b = new Settings();
  if (SAFARI) {
    var a;
    if (safari.extension.secureSettings.json) {
      a = parseSettings(safari.extension.secureSettings.json);
    } else {
      a = parseSettings(localStorage.getItem("justatestX"));
    }
    c(reconcileWithExisting(b, a));
  } else {
    chromeSyncLoad(
      b,
      function (d) {
        c(reconcileWithExisting(b, d));
      },
      function () {
        window.console.log("Try to load settings from localstorage.");
        var d = reconcileWithExisting(
          b,
          parseSettings(localStorage.getItem("justatestX"))
        );
        c(d);
        saveSettings(d, function () {
          window.console.log(
            "Migrated to chrome.storage successfully. Remove settings from localstorage."
          );
          localStorage.removeItem("justatestX");
        });
      }
    );
  }
}
function Settings() {
  this.name = "default";
  this.activedays = new Array(7);
  for (i = 0; i < this.activedays.length; i++) {
    this.activedays[i] = 1;
  }
  this.enableTimeRange = true;
  this.time_ranges = [new TimeRange("8:00 AM", "5:00 PM")];
  this.allowed_minutes_wh = 30;
  this.allowed_minutes_ah = 120;
  this.daily_reset_time = 0;
  this.blockurlUseDefault = true;
  this.blockurl = "http://";
  this.blacklist = ["*.facebook.com", "*.reddit.com", "*.digg.com"];
  this.whitelist = new Array();
  this.enableChallenge = false;
  this.challengeType = "random";
  this.challengeLength = 32;
  this.challengePassword = "";
  this.idleTimeout = 1800;
  this.perSiteOptions = {
    "*.reddit.com": new perSiteOption("useGlobal", 0, "checked"),
    "*.digg.com": new perSiteOption("useGlobal", 0, "checked"),
  };
  this.isDefault = true;
  this.warnAtMinutes = 3;
  this.version = 1;
  this.enabledForPrivateBrowsing = "blockOnly";
  this.numSitesInTimeTracker = 10;
  this.doNotTrackSite = "";
}
const lockdownOptions = {
  blockAll: "All sites",
  blockAllExceptAllowed: "All sites except those listed in Allowed Sites",
  blockBlockedExceptAllowed:
    "Blocked sites except those listed in Allowed Sites",
};
function lockdownSettings() {
  var a = localStorage.getItem("lockdownSettings");
  var b = null;
  try {
    b = JSON.parse(a);
  } catch (c) {}
  this.settings = { option: "blockAllExceptAllowed", until: 0 };
  if (b) {
    for (var d in b) {
      this.settings[d] = b[d];
    }
  }
  this.inLockdown = function () {
    var e = new Date().getTime();
    if (e < this.settings.until) {
      return true;
    }
    return false;
  };
  this.startLockdown = function (g, h) {
    var e = new Date().getTime();
    this.settings.until = e + h * 1000;
    this.settings.option = g;
    var f = JSON.stringify(this.settings);
    localStorage.setItem("lockdownSettings", f);
  };
  this.getTimeUntil = function () {
    return this.settings.until;
  };
  this.getOption = function () {
    return this.settings.option;
  };
}
function initializePerSiteTimers(c, e) {
  var g = new Object();
  for (var a in c.perSiteOptions) {
    var d = c.perSiteOptions[a];
    if (d.option == "useCustom") {
      var f = (g[a] = new Object());
      if (c.enableTimeRange) {
        f.workHoursSecondsAllowed = d.quota[0] * 60;
        f.afterHoursSecondsAllowed = d.quota[1] * 60;
      } else {
        f.workHoursSecondsAllowed = d.quota[0] * 60;
        f.afterHoursSecondsAllowed = 0;
      }
      f.hasWarned = false;
      if (DEBUG) {
        window.console.log(
          "initialize timer for " +
            a +
            " : allowing " +
            f.workHoursSecondsAllowed +
            "seconds/" +
            f.afterHoursSecondsAllowed +
            "seconds"
        );
      }
      if (e) {
        var b = e[a];
        if (b) {
          f.workHoursSecondsUsed = b.workHoursSecondsUsed;
          f.afterHoursSecondsUsed = b.afterHoursSecondsUsed;
        } else {
          f.workHoursSecondsUsed = 0;
          f.afterHoursSecondsUsed = 0;
        }
      }
    }
  }
  return g;
}
function timeQuota(a) {
  this.init = function (b) {
    this.enableTimeRange = b.enableTimeRange;
    if (this.enableTimeRange) {
      this.workHoursSecondsAllowed = b.allowed_minutes_wh * 60;
      this.afterHoursSecondsAllowed = b.allowed_minutes_ah * 60;
      this.time_ranges = [];
      for (var c in b.time_ranges) {
        this.time_ranges.push(
          new TimeRange(
            getMinutesOfDay(b.time_ranges[c].start),
            getMinutesOfDay(b.time_ranges[c].end)
          )
        );
        if (this.time_ranges[c].end == 0) {
          this.time_ranges[c].end = 24 * 60;
        }
      }
    } else {
      this.workHoursSecondsAllowed = b.allowed_minutes_wh * 60;
      this.afterHoursSecondsAllowed = 0;
      this.time_ranges = [new TimeRange(0, 24 * 60)];
    }
    this.hasWarned = false;
    this.perSiteTimers = initializePerSiteTimers(b, this.perSiteTimers);
    this.dailyResetTimeMinutes = b.daily_reset_time;
  };
  this.reinit = function (b) {
    if (this.enableTimeRange == b.enableTimeRange) {
      return this.init(b);
    }
    if (this.enableTimeRange) {
      this.init(b);
      this.workHoursSecondsUsed += this.afterHoursSecondsUsed;
      this.afterHoursSecondsUsed = 0;
      for (var c in this.perSiteTimers) {
        timer = this.perSiteTimers[c];
        timer.workHoursSecondsUsed += timer.afterHoursSecondsUsed;
        timer.afterHoursSecondsUsed = 0;
      }
    } else {
      this.init(b);
      this.resetTimers();
    }
  };
  this.resetTimers = function () {
    this.workHoursSecondsUsed = 0;
    this.afterHoursSecondsUsed = 0;
    this.hasWarned = false;
    for (var b in this.perSiteTimers) {
      timer = this.perSiteTimers[b];
      timer.workHoursSecondsUsed = 0;
      timer.afterHoursSecondsUsed = 0;
      timer.hasWarned = false;
    }
    this.startTime = new Date();
    this.saveTimers();
    this._set_reset_time();
  };
  this.loadTimers = function (c) {
    var f = localStorage.getItem("workHoursSecondsUsed");
    if (f) {
      this.workHoursSecondsUsed = parseInt(f);
    } else {
      this.workHoursSecondsUsed = 0;
    }
    f = localStorage.getItem("afterHoursSecondsUsed");
    if (f) {
      this.afterHoursSecondsUsed = parseInt(f);
    } else {
      this.afterHoursSecondsUsed = 0;
    }
    f = localStorage.getItem("perSiteTimers");
    var b = null;
    try {
      b = JSON.parse(f);
    } catch (g) {}
    if (b) {
      for (var d in this.perSiteTimers) {
        timer = this.perSiteTimers[d];
        saved = b[d];
        if (saved) {
          timer.workHoursSecondsUsed = saved.workHoursSecondsUsed;
          timer.afterHoursSecondsUsed = saved.afterHoursSecondsUsed;
          if (DEBUG) {
            window.console.log(
              "Load timer for " +
                d +
                " : used " +
                timer.workHoursSecondsUsed +
                "seconds/" +
                timer.afterHoursSecondsUsed +
                "seconds"
            );
          }
        }
        if (
          timer.workHoursSecondsUsed == undefined ||
          timer.workHoursSecondsUsed == null
        ) {
          timer.workHoursSecondsUsed = 0;
        }
        if (
          timer.afterHoursSecondsUsed == undefined ||
          timer.afterHoursSecondsUsed == null
        ) {
          timer.afterHoursSecondsUsed = 0;
        }
      }
    }
    f = localStorage.getItem("quotaStartTime");
    if (f) {
      this.startTime = new Date(f);
    } else {
      this.startTime = new Date();
    }
    this.lastSaveTime = this.startTime.getTime();
    this._set_reset_time();
  };
  this._set_reset_time = function () {
    var b = getMinutesOfDay(this.startTime);
    this.resetTime = new Date();
    if (b < this.dailyResetTimeMinutes) {
      this.resetTime.setTime(
        this.startTime.getTime() + (this.dailyResetTimeMinutes - b) * 60 * 1000
      );
    } else {
      this.resetTime.setTime(
        this.startTime.getTime() +
          24 * 60 * 60 * 1000 +
          (this.dailyResetTimeMinutes - b) * 60 * 1000
      );
    }
    this.resetTime.setSeconds(0);
  };
  this.saveTimers = function () {
    this.lastSaveTime = new Date().getTime();
    localStorage.setItem("workHoursSecondsUsed", this.workHoursSecondsUsed);
    localStorage.setItem("afterHoursSecondsUsed", this.afterHoursSecondsUsed);
    localStorage.setItem("perSiteTimers", JSON.stringify(this.perSiteTimers));
    for (var b in this.perSiteTimers) {
      timer = this.perSiteTimers[b];
      if (DEBUG) {
        window.console.log(
          "save per site time quota " +
            b +
            ": workHoursSecondsUsed " +
            timer.workHoursSecondsUsed +
            " afterHoursSecondsUsed " +
            timer.afterHoursSecondsUsed
        );
      }
    }
    localStorage.setItem("quotaStartTime", this.startTime);
    if (DEBUG) {
      window.console.log(
        "save time quota: workHoursSecondsUsed " +
          this.workHoursSecondsUsed +
          " afterHoursSecondsUsed " +
          this.afterHoursSecondsUsed
      );
    }
  };
  this.init(a);
  this.loadTimers(a);
  this.getTimeRange = function (c) {
    var l;
    if (c == null || c == undefined) {
      l = getMinutesOfDay(new Date());
    } else {
      l = getMinutesOfDay(c);
    }
    var g = 99999;
    var d = -1;
    var b = 99999;
    var h = -1;
    var j = -1;
    var k = -1;
    for (var f in this.time_ranges) {
      if (this.time_ranges[f].start <= l && l < this.time_ranges[f].end) {
        if (j < this.time_ranges[f].end) {
          j = this.time_ranges[f].end;
          k = f;
        }
      } else {
        if (this.time_ranges[f].start > l) {
          var e = this.time_ranges[f].start - l;
          if (e < g) {
            d = f;
            g = e;
          }
        }
      }
      if (this.time_ranges[f].start < b) {
        h = f;
        b = this.time_ranges[f].start;
      }
    }
    if (k != -1) {
      return [true, j - l];
    }
    if (d != -1) {
      return [false, this.time_ranges[d].start - l];
    } else {
      return [false, b + 24 * 60 - l];
    }
  };
  this.isInWorkHour = function (d) {
    var c;
    if (d == null || d == undefined) {
      c = getMinutesOfDay(new Date());
    } else {
      c = getMinutesOfDay(d);
    }
    for (var b in this.time_ranges) {
      if (this.time_ranges[b].start <= c && c < this.time_ranges[b].end) {
        return true;
      }
    }
    return false;
  };
  this.useSeconds = function (d, b) {
    this._houseKeeping();
    var c = this.perSiteTimers[trim(b)];
    if (this.isInWorkHour()) {
      if (c) {
        c.workHoursSecondsUsed += d;
      } else {
        this.workHoursSecondsUsed += d;
      }
    } else {
      if (c) {
        c.afterHoursSecondsUsed += d;
      } else {
        this.afterHoursSecondsUsed += d;
      }
    }
  };
  this.getTimeLeftUntilBlock = function (c) {
    this._houseKeeping();
    var f = this.getTimeRange();
    var h = f[0];
    var e = f[1];
    var g = this.perSiteTimers[trim(c)];
    var j = -1;
    if (g) {
      j = h
        ? g.workHoursSecondsAllowed - g.workHoursSecondsUsed
        : g.afterHoursSecondsAllowed - g.afterHoursSecondsUsed;
      if (e * 60 < j) {
        var d = !h
          ? g.workHoursSecondsAllowed - g.workHoursSecondsUsed
          : g.afterHoursSecondsAllowed - g.afterHoursSecondsUsed;
        j = e * 60 + d;
      }
    }
    var b = h
      ? this.workHoursSecondsAllowed - this.workHoursSecondsUsed
      : this.afterHoursSecondsAllowed - this.afterHoursSecondsUsed;
    if (e * 60 < b) {
      var d = !h
        ? this.workHoursSecondsAllowed - this.workHoursSecondsUsed
        : this.afterHoursSecondsAllowed - this.afterHoursSecondsUsed;
      b = e * 60 + d;
    }
    return [j, b];
  };
  this.getHasWarned = function (b) {
    this._houseKeeping();
    var c = this.perSiteTimers[trim(b)];
    if (c) {
      return c.hasWarned;
    } else {
      return this.hasWarned;
    }
  };
  this.unwarn = function (b) {
    if (b) {
      var c = this.perSiteTimers[trim(b)];
      if (c) {
        c.hasWarned = false;
      }
    } else {
      this.hasWarned = false;
    }
  };
  this.warn = function (b) {
    if (b) {
      var c = this.perSiteTimers[trim(b)];
      c.hasWarned = true;
    } else {
      this.hasWarned = true;
    }
  };
  this.exceeded = function (b) {
    this._houseKeeping();
    var d = this.perSiteTimers[trim(b)];
    var c = false;
    if (d) {
      return this.isInWorkHour()
        ? d.workHoursSecondsAllowed <= d.workHoursSecondsUsed
        : d.afterHoursSecondsAllowed <= d.afterHoursSecondsUsed;
    }
    return this.isInWorkHour()
      ? this.workHoursSecondsAllowed <= this.workHoursSecondsUsed
      : this.afterHoursSecondsAllowed <= this.afterHoursSecondsUsed;
  };
  this._houseKeeping = function () {
    var b = new Date();
    if (b.getTime() > this.resetTime.getTime()) {
      this.resetTimers();
    }
    if (b.getTime() > this.lastSaveTime + 30 * 1000) {
      this.saveTimers();
    }
  };
  this.getRemainingSeconds = function (b) {
    if (this.enableTimeRange) {
      return this.isInWorkHour()
        ? this.getWorkHourSeconds(b)
        : this.getAfterHourSeconds(b);
    } else {
      return this.getWorkHourSeconds(b);
    }
  };
  this.getWorkHourSeconds = function (b) {
    this._houseKeeping();
    if (b) {
      var c = this.perSiteTimers[trim(b)];
      if (c) {
        return c.workHoursSecondsAllowed - c.workHoursSecondsUsed > 0
          ? c.workHoursSecondsAllowed - c.workHoursSecondsUsed
          : 0;
      } else {
        return -1;
      }
    }
    return this.workHoursSecondsAllowed - this.workHoursSecondsUsed > 0
      ? this.workHoursSecondsAllowed - this.workHoursSecondsUsed
      : 0;
  };
  this.getAfterHourSeconds = function (b) {
    this._houseKeeping();
    if (b) {
      var c = this.perSiteTimers[trim(b)];
      if (c) {
        return c.afterHoursSecondsAllowed - c.afterHoursSecondsUsed > 0
          ? c.afterHoursSecondsAllowed - c.afterHoursSecondsUsed
          : 0;
      } else {
        return -1;
      }
    }
    return this.afterHoursSecondsAllowed - this.afterHoursSecondsUsed > 0
      ? this.afterHoursSecondsAllowed - this.afterHoursSecondsUsed
      : 0;
  };
}
function getMinutesOfDay(f) {
  var a;
  var c;
  if (f.constructor === String) {
    var b = f.split(" ");
    var e = b[0].split(":");
    a = parseInt(e[0]) % 12;
    c = parseInt(e[1]);
    if (b.length > 1) {
      if (b[1].toLowerCase() == "pm") {
        a += 12;
      }
    }
  } else {
    a = f.getHours();
    c = f.getMinutes();
  }
  return a * 60 + c;
}
