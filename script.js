const markdownInput = document.getElementById("markdownInput");
const previewSlide = document.getElementById("previewSlide");
const presentationSlide = document.getElementById("presentationSlide");
const slideCount = document.getElementById("slideCount");
const presentationCount = document.getElementById("presentationCount");
const saveMessage = document.getElementById("saveMessage");
const editorPage = document.getElementById("editorPage");
const presentationPage = document.getElementById("presentationPage");

const defaultMarkdown = markdownInput.value;
let slides = [];
let currentSlide = 0;
let isPresenting = false;

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function inlineMarkdown(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");
    safe = safe.replace(/`(.+?)`/g, "<code>$1</code>");
    return safe;
}

function markdownToHtml(markdown) {
    const lines = markdown.split("\n");
    let html = "";
    let inList = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("# ")) {
            if (inList) {
                html += "</ul>";
                inList = false;
            }
            html += "<h1>" + inlineMarkdown(trimmed.slice(2)) + "</h1>";
        } else if (trimmed.startsWith("## ")) {
            if (inList) {
                html += "</ul>";
                inList = false;
            }
            html += "<h2>" + inlineMarkdown(trimmed.slice(3)) + "</h2>";
        } else if (trimmed.startsWith("### ")) {
            if (inList) {
                html += "</ul>";
                inList = false;
            }
            html += "<h3>" + inlineMarkdown(trimmed.slice(4)) + "</h3>";
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            if (!inList) {
                html += "<ul>";
                inList = true;
            }
            html += "<li>" + inlineMarkdown(trimmed.slice(2)) + "</li>";
        } else {
            if (inList) {
                html += "</ul>";
                inList = false;
            }
            if (trimmed !== "") {
                html += "<p>" + inlineMarkdown(trimmed) + "</p>";
            }
        }
    }

    if (inList) {
        html += "</ul>";
    }

    return html || "<p>Empty slide</p>";
}

function updateSlides() {
    slides = markdownInput.value
        .split(/^\s*---\s*$/m)
        .map(function (slide) { return slide.trim(); })
        .filter(function (slide) { return slide.length > 0; });

    if (slides.length === 0) {
        slides = ["# Empty Slide\n\nWrite some Markdown on the left."];
    }

    if (currentSlide >= slides.length) {
        currentSlide = slides.length - 1;
    }

    showCurrentSlide();
}

function showCurrentSlide() {
    const html = markdownToHtml(slides[currentSlide]);
    previewSlide.innerHTML = html;
    presentationSlide.innerHTML = html;

    const countText = (currentSlide + 1) + " / " + slides.length;
    slideCount.textContent = countText;
    presentationCount.textContent = countText;

    document.getElementById("prevButton").disabled = currentSlide === 0;
    document.getElementById("presentationPrevButton").disabled = currentSlide === 0;
    document.getElementById("nextButton").disabled = currentSlide === slides.length - 1;
    document.getElementById("presentationNextButton").disabled = currentSlide === slides.length - 1;
}

function goPrevious() {
    if (currentSlide > 0) {
        currentSlide--;
        showCurrentSlide();
    }
}

function goNext() {
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        showCurrentSlide();
    }
}

function saveSlides() {
    try {
        localStorage.setItem("markdownSlidesText", markdownInput.value);
        saveMessage.textContent = "Slides saved in this browser.";
    } catch (error) {
        saveMessage.textContent = "Browser storage is unavailable. Open the project through a local web server or GitHub Pages.";
    }
}

function enterPresentation() {
    isPresenting = true;
    editorPage.classList.add("hidden");
    presentationPage.classList.remove("hidden");
    document.body.classList.add("presenting");

    if (presentationPage.requestFullscreen) {
        presentationPage.requestFullscreen().catch(function () {});
    }
}

function exitPresentation() {
    isPresenting = false;
    editorPage.classList.remove("hidden");
    presentationPage.classList.add("hidden");
    document.body.classList.remove("presenting");

    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
    }
}

markdownInput.addEventListener("input", function () {
    currentSlide = 0;
    updateSlides();
    saveMessage.textContent = "Unsaved changes";
});

document.getElementById("saveButton").addEventListener("click", saveSlides);

document.getElementById("resetButton").addEventListener("click", function () {
    markdownInput.value = defaultMarkdown;
    currentSlide = 0;
    updateSlides();
    saveMessage.textContent = "Example restored. Click Save Slides to keep it.";
});

document.getElementById("prevButton").addEventListener("click", goPrevious);
document.getElementById("nextButton").addEventListener("click", goNext);
document.getElementById("presentationPrevButton").addEventListener("click", goPrevious);
document.getElementById("presentationNextButton").addEventListener("click", goNext);
document.getElementById("presentButton").addEventListener("click", enterPresentation);
document.getElementById("exitPresentButton").addEventListener("click", exitPresentation);

document.getElementById("previewFullButton").addEventListener("click", function () {
    if (previewSlide.requestFullscreen) {
        previewSlide.requestFullscreen().catch(function () {});
    }
});

document.addEventListener("keydown", function (event) {
    const target = event.target;
    const typing = target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT");

    if (typing && event.key !== "F11" && !(event.ctrlKey && event.key.toLowerCase() === "s")) {
        return;
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
    } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
    } else if (event.key.toLowerCase() === "s" && event.ctrlKey) {
        event.preventDefault();
        saveSlides();
    } else if (event.key === "F11") {
        event.preventDefault();
        if (isPresenting) {
            exitPresentation();
        } else {
            enterPresentation();
        }
    } else if (event.key === "Escape" && isPresenting && !document.fullscreenElement) {
        exitPresentation();
    }
});

document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement && isPresenting) {
        isPresenting = false;
        editorPage.classList.remove("hidden");
        presentationPage.classList.add("hidden");
        document.body.classList.remove("presenting");
    }
});

try {
    const savedMarkdown = localStorage.getItem("markdownSlidesText");
    if (savedMarkdown !== null) {
        markdownInput.value = savedMarkdown;
    }
} catch (error) {
    saveMessage.textContent = "Browser storage is unavailable in this file preview.";
}

updateSlides();
