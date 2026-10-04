
// =========================================================
// MissionLMS ADMIN - ASSIGNMENTS
// =========================================================
 
 
// =========================================================
// GET MISSIONS FOR DROPDOWNS
// =========================================================
 
async function getMissionsForAssignments() {
 
    try {
 
        const response =
            await adminFetch(`${API_URL}/missions`);
 
        const data =
            await response.json();
 
        if (!data.missions) {
            return [];
        }
 
        return data.missions;
 
    }
    catch (error) {
 
        console.error(error);
 
        return [];
    }
 
}
 
 
// =========================================================
// BUILD MISSION OPTIONS
// =========================================================
 
function buildAssignmentMissionOptions(
    missions,
    selectedMissionId = null
) {
 
    let options = `
        <option value="">
            Sélectionner une mission
        </option>
    `;
 
    missions.forEach(mission => {
 
        const selected =
            Number(selectedMissionId) === Number(mission.id)
                ? "selected"
                : "";
 
        options += `
            <option
                value="${mission.id}"
                ${selected}
            >
                Mission ${mission.mission_number} — ${mission.title}
            </option>
        `;
 
    });
 
    return options;
}
 
 
// =========================================================
// LOAD ASSIGNMENTS
// =========================================================
 
async function loadAssignments() {
 
    const assignmentsList =
        document.getElementById("assignments-list");
 
    assignmentsList.innerHTML =
        '<div class="loading-message">Chargement des travaux…</div>';
 
    try {
 
        // -------------------------------------------------
        // Load assignments
        // -------------------------------------------------
 
        const response =
            await adminFetch(`${API_URL}/assignments`);
 
        const data =
            await response.json();
 
        // -------------------------------------------------
        // Load missions so we can display mission names
        // -------------------------------------------------
 
        const missions =
            await getMissionsForAssignments();
 
        assignmentsList.innerHTML = "";
 
        if (
            !data.assignments ||
            data.assignments.length === 0
        ) {
 
            assignmentsList.innerHTML =
                '<div class="empty-message">Aucun travail trouvé.</div>';
 
            document.getElementById(
                "assignment-count"
            ).textContent = "0";
 
            return;
        }
 
        data.assignments.forEach(assignment => {
 
            // -------------------------------------------------
            // Find this assignment's mission
            // -------------------------------------------------
 
            const mission =
                missions.find(
                    mission =>
                        Number(mission.id) ===
                        Number(assignment.mission_id)
                );
 
            const missionName =
                mission
                    ? `Mission ${mission.mission_number} — ${mission.title}`
                    : "Mission inconnue";
 
            // -------------------------------------------------
            // Create assignment card
            // -------------------------------------------------
 
            const card =
                document.createElement("div");
 
            card.className = "content-card";
 
            card.innerHTML = `
                <h3>
                    ${assignment.title}
                </h3>
 
                <p>
                    Mission : ${missionName}
                </p>
 
                <p>
                    ${assignment.instructions}
                </p>
 
                <p>
                    <strong>Réponse attendue :</strong>
                    ${assignment.expected_answer || "Aucune réponse configurée."}
                </p>
 
                <p>
                    <strong>Concepts requis :</strong><br>
                    ${(assignment.required_concepts || "Aucun concept configuré.").replace(/\n/g, "<br>")}
                </p>
 
                <div class="card-actions">
 
                    <button
                        class="edit-button assignment-edit-button"
                    >
                        Modifier
                    </button>
 
                    <button
                        class="delete-button assignment-delete-button"
                    >
                        Supprimer
                    </button>
 
                </div>
            `;
 
            assignmentsList.appendChild(card);
 
            // =================================================
            // EDIT ASSIGNMENT
            // =================================================
 
            const editButton =
                card.querySelector(
                    ".assignment-edit-button"
                );
 
            editButton.addEventListener(
                "click",
                () => {
 
                    openEditAssignment(
                        assignment
                    );
 
                }
            );
 
            // =================================================
            // DELETE ASSIGNMENT
            // =================================================
 
            const deleteButton =
                card.querySelector(
                    ".assignment-delete-button"
                );
 
            deleteButton.addEventListener(
                "click",
                async () => {
 
                    const confirmed =
                        confirm(
                            `Delete "${assignment.title}"?\n\n` +
                            "Cette action est irréversible."
                        );
 
                    if (!confirmed) {
                        return;
                    }
 
                    try {
 
                        const response =
                            await adminFetch(
                                `${API_URL}/assignments/${assignment.id}`,
                                {
                                    method: "DELETE"
                                }
                            );
 
                        const data =
                            await response.json();
 
                        if (data.error) {
 
                            alert(data.error);
 
                            return;
                        }
 
                        await loadAssignments();
 
                        alert(
                            "Travail supprimé avec succès."
                        );
 
                    }
                    catch (error) {
 
                        console.error(error);
 
                        alert(
                            "Impossible de supprimer le travail."
                        );
 
                    }
 
                }
            );
 
        });
 
        document.getElementById(
            "assignment-count"
        ).textContent =
            data.assignments.length;
 
    }
    catch (error) {
 
        console.error(error);
 
        assignmentsList.innerHTML = `
            <div class="error-message">
                Impossible de charger les travaux du service MissionLMS.
            </div>
        `;
 
    }
 
}
 
 
// =========================================================
// ADD ASSIGNMENT
// =========================================================
 
document
    .getElementById("add-assignment-button")
    .addEventListener(
        "click",
        async () => {
 
            const missions =
                await getMissionsForAssignments();
 
            if (missions.length === 0) {
 
                alert(
                    "Aucune mission n’est disponible. " +
                    "Créez d’abord une mission."
                );
 
                return;
            }
 
            modalTitle.textContent =
                "Ajouter un travail";
 
            modalBody.innerHTML = `
 
                <form id="assignment-form">
 
                    <div class="form-group">
 
                        <label for="assignment-title">
                            Titre du travail
                        </label>
 
                        <input
                            id="assignment-title"
                            type="text"
                            required
                        >
 
                    </div>
 
 
                    <div class="form-group">
 
                        <label for="assignment-mission">
                            Mission
                        </label>
 
                        <select
                            id="assignment-mission"
                            required
                        >
                            ${buildAssignmentMissionOptions(
                                missions
                            )}
                        </select>
 
                    </div>
 
 
                    <div class="form-group">
 
                        <label for="assignment-instructions">
                            Instructions
                        </label>
 
                        <textarea
                            id="assignment-instructions"
                            required
                        ></textarea>
 
                    </div>
 
 
                    <div class="form-group">
 
                        <label for="assignment-expected-answer">
                            Réponse attendue
                        </label>
 
                        <textarea
                            id="assignment-expected-answer"
                            placeholder="Entrez la réponse attendue pour cette question."
                            required
                        ></textarea>
 
                    </div>
 
 
                    <div class="form-group">
 
                        <label for="assignment-required-concepts">
                            Concepts requis
                        </label>
 
                        <textarea
                            id="assignment-required-concepts"
                            placeholder="Un concept par ligne. Exemple : labeled data&#10;input&#10;output&#10;prediction&#10;new data"
                            required
                        ></textarea>
 
                    </div>
 
 
                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Enregistrer le travail
                    </button>
 
                </form>
            `;
 
            modal.classList.add("show");
 
            const assignmentForm =
                document.getElementById(
                    "assignment-form"
                );
 
            assignmentForm.addEventListener(
                "submit",
                async event => {
 
                    event.preventDefault();
 
                    const assignmentData = {
 
                        title:
                            document
                                .getElementById(
                                    "assignment-title"
                                )
                                .value,
 
                        mission_id:
                            Number(
                                document
                                    .getElementById(
                                        "assignment-mission"
                                    )
                                    .value
                            ),
 
                        instructions:
                            document
                                .getElementById(
                                    "assignment-instructions"
                                )
                                .value,
 
                        expected_answer:
                            document
                                .getElementById(
                                    "assignment-expected-answer"
                                )
                                .value,
 
                        required_concepts:
                            document
                                .getElementById(
                                    "assignment-required-concepts"
                                )
                                .value
 
                    };
 
                    try {
 
                        const response =
                            await adminFetch(
                                `${API_URL}/assignments`,
                                {
                                    method: "POST",
 
                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },
 
                                    body:
                                        JSON.stringify(
                                            assignmentData
                                        )
                                }
                            );
 
                        const data =
                            await response.json();
 
                        if (data.error) {
 
                            alert(data.error);
 
                            return;
                        }
 
                        closeModal();
 
                        await loadAssignments();
 
                        alert(
                            "Travail créé avec succès."
                        );
 
                    }
                    catch (error) {
 
                        console.error(error);
 
                        alert(
                            "Impossible de créer le travail."
                        );
 
                    }
 
                }
            );
 
        }
    );
 
 
// =========================================================
// EDIT ASSIGNMENT
// =========================================================
 
async function openEditAssignment(assignment) {
 
    const missions =
        await getMissionsForAssignments();
 
    if (missions.length === 0) {
 
        alert(
            "Aucune mission n’est disponible."
        );
 
        return;
    }
 
    modalTitle.textContent =
        "Modifier le travail";
 
    modalBody.innerHTML = `
 
        <form id="edit-assignment-form">
 
            <div class="form-group">
 
                <label for="edit-assignment-title">
                    Titre du travail
                </label>
 
                <input
                    id="edit-assignment-title"
                    type="text"
                    required
                >
 
            </div>
 
 
            <div class="form-group">
 
                <label for="edit-assignment-mission">
                    Mission
                </label>
 
                <select
                    id="edit-assignment-mission"
                    required
                >
                    ${buildAssignmentMissionOptions(
                        missions,
                        assignment.mission_id
                    )}
                </select>
 
            </div>
 
 
            <div class="form-group">
 
                <label for="edit-assignment-instructions">
                    Instructions
                </label>
 
                <textarea
                    id="edit-assignment-instructions"
                    required
                ></textarea>
 
            </div>
 
 
            <div class="form-group">
 
                <label for="edit-assignment-expected-answer">
                    Réponse attendue
                </label>
 
                <textarea
                    id="edit-assignment-expected-answer"
                    placeholder="Entrez la réponse attendue pour cette question."
                    required
                ></textarea>
 
            </div>
 
 
            <div class="form-group">
 
                <label for="edit-assignment-required-concepts">
                    Concepts requis
                </label>
 
                <textarea
                    id="edit-assignment-required-concepts"
                    placeholder="Un concept par ligne."
                    required
                ></textarea>
 
            </div>
 
 
            <button
                type="submit"
                class="primary-button"
            >
                Enregistrer les modifications
            </button>
 
        </form>
    `;
 
    // =====================================================
    // FILL CURRENT VALUES
    // =====================================================
 
    document.getElementById(
        "edit-assignment-title"
    ).value = assignment.title;
 
    document.getElementById(
        "edit-assignment-instructions"
    ).value = assignment.instructions;
 
    document.getElementById(
        "edit-assignment-expected-answer"
    ).value =
        assignment.expected_answer || "";
 
    document.getElementById(
        "edit-assignment-required-concepts"
    ).value =
        assignment.required_concepts || "";
 
    modal.classList.add("show");
 
    const editAssignmentForm =
        document.getElementById(
            "edit-assignment-form"
        );
 
    editAssignmentForm.addEventListener(
        "submit",
        async event => {
 
            event.preventDefault();
 
            const assignmentData = {
 
                title:
                    document
                        .getElementById(
                            "edit-assignment-title"
                        )
                        .value,
 
                mission_id:
                    Number(
                        document
                            .getElementById(
                                "edit-assignment-mission"
                            )
                            .value
                    ),
 
                instructions:
                    document
                        .getElementById(
                            "edit-assignment-instructions"
                        )
                        .value,
 
                expected_answer:
                    document
                        .getElementById(
                            "edit-assignment-expected-answer"
                        )
                        .value,
 
                required_concepts:
                    document
                        .getElementById(
                            "edit-assignment-required-concepts"
                        )
                        .value
 
            };
 
            try {
 
                const response =
                    await adminFetch(
                        `${API_URL}/assignments/${assignment.id}`,
                        {
                            method: "PUT",
 
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
 
                            body:
                                JSON.stringify(
                                    assignmentData
                                )
                        }
                    );
 
                const data =
                    await response.json();
 
                if (data.error) {
 
                    alert(data.error);
 
                    return;
                }
 
                closeModal();
 
                await loadAssignments();
 
                alert(
                    "Travail modifié avec succès."
                );
 
            }
            catch (error) {
 
                console.error(error);
 
                alert(
                    "Impossible de modifier le travail."
                );
 
            }
 
        }
    );
 
}
