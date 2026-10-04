// =========================================================
// MissionLMS ADMIN - MISSIONS
// =========================================================


// =========================================================
// GET COURSES FOR DROPDOWNS
// =========================================================

async function getCourssForMissions() {

    try {

        const response =
            await adminFetch(`${API_URL}/courses`);

        const data =
            await response.json();


        if (!data.courses) {
            return [];
        }


        return data.courses;

    }
    catch (error) {

        console.error(error);

        return [];
    }

}


// =========================================================
// BUILD COURSE OPTIONS
// =========================================================

function buildMissionCoursOptions(
    courses,
    selectedCoursId = null
) {

    let options = `
        <option value="">
            Sélectionner un cours
        </option>
    `;


    courses.forEach(course => {

        const selected =
            Number(selectedCoursId) === Number(course.id)
                ? "selected"
                : "";


        options += `
            <option
                value="${course.id}"
                ${selected}
            >
                ${course.title}
            </option>
        `;

    });


    return options;
}


// =========================================================
// LOAD MISSIONS
// =========================================================

async function loadMissions() {

    const missionsList =
        document.getElementById("missions-list");


    missionsList.innerHTML =
        '<div class="loading-message">Chargement des missions…</div>';


    try {

        // -------------------------------------------------
        // Load missions
        // -------------------------------------------------

        const response =
            await adminFetch(`${API_URL}/missions`);

        const data =
            await response.json();


        // -------------------------------------------------
        // Load courses so we can display course names
        // -------------------------------------------------

        const courses =
            await getCourssForMissions();


        missionsList.innerHTML = "";


        if (!data.missions || data.missions.length === 0) {

            missionsList.innerHTML =
                '<div class="empty-message">Aucune mission trouvée.</div>';

            document.getElementById(
                "mission-count"
            ).textContent = "0";

            return;
        }


        data.missions.forEach(mission => {

            // -------------------------------------------------
            // Find the course that belongs to this mission
            // -------------------------------------------------

            const course =
                courses.find(
                    course =>
                        Number(course.id) ===
                        Number(mission.course_id)
                );


            const courseName =
                course
                    ? course.title
                    : "Cours inconnu";


            // -------------------------------------------------
            // Create mission card
            // -------------------------------------------------

            const card =
                document.createElement("div");

            card.className = "content-card";


            card.innerHTML = `
                <h3>
                    Mission ${mission.mission_number} —
                    ${mission.title}
                </h3>

                <p>
                    Cours : ${courseName}
                    <br>
                    Note de passage :
                    ${mission.passing_score}/100
                </p>

                <div class="card-actions">

                    <button
                        class="edit-button mission-edit-button"
                    >Modifier</button>

                    <button
                        class="delete-button mission-delete-button"
                    >Supprimer</button>

                </div>
            `;


            missionsList.appendChild(card);


            // =================================================
            // EDIT MISSION BUTTON
            // =================================================

            const editButton =
                card.querySelector(
                    ".mission-edit-button"
                );


            editButton.addEventListener(
                "click",
                () => {

                    openEditMission(mission);

                }
            );


            // =================================================
            // DELETE MISSION BUTTON
            // =================================================

            const deleteButton =
                card.querySelector(
                    ".mission-delete-button"
                );


            deleteButton.addEventListener(
                "click",
                () => {

                    deleteMission(mission);

                }
            );

        });


        document.getElementById(
            "mission-count"
        ).textContent = data.missions.length;

    }
    catch (error) {

        console.error(error);

        missionsList.innerHTML = `
            <div class="error-message">
                Impossible de charger les missions du service MissionLMS.
            </div>
        `;

    }

}


// =========================================================
// ADD MISSION
// =========================================================

document
    .getElementById("add-mission-button")
    .addEventListener(
        "click",
        async () => {

            const courses =
                await getCourssForMissions();


            if (courses.length === 0) {

                alert(
                    "Aucun cours n’est disponible. " +
                    "Créez d’abord un cours."
                );

                return;
            }


            modalTitle.textContent =
                "Ajouter une mission";


            modalBody.innerHTML = `

                <form id="mission-form">

                    <div class="form-group">

                        <label for="mission-title">
                            Titre de la mission
                        </label>

                        <input
                            id="mission-title"
                            type="text"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label for="mission-number">
                            Numéro de la mission
                        </label>

                        <input
                            id="mission-number"
                            type="number"
                            min="1"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label for="mission-score">
                            Note de passage
                        </label>

                        <input
                            id="mission-score"
                            type="number"
                            min="0"
                            max="100"
                            value="80"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label for="mission-course">
                            Cours
                        </label>

                        <select
                            id="mission-course"
                            required
                        >
                            ${buildMissionCoursOptions(
                                courses
                            )}
                        </select>

                    </div>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Enregistrer la mission
                    </button>

                </form>
            `;


            modal.classList.add("show");


            const missionForm =
                document.getElementById(
                    "mission-form"
                );


            missionForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const missionData = {

                        title:
                            document
                                .getElementById(
                                    "mission-title"
                                )
                                .value,

                        mission_number:
                            Number(
                                document
                                    .getElementById(
                                        "mission-number"
                                    )
                                    .value
                            ),

                        passing_score:
                            Number(
                                document
                                    .getElementById(
                                        "mission-score"
                                    )
                                    .value
                            ),

                        course_id:
                            Number(
                                document
                                    .getElementById(
                                        "mission-course"
                                    )
                                    .value
                            )

                    };


                    try {

                        const response =
                            await adminFetch(
                                `${API_URL}/missions`,
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify(
                                            missionData
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

                        await loadMissions();


                        alert(
                            "Mission créée avec succès."
                        );

                    }
                    catch (error) {

                        console.error(error);

                        alert(
                            "Impossible de créer la mission."
                        );

                    }

                }
            );

        }
    );


// =========================================================
// EDIT MISSION
// =========================================================

async function openEditMission(mission) {

    const courses =
        await getCourssForMissions();


    if (courses.length === 0) {

        alert(
            "Aucun cours n’est disponible."
        );

        return;
    }


    modalTitle.textContent =
        "Modifier la mission";


    modalBody.innerHTML = `

        <form id="edit-mission-form">

            <div class="form-group">

                <label for="edit-mission-title">
                    Titre de la mission
                </label>

                <input
                    id="edit-mission-title"
                    type="text"
                    required
                >

            </div>


            <div class="form-group">

                <label for="edit-mission-number">
                    Numéro de la mission
                </label>

                <input
                    id="edit-mission-number"
                    type="number"
                    min="1"
                    required
                >

            </div>


            <div class="form-group">

                <label for="edit-mission-score">
                    Note de passage
                </label>

                <input
                    id="edit-mission-score"
                    type="number"
                    min="0"
                    max="100"
                    required
                >

            </div>


            <div class="form-group">

                <label for="edit-mission-course">
                    Cours
                </label>

                <select
                    id="edit-mission-course"
                    required
                >
                    ${buildMissionCoursOptions(
                        courses,
                        mission.course_id
                    )}
                </select>

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
        "edit-mission-title"
    ).value = mission.title;


    document.getElementById(
        "edit-mission-number"
    ).value = mission.mission_number;


    document.getElementById(
        "edit-mission-score"
    ).value = mission.passing_score;


    modal.classList.add("show");


    const editMissionForm =
        document.getElementById(
            "edit-mission-form"
        );


    editMissionForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const missionData = {

                title:
                    document
                        .getElementById(
                            "edit-mission-title"
                        )
                        .value,

                mission_number:
                    Number(
                        document
                            .getElementById(
                                "edit-mission-number"
                            )
                            .value
                    ),

                passing_score:
                    Number(
                        document
                            .getElementById(
                                "edit-mission-score"
                            )
                            .value
                    ),

                course_id:
                    Number(
                        document
                            .getElementById(
                                "edit-mission-course"
                            )
                            .value
                    )

            };


            try {

                const response =
                    await adminFetch(
                        `${API_URL}/missions/${mission.id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    missionData
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

                await loadMissions();


                alert(
                    "Mission modifiée avec succès."
                );

            }
            catch (error) {

                console.error(error);

                alert(
                    "Impossible de modifier la mission."
                );

            }

        }
    );

}


// =========================================================
// DELETE MISSION
// =========================================================

async function deleteMission(mission) {

    const confirmed =
        confirm(
            `Supprimer la mission ${mission.mission_number} — ${mission.title} ?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await adminFetch(
                `${API_URL}/missions/${mission.id}`,
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


        await loadMissions();


        alert(
            "Mission supprimée avec succès."
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Impossible de supprimer la mission."
        );

    }

}