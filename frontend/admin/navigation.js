// =========================================================
// MissionLMS ADMIN - NAVIGATION
// =========================================================

const navButtons = document.querySelectorAll(".nav-button");
const sections = document.querySelectorAll(".admin-section");


navButtons.forEach(button => {

    button.addEventListener("click", () => {

        const sectionName = button.dataset.section;


        // Remove active state from navigation buttons
        navButtons.forEach(navButton => {

            navButton.classList.remove("active");

        });


        // Hide all sections
        sections.forEach(section => {

            section.classList.remove("active-section");

        });


        // Activate selected navigation button
        button.classList.add("active");


        // Find selected section
        const selectedSection =
            document.getElementById(
                `${sectionName}-section`
            );


        // Show selected section
        if (selectedSection) {

            selectedSection.classList.add(
                "active-section"
            );

        }

    });

});