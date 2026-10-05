const API_URL =
    window.location.port === "5500"
        ? "http://127.0.0.1:8000"
        : window.location.origin;

if (!requireConnexion("STUDENT")) {
    throw new Error("Authentication required");
}

const COURSE_ID = 1;


// =========================================================
// LOAD STUDENT
// =========================================================

async function loadStudent() {
    const studentId = getStudentId();

    if (!studentId) {
        throw new Error(
            "Aucun étudiant n’est associé à ce compte"
        );
    }

    const response = await authenticatedFetch(
        `${API_URL}/students/${studentId}`,
        {
            headers: authHeaders()
        }
    );

    if (!response.ok) {
        throw new Error("Impossible de charger l’étudiant");
    }

    const student = await response.json();

    document.getElementById(
        "student-name"
    ).textContent = student.name;

    document.getElementById(
        "student-email"
    ).textContent = student.email;
}


// =========================================================
// LOAD COURSE PROGRESS
// =========================================================

async function loadProgress() {
    const response = await authenticatedFetch(
        `${API_URL}/students/${getStudentId()}/courses/${COURSE_ID}/progress`,
        {
            headers: authHeaders()
        }
    );

    if (!response.ok) {
        throw new Error("Impossible de charger la progression");
    }

    const data = await response.json();

    const container =
        document.getElementById("missions");

    container.innerHTML = "";

    if (
        !data.missions ||
        data.missions.length === 0
    ) {
        container.innerHTML =
            "<p>Aucune mission disponible.</p>";

        return;
    }

    data.missions.forEach(mission => {
        const card =
            document.createElement("div");

        card.className = "mission";

        if (mission.unlocked) {
            card.classList.add("unlocked");
        } else {
            card.classList.add("locked");
        }

        let status = "";

        if (mission.completed) {
            status = `
                <p class="status completed">
                    ✓ Terminée
                </p>
            `;
        } else if (mission.unlocked) {
            status = `
                <p class="status unlocked">
                    🔓 Déverrouillée
                </p>
            `;
        } else {
            status = `
                <p class="status locked">
                    🔒 Verrouillée
                </p>
            `;
        }

        let button = "";

        if (mission.unlocked) {
            button = `
                <button
                    class="mission-button open-button"
                    onclick="openMission(
                        ${mission.mission_id},
                        '${escapeHtml(mission.title)}',
                        ${mission.unlocked},
                        ${mission.completed}
                    )"
                >
                    ${
                        mission.completed
                            ? "Revoir la mission"
                            : "Commencer la mission"
                    }
                </button>
            `;
        }

        card.innerHTML = `
            <h3>
                Mission ${mission.mission_number}:
                ${escapeHtml(mission.title)}
            </h3>

            <p>
                Note :
                ${mission.score}
                / 100
            </p>

            <p>
                Note de passage :
                ${mission.passing_score}
            </p>

            ${status}
            ${button}
        `;

        container.appendChild(card);
    });
}


// =========================================================
// OPEN MISSION
// =========================================================

async function openMission(
    missionId,
    missionTitle,
    unlocked,
    completed
) {
    if (!unlocked) {
        return;
    }

    document.getElementById(
        "missions-screen"
    ).style.display = "none";

    document.getElementById(
        "mission-screen"
    ).style.display = "block";

    document.getElementById(
        "mission-title"
    ).textContent = missionTitle;

    const status =
        document.getElementById(
            "mission-status"
        );

    if (completed) {
        status.innerHTML = `
            <p class="status completed">
                ✓ Mission terminée
            </p>
        `;
    } else {
        status.innerHTML = `
            <p class="status unlocked">
                🔓 Mission déverrouillée
            </p>
        `;
    }

    await loadLessons(missionId);
    await loadAssignments(missionId);
}


// =========================================================
// MEDIA RENDERING
// =========================================================

function renderLessonMedia(mediaItems) {
    if (
        !Array.isArray(mediaItems) ||
        mediaItems.length === 0
    ) {
        return "";
    }

    const items = mediaItems.map(media => {
        const title =
            escapeHtml(
                media.title ||
                "Ressource de mission"
            );

        const url =
            escapeHtml(media.url || "");

        const mimeType =
            escapeHtml(media.mime_type || "");

        if (media.media_type === "video") {
            return `
                <div class="mission-resource-card">
                    <div class="mission-resource-icon">
                        🎥
                    </div>

                    <div class="mission-resource-body">
                        <span class="mission-resource-type">
                            VIDÉO DE MISSION
                        </span>

                        <h4>${title}</h4>

                        <p>
                            Regardez cette ressource avant de poursuivre
                            votre mission.
                        </p>

                        <video
                            class="mission-resource-video"
                            controls
                            preload="metadata"
                        >
                            <source
                                src="${url}"
                                type="${mimeType}"
                            >
                            Votre navigateur ne peut pas lire cette vidéo.
                        </video>
                    </div>
                </div>
            `;
        }

        if (media.media_type === "image") {
            return `
                <div class="mission-resource-card">
                    <div class="mission-resource-icon">
                        🖼️
                    </div>

                    <div class="mission-resource-body">
                        <span class="mission-resource-type">
                            IMAGE DE MISSION
                        </span>

                        <h4>${title}</h4>

                        <p>
                            Consultez cette ressource pour avancer
                            dans votre mission.
                        </p>

                        <a
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <img
                                class="mission-resource-image"
                                src="${url}"
                                alt="${title}"
                            >
                        </a>
                    </div>
                </div>
            `;
        }

        if (media.media_type === "powerpoint") {
            return `
                <div class="mission-resource-card">
                    <div class="mission-resource-icon">
                        📊
                    </div>

                    <div class="mission-resource-body">
                        <span class="mission-resource-type">
                            SUPPORT DE MISSION
                        </span>

                        <h4>${title}</h4>

                        <p>
                            Consultez la présentation de la mission
                            avant de poursuivre le défi.
                        </p>

                        <a
                            class="mission-resource-button"
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ▶ Ouvrir le PowerPoint
                        </a>
                    </div>
                </div>
            `;
        }

        if (media.media_type === "pdf") {
            return `
                <div class="mission-resource-card">
                    <div class="mission-resource-icon">
                        📄
                    </div>

                    <div class="mission-resource-body">
                        <span class="mission-resource-type">
                            DOCUMENT DE MISSION
                        </span>

                        <h4>${title}</h4>

                        <p>
                            Consultez ce document pour poursuivre
                            votre mission.
                        </p>

                        <a
                            class="mission-resource-button"
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ▶ Ouvrir le PDF
                        </a>
                    </div>
                </div>
            `;
        }

        return `
            <div class="mission-resource-card">
                <div class="mission-resource-icon">
                    📎
                </div>

                <div class="mission-resource-body">
                    <span class="mission-resource-type">
                        RESSOURCE DE MISSION
                    </span>

                    <h4>${title}</h4>

                    <p>
                        Une ressource supplémentaire est disponible
                        pour cette mission.
                    </p>

                    <a
                        class="mission-resource-button"
                        href="${url}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ▶ Ouvrir la ressource
                    </a>
                </div>
            </div>
        `;
    }).join("");

    return `
        <div class="mission-resources">
            <div class="mission-resources-header">
                <span>🎒</span>

                <div>
                    <span class="mission-resources-kicker">
                        ÉQUIPEMENT
                    </span>

                    <h3>Ressources de la mission</h3>
                </div>
            </div>

            <div class="mission-resources-list">
                ${items}
            </div>
        </div>
    `;
}

// =========================================================
// LOAD STUDENT MISSION LESSONS
// =========================================================

async function loadLessons(missionId) {
    const container =
        document.getElementById("lessons");

    container.innerHTML = `
        <p class="loading">
            Chargement des leçons…
        </p>
    `;

    try {
        const response = await authenticatedFetch(
            `${API_URL}/students/${getStudentId()}/missions/${missionId}/lessons`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = `
                <div class="error">
                    ${escapeHtml(
                        data.detail ||
                        data.error ||
                        "Impossible de charger les leçons."
                    )}
                </div>
            `;

            return;
        }

        if (data.error) {
            container.innerHTML = `
                <div class="error">
                    ${escapeHtml(data.error)}
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        if (
            !data.lessons ||
            data.lessons.length === 0
        ) {
            container.innerHTML = `
                <p class="no-data">
                    Aucune leçon n’a encore été créée
                    pour cette mission.
                </p>
            `;

            return;
        }

        data.lessons.forEach(lesson => {
            const lessonCard =
                document.createElement("div");

            lessonCard.className = "lesson";

            lessonCard.innerHTML = `
                <h3>
                    Leçon ${lesson.lesson_number} :
                    ${escapeHtml(lesson.title)}
                </h3>

                <div class="lesson-content markdown-content">
                    ${renderMarkdown(lesson.content)}
                </div>

                ${renderLessonMedia(lesson.media)}
            `;

            container.appendChild(
                lessonCard
            );
        });

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="error">
                Impossible de se connecter au service MissionLMS.
            </div>
        `;
    }
}


// =========================================================
// LOAD ASSIGNMENTS
// =========================================================

async function loadAssignments(missionId) {
    const container =
        document.getElementById(
            "assignments"
        );

    container.innerHTML = `
        <p class="loading">
            Chargement du travail…
        </p>
    `;

    try {
        const response =
            await authenticatedFetch(
                `${API_URL}/assignments/mission/${missionId}`,
                {
                    headers: authHeaders()
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            container.innerHTML = `
                <div class="error">
                    ${escapeHtml(
                        data.detail ||
                        data.error ||
                        "Impossible de charger les travaux."
                    )}
                </div>
            `;

            return;
        }

        if (data.error) {
            container.innerHTML = `
                <div class="error">
                    ${escapeHtml(data.error)}
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        if (
            !data.assignments ||
            data.assignments.length === 0
        ) {
            container.innerHTML = `
                <p class="no-data">
                    Aucun travail n’a encore été créé
                    pour cette mission.
                </p>
            `;

            return;
        }

        for (const assignment of data.assignments) {
            const assignmentCard =
                document.createElement("div");

            assignmentCard.className =
                "assignment";

            assignmentCard.innerHTML = `
                <h3>
                    ${escapeHtml(
                        assignment.title
                    )}
                </h3>

                <div class="assignment-instructions">
                    ${escapeHtml(
                        cleanContent(
                            assignment.instructions
                        )
                    )}
                </div>

                <label
                    class="answer-label"
                    for="answer-${assignment.id}"
                >
                    Votre réponse
                </label>

                <textarea
                    id="answer-${assignment.id}"
                    class="answer-box"
                    placeholder="Écrivez votre réponse ici…"
                ></textarea>

                <br>

                <button
                    id="submit-button-${assignment.id}"
                    class="submit-button"
                    onclick="submitAssignment(
                        ${assignment.id},
                        ${assignment.mission_id}
                    )"
                >
                    Soumettre le travail
                </button>

                <div
                    id="submission-result-${assignment.id}"
                ></div>
            `;

            container.appendChild(
                assignmentCard
            );

            // Restore the student's most recent attempt.
            await loadLatestSubmission(
                assignment.id
            );
        }

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="error">
                Impossible de se connecter au service MissionLMS.
            </div>
        `;
    }
}


// =========================================================
// LOAD LATEST SUBMISSION
// =========================================================

async function loadLatestSubmission(
    assignmentId
) {
    const studentId =
        getStudentId();

    const answerBox =
        document.getElementById(
            `answer-${assignmentId}`
        );

    const resultBox =
        document.getElementById(
            `submission-result-${assignmentId}`
        );

    const submitButton =
        document.getElementById(
            `submit-button-${assignmentId}`
        );

    if (
        !answerBox ||
        !resultBox ||
        !submitButton
    ) {
        return;
    }

    try {
        const response =
            await authenticatedFetch(
                `${API_URL}/submissions/student/${studentId}/assignment/${assignmentId}/latest`,
                {
                    headers: authHeaders()
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                "Impossible de charger la soumission précédente."
            );
        }

        if (!data.submission) {
            return;
        }

        const submission =
            data.submission;

        answerBox.value =
            submission.content || "";

        if (submission.score === null) {
            resultBox.innerHTML = `
                <div class="submission-result warning">
                    <strong>
                        Une soumission précédente a été trouvée
                    </strong>

                    <p>
                        Cette soumission n’a pas été
                        évaluée.
                    </p>
                </div>
            `;

            return;
        }

        const passed =
            submission.score >= 80;

        if (passed) {
            resultBox.innerHTML = `
                <div class="submission-result success">
                    <strong>
                        ✓ Travail terminé
                    </strong>

                    <div class="score">
                        Note :
                        ${submission.score}
                        / 100
                    </div>

                    <p>
                        ${escapeHtml(
                            submission.feedback || ""
                        )}
                    </p>

                    <p>
                        ✓ Soumission enregistrée
                    </p>
                </div>
            `;
        } else {
            resultBox.innerHTML = `
                <div class="submission-result warning">
                    <strong>
                        Tentative précédente
                    </strong>

                    <div class="score">
                        Note :
                        ${submission.score}
                        / 100
                    </div>

                    <p>
                        ${escapeHtml(
                            submission.feedback || ""
                        )}
                    </p>
                </div>
            `;
        }

        if (passed) {
            answerBox.disabled = true;
            submitButton.disabled = true;
            submitButton.textContent = "Soumis";
        } else {
            answerBox.disabled = false;
            submitButton.disabled = false;
            submitButton.textContent = "Réessayer";
        }

    } catch (error) {
        console.error(error);

        resultBox.innerHTML = `
            <div class="error">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}


// =========================================================
// SUBMIT ASSIGNMENT
// =========================================================

async function submitAssignment(
    assignmentId,
    missionId
) {
    const answerBox =
        document.getElementById(
            `answer-${assignmentId}`
        );

    const resultBox =
        document.getElementById(
            `submission-result-${assignmentId}`
        );

    const submitButton =
        document.getElementById(
            `submit-button-${assignmentId}`
        );

    const content =
        answerBox.value.trim();

    if (!content) {
        resultBox.innerHTML = `
            <div class="error">
                Veuillez entrer votre réponse avant de soumettre.
            </div>
        `;

        return;
    }

    submitButton.disabled = true;

    submitButton.textContent =
        "Soumission en cours…";

    resultBox.innerHTML = `
        <p class="loading">
            Enregistrement de votre soumission…
        </p>
    `;

    try {
        const response =
            await authenticatedFetch(
                `${API_URL}/submissions`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        student_id:
                            getStudentId(),

                        assignment_id:
                            assignmentId,

                        content:
                            content
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                "Échec de la soumission."
            );
        }

        if (data.error) {
            throw new Error(
                data.error
            );
        }

        const submissionId =
            data.id;

        resultBox.innerHTML = `
            <p class="loading">
                Évaluation de votre réponse…
            </p>
        `;

        const evaluationResponse =
            await authenticatedFetch(
                `${API_URL}/submissions/${submissionId}/evaluate`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

        const evaluationData =
            await evaluationResponse.json();

        if (!evaluationResponse.ok) {
            throw new Error(
                evaluationData.detail ||
                evaluationData.error ||
                "Échec de l’évaluation."
            );
        }

        if (evaluationData.error) {
            throw new Error(
                evaluationData.error
            );
        }

        if (evaluationData.passed) {
            resultBox.innerHTML = `
                <div class="submission-result success">
                    <strong>
                        ✓ Travail terminé
                    </strong>

                    <div class="score">
                        Note :
                        ${evaluationData.score}
                        / 100
                    </div>

                    <p>
                        ${escapeHtml(
                            evaluationData.feedback
                        )}
                    </p>

                    <p>
                        ✓ Mission terminée
                    </p>
                </div>
            `;
        } else {
            resultBox.innerHTML = `
                <div class="submission-result warning">
                    <strong>
                        Travail évalué
                    </strong>

                    <div class="score">
                        Note :
                        ${evaluationData.score}
                        / 100
                    </div>

                    <p>
                        ${escapeHtml(
                            evaluationData.feedback
                        )}
                    </p>

                    <p>
                        Vous devez obtenir
                        ${evaluationData.passing_score}
                        pour réussir cette mission.
                    </p>
                </div>
            `;
        }

        if (evaluationData.passed) {
            answerBox.disabled = true;
            submitButton.disabled = true;
            submitButton.textContent = "Soumis";
        } else {
            answerBox.disabled = false;
            submitButton.disabled = false;
            submitButton.textContent = "Réessayer";
        }

        await loadProgress();

    } catch (error) {
        console.error(error);

        resultBox.innerHTML = `
            <div class="error">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;

        submitButton.disabled = false;

        submitButton.textContent =
            "Soumettre le travail";
    }
}


// =========================================================
// BACK TO MISSIONS
// =========================================================

function showMissions() {
    document.getElementById(
        "mission-screen"
    ).style.display = "none";

    document.getElementById(
        "missions-screen"
    ).style.display = "block";

    loadProgress();
}


// =========================================================
// CONTENT CLEANING
// =========================================================

function cleanContent(value) {
    return String(value || "")
        .replace(/&amp;#x20;/gi, " ")
        .replace(/&#x20;/gi, " ")
        .replace(/&amp;nbsp;/gi, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// START APPLICATION
// =========================================================

async function startApp() {
    try {
        await loadStudent();
        await loadProgress();

    } catch (error) {
        console.error(error);

        document.getElementById(
            "missions"
        ).innerHTML = `
            <div class="error">
                Impossible de se connecter au service
                MissionLMS.
            </div>
        `;
    }
}


startApp();
