(function () {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const formMessage = document.getElementById("formMessage");
    const submitBtn = document.getElementById("submitBtn");
    const passwordToggle = document.getElementById("passwordToggle");

    function showMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = "form-message show " + type;
    }

    function clearMessage() {
        formMessage.textContent = "";
        formMessage.className = "form-message";
    }

    function setInputState(input, errorEl, isValid, message) {
        input.classList.remove("valid", "invalid");
        if (!isValid) {
            input.classList.add("invalid");
            errorEl.textContent = message;
            return;
        }
        input.classList.add("valid");
        errorEl.textContent = "";
    }

    function validateEmail(showState) {
        const value = emailInput.value.trim();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (showState) {
            setInputState(emailInput, emailError, isValid, "Enter a valid email address.");
        }
        return isValid;
    }

    function validatePassword(showState) {
        const isValid = passwordInput.value.trim().length >= 6;
        if (showState) {
            setInputState(passwordInput, passwordError, isValid, "Password must be at least 6 characters.");
        }
        return isValid;
    }

    function validateForm(showState) {
        const valid = validateEmail(showState) && validatePassword(showState);
        submitBtn.disabled = !valid;
        return valid;
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span>Signing In...';
            return;
        }
        submitBtn.innerHTML = "Login";
        validateForm(false);
    }

    function getUsers() {
        const raw = localStorage.getItem("farmsyncUsers");
        if (!raw) return [];
        try {
            const users = JSON.parse(raw);
            return Array.isArray(users) ? users : [];
        } catch (error) {
            return [];
        }
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        clearMessage();

        if (!validateForm(true)) {
            showMessage("Please fix the highlighted fields.", "error");
            return;
        }

        setLoading(true);

        window.setTimeout(function () {
            const users = getUsers();
            const email = emailInput.value.trim().toLowerCase();
            const password = passwordInput.value;

            const matchedUser = users.find(function (user) {
                return String(user.email || "").toLowerCase() === email && String(user.password || "") === password;
            });

            if (!matchedUser) {
                showMessage("Invalid email or password.", "error");
                setLoading(false);
                return;
            }

            localStorage.setItem("farmsyncCurrentUser", JSON.stringify(matchedUser));
            showMessage("Login successful. Redirecting...", "success");

            window.setTimeout(function () {
                window.location.href = "index.html";
            }, 500);
        }, 1200);
    });

    [emailInput, passwordInput].forEach(function (input) {
        input.addEventListener("input", function () {
            clearMessage();
            if (input.id === "email") validateEmail(true);
            if (input.id === "password") validatePassword(true);
            validateForm(false);
        });

        input.addEventListener("blur", function () {
            if (input.id === "email") validateEmail(true);
            if (input.id === "password") validatePassword(true);
            validateForm(false);
        });
    });

    passwordToggle.addEventListener("click", function () {
        const nextType = passwordInput.type === "password" ? "text" : "password";
        passwordInput.type = nextType;
        passwordToggle.textContent = nextType === "password" ? "Show" : "Hide";
    });

    validateForm(false);
})();
