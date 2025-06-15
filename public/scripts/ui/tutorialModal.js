const tutorialCloseBtn = document.getElementById("tutorial-close-btn");
const tutorialOpenBtn = document.getElementById("tutorial-open-btn");
const tutorialDialog = document.getElementById("tutorial-dialog");
const steps = Array.from(tutorialDialog.querySelectorAll(".modal-step"));

let currentStepIndex = 0;

function showStep(index) {
  steps.forEach((step, i) => {
    step.hidden = i !== index;
  });
}

// Open the tutorial dialog
tutorialOpenBtn.addEventListener("click", () => {
  currentStepIndex = 0;
  showStep(currentStepIndex);
  tutorialDialog.showModal();
});

// Navigate the tutorial dialog
tutorialDialog.addEventListener("click", event => {
  if (event.target.matches(".next-step-btn")) {
    if (currentStepIndex < steps.length - 1) {
      currentStepIndex++;
      showStep(currentStepIndex);
    }
  }

  if (event.target.matches(".prev-step-btn")) {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      showStep(currentStepIndex);
    }
  }
});

// Close the tutorial dialog
tutorialCloseBtn.addEventListener("click", () => {
  tutorialDialog.close();
});

// Close modal when clicking outside of its visible content
// (works without this in chrome - this is required for the behaviour to work in firefox)
tutorialDialog.addEventListener("click", e => {
  const rect = tutorialDialog.getBoundingClientRect();
  const clickedInside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;
  if (!clickedInside) {
    tutorialDialog.close();
  }
});
