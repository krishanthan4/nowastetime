function showStatus(a){$(".status").hide();$(".status"+a).show()}function updateStatus(a){if(a.useCustomQuota){$("#quotaTypeCustom").show();$("#quotaTypeGlobal").hide()}else{$("#quotaTypeCustom").hide();$("#quotaTypeGlobal").show()}if(a.inLockdown){$("#lockdownUntil").html(a.inLockdownUntil);$("#currentTime").html(myextension.getMessage("Current time ")+" "+new Date().toLocaleTimeString());showStatus(".inLockdown")}else{if(a.enableTimeRange){var d=a.inWorkhour;var b=a.workhourSeconds;var c=a.afterhourSeconds;if(d){$("#remainingtime1").removeClass("ineffective");$("#remainingtime2").addClass("ineffective");$("#currentTime").html(myextension.getMessage("Current time ")+" "+new Date().toLocaleTimeString()+" "+myextension.getMessage(" is within work hours"));$("#nextTimeSegment").html(myextension.getMessage("This work hour segment ends at ")+" "+a.nextTimeSegment.toLocaleTimeString())}else{$("#remainingtime1").addClass("ineffective");$("#remainingtime2").removeClass("ineffective");$("#currentTime").html(myextension.getMessage("Current time ")+" "+new Date().toLocaleTimeString()+" "+myextension.getMessage(" is outside of work hours"));$("#nextTimeSegment").html(myextension.getMessage("The next work hour segment starts at ")+" "+a.nextTimeSegment.toLocaleTimeString())}$("#remainingtime1").html(b);$("#remainingtime2").html(c);showStatus(".timeRanges")}else{$("#remainingtime0").html(a.remainingSeconds);$("#currentTime").html(myextension.getMessage("Current time ")+" "+new Date().toLocaleTimeString());showStatus(".noTimeRanges")}}if(a.perSiteStatus){$("#perSiteRemainingTime").html(a.perSiteStatus)}else{$("#perSiteRemainingTime").html("")}$("#resetTime").html(a.resetTime);$("#currentURL").html(a.currentURL);if(a.matchedSite){$("#matchedSite").html(myextension.getMessage("<p>Matching: <b>")+a.matchedSite+"</b></p>")}else{$("#matchedSite").html(myextension.getMessage("<p>* Does not match any site in Allow or Block List</p>"))}$("#onBlockList").html(a.onBlockList);myextension.getGlobalPage().validateAddSiteCommand(function(){$("a.addsite").removeClass("disabled")},function(){$("a.addsite").addClass("disabled")});if(a.isIdle){$("#idleness").html(myextension.getMessage("[Idle]"))}else{$("#idleness").html("")}}function addEntireSiteToBlockList(){myextension.getGlobalPage().validateAddSiteCommand(function(){myextension.getGlobalPage().addEntireSiteCommand()},null)}function addSiteToBlockList(){myextension.getGlobalPage().validateAddSiteCommand(function(){myextension.getGlobalPage().addSiteCommand()},null)}function instantLockdown(){myextension.getGlobalPage().instantLockdown();myextension.getGlobalPage().hidePopover()}function viewSettings(){myextension.getGlobalPage().showSettings();myextension.getGlobalPage().hidePopover()}function showTimeTracker(){myextension.getGlobalPage().showTimeTracker();myextension.getGlobalPage().hidePopover()}function hide(){myextension.getGlobalPage().hidePopover()}function openHomePage(){myextension.getGlobalPage().openPage("http://www.bumblebeesystems.com/");myextension.getGlobalPage().hidePopover()}$(document).ready(function doc_ready(){if(typeof myextension=="undefined"){window.console.log("extension.js is not loaded");setTimeout(doc_ready,1);return}myextension.loadHTMLBody(function(){$("#closeBtn").click(function(){hide()});$("#addSite").click(function(a){a.preventDefault();addSiteToBlockList()});$("#timeTracker").click(function(a){a.preventDefault();showTimeTracker()});$("#instantLockdown").click(function(a){a.preventDefault();instantLockdown()});$("#settings").click(function(a){a.preventDefault();viewSettings()});if(CHROME){updateStatus(myextension.getGlobalPage().getStatus())}})});