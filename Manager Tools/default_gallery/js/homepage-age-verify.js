            // Check age verification immediately on page load
            // This must run before any other scripts to prevent popup flash
            (function () {
                var dmSettingsEmbed =
                    new URLSearchParams(window.location.search).get(
                        "dm_settings",
                    ) === "1";
                window.__DM_SETTINGS_EMBED__ = dmSettingsEmbed;
                if (dmSettingsEmbed) {
                    document.body.classList.add("dm-settings-embed");
                }

                var overlay = document.getElementById("age-verify-overlay");
                if (!overlay) return;

                if (dmSettingsEmbed) {
                    overlay.style.display = "none";
                    overlay.setAttribute("data-age-verify", "false");
                    return;
                }

                // Check both sessionStorage (current session) and the skip preference
                var ageVerified =
                    sessionStorage.getItem("ageVerified") === "true";
                var skipPref = false;

                try {
                    var prefsRaw = localStorage.getItem("skipPreferences");
                    if (prefsRaw) {
                        var prefs = JSON.parse(prefsRaw);
                        skipPref = prefs && prefs.skipAgeVerify === true;
                    }
                } catch (e) {}

                // If already verified or skip preference is on, hide overlay immediately
                if (ageVerified || skipPref) {
                    overlay.style.display = "none";
                    overlay.setAttribute("data-age-verify", "false");
                    console.log(
                        "Age verify skipped (session verified: " +
                            ageVerified +
                            ", pref: " +
                            skipPref +
                            ")",
                    );
                } else {
                    // Show overlay
                }
            })();

            // Global handlers for age verification buttons
            window.handleAgeYes = function (e) {
                if (e) e.preventDefault();

                // Save age verified state in sessionStorage (persists until F5/tab close)
                sessionStorage.setItem("ageVerified", "true");

                var overlay = document.getElementById("age-verify-overlay");
                if (overlay) {
                    overlay.style.display = "none";
                    overlay.setAttribute("data-age-verify", "false");
                }
                // Start loading - call the global function
                if (typeof window.startAgeVerifiedLoading === "function") {
                    window.startAgeVerifiedLoading();
                }
            };

            window.handleAgeNo = function (e) {
                if (e) e.preventDefault();
                console.log("Age No clicked - closing tab");
                // Close the tab - works in most browsers
                window.close();
                // Fallback: if window.close() doesn't work, show a message
                setTimeout(function () {
                    document.body.innerHTML =
                        '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#03050b;color:#e8f1ff;font-family:sans-serif;text-align:center;padding:20px;"><div><h1>Access Denied</h1><p>You must be 18 or older to access this archive.</p><p style="margin-top:20px;font-size:12px;color:#e8f1ff66;">You can close this tab manually.</p></div></div>';
                }, 100);
            };

            // Keyboard bypass - press Y to bypass age verification
            document.addEventListener("keydown", function (e) {
                var overlay = document.getElementById("age-verify-overlay");
                if (
                    overlay &&
                    overlay.style.display !== "none" &&
                    e.key.toLowerCase() === "y"
                ) {
                    handleAgeYes(e);
                }
            });
