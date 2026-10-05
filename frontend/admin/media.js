// =========================================================
// MissionLMS ADMIN - MEDIA GALLERY
// =========================================================


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeMediaHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// MEDIA TYPE INFORMATION
// =========================================================

function getMediaTypeInfo(mediaType) {

    switch (mediaType) {

        case "powerpoint":
            return {
                icon: "📊",
                label: "PowerPoint"
            };

        case "video":
            return {
                icon: "🎥",
                label: "Vidéo"
            };

        case "pdf":
            return {
                icon: "📄",
                label: "PDF"
            };

        case "image":
            return {
                icon: "🖼️",
                label: "Image"
            };

        default:
            return {
                icon: "📎",
                label: "Document"
            };
    }
}


// =========================================================
// GET LESSONS
// =========================================================

async function getLessonsForMedia() {

    try {

        const response =
            await adminFetch(`${API_URL}/lessons`);

        if (!response.ok) {
            return [];
        }

        const data =
            await response.json();

        return data.lessons || [];

    }
    catch (error) {

        console.error(error);

        return [];
    }
}


// =========================================================
// GET MISSIONS
// =========================================================

async function getMissionsForMedia() {

    try {

        const response =
            await adminFetch(`${API_URL}/missions`);

        if (!response.ok) {
            return [];
        }

        const data =
            await response.json();

        return data.missions || [];

    }
    catch (error) {

        console.error(error);

        return [];
    }
}


// =========================================================
// BUILD LESSON OPTIONS
// =========================================================

async function buildMediaLessonOptions() {

    const lessons =
        await getLessonsForMedia();

    const missions =
        await getMissionsForMedia();


    if (lessons.length === 0) {

        return `
            <option value="">
                Aucune leçon disponible
            </option>
        `;
    }


    let options = `
        <option value="">
            Sélectionner une leçon
        </option>
    `;


    lessons.forEach(lesson => {

        const mission =
            missions.find(
                item =>
                    Number(item.id) ===
                    Number(lesson.mission_id)
            );


        const missionLabel =
            mission
                ? `Mission ${mission.mission_number}`
                : "Mission";


        options += `
            <option value="${lesson.id}">
                ${escapeMediaHtml(missionLabel)}
                —
                Leçon ${lesson.lesson_number}
                —
                ${escapeMediaHtml(lesson.title)}
            </option>
        `;
    });


    return options;
}


// =========================================================
// LOAD MEDIA GALLERY
// =========================================================

async function loadMedia() {

    const mediaList =
        document.getElementById("media-list");


    if (!mediaList) {
        return;
    }


    mediaList.innerHTML = `
        <div class="loading-message">
            Chargement de la galerie…
        </div>
    `;


    try {

        const response =
            await adminFetch(`${API_URL}/media`);


        if (!response.ok) {

            throw new Error(
                "Impossible de charger la galerie."
            );
        }


        const data =
            await response.json();


        const mediaItems =
            data.media || [];


        mediaList.innerHTML = "";


        if (mediaItems.length === 0) {

            mediaList.innerHTML = `
                <div class="empty-message">
                    Aucune ressource dans la galerie.
                </div>
            `;

            return;
        }


        mediaItems.forEach(media => {

            const typeInfo =
                getMediaTypeInfo(
                    media.media_type
                );


            const card =
                document.createElement("div");


            card.className =
                "content-card media-admin-card";


            const title =
                escapeMediaHtml(
                    media.title ||
                    media.filename ||
                    "Ressource"
                );


            const filename =
                escapeMediaHtml(
                    media.filename || ""
                );


            const mediaUrl =
                escapeMediaHtml(
                    media.url || ""
                );


            card.innerHTML = `

                <div class="media-admin-header">

                    <div class="media-admin-icon">
                        ${typeInfo.icon}
                    </div>

                    <div class="media-admin-info">

                        <span class="media-admin-type">
                            ${escapeMediaHtml(
                                typeInfo.label
                            )}
                        </span>

                        <h3>
                            ${title}
                        </h3>

                        <p>
                            ${filename}
                        </p>

                    </div>

                </div>


                <div class="card-actions">

                    <a
                        class="edit-button media-open-button"
                        href="${mediaUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Ouvrir
                    </a>


                    <button
                        class="edit-button media-attach-button"
                        type="button"
                    >
                        Attacher à une leçon
                    </button>


                    <button
                        class="delete-button media-delete-button"
                        type="button"
                    >
                        Supprimer
                    </button>

                </div>
            `;


            mediaList.appendChild(card);


            // =================================================
            // ATTACH
            // =================================================

            const attachButton =
                card.querySelector(
                    ".media-attach-button"
                );


            attachButton.addEventListener(
                "click",
                () => {

                    openAttachMediaModal(media);
                }
            );


            // =================================================
            // DELETE
            // =================================================

            const deleteButton =
                card.querySelector(
                    ".media-delete-button"
                );


            deleteButton.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        confirm(
                            `Supprimer "${media.title || media.filename}" ?\n\n` +
                            "Cette ressource sera supprimée de la galerie."
                        );


                    if (!confirmed) {
                        return;
                    }


                    try {

                        const response =
                            await adminFetch(
                                `${API_URL}/media/${media.id}`,
                                {
                                    method: "DELETE"
                                }
                            );


                        if (!response.ok) {

                            let message =
                                "Impossible de supprimer la ressource.";


                            try {

                                const data =
                                    await response.json();


                                message =
                                    data.detail ||
                                    data.error ||
                                    message;

                            }
                            catch (_) {
                                // Keep default message
                            }


                            alert(message);

                            return;
                        }


                        await loadMedia();


                        alert(
                            "Ressource supprimée avec succès."
                        );

                    }
                    catch (error) {

                        console.error(error);


                        alert(
                            "Impossible de supprimer la ressource."
                        );
                    }
                }
            );
        });

    }
    catch (error) {

        console.error(error);


        mediaList.innerHTML = `
            <div class="error-message">
                Impossible de charger la galerie.
            </div>
        `;
    }
}


// =========================================================
// UPLOAD MEDIA
// =========================================================

const addMediaButton =
    document.getElementById(
        "add-media-button"
    );


if (addMediaButton) {

    addMediaButton.addEventListener(
        "click",
        () => {

            modalTitle.textContent =
                "Ajouter une ressource";


            modalBody.innerHTML = `

                <form id="media-upload-form">

                    <div class="form-group">

                        <label for="media-file">
                            Choisir le fichier
                        </label>

                        <input
                            id="media-file"
                            name="file"
                            type="file"
                            accept=".pptx,.mp4,.webm,.pdf,.png,.jpg,.jpeg,.gif,.webp,.docx,.txt"
                            required
                        >

                    </div>


                    <div class="media-upload-help">

                        <strong>
                            📦 Formats acceptés
                        </strong>

                        <p>
                            📊 PowerPoint (.pptx)
                        </p>

                        <p>
                            🎥 Vidéo (.mp4, .webm)
                        </p>

                        <p>
                            📄 PDF (.pdf)
                        </p>

                        <p>
                            🖼️ Images (.png, .jpg, .jpeg, .gif, .webp)
                        </p>

                        <p>
                            📎 Documents (.docx, .txt)
                        </p>

                    </div>


                    <button
                        id="media-upload-submit"
                        type="submit"
                        class="primary-button"
                    >
                        Téléverser la ressource
                    </button>

                </form>
            `;


            modal.classList.add("show");


            const uploadForm =
                document.getElementById(
                    "media-upload-form"
                );


            uploadForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const fileInput =
                        document.getElementById(
                            "media-file"
                        );


                    if (
                        !fileInput.files ||
                        fileInput.files.length === 0
                    ) {

                        alert(
                            "Veuillez sélectionner un fichier."
                        );

                        return;
                    }


                    const file =
                        fileInput.files[0];


                    const formData =
                        new FormData();


                    formData.append(
                        "file",
                        file
                    );


                    const submitButton =
                        document.getElementById(
                            "media-upload-submit"
                        );


                    submitButton.disabled = true;

                    submitButton.textContent =
                        "Téléversement en cours…";


                    try {

                        const response =
                            await adminFetch(
                                `${API_URL}/media/upload`,
                                {
                                    method: "POST",
                                    body: formData
                                }
                            );


                        if (!response.ok) {

                            let message =
                                "Impossible de téléverser la ressource.";


                            try {

                                const data =
                                    await response.json();


                                message =
                                    data.detail ||
                                    data.error ||
                                    message;

                            }
                            catch (_) {
                                // Keep default message
                            }


                            alert(message);

                            return;
                        }


                        closeModal();


                        await loadMedia();


                        alert(
                            "Ressource ajoutée à la galerie avec succès."
                        );

                    }
                    catch (error) {

                        console.error(error);


                        alert(
                            "Impossible de téléverser la ressource."
                        );

                    }
                    finally {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "Téléverser la ressource";
                    }
                }
            );
        }
    );
}


// =========================================================
// ATTACH MEDIA TO LESSON
// =========================================================

async function openAttachMediaModal(media) {

    const lessonOptions =
        await buildMediaLessonOptions();


    modalTitle.textContent =
        "Attacher à une leçon";


    modalBody.innerHTML = `

        <form id="media-attach-form">

            <div class="media-attach-summary">

                <div class="media-admin-icon">
                    ${
                        getMediaTypeInfo(
                            media.media_type
                        ).icon
                    }
                </div>

                <div>

                    <strong>
                        ${escapeMediaHtml(
                            media.title ||
                            media.filename
                        )}
                    </strong>

                    <p>
                        Choisissez la leçon dans laquelle
                        cette ressource doit apparaître.
                    </p>

                </div>

            </div>


            <div class="form-group">

                <label for="media-lesson">
                    Leçon
                </label>

                <select
                    id="media-lesson"
                    required
                >
                    ${lessonOptions}
                </select>

            </div>


            <button
                id="media-attach-submit"
                type="submit"
                class="primary-button"
            >
                Attacher à la leçon
            </button>

        </form>
    `;


    modal.classList.add("show");


    const attachForm =
        document.getElementById(
            "media-attach-form"
        );


    attachForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const lessonId =
                Number(
                    document
                        .getElementById(
                            "media-lesson"
                        )
                        .value
                );


            if (!lessonId) {

                alert(
                    "Veuillez sélectionner une leçon."
                );

                return;
            }


            const submitButton =
                document.getElementById(
                    "media-attach-submit"
                );


            submitButton.disabled = true;

            submitButton.textContent =
                "Association en cours…";


            try {

                const response =
                    await adminFetch(
                        `${API_URL}/media/${media.id}/lessons/${lessonId}`,
                        {
                            method: "POST"
                        }
                    );


                if (!response.ok) {

                    let message =
                        "Impossible d’attacher la ressource.";


                    try {

                        const data =
                            await response.json();


                        message =
                            data.detail ||
                            data.error ||
                            message;

                    }
                    catch (_) {
                        // Keep default message
                    }


                    alert(message);

                    return;
                }


                const data =
                    await response.json();


                closeModal();


                if (
                    data.message ===
                    "Media is already attached to this lesson."
                ) {

                    alert(
                        "Cette ressource est déjà attachée à cette leçon."
                    );

                    return;
                }


                alert(
                    "Ressource attachée à la leçon avec succès."
                );

            }
            catch (error) {

                console.error(error);


                alert(
                    "Impossible d’attacher la ressource."
                );

            }
            finally {

                submitButton.disabled = false;

                submitButton.textContent =
                    "Attacher à la leçon";
            }
        }
    );
}
