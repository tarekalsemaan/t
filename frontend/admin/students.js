async function loadStudents() {
    const list = document.getElementById("students-list");
    if (!list) return;
    list.innerHTML = '<div class="loading-message">Chargement des étudiants…</div>';
    try {
        const response = await adminFetch(`${API_URL}/students`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Impossible de charger les étudiants");
        list.innerHTML = "";
        if (!data.students?.length) {
            list.innerHTML = '<div class="empty-message">Aucun étudiant trouvé.</div>';
            return;
        }
        data.students.forEach(student => {
            const card = document.createElement("div");
            card.className = "content-card";
            card.innerHTML = `<h3>${escapeAdmin(student.name)}</h3><p>${escapeAdmin(student.email)}</p>`;
            list.appendChild(card);
        });
    } catch (error) {
        list.innerHTML = `<div class="empty-message">${escapeAdmin(error.message)}</div>`;
    }
}

async function openAddStudent() {
    const coursesResponse = await adminFetch(`${API_URL}/courses`);
    const coursesData = await coursesResponse.json();
    const courses = coursesData.courses || [];
    modalTitle.textContent = "Ajouter un étudiant";
    modalBody.innerHTML = `
        <form id="student-form">
            <label>Nom</label><input id="student-name-input" required>
            <label>Courriel</label><input id="student-email-input" type="email" required>
            <label>Mot de passe temporaire</label><input id="student-password-input" type="password" minlength="8" required>
            <label>Cours</label>
            <select id="student-course-input">
                <option value="">Aucun cours pour le moment</option>
                ${courses.map(c => `<option value="${c.id}">${escapeAdmin(c.title)}</option>`).join("")}
            </select>
            <p id="student-form-error"></p>
            <button class="primary-button" type="submit">Créer l’étudiant</button>
        </form>`;
    modal.classList.add("show");
    document.getElementById("student-form").addEventListener("submit", async event => {
        event.preventDefault();
        const courseValue = document.getElementById("student-course-input").value;
        const response = await adminFetch(`${API_URL}/students`, {
            method: "POST",
            body: JSON.stringify({
                name: document.getElementById("student-name-input").value.trim(),
                email: document.getElementById("student-email-input").value.trim(),
                password: document.getElementById("student-password-input").value,
                course_id: courseValue ? Number(courseValue) : null
            })
        });
        const data = await response.json();
        if (!response.ok) {
            document.getElementById("student-form-error").textContent = data.detail || "Impossible de créer l’étudiant";
            return;
        }
        closeModal();
        await loadStudents();
    });
}

function escapeAdmin(value) {
    return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

document.getElementById("add-student-button")?.addEventListener("click", openAddStudent);
