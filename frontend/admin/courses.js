// =========================================================
// MissionLMS ADMIN - COURSES
// =========================================================


// =========================================================
// LOAD COURSES
// =========================================================

async function loadCourses() {

    const coursesList =
        document.getElementById("courses-list");


    coursesList.innerHTML =
        '<div class="loading-message">Chargement des cours…</div>';


    try {

        const response =
            await adminFetch(`${API_URL}/courses`);


        const data =
            await response.json();


        coursesList.innerHTML = "";


        if (!data.courses || data.courses.length === 0) {

            coursesList.innerHTML =
                '<div class="empty-message">Aucun cours trouvé.</div>';


            document.getElementById(
                "course-count"
            ).textContent = "0";


            return;
        }


        data.courses.forEach(course => {

            const card =
                document.createElement("div");


            card.className =
                "content-card";


            // =================================================
            // COURSE CARD
            // =================================================

            card.innerHTML = `
                <h3>
                    ${course.title}
                </h3>

                <div class="card-actions">

                    <button
                        class="edit-button course-edit-button"
                    >Modifier</button>

                    <button
                        class="delete-button course-delete-button"
                    >Supprimer</button>

                </div>
            `;


            coursesList.appendChild(card);


            // =================================================
            // EDIT COURSE BUTTON
            // =================================================

            const editButton =
                card.querySelector(
                    ".course-edit-button"
                );


            editButton.addEventListener(
                "click",
                () => {

                    openEditCourse(course);

                }
            );


            // =================================================
            // DELETE COURSE BUTTON
            // =================================================

            const deleteButton =
                card.querySelector(
                    ".course-delete-button"
                );


            deleteButton.addEventListener(
                "click",
                () => {

                    deleteCourse(course);

                }
            );

        });


        document.getElementById(
            "course-count"
        ).textContent =
            data.courses.length;

    }
    catch (error) {

        console.error(error);


        coursesList.innerHTML = `
            <div class="error-message">
                Impossible de charger les cours du service MissionLMS.
            </div>
        `;

    }

}


// =========================================================
// ADD COURSE
// =========================================================

document
    .getElementById("add-course-button")
    .addEventListener(
        "click",
        () => {

            modalTitle.textContent =
                "Ajouter un cours";


            modalBody.innerHTML = `

                <form id="course-form">

                    <div class="form-group">

                        <label for="course-title">
                            Titre du cours
                        </label>

                        <input
                            id="course-title"
                            type="text"
                            required
                        >

                    </div>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Enregistrer le cours
                    </button>

                </form>
            `;


            modal.classList.add("show");


            const courseForm =
                document.getElementById(
                    "course-form"
                );


            courseForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const courseData = {

                        title:
                            document
                                .getElementById(
                                    "course-title"
                                )
                                .value

                    };


                    try {

                        const response =
                            await adminFetch(
                                `${API_URL}/courses`,
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify(
                                            courseData
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


                        await loadCourses();


                        alert(
                            "Cours créé avec succès."
                        );

                    }
                    catch (error) {

                        console.error(error);


                        alert(
                            "Impossible de créer le cours."
                        );

                    }

                }
            );

        }
    );


// =========================================================
// EDIT COURSE
// =========================================================

function openEditCourse(course) {

    modalTitle.textContent =
        "Modifier le cours";


    modalBody.innerHTML = `

        <form id="edit-course-form">

            <div class="form-group">

                <label for="edit-course-title">
                    Titre du cours
                </label>

                <input
                    id="edit-course-title"
                    type="text"
                    required
                >

            </div>


            <button
                type="submit"
                class="primary-button"
            >
                Enregistrer les modifications
            </button>

        </form>
    `;


    document.getElementById(
        "edit-course-title"
    ).value =
        course.title;


    modal.classList.add("show");


    const editCourseForm =
        document.getElementById(
            "edit-course-form"
        );


    editCourseForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const courseData = {

                title:
                    document
                        .getElementById(
                            "edit-course-title"
                        )
                        .value

            };


            try {

                const response =
                    await adminFetch(
                        `${API_URL}/courses/${course.id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    courseData
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


                await loadCourses();


                alert(
                    "Cours modifié avec succès."
                );

            }
            catch (error) {

                console.error(error);


                alert(
                    "Impossible de modifier le cours."
                );

            }

        }
    );

}


// =========================================================
// DELETE COURSE
// =========================================================

async function deleteCourse(course) {

    const confirmed =
        confirm(
            `Delete "${course.title}"?\n\n` +
            "Cette action est irréversible."
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await adminFetch(
                `${API_URL}/courses/${course.id}`,
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


        await loadCourses();


        alert(
            "Cours supprimé avec succès."
        );

    }
    catch (error) {

        console.error(error);


        alert(
            "Impossible de supprimer le cours."
        );

    }

}