// ==== Fetch Questions from Open Trivia API ====
async function fetchQuestions(difficulty, amount = 10) {
    try {
        const url = `https://opentdb.com/api.php?amount=${amount}&difficulty=${difficulty}&type=multiple`;
        const res = await fetch(url);
        const data = await res.json();

        return data.results.map(q => {
            const options = [...q.incorrect_answers, q.correct_answer];
            options.sort(() => Math.random() - 0.5); // shuffle

            return {
                question: q.question,
                options,
                correctIndex: options.indexOf(q.correct_answer),
                difficulty
            };
        });
    } catch (err) {
        console.error("Error fetching questions:", err);
        alert("Failed to fetch questions. Check your internet connection.");
        return [];
    }
}

// ==== App State ====
let currentQuestionIndex = 0;
let score = 0;
let selectedDifficulty = "easy";
let filteredQuestions = [];
let timeLeft = 0;
let timerId = null;

const DIFF_POINTS = { easy: 1, medium: 2, hard: 3 };
const DIFF_SECS = { easy: 25, medium: 20, hard: 15 };

// ==== Shuffle Helper ====
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ==== Show Question ====
function showQuestion() {
    clearInterval(timerId);

    const q = filteredQuestions[currentQuestionIndex];
    document.getElementById("question-text").innerHTML =
        `Q${currentQuestionIndex + 1}/${filteredQuestions.length}: ${q.question}`;

    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    let optionIndexes = q.options.map((_, i) => i);
    shuffleArray(optionIndexes);

    optionsContainer.dataset.mapping = JSON.stringify(optionIndexes);

    optionIndexes.forEach(shuffledIndex => {
        const btn = document.createElement("button");
        btn.textContent = q.options[shuffledIndex];
        btn.addEventListener("click", () => selectAnswer(shuffledIndex));
        optionsContainer.appendChild(btn);
    });

    // Timer
    timeLeft = DIFF_SECS[selectedDifficulty];
    document.getElementById("time-left").textContent = timeLeft;
    timerId = setInterval(() => {
        timeLeft--;
        document.getElementById("time-left").textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
            selectAnswer(-1); // no answer selected
        }
    }, 1000);
}

// ==== Select Answer ====
function selectAnswer(index) {
    clearInterval(timerId);

    const q = filteredQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll("#options-container button");
    const mapping = JSON.parse(document.getElementById("options-container").dataset.mapping);

    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (mapping[i] === q.correctIndex) btn.style.backgroundColor = "lightgreen";
        else if (mapping[i] === index) btn.style.backgroundColor = "salmon";
    });

    if (index === q.correctIndex) {
        score += DIFF_POINTS[q.difficulty];
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < filteredQuestions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }, 1000);
}

// ==== Show Results ====
function showResults() {
    document.getElementById("quiz-screen").classList.add("hidden");
    document.getElementById("results-screen").classList.remove("hidden");

    const maxScore = filteredQuestions.length * DIFF_POINTS[selectedDifficulty];
    const percent = Math.round((score / maxScore) * 100);

    document.getElementById("score-text").textContent = `Score: ${score} / ${maxScore}`;
    document.getElementById("percent-text").textContent = `Percentage: ${percent}%`;

    let message = "";
    if (percent >= 90) message = "Outstanding!";
    else if (percent >= 70) message = "Great job!";
    else if (percent >= 50) message = "Good attempt—review and try again.";
    else message = "Keep practicing!";
    document.getElementById("message-text").textContent = message;
}

// ==== Event Listeners ====

// Start Quiz button
document.getElementById("start-btn").addEventListener("click", async () => {
    score = 0;
    currentQuestionIndex = 0;
    selectedDifficulty = document.getElementById("difficulty").value;

    // Fetch questions for selected difficulty
    filteredQuestions = await fetchQuestions(selectedDifficulty, 10);

    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");

    showQuestion();
});

// Restart Quiz button
document.getElementById("restart-btn").addEventListener("click", () => {
    document.getElementById("results-screen").classList.add("hidden");
    document.getElementById("start-screen").classList.remove("hidden");
});
