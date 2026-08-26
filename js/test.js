const API_URL = 'http://localhost:5000/api';

// Load and display test
async function loadTest() {
    const assignmentId = localStorage.getItem('currentAssignment');
    const token = localStorage.getItem('token');
    
    if (!assignmentId || !token) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    try {
        // Get assignment details
        const assignResponse = await fetch(`${API_URL}/assignments/${assignmentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const assignment = await assignResponse.json();
        
        // Get test details
        const testResponse = await fetch(`${API_URL}/tests/${assignment.testId._id || assignment.testId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const test = await testResponse.json();
        
        // Display test
        document.getElementById('testTitle').textContent = test.title;
        displayQuestions(test.questions, assignmentId);
        
        // Start timer
        if (test.timeLimit) {
            startTimer(test.timeLimit);
        }
    } catch (error) {
        console.error('Xato:', error);
    }
}

function displayQuestions(questions, assignmentId) {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        
        let optionsHTML = '';
        if (question.options) {
            optionsHTML = `
                <div class="question-options">
                    ${question.options.map((option, i) => `
                        <label class="option-label">
                            <input type="radio" name="question_${question._id}" value="${option}">
                            ${option}
                        </label>
                    `).join('')}
                </div>
            `;
        } else {
            optionsHTML = `
                <div class="question-options">
                    <input type="text" name="question_${question._id}" placeholder="Javobingizni kiriting...">
                </div>
            `;
        }
        
        questionDiv.innerHTML = `
            <h4>${index + 1}. ${question.question}</h4>
            ${optionsHTML}
        `;
        
        container.appendChild(questionDiv);
    });
}

function startTimer(minutes) {
    let totalSeconds = minutes * 60;
    
    setInterval(() => {
        totalSeconds--;
        
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        
        document.getElementById('timeRemaining').textContent = 
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        if (totalSeconds <= 0) {
            submitTest();
        }
    }, 1000);
}

document.getElementById('testForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitTest();
});

async function submitTest() {
    const assignmentId = localStorage.getItem('currentAssignment');
    const token = localStorage.getItem('token');
    
    const formData = new FormData(document.getElementById('testForm'));
    const answers = [];
    
    for (let [key, value] of formData) {
        if (key.startsWith('question_')) {
            const questionId = key.replace('question_', '');
            answers.push({
                questionId,
                studentAnswer: value
            });
        }
    }
    
    try {
        const response = await fetch(`${API_URL}/results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                assignmentId,
                answers
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('currentResult', data._id);
            window.location.href = 'results.html';
        } else {
            alert('Xato: ' + data.error);
        }
    } catch (error) {
        console.error('Xato:', error);
        alert('Test yuborishda xato!');
    }
}

// Load results
async function loadResults() {
    const resultId = localStorage.getItem('currentResult');
    const token = localStorage.getItem('token');
    
    if (!resultId || !token) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/results/${resultId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        // Display results
        document.getElementById('testName').textContent = result.testId.title;
        document.getElementById('correctCount').textContent = result.correctCount;
        document.getElementById('incorrectCount').textContent = result.incorrectCount;
        document.getElementById('percentage').textContent = result.percentage + '%';
        document.getElementById('points').textContent = result.totalPoints;
        document.getElementById('feedback').textContent = result.feedback || 'Hali feedback yo\'q';
        
        const gradeBadge = document.getElementById('grade');
        gradeBadge.textContent = result.grade;
        gradeBadge.className = `grade-badge ${result.grade}`;
        
        // Display answers
        const answersList = document.getElementById('answersList');
        answersList.innerHTML = '';
        
        result.answers.forEach((answer, index) => {
            const answerDiv = document.createElement('div');
            answerDiv.className = `answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;
            answerDiv.innerHTML = `
                <h5>Savol ${index + 1}</h5>
                <p><strong>Siz javob berdingiz:</strong> ${answer.studentAnswer}</p>
                <p><strong>Ballar:</strong> ${answer.points}</p>
                <p>${answer.isCorrect ? '✅ To\'g\'ri' : '❌ Noto\'g\'ri'}</p>
            `;
            answersList.appendChild(answerDiv);
        });
    } catch (error) {
        console.error('Xato:', error);
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    if (document.location.pathname.includes('test.html')) {
        loadTest();
    }
    if (document.location.pathname.includes('results.html')) {
        loadResults();
    }
});
