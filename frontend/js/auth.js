// =========================================================
// TOKEN
// =========================================================

function getToken() {
    return localStorage.getItem("missionlms_token");
}


// =========================================================
// CURRENT USER
// =========================================================

function getUser() {
    try {
        return JSON.parse(
            localStorage.getItem("missionlms_user")
        );
    } catch {
        return null;
    }
}


// =========================================================
// STUDENT ID
// =========================================================

function getStudentId() {
    return getUser()?.student_id ?? null;
}


// =========================================================
// AUTHENTICATED HEADERS
// =========================================================

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken() || ""}`
    };
}


// =========================================================
// DÉCONNEXION
// =========================================================

function Déconnexion() {
    localStorage.removeItem("missionlms_token");
    localStorage.removeItem("missionlms_user");

    window.location.replace("login.html");
}


// =========================================================
// REQUIRE CONNEXION
// =========================================================

function requireConnexion(expectedRole = null) {
    const token = getToken();
    const user = getUser();

    if (
        !token ||
        !user ||
        (expectedRole && user.role !== expectedRole)
    ) {
        localStorage.removeItem("missionlms_token");
        localStorage.removeItem("missionlms_user");

        window.location.replace("login.html");

        return false;
    }

    return true;
}


// =========================================================
// AUTHENTICATED FETCH
// =========================================================

async function authenticatedFetch(
    url,
    options = {}
) {
    const headers = {
        ...authHeaders(),
        ...(options.headers || {})
    };

    const response = await fetch(
        url,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {
        Déconnexion();

        throw new Error(
            "Votre session a expiré."
        );
    }

    return response;
}


// =========================================================
// PROTECT AGAINST BROWSER BACK/FORWARD CACHE
// =========================================================

window.addEventListener("pageshow", function () {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        window.location.replace("login.html");
    }
});