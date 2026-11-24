// VOXORA - beginner-friendly interactive features
// VOXORA - Supabase connection

const SUPABASE_URL = "https://eqqvxcbxylzyaicauuhw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cGNR8HhZ8x2hwWSJ6LBGpA_Qseo4i0-";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("VOXORA connected to supabase!");
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("#searchInput");
    const debateList = document.querySelector("#debateList");
    const noResults = document.querySelector("#noResults");
    const categoryButtons = document.querySelectorAll(".category-chip");
    const feedButtons = document.querySelectorAll(".feed-tab");
    const themeToggle = document.querySelector("#themeToggle");
    const notificationToggle = document.querySelector("#notificationToggle");
    const notificationPanel = document.querySelector("#notificationPanel");
    const profileButton = document.querySelector("#profileButton");
    const searchForm = document.querySelector("#searchForm");

    if (!debateList) return;

    let selectedCategory = "all";
    let selectedFeed = "foryou";
    const originalCards = getInitialCards();

    function getInitialCards() {
        return Array.from(debateList.querySelectorAll(".debate-card"));
    }

    originalCards.forEach(function (card, index) {
        card.dataset.originalOrder = String(index);
    });

    function readStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return fallback;
            try {
                return JSON.parse(value);
            } catch (error) {
                return value;
            }
        } catch (error) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // The page remains usable when browser storage is unavailable.
        }
    }

    function getCardId(card) {
        return card.querySelector("h3")?.textContent.trim() || "";
    }

    function getDebateCards() {
        return Array.from(debateList.querySelectorAll(".debate-card"));
    }

    // Search and category filters work together.
    function updateDebates() {
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const cards = getDebateCards();
        let visibleCount = 0;

        cards.forEach(function (card) {
            const matchesSearch = card.textContent.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === "all" ||
                card.dataset.category === selectedCategory;

            const shouldShow = matchesSearch && matchesCategory;
            card.hidden = !shouldShow;

            if (shouldShow) visibleCount++;
        });

        // Trending sorts by vote count; Latest sorts by date marker.
        if (selectedFeed === "trending") {
            cards.sort((a, b) => Number(b.dataset.votes) - Number(a.dataset.votes));
        } else if (selectedFeed === "latest") {
            cards.sort((a, b) => Number(b.dataset.date) - Number(a.dataset.date));
        } else {
            cards.sort((a, b) => Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder));
        }

        cards.forEach(card => debateList.appendChild(card));

        if (noResults) noResults.hidden = visibleCount !== 0;
    }

    if (searchInput) {
        searchInput.addEventListener("input", updateDebates);
    }

    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            updateDebates();
            document.querySelector("#debates")?.scrollIntoView({ behavior: "smooth" });
        });
    }

    categoryButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            categoryButtons.forEach(item => item.classList.remove("active"));
            categoryButtons.forEach(item => item.setAttribute("aria-pressed",
                item === button ? "true" : "false"));
            button.classList.add("active");
            selectedCategory = button.dataset.category;
            updateDebates();
        });
    });

    feedButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            feedButtons.forEach(item => item.classList.remove("active"));
            button.classList.add("active");
            feedButtons.forEach(item => item.setAttribute("aria-selected",
                item === button ? "true" : "false"));
            selectedFeed = button.dataset.feed;
            updateDebates();
        });
    });

    // Trending topic links select the matching category.
    document.querySelectorAll(".trending-topic").forEach(function (topic) {
        topic.addEventListener("click", function (event) {
            event.preventDefault();
            selectedCategory = topic.dataset.topic;
            categoryButtons.forEach(function (button) {
                button.classList.toggle("active", button.dataset.category === selectedCategory);
                button.setAttribute("aria-pressed",
                    button.dataset.category === selectedCategory ? "true" : "false");
            });
            updateDebates();
            document.querySelector("#debates").scrollIntoView({ behavior: "smooth" });
        });
    });

    // Dark/light mode. The preference is remembered in this browser.
    function setTheme(isLight) {
        document.body.classList.toggle("light-mode", isLight);
        if (themeToggle) {
            themeToggle.textContent = isLight ? "☾" : "☼";
            themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
        }
    }

    setTheme(readStorage("voxora-theme", "dark") === "light");

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const isLight = !document.body.classList.contains("light-mode");
            setTheme(isLight);
            writeStorage("voxora-theme", isLight ? "light" : "dark");
        });
    }

    // Show/hide the sample notification panel.
    if (notificationToggle && notificationPanel) {
        notificationToggle.addEventListener("click", function () {
            notificationPanel.hidden = !notificationPanel.hidden;
            notificationToggle.setAttribute("aria-expanded", String(!notificationPanel.hidden));
        });

        document.addEventListener("click", function (event) {
            const clickedInside = notificationPanel.contains(event.target) ||
                notificationToggle.contains(event.target);
            if (!clickedInside) {
                notificationPanel.hidden = true;
                notificationToggle.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !notificationPanel.hidden) {
                notificationPanel.hidden = true;
                notificationToggle.setAttribute("aria-expanded", "false");
                notificationToggle.focus();
            }
        });
    }


    // Persist Like and Save interactions for this browser.
    const likedDebates = new Set(readStorage("voxora-liked", []));
    const savedDebates = new Set(readStorage("voxora-saved", []));

    getDebateCards().forEach(function (card) {
        const cardId = getCardId(card);
        const likeButton = card.querySelector(".subtle-action:not(.save-button)");
        const saveButton = card.querySelector(".save-button");

        if (likeButton && likedDebates.has(cardId)) {
            likeButton.classList.add("selected");
            likeButton.textContent = "♥ Liked";
        }

        if (saveButton && savedDebates.has(cardId)) {
            saveButton.classList.add("selected");
            saveButton.textContent = "★ Saved";
        }
    });

    debateList.addEventListener("click", function (event) {
        const button = event.target.closest(".subtle-action");
        if (!button) return;

        button.classList.toggle("selected");
        const card = button.closest(".debate-card");
        const cardId = card ? getCardId(card) : "";

        if (button.classList.contains("save-button")) {
            const isSelected = button.classList.contains("selected");
            button.textContent = isSelected ? "★ Saved" : "☆ Save";
            if (isSelected) savedDebates.add(cardId);
            else savedDebates.delete(cardId);
            writeStorage("voxora-saved", Array.from(savedDebates));
        } else if (button.textContent.includes("Like")) {
            button.textContent = button.classList.contains("selected") ? "♥ Liked" : "♡ Like";
            const isSelected = button.classList.contains("selected");
            if (isSelected) likedDebates.add(cardId);
            else likedDebates.delete(cardId);
            writeStorage("voxora-liked", Array.from(likedDebates));
        } else if (button.textContent.includes("Discuss")) {
            alert("Comments are a feature we'll add next!");
        }
    });

    updateDebates();
});
// VOXORA ACCOUNT WINDOW

document.addEventListener("DOMContentLoaded", function () {

    const profileButton = document.getElementById("profileButton");
    const authOverlay = document.getElementById("authOverlay");
    const authClose = document.getElementById("authClose");

    // Open account window
    if (profileButton && authOverlay) {
        profileButton.addEventListener("click", function () {
            authOverlay.hidden = false;
        });
    }

    // Close account window
    if (authClose && authOverlay) {
        authClose.addEventListener("click", function () {
            authOverlay.hidden = true;
        });
    }

    // Close when clicking outside the account window
    if (authOverlay) {
        authOverlay.addEventListener("click", function (event) {
            if (event.target === authOverlay) {
                authOverlay.hidden = true;
            }
        });
    }

});

// VOXORA USER REGISTRATION


// VOXORA REGISTRATION AND LOGIN

document.addEventListener("DOMContentLoaded", function () {

    const authForm = document.getElementById("authForm");
    const authUsername = document.getElementById("authUsername");
    const authEmail = document.getElementById("authEmail");
    const authPassword = document.getElementById("authPassword");
    const authMessage = document.getElementById("authMessage");
    const authSubmit = document.getElementById("authSubmit");
    const usernameField = document.getElementById("usernameField");
    const authSwitch = document.getElementById("authSwitch");
    const authSwitchButton = document.getElementById("authSwitchButton");
    const authTitle = document.getElementById("authTitle");
    const authDescription = document.getElementById("authDescription");

    if (!authForm) {
        console.error("VOXORA account form not found.");
        return;
    }

    let authMode = "signup";

    // Switch between registration and login
    authSwitchButton.addEventListener("click", function () {

        authMode = authMode === "signup" ? "login" : "signup";

        authMessage.textContent = "";

        if (authMode === "login") {
            usernameField.hidden = true;
            authUsername.required = false;
            authPassword.autocomplete = "current-password";

            authTitle.textContent = "Welcome back.";
            authDescription.textContent = "Sign in to continue the conversation.";
            authSubmit.textContent = "Sign in";

            authSwitch.firstChild.textContent = "New to VOXORA? ";
            authSwitchButton.textContent = "Create account";

        } else {
            usernameField.hidden = false;
            authUsername.required = true;
            authPassword.autocomplete = "new-password";

            authTitle.textContent = "Join the conversation.";
            authDescription.textContent = "Create an account to share your voice.";
            authSubmit.textContent = "Create account";

            authSwitch.firstChild.textContent = "Already have an account? ";
            authSwitchButton.textContent = "Sign in";
        }

    });

    // Handle registration and login
    authForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = authEmail.value.trim();
        const password = authPassword.value;

        authSubmit.disabled = true;
        authMessage.textContent = "";

        try {

            if (authMode === "signup") {

                const username = authUsername.value.trim().toLowerCase();

                if (!/^[a-z0-9_]{3,24}$/.test(username)) {
                    throw new Error("Username must contain 3–24 letters, numbers or underscores.");
                }

                if (password.length < 8) {
                    throw new Error("Password must contain at least 8 characters.");
                }

                authSubmit.textContent = "Creating account...";

                const { data, error } =
                    await supabaseClient.auth.signUp({
                        email,
                        password,
                        options: {
                            data: { username }
                        }
                    });

                if (error) throw error;

                if (data.session) {
                    authMessage.textContent = "Your VOXORA account has been created!";
                } else {
                    authMessage.textContent =
                        "Account created! Check your email to confirm your address.";
                }

            } else {

                authSubmit.textContent = "Signing in...";

                const { error } =
                    await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });

                if (error) throw error;

                authMessage.textContent = "Welcome back to VOXORA!";

                authForm.reset();
            }

        } catch (error) {

            console.error("VOXORA authentication error:", error);
            authMessage.textContent = error.message;

        } finally {

            authSubmit.disabled = false;
            authSubmit.textContent =
                authMode === "signup" ? "Create account" : "Sign in";

        }

    });

});
