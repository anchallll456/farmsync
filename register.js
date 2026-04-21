(function () {
    const form = document.getElementById("registerForm");
    const submitBtn = document.getElementById("submitBtn");
    const formMessage = document.getElementById("formMessage");
    const roleWrapper = document.getElementById("roleWrapper");
    const roleCards = Array.from(document.querySelectorAll(".role-card"));

    const fields = {
        fullName: document.getElementById("fullName"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        password: document.getElementById("password"),
        confirmPassword: document.getElementById("confirmPassword"),
        address: document.getElementById("address")
    };

    const errors = {
        fullName: document.getElementById("fullNameError"),
        email: document.getElementById("emailError"),
        phone: document.getElementById("phoneError"),
        password: document.getElementById("passwordError"),
        confirmPassword: document.getElementById("confirmPasswordError"),
        address: document.getElementById("addressError"),
        role: document.getElementById("roleError")
    };

    let selectedRole = "";

    function setMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = "form-message show " + type;
    }

    function clearMessage() {
        formMessage.textContent = "";
        formMessage.className = "form-message";
    }

    function setFieldState(input, errorEl, isValid, errorText) {
        input.classList.remove("valid", "invalid");
        if (isValid) {
            input.classList.add("valid");
            errorEl.textContent = "";
            return;
        }
        input.classList.add("invalid");
        errorEl.textContent = errorText;
    }

    function validateFullName(showState) {
        const value = fields.fullName.value.trim();
        const isValid = value.length >= 2;
        if (showState) setFieldState(fields.fullName, errors.fullName, isValid, "Full name is required.");
        return isValid;
    }

    function validateEmail(showState) {
        const value = fields.email.value.trim();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (showState) setFieldState(fields.email, errors.email, isValid, "Enter a valid email address.");
        return isValid;
    }

    function validatePhone(showState) {
        const value = fields.phone.value.trim();
        const isValid = /^\d{10}$/.test(value);
        if (showState) setFieldState(fields.phone, errors.phone, isValid, "Phone number must be 10 digits.");
        return isValid;
    }

    function validatePassword(showState) {
        const value = fields.password.value;
        const isValid = value.length >= 6;
        if (showState) setFieldState(fields.password, errors.password, isValid, "Password must be at least 6 characters.");
        return isValid;
    }

    function validateConfirmPassword(showState) {
        const isValid = fields.confirmPassword.value === fields.password.value && fields.confirmPassword.value.length > 0;
        if (showState) {
            setFieldState(fields.confirmPassword, errors.confirmPassword, isValid, "Passwords must match.");
        }
        return isValid;
    }

    function validateAddress(showState) {
        const value = fields.address.value.trim();
        const isValid = value.length >= 8;
        if (showState) setFieldState(fields.address, errors.address, isValid, "Address is required.");
        return isValid;
    }

    function validateRole(showState) {
        const isValid = selectedRole === "farmer" || selectedRole === "consumer";
        roleWrapper.classList.remove("valid", "invalid");
        if (showState) {
            if (isValid) {
                roleWrapper.classList.add("valid");
                errors.role.textContent = "";
            } else {
                roleWrapper.classList.add("invalid");
                errors.role.textContent = "Please select a role.";
            }
        }
        return isValid;
    }

    function validateForm(showState) {
        const valid = [
            validateFullName(showState),
            validateEmail(showState),
            validatePhone(showState),
            validatePassword(showState),
            validateConfirmPassword(showState),
            validateAddress(showState),
            validateRole(showState)
        ].every(Boolean);

        submitBtn.disabled = !valid;
        return valid;
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span>Creating Account...';
            return;
        }
        submitBtn.innerHTML = "Create Account";
        validateForm(false);
    }

    function buildUserObject() {
        return {
            name: fields.fullName.value.trim(),
            email: fields.email.value.trim().toLowerCase(),
            phone: fields.phone.value.trim(),
            role: selectedRole,
            address: fields.address.value.trim()
        };
    }

    function persistUser(user) {
        const storageKey = "farmsyncUsers";
        const raw = localStorage.getItem(storageKey);
        const users = raw ? JSON.parse(raw) : [];
        users.push(user);
        localStorage.setItem(storageKey, JSON.stringify(users));
    }

    roleCards.forEach(function (card) {
        function selectRoleCard() {
            roleCards.forEach((item) => item.classList.remove("selected"));
            card.classList.add("selected");
            selectedRole = card.getAttribute("data-role") || "";
            clearMessage();
            validateRole(true);
            validateForm(false);
        }

        card.addEventListener("click", selectRoleCard);
        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectRoleCard();
            }
        });
    });

    Object.keys(fields).forEach(function (key) {
        fields[key].addEventListener("input", function () {
            clearMessage();

            if (key === "password" || key === "confirmPassword") {
                validatePassword(true);
                validateConfirmPassword(true);
            } else {
                if (key === "fullName") validateFullName(true);
                if (key === "email") validateEmail(true);
                if (key === "phone") validatePhone(true);
                if (key === "address") validateAddress(true);
            }

            validateForm(false);
        });

        fields[key].addEventListener("blur", function () {
            if (key === "fullName") validateFullName(true);
            if (key === "email") validateEmail(true);
            if (key === "phone") validatePhone(true);
            if (key === "password") validatePassword(true);
            if (key === "confirmPassword") validateConfirmPassword(true);
            if (key === "address") validateAddress(true);
            validateForm(false);
        });
    });

    document.querySelectorAll(".toggle-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            const target = document.getElementById(button.getAttribute("data-target"));
            if (!target) return;

            const nextType = target.type === "password" ? "text" : "password";
            target.type = nextType;
            button.textContent = nextType === "password" ? "Show" : "Hide";
        });
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        clearMessage();

        if (!validateForm(true)) {
            setMessage("Please fix the highlighted fields.", "error");
            return;
        }

        const user = buildUserObject();
        setLoading(true);

        window.setTimeout(function () {
            try {
                persistUser(user);
                setMessage("Registration successful. Redirecting to login...", "success");

                window.setTimeout(function () {
                    window.location.href = "login.html";
                }, 350);
            } catch (error) {
                setMessage("Unable to save your registration right now.", "error");
                setLoading(false);
            }
        }, 1500);
    });

    validateForm(false);
})();
