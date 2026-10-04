// =========================================================
// MissionLMS ADMIN - MODAL
// =========================================================

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const closeModalButton = document.getElementById("close-modal");


// =========================================================
// CLOSE MODAL
// =========================================================

function closeModal() {

    modal.classList.remove("show");

    modalBody.innerHTML = "";
}


// =========================================================
// CLOSE BUTTON
// =========================================================

closeModalButton.addEventListener(
    "click",
    closeModal
);


// =========================================================
// CLICK OUTSIDE MODAL
// =========================================================

modal.addEventListener("click", event => {

    if (event.target === modal) {

        closeModal();
    }

});