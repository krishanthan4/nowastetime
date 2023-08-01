var settings = null;
function getAnswer(c, e, d, a) {
  if (c == "settings") {
    var b = settings;
    settings = e;
    if (null === b && settings) {
      if (settings.enableChallenge) {
        var f = "?token=";
        if (
          !document.location.search.startsWith(f) ||
          !isTimeTokenFresh(document.location.search.substr(f.length))
        ) {
          window.console.log("Can not directly access this page. Redirect ...");
          window.location.href = myextension.getURL("view.html");
        }
      }
      initializePage();
    }
  }
}
function validatePage() {
  var a = validateTimeRanges();
  a = validateTimeAllowed() && a;
  a = validatePassword() && a;
  if (!a) {
    $("#messageWhenSaving").html(
      myextension.getMessage("Please correct the error on this page first!")
    );
    return false;
  } else {
    $("#messageWhenSaving").html("");
    return true;
  }
}
function validatePassword() {
  var a = $("input[name=enableChallenge]:checked").val();
  if (a != "passwordChallenge") {
    return true;
  }
  if ($("#password1").val() != $("#password2").val()) {
    $("#passwordError").html(myextension.getMessage("Password don't match!"));
    return false;
  } else {
    if ($("#password1").val() == "") {
      $("#passwordError").html(myextension.getMessage("Password is empty!"));
      return false;
    } else {
      $("#passwordError").html("");
      return true;
    }
  }
}
Number.prototype.pad = function (a) {
  var b = String(this);
  if (typeof a !== "number") {
    a = 2;
  }
  while (b.length < a) {
    b = "0" + b;
  }
  return b;
};
function validateTimeRanges() {
  var a = false;
  if ($("#enableTimeRange").val() == "timeRangeIsEnabled") {
    $("#rangeDefinitions > li").each(function () {
      var e = $("[name='start']", $(this)).val();
      var c = $("[name='end']", $(this)).val();
      start_str_norm = normalizeTime(e, false);
      end_str_norm = normalizeTime(c, false);
      if (!start_str_norm || !end_str_norm) {
        $("#timeRangeErrors").html(
          myextension.getMessage("Invalid time input [hh:mm AM|PM]: ") +
            (!start_str_norm ? e : c)
        );
        a = true;
        return;
      }
      $("[name='start']", $(this)).val(start_str_norm);
      $("[name='end']", $(this)).val(end_str_norm);
      var d = getMinutesOfDay(e);
      var b = getMinutesOfDay(c);
      if (DEBUG) {
        window.console.log(
          "start time:" +
            $("[name='start']", $(this)).val() +
            " end time:" +
            $("[name='end']", $(this)).val()
        );
      }
      if (d >= b) {
        $("#timeRangeErrors").html(
          myextension.getMessage(
            "Invalid time range: End time must be later than Start time."
          )
        );
        a = true;
      }
      if (DEBUG) {
        window.console.log("start time:" + d + " end time:" + b);
      }
    });
  }
  if (a) {
    return false;
  } else {
    $("#timeRangeErrors").html("");
    return true;
  }
}
function validateTimeAllowed() {
  var b = false;
  var a =
    $("#enableTimeRange").val() == "timeRangeIsEnabled"
      ? $(".allowtimeWithRange")
      : $(".allowtimeWithoutRange");
  a.each(function () {
    var c = parseInt($(this).val());
    if (c < 0 || c > 24 * 60 || isNaN(c)) {
      b = b || true;
    }
  });
  if (b) {
    $("#timeAllowedErrors").html(
      myextension.getMessage(
        "Invalid minutes input. It must be between 0 and 1440 (24 hours)"
      )
    );
    return false;
  } else {
    $("#timeAllowedErrors").html("");
    return true;
  }
}
function validateTimeAllowedInDialog() {
  var b = false;
  var a =
    $("#enableTimeRange").val() == "timeRangeIsEnabled"
      ? $("#allowtime3,#allowtime4")
      : $("#allowtime5");
  a.each(function () {
    var c = parseInt($(this).val());
    if (c < 0 || c > 24 * 60 || isNaN(c)) {
      b = b || true;
    }
  });
  if (b) {
    $("#timeAllowedInDialogErrors").html(
      myextension.getMessage(
        "Invalid input: Must be between 0 and 1440 (24 hours)"
      )
    );
    return false;
  } else {
    $("#timeAllowedInDialogErrors").html("");
    return true;
  }
}
function resetTimeTracker() {
  var a = confirm(
    myextension.getMessage(
      "Are you sure?\n\nAll historical Time Tracker data will be wiped out and permanently lost. This won't allow you to work around the time quota for blocking purpose. Click OK to reset or Cancel to abort."
    )
  );
  if (a == false) {
    return;
  }
  myextension.sendMessage(null, "resetTimeTracker");
}
function initializePage() {
  $("#name").val(settings.name);
  $("#allowtime0").val(settings.allowed_minutes_wh);
  $("#allowtime1").val(settings.allowed_minutes_wh);
  $("#allowtime2").val(settings.allowed_minutes_ah);
  $("#enableTimeRange").val(
    settings.enableTimeRange ? "timeRangeIsEnabled" : "timeRangeIsDisabled"
  );
  toggleTimeRangeDiv();
  if (settings.enableChallenge) {
    if (settings.challengeType == "random") {
      $('input[name=enableChallenge][value="randomChallenge"]').attr(
        "checked",
        true
      );
    } else {
      $('input[name=enableChallenge][value="passwordChallenge"]').attr(
        "checked",
        true
      );
      $("#password1").val(settings.challengePassword);
      $("#password2").val(settings.challengePassword);
    }
  } else {
    $('input[name=enableChallenge][value="noChallenge"]').attr("checked", true);
  }
  if (settings.enabledForPrivateBrowsing == "always") {
    $('input[name=enabledForIncognitoOption][value="always"]').attr(
      "checked",
      true
    );
  } else {
    if (settings.enabledForPrivateBrowsing == "never") {
      $('input[name=enabledForIncognitoOption][value="never"]').attr(
        "checked",
        true
      );
    } else {
      $('input[name=enabledForIncognitoOption][value="blockOnly"]').attr(
        "checked",
        true
      );
    }
  }
  $(".activeDayListItem").remove();
  for (i = 0; i < 7; i++) {
    li = document.createElement("li");
    li.innerHTML =
      '<label><input type="checkbox" id="' +
      weekday[i] +
      '" class="activeDay" />' +
      myextension.getMessage(weekday[i]) +
      "</label>";
    li.setAttribute("class", "activeDayListItem");
    $("#activedaysall").before(li);
  }
  for (i = 0; i < 7; i++) {
    $("#" + weekday[i]).attr("checked", settings.activedays[i]);
  }
  initTimeRanges();
  $("#do_not_track_url").val(settings.doNotTrackSite);
  $("#blockurl").val(settings.blockurl);
  if (settings.blockurlUseDefault) {
    $('input[name="blockurlOption"][value="blockurlUseDefault"]').attr(
      "checked",
      true
    );
    $("#blockurl").attr("disabled", true);
  } else {
    $('input[name="blockurlOption"][value="blockurlUseCustom"]').attr(
      "checked",
      true
    );
  }
  $("#warnAtMinutes").val(settings.warnAtMinutes);
  $("#blockedsites").empty();
  for (i in settings.blacklist) {
    li = document.createElement("li");
    li.innerHTML = blockedSiteHTML(settings.blacklist[i]);
    $("#blockedsites").append(li);
  }
  $("#blockedsites>li:odd").removeClass("rowHighlight");
  $("#blockedsites>li:even").addClass("rowHighlight");
  $("#blockedsites")
    .find(".delete_btn")
    .click(function () {
      deleteSite(this);
    });
  $("#blockedsites")
    .find(".customize_btn")
    .click(function () {
      showCustomizationDialog(this);
    });
  $("#allowedsites").empty();
  for (i in settings.whitelist) {
    li = document.createElement("li");
    li.innerHTML = allowedSiteHTML(settings.whitelist[i]);
    $("#allowedsites").append(li);
  }
  $("#allowedsites>li:odd").removeClass("rowHighlight");
  $("#allowedsites>li:even").addClass("rowHighlight");
  $("#allowedsites")
    .find(".delete_btn")
    .click(function () {
      deleteSite(this);
    });
  $(".timeSelection").blur(validateTimeRanges);
  $("#idleTimeoutSlider").val(settings.idleTimeout / 60);
  $("#idleTimeoutValue").html(settings.idleTimeout / 60);
  if (
    settings.numSitesInTimeTracker == 5 ||
    settings.numSitesInTimeTracker == 10 ||
    settings.numSitesInTimeTracker == 20
  ) {
    $(
      'input[name="numTimeTrackerSites"][value="' +
        settings.numSitesInTimeTracker +
        '"]'
    ).attr("checked", true);
  } else {
    $('input[name="numTimeTrackerSites"][value="10"]').attr("checked", true);
  }
  var a = ["#addBlockedSitesTipText", "#addAllowedSitesTipText"];
  $(".showTips").each(function (b) {
    var c = $(a[b]);
    $(this)
      .mouseover(function () {
        c.animate({ opacity: 0.95 }, { queue: false });
      })
      .mousemove(function (d) {
        c.css({ left: d.pageX - 500, top: d.pageY - 90 });
      })
      .mouseout(function () {
        c.animate({ opacity: 0 }, { duration: 400, queue: false });
        c.css({ left: -9999, top: -100 });
      });
  });
  $("#selectAllBtn").click(function (b) {
    b.preventDefault();
    $(".activeDay").attr("checked", true);
  });
  $("#unselectAllBtn").click(function (b) {
    b.preventDefault();
    $(".activeDay").attr("checked", false);
  });
  $("#blockurlUseDefaultBtn").click(function () {
    $("#blockurl").attr("disabled", true);
  });
  $("#blockurlUseCustomBtn").click(function () {
    $("#blockurl").attr("disabled", false);
  });
  $(".sortable")
    .sortable()
    .bind("sortupdate", function () {
      $("li:even", this).addClass("rowHighlight");
      $("li:odd", this).removeClass("rowHighlight");
    });
}
$(document).ready(function doc_ready() {
  window.console.log("DOM ready");
  if (typeof myextension == "undefined") {
    window.console.log("extension.js is not loaded");
    setTimeout(doc_ready, 1);
    return;
  }
  myextension.loadHTMLBody(function () {
    $("#dialogCancelButton").click(function () {
      hideCustomizationDialog();
    });
    $("#dialogOKButton").click(function () {
      saveDialog();
    });
    $("#loadURLDialogCancelButton").click(function () {
      hideLoadBlocklistURLDialog();
    });
    $("#loadURLDialogOKButton").click(function () {
      loadBlocklistUrl();
    });
    $("#resetTimeTracker").click(function () {
      resetTimeTracker();
    });
    $("#loadBlocklistURLButton").click(function () {
      showLoadBlocklistURLDialog();
    });
    $("#addBlockedSitesButton").click(function () {
      addBlockedSites();
    });
    $("#addAllowedSitesButton").click(function () {
      addAllowedSites();
    });
    $("#addTimeRange").click(function () {
      addTimeRangeDefault();
    });
    $("#enableTimeRange").change(function () {
      enableTimeRange();
    });
    $("#cancel").click(function () {
      cancel();
    });
    $("#saveSettings").click(function () {
      applySettings();
    });
    if (SAFARI) {
      $("#google_chrome_incognito_notice").hide();
    }
    if (CHROME) {
      $("#chrome_extension_link").click(function () {
        chrome.tabs.create({ url: "chrome://extensions" });
      });
    }
    var b = $("#vtab>ul>li");
    b.mousedown(function () {
      if ($("#vtab>ul>li.timeAllowed.selected").length > 0) {
        if (!validatePage()) {
          return;
        }
      }
      var e = b.index($(this));
      b.removeClass("selected");
      $(this).addClass("selected");
      $("#vtab>div").hide().eq(e).show();
    });
    b.mouseover(function () {
      $(this).addClass("highlight");
    });
    b.mouseout(function () {
      $(this).removeClass("highlight");
    });
    $(".jqmWindow").jqm({ modal: true, overlay: 30 });
    $("#mydialog").keyup(function (e) {
      if (e.keyCode == 13) {
        $("#dialogOKButton").click();
      }
    });
    $("#loadurl_mydialog").keyup(function (e) {
      if (e.keyCode == 13) {
        $("#loadURLDialogOKButton").click();
      }
    });
    $(".allowtime").blur(validateTimeAllowed);
    $("#idleTimeoutSlider").change(function () {
      $("#idleTimeoutValue").html($(this).val());
    });
    $("#exportform").submit(function () {
      $("#exportdata").val(exportSettings(settings));
    });
    function c(f) {
      var e = f.substring(f.lastIndexOf("\\") + 1);
      return e.substring(e.lastIndexOf("/") + 1);
    }
    var d = false;
    $("#importform").submit(function () {
      if (d) {
        return false;
      }
      if (0 >= $("#importFileName").val().length) {
        return false;
      }
      d = true;
      var f = "iframeUpload";
      var e = $('<iframe name="' + f + '" src="about:blank" />');
      e.css("display", "none");
      $("body").append(e);
      $(this).attr({ target: f });
      $("#importStatus").html(myextension.getMessage("Status: Importing ..."));
      $("#extensionid").val(location.hostname);
      setTimeout(function () {
        e.remove();
        var g = encodeURI(
          "https://www.bumblebeesystems.com/safari-extz/import-download-v2.php?extensionid=" +
            location.hostname +
            "&filename=" +
            c($("#importFileName").val())
        );
        $.getJSON(g + "&callback=?", function (h) {
          var j = parseSettings(h);
          if (j && isOK(j)) {
            settings = j;
            initializePage();
            $("#importStatus").html(
              myextension.getMessage(
                'Status: Settings have been successfully imported from this file.<br />The imported settings won\'t take effect until you click "Apply Settings" button.'
              )
            );
          } else {
            $("#importStatus").html(
              myextension.getMessage("Status: Failed to import this file.")
            );
          }
          d = false;
        });
        setTimeout(function () {
          if (d) {
            $("#importStatus").html(
              myextension.getMessage(
                "Status: Failed to import this file. Server error."
              )
            );
            d = false;
          }
        }, 1000);
      }, 1000);
    });
    var a = document.location.hash.substr(1);
    if (!a) {
      a = "blockedSites";
    }
    $("#vtab>ul>li." + a).mousedown();
    myextension.addMessageListener(getAnswer);
    myextension.sendMessage(null, "getSettings", "");
  });
});
function showCustomizationDialog(b) {
  var d = $(b).parent();
  var a = $(".url", d).html();
  $("#blockedSiteURL").html(a);
  saveDialog = function () {
    _saveDialog(d);
  };
  var c = getPerSiteOption(settings, a);
  $("#allowtime3").val(0);
  $("#allowtime4").val(0);
  $("#allowtime5").val(0);
  if (!c || c.option == "useGlobal") {
    $("input[name=blockedSiteOptions][value=useGlobal]").attr("checked", true);
  } else {
    if (c.option == "useCustom") {
      $("input[name=blockedSiteOptions][value=useCustom]").attr(
        "checked",
        true
      );
      $("#allowtime3").val(c.quota[0]);
      $("#allowtime4").val(c.quota[1]);
      $("#allowtime5").val(c.quota[0]);
    } else {
      $("input[name=blockedSiteOptions][value=alwaysBlock]").attr(
        "checked",
        true
      );
    }
  }
  if (c && c.includeChildren) {
    $("#includeChildrenCheckbox").attr("checked", true);
  } else {
    $("#includeChildrenCheckbox").attr("checked", false);
  }
  $("#mydialog").jqmShow();
}
function hideCustomizationDialog() {
  $("#mydialog").jqmHide();
}
function saveDialog() {}
function _saveDialog(e) {
  var b = $(".url", e).html();
  var f = $(".blockedSiteOption", e);
  var d = $("input[name=blockedSiteOptions]:checked").val();
  if (d == "useCustom" && !validateTimeAllowedInDialog()) {
    return;
  }
  var a = $("#includeChildrenCheckbox").attr("checked");
  if (settings.enableTimeRange) {
    setPerSiteOption(
      settings,
      b,
      d,
      [parseInt($("#allowtime3").val()), parseInt($("#allowtime4").val())],
      a
    );
  } else {
    setPerSiteOption(settings, b, d, [parseInt($("#allowtime5").val()), 0], a);
  }
  var c = printPerSiteOption(settings, b);
  if (c) {
    if (f.length > 0) {
      f.html(c);
    } else {
      var g = document.createElement("span");
      g.innerHTML = c;
      g.className = "blockedSiteOption";
      e.append(g);
    }
  } else {
    $(".blockedSiteOption", e).remove();
  }
  if (DEBUG) {
    window.console.log("saveDialog for " + b + " option: " + c);
  }
  hideCustomizationDialog();
}
function blockedSiteHTML(a) {
  var b = printPerSiteOption(settings, a);
  var c =
    "<img src='customize_16.gif' class='customize_btn clickable' title='Click to customize per-site settings' /> <span class='url'>" +
    a +
    "</span>";
  if (b) {
    c = c + "<span class='blockedSiteOption'>" + b + "</span>";
  }
  c =
    c +
    "<img src='delete_16.png' class='delete_btn clickable' title='Click to remove a site'/>";
  return c;
}
function allowedSiteHTML(a) {
  return (
    "<span class='url'>" +
    a +
    "</span><img src='delete_16.png' class='delete_btn clickable' title='Click to remove a site' />"
  );
}
function enableTimeRange() {
  if (
    $("#enableTimeRange").val() == "timeRangeIsEnabled" &&
    settings.enableTimeRange == false
  ) {
    var a = confirm(
      myextension.getMessage(
        "Warning: Enabling Time Range will cause today's timers to reset when you save settings.\n\nPlease click OK to continue or Cancel to revert it back."
      )
    );
    if (a == false) {
      $("#enableTimeRange").val("timeRangeIsDisabled");
    }
  }
  settings.enableTimeRange =
    $("#enableTimeRange").val() == "timeRangeIsEnabled";
  updateBlockedSiteOptionDisplay();
  validateTimeRanges();
  validateTimeAllowed();
  if ($("#rangeDefinitions li").length == 0) {
    addTimeRangeDefault();
  }
  toggleTimeRangeDiv();
}
function updateBlockedSiteOptionDisplay() {
  $("span.blockedSiteOption").each(function () {
    var a = $(".url", $(this).parent()).text();
    var b = $(".blockedSiteOption", $(this).parent());
    if (b.length > 0) {
      b.html(printPerSiteOption(settings, a));
    }
  });
}
function addTimeRange(c, a) {
  var b = document.createElement("li");
  b.innerHTML =
    "From <input type='text' name='start' class='timeSelection' value='" +
    c +
    "' size='9' /> to <input type='text' name='end' class='timeSelection' value='" +
    a +
    "' size='9' /> <img src='delete_10.png' class='deleteTimeRange' title='Delete time range' />";
  $("#rangeDefinitions").append(b);
}
function addTimeRangeDefault() {
  addTimeRange("12:00 AM", "11:59 PM");
  toggleTimeRangeDeleteButton();
  installTimeRangeHooks();
}
function initTimeRanges() {
  $("#rangeDefinitions").empty();
  for (var a in settings.time_ranges) {
    addTimeRange(settings.time_ranges[a].start, settings.time_ranges[a].end);
  }
  toggleTimeRangeDeleteButton();
  installTimeRangeHooks();
}
function installTimeRangeHooks() {
  $(".timeSelection").timePicker({
    show24Hours: false,
    separator: ":",
    step: 15,
  });
  $(".timeSelection").blur(validateTimeRanges);
  $(".deleteTimeRange").unbind("click");
  $(".deleteTimeRange").click(function () {
    $(this).parent().remove();
    toggleTimeRangeDeleteButton();
  });
}
function toggleTimeRangeDeleteButton() {
  if ($("#rangeDefinitions li").length == 1) {
    $("#rangeDefinitions li img").hide();
  } else {
    $("#rangeDefinitions li img").show();
  }
}
function toggleTimeRangeDiv() {
  if ($("#enableTimeRange").val() == "timeRangeIsEnabled") {
    $(".timeRanges").show();
    $(".noTimeRanges").hide();
  } else {
    $(".timeRanges").hide();
    $(".noTimeRanges").show();
  }
}
function showLoadBlocklistURLDialog() {
  $("#loadurl_mydialog").jqmShow();
}
function hideLoadBlocklistURLDialog() {
  $("#loadurl_mydialog").jqmHide();
}
function loadBlocklistUrl() {
  $("#loadurl_mydialog").jqmHide();
  var a = trim($("#loadBlocklistURLInput").val());
  if (a) {
    encoded_url = encodeURI(a);
    var b = true;
    $("#loadBlocklistURLButton").attr("disabled", true);
    $("#blockedsites_error").html("");
    $.get(encoded_url, function (c) {
      b = false;
      $("#loadBlocklistURLButton").attr("disabled", false);
      if (c.startsWith("#!WasteNoTime Blocklist")) {
        $("#blockednewsites").val(c);
      } else {
        $("#blockedsites_error").html(
          myextension.getMessage("Invalid block list from URL ") + a
        );
      }
    });
    setTimeout(function () {
      if (b) {
        $("#blockedsites_error").html(
          myextension.getMessage("Failed to load block list from URL ") + a
        );
        b = false;
        $("#loadBlocklistURLButton").attr("disabled", false);
      }
    }, 1000);
  }
}
function addAllowedSites() {
  addSites(
    "#allowednewsites",
    "#allowedsites_error",
    "#allowedsites",
    allowedSiteHTML
  );
  $("#allowedsites")
    .find(".delete_btn")
    .click(function () {
      deleteSite(this);
    });
}
function addBlockedSites() {
  addSites(
    "#blockednewsites",
    "#blockedsites_error",
    "#blockedsites",
    blockedSiteHTML
  );
  $("#blockedsites")
    .find(".delete_btn")
    .click(function () {
      deleteSite(this);
    });
  $("#blockedsites")
    .find(".customize_btn")
    .click(function () {
      showCustomizationDialog(this);
    });
  $("#blockedsites").sortable();
}
function addSites(l, e, f, j) {
  $(e).html("");
  var c = $(l).val().split("\n");
  var d = 0;
  var k = 0;
  var g = 0;
  var b = new Array();
  $(f + " > li span.url").each(function () {
    var a = trim($(this).text());
    b.push(a);
  });
  for (i in c) {
    site = trim(c[i]);
    if (site) {
      if (site.startsWith("#")) {
        continue;
      }
      cleaned_site = validateAndCleanURL(site);
      if (cleaned_site) {
        if (b.indexOf(cleaned_site) < 0) {
          li = document.createElement("li");
          li.innerHTML = j(cleaned_site);
          $(f).append(li);
          b.push(cleaned_site);
          d = d + 1;
        } else {
          g = g + 1;
        }
      } else {
        var h = parseURL(site);
        $(e).append("Invalid input: " + site + "<br/>");
        k = k + 1;
      }
    }
  }
  if (k > 0) {
    $(e).append(
      "" + k + " site(s) were not added becaused of invalid syntax.<br />"
    );
  }
  if (d > 0) {
    $(e).append("" + d + " site(s) have been successfully added.<br />");
  }
  if (g > 0) {
    $(e).append("" + g + " site(s) are duplicates.<br />");
  }
  $(l).val("");
  $("li:even", f).addClass("rowHighlight");
  $("li:odd", f).removeClass("rowHighlight");
}
function deleteSite(a) {
  var b = $(a).parent().parent();
  $(a).parent().remove();
  $("li:even", b).addClass("rowHighlight");
  $("li:odd", b).removeClass("rowHighlight");
}
function applySettings() {
  if (!validatePage()) {
    return;
  }
  settings.name = $("#name").val();
  settings.enableTimeRange =
    $("#enableTimeRange").val() == "timeRangeIsEnabled";
  if (settings.enableTimeRange) {
    settings.time_ranges = [];
    $("#rangeDefinitions > li").each(function () {
      settings.time_ranges.push(
        new TimeRange(
          $("[name='start']", $(this)).val(),
          $("[name='end']", $(this)).val()
        )
      );
    });
    settings.allowed_minutes_wh = parseInt($("#allowtime1").val());
    settings.allowed_minutes_ah = parseInt($("#allowtime2").val());
  } else {
    settings.allowed_minutes_wh = parseInt($("#allowtime0").val());
  }
  if ($("input[name='blockurlOption']:checked").val() == "blockurlUseDefault") {
    settings.blockurlUseDefault = true;
  } else {
    settings.blockurlUseDefault = false;
    settings.blockurl = $("#blockurl").val();
  }
  settings.doNotTrackSite = $("#do_not_track_url").val();
  var a = parseInt($("#warnAtMinutes").val());
  settings.warnAtMinutes = 0 <= a ? a : 0;
  settings.blacklist = new Array();
  $("#blockedsites > li span.url").each(function () {
    var e = trim($(this).text());
    if (DEBUG) {
      window.console.log(
        "save blocked site: " +
          e +
          " option: " +
          printPerSiteOption(settings, e)
      );
    }
    settings.blacklist.push(e);
  });
  rebuildPerSiteOptions(settings);
  settings.whitelist = new Array();
  $("#allowedsites > li span.url").each(function () {
    var e = trim($(this).text());
    if (DEBUG) {
      window.console.log("save allowed site: " + e);
    }
    settings.whitelist.push(e);
  });
  $(".activeDay").each(function (e) {
    settings.activedays[e] = $(this).attr("checked");
  });
  settings.enabledForPrivateBrowsing = $(
    "input[name=enabledForIncognitoOption]:checked"
  ).val();
  var b = $("input[name=enableChallenge]:checked").val();
  if (b == "noChallenge") {
    settings.enableChallenge = false;
  } else {
    settings.enableChallenge = true;
    if (b == "randomChallenge") {
      settings.challengeType = "random";
    } else {
      settings.challengeType = "password";
      settings.challengePassword = $("#password1").val();
    }
  }
  settings.idleTimeout = 60 * $("#idleTimeoutSlider").val();
  settings.numSitesInTimeTracker = parseInt(
    $("input[name=numTimeTrackerSites]:checked").val()
  );
  printSettings();
  myextension.sendMessage(null, "reload", settings);
  var c = $("#vtab>ul>li.selected").attr("href");
  var d = myextension.getURL("view.html" + c);
  if (!DEBUG) {
    window.location = d;
  }
}
function cancel() {
  var a = $("#vtab>ul>li.selected").attr("href");
  var b = myextension.getURL("view.html" + a);
  window.location = b;
}
function printSettings() {
  if (!DEBUG || !window.console) {
    return;
  }
  window.console.log("============= SETTINGS ===============");
  window.console.log(
    "Time Range is " + settings.enableTimeRange ? "Enabled" : "Disabled"
  );
  if (settings.enableTimeRange) {
    for (var a in settings.time_ranges) {
      window.console.log(
        "Time Range From " +
          settings.time_ranges[a].start +
          " to " +
          settings.time_ranges[a].end
      );
    }
  }
  window.console.log("Workhour allowed minutes:" + settings.allowed_minutes_wh);
  window.console.log(
    "Afterhour allowed minutes:" + settings.allowed_minutes_ah
  );
  window.console.log("Blacklist:");
  for (var a in settings.blacklist) {
    window.console.log(settings.blacklist[a]);
  }
  window.console.log("Whitelist:");
  for (var a in settings.whitelist) {
    window.console.log(settings.whitelist[a]);
  }
  window.console.log("Per-Site Options:");
  for (var a in settings.perSiteOptions) {
    window.console.log(a + ": " + printPerSiteOption(settings, a));
  }
  for (var a in settings.activedays) {
    window.console.log(weekday[a] + ":" + settings.activedays[a]);
  }
  window.console.log("Enable challenge:" + settings.enableChallenge);
  window.console.log(
    "Enabled for Private Browsing:" + settings.enabledForPrivateBrowsing
  );
  window.console.log(
    "Number of sites displayed in Time Tracker:" +
      settings.numSitesInTimeTracker
  );
}
var _gaq = _gaq || [];
_gaq.push(["_setAccount", "UA-23593853-1"]);
_gaq.push(["_trackPageview"]);
(function () {
  var b = document.createElement("script");
  b.type = "text/javascript";
  b.async = true;
  b.src = "https://ssl.google-analytics.com/ga.js";
  var a = document.getElementsByTagName("script")[0];
  a.parentNode.insertBefore(b, a);
})();
