const API_URL =
    window.location.port === "5500"
        ? "http://127.0.0.1:8000"
        : window.location.origin;

const loginForm =
    document.getElementById("login-form");

const loginError =
    document.getElementById("login-error");


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    try {

        const response = await fetch(
            `${API_URL}/auth/Connexion`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email:
                        document.getElementById("email")
                            .value.trim(),

                    password:
                        document.getElementById("password")
                            .value
                })
            }
        );


        if (!response.ok) {

            throw new Error(
                "Invalid email or password"
            );

        }


        const data =
            await response.json();


        // Keep these identifiers unchanged.
        // They are used by auth.js and app.js.

        localStorage.setItem(
            "missionlms_token",
            data.access_token
        );


        localStorage.setItem(
            "missionlms_user",
            JSON.stringify({
                user_id: data.user_id,
                role: data.role,
                student_id: data.student_id
            })
        );


        // Redirect according to the user's role.

        window.location.href =
            data.role === "ADMIN"
                ? "admin.html"
                : "index.html";

    }


    catch (error) {

        loginError.textContent =
            "Courriel ou mot de passe invalide.";

    }

});
