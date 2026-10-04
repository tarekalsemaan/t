// =========================================================
// MissionLMS ADMIN - LESSONS
// =========================================================


// =========================================================
// GET MISSIONS FOR DROPDOWNS
// =========================================================

async function getMissionsForLessons() {

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

function buildLessonMissionOptions(
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
// LOAD LESSONS
// =========================================================

async function loadLessons() {

    const lessonsList =
        document.getElementById("lessons-list");


    lessonsList.innerHTML =
        '<div class="loading-message">Chargement des leçons…</div>';


    try {

        // -------------------------------------------------
        // Load lessons
        // -------------------------------------------------

        const response =
            await adminFetch(`${API_URL}/lessons`);

        const data =
            await response.json();


        // -------------------------------------------------
        // Load missions so we can display mission names
        // -------------------------------------------------

        const missions =
            await getMissionsForLessons();


        lessonsList.innerHTML = "";


        if (!data.lessons || data.lessons.length === 0) {

            lessonsList.innerHTML =
                '<div class="empty-message">Aucune leçon trouvée.</div>';

            document.getElementById(
                "lesson-count"
            ).textContent = "0";

            return;
        }


        data.lessons.forEach(lesson => {

            // -------------------------------------------------
            // Find this lesson's mission
            // -------------------------------------------------

            const mission =
                missions.find(
                    mission =>
                        Number(mission.id) ===
                        Number(lesson.mission_id)
                );


            const missionName =
                mission
                    ? `Mission ${mission.mission_number} — ${mission.title}`
                    : "Mission inconnue";


            // -------------------------------------------------
            // Create lesson card
            // -------------------------------------------------

            const card =
                document.createElement("div");

            card.className = "content-card";


            card.innerHTML = `
                <h3>
                    Leçon ${lesson.lesson_number} —
                    ${lesson.title}
                </h3>

                <p>
                    Mission : ${missionName}
                </p>

                <p>
                    ${lesson.content}
                </p>

                <div class="card-actions">

                    <button
                        class="edit-button lesson-edit-button"
                    >Modifier</button>

                    <button
                        class="delete-button lesson-delete-button"
                    >Supprimer</button>

                </div>
            `;


            lessonsList.appendChild(card);


            // =================================================
            // EDIT LESSON
            // =================================================

            const editButton =
                card.querySelector(
                    ".lesson-edit-button"
                );


            editButton.addEventListener(
                "click",
                () => {

                    openEditLesson(lesson);

                }
            );


            // =================================================
            // DELETE LESSON
            // =================================================

            const deleteButton =
                card.querySelector(
                    ".lesson-delete-button"
                );


            deleteButton.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        confirm(
                            `Delete "${lesson.title}"?\n\n` +
                            "Cette action est irréversible."
                        );


                    if (!confirmed) {

                        return;

                    }


                    try {

                        const response =
                            await adminFetch(
                                `${API_URL}/lessons/${lesson.id}`,
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


                        await loadLessons();


                        alert(
                            "Leçon supprimée avec succès."
                        );

                    }
                    catch (error) {

                        console.error(error);

                        alert(
                            "Impossible de supprimer la leçon."
                        );

                    }

                }
            );

        });


        document.getElementById(
            "lesson-count"
        ).textContent = data.lessons.length;

    }
    catch (error) {

        console.error(error);

        lessonsList.innerHTML = `
            <div class="error-message">
                Impossible de charger les leçons du service MissionLMS.
            </div>
        `;

    }

}


// =========================================================
// ADD LESSON
// =========================================================

document
    .getElementById("add-lesson-button")
    .addEventListener(
        "click",
        async () => {

            const missions =
                await getMissionsForLessons();


            if (missions.length === 0) {

                alert(
                    "Aucune mission n’est disponible. " +
                    "Créez d’abord une mission."
                );

                return;
            }


            modalTitle.textContent =
                "Ajouter une leçon";


            modalBody.innerHTML = `

                <form id="lesson-form">

                    <div class="form-group">

                        <label for="lesson-title">
                            Titre de la leçon
                        </label>

                        <input
                            id="lesson-title"
                            type="text"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label for="lesson-number">
                            Numéro de la leçon
                        </label>

                        <input
                            id="lesson-number"
                            type="number"
                            min="1"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label for="lesson-mission">
                            Mission
                        </label>

                        <select
                            id="lesson-mission"
                            required
                        >
                            ${buildLessonMissionOptions(
                                missions
                            )}
                        </select>

                    </div>


                    <div class="form-group">

                        <label for="lesson-content">
                            Contenu de la leçon
                        </label>

                        <textarea
                            id="lesson-content"
                            required
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Enregistrer la leçon
                    </button>

                </form>
            `;


            modal.classList.add("show");


            const lessonForm =
                document.getElementById(
                    "lesson-form"
                );


            lessonForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const lessonData = {

                        title:
                            document
                                .getElementById(
                                    "lesson-title"
                                )
                                .value,

                        lesson_number:
                            Number(
                                document
                                    .getElementById(
                                        "lesson-number"
                                    )
                                    .value
                            ),

                        mission_id:
                            Number(
                                document
                                    .getElementById(
                                        "lesson-mission"
                                    )
                                    .value
                            ),

                        content:
                            document
                                .getElementById(
                                    "lesson-content"
                                )
                                .value

                    };


                    try {

                        const response =
                            await adminFetch(
                                `${API_URL}/lessons`,
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify(
                                            lessonData
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

                        await loadLessons();


                        alert(
                            "Leçon créée avec succès."
                        );

                    }
                    catch (error) {

                        console.error(error);

                        alert(
                            "Impossible de créer la leçon."
                        );

                    }

                }
            );

        }
    );


// =========================================================
// EDIT LESSON
// =========================================================

async function openEditLesson(lesson) {

    const missions =
        await getMissionsForLessons();


    if (missions.length === 0) {

        alert(
            "Aucune mission n’est disponible."
        );

        return;
    }


    modalTitle.textContent =
        "Modifier la leçon";


    modalBody.innerHTML = `

        <form id="edit-lesson-form">

            <div class="form-group">

                <label for="edit-lesson-title">
                    Titre de la leçon
                </label>

                <input
                    id="edit-lesson-title"
                    type="text"
                    required
                >

            </div>


            <div class="form-group">

                <label for="edit-lesson-number">
                    Numéro de la leçon
                </label>

                <input
                    id="edit-lesson-number"
                    type="number"
                    min="1"
                    required
                >

            </div>


            <div class="form-group">

                <label for="edit-lesson-mission">
                    Mission
                </label>

                <select
                    id="edit-lesson-mission"
                    required
                >
                    ${buildLessonMissionOptions(
                        missions,
                        lesson.mission_id
                    )}
                </select>

            </div>


            <div class="form-group">

                <label for="edit-lesson-content">
                    Contenu de la leçon
                </label>

                <textarea
                    id="edit-lesson-content"
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
        "edit-lesson-title"
    ).value = lesson.title;


    document.getElementById(
        "edit-lesson-number"
    ).value = lesson.lesson_number;


    document.getElementById(
        "edit-lesson-content"
    ).value = lesson.content;


    modal.classList.add("show");


    const editLessonForm =
        document.getElementById(
            "edit-lesson-form"
        );


    editLessonForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const lessonData = {

                title:
                    document
                        .getElementById(
                            "edit-lesson-title"
                        )
                        .value,

                lesson_number:
                    Number(
                        document
                            .getElementById(
                                "edit-lesson-number"
                            )
                            .value
                    ),

                mission_id:
                    Number(
                        document
                            .getElementById(
                                "edit-lesson-mission"
                            )
                            .value
                    ),

                content:
                    document
                        .getElementById(
                            "edit-lesson-content"
                        )
                        .value

            };


            try {

                const response =
                    await adminFetch(
                        `${API_URL}/lessons/${lesson.id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    lessonData
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

                await loadLessons();


                alert(
                    "Leçon modifiée avec succès."
                );

            }
            catch (error) {

                console.error(error);

                alert(
                    "Impossible de modifier la leçon."
                );

            }

        }
    );

}