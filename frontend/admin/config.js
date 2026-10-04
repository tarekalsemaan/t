// =========================================================
// MissionLMS ADMIN - CONFIGURATION
// =========================================================

const API_URL =
    window.location.port === "5500"
        ? "http://127.0.0.1:8000"
        : window.location.origin;


// =========================================================
// ADMIN TOKEN
// =========================================================

function adminToken() {
    return localStorage.getItem("missionlms_token");
}


// =========================================================
// ADMIN USER
// =========================================================

function adminUser() {
    try {
        return JSON.parse(
            localStorage.getItem("missionlms_user")
        );
    } catch {
        return null;
    }
}


// =========================================================
// ADMIN DÉCONNEXION
// =========================================================

function adminDéconnexion() {
    localStorage.removeItem("missionlms_token");
    localStorage.removeItem("missionlms_user");

    window.location.href = "login.html";
}


// =========================================================
// REQUIRE ADMIN
// =========================================================

if (
    !adminToken() ||
    adminUser()?.role !== "ADMIN"
) {
    adminDéconnexion();
}


// =========================================================
// ADMIN API REQUEST
// =========================================================

async function adminFetch(
    url,
    options = {}
) {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken() || ""}`,
        ...(options.headers || {})
    };

    const response = await fetch(
        url,
        {
            ...options,
            headers
        }
    );

    if (
        response.status === 401 ||
        response.status === 403
    ) {
        adminDéconnexion();
    }

    return response;
}