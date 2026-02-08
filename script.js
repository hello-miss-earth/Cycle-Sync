let appData = {
    userName: '',
    themeColor: '#FFB3BA',
    day1: null,
    cycleLength: 28,
    menstrualEndDay: 5,
    phaseFocus: {
        food: { menstrual: '', follicular: '', ovulatory: '', luteal: '' },
        exercise: { menstrual: '', follicular: '', ovulatory: '', luteal: '' },
        work: { menstrual: '', follicular: '', ovulatory: '', luteal: '' },
        study: { menstrual: '', follicular: '', ovulatory: '', luteal: '' },
        personal: { menstrual: '', follicular: '', ovulatory: '', luteal: '' }
    },
    macroStars: {
        menstrual: { protein: 3, carbs: 2, fats: 1 },
        follicular: { protein: 3, carbs: 2, fats: 1 },
        ovulatory: { protein: 3, carbs: 2, fats: 1 },
        luteal: { protein: 3, carbs: 2, fats: 1 }
    },
    dayTemplates: {
        food: {},
        exercise: {},
        work: {},
        study: {},
        personal: {}
    },
    dailyLogs: {}
};

let currentCategory = 'food';
let currentTemplateCategory = 'food';
let currentTemplateDay = 1;

function loadData() {
    try {
        const saved = localStorage.getItem('cycle-sync-v4');
        if (saved) {
            appData = JSON.parse(saved);
            applyTheme();
            updateUserName();
        }
    } catch (e) {}
    updateDisplay();
}

function saveData() {
    try {
        localStorage.setItem('cycle-sync-v4', JSON.stringify(appData));
    } catch (e) {
        alert('Save error!');
    }
}

function applyTheme() {
    const color = appData.themeColor || '#FFB3BA';
    const brightness = (parseInt(color.slice(1,3),16)*299 + parseInt(color.slice(3,5),16)*587 + parseInt(color.slice(5,7),16)*114) / 1000;
    const textColor = brightness > 128 ? '#000000' : '#ffffff';
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--bg-color', color);
    document.documentElement.style.setProperty('--text-color', textColor);
}

function updateUserName() {
    if (appData.userName) document.getElementById('userName').textContent = appData.userName;
}

function selectColor(color) {
    appData.themeColor = color;
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
    document.querySelector(`[data-color="${color}"]`).classList.add('selected');
    applyTheme();
    saveData();
}

function getCurrentCycleInfo() {
    if (!appData.day1) return null;
    const day1 = new Date(appData.day1);
    const today = new Date();
    today.setHours(0,0,0,0);
    day1.setHours(0,0,0,0);
    const daysDiff = Math.floor((today - day1) / 86400000);
    const cycleDay = (daysDiff % appData.cycleLength) + 1;
    const menstrualEnd = appData.menstrualEndDay || 5;
    const remaining = appData.cycleLength - menstrualEnd;
    const follicularLen = Math.round(remaining * 0.39);
    const follicularEnd = menstrualEnd + follicularLen;
    const ovulatoryEnd = follicularEnd + 3;
    let phase = cycleDay <= menstrualEnd ? 'menstrual' : cycleDay <= follicularEnd ? 'follicular' : cycleDay <= ovulatoryEnd ? 'ovulatory' : 'luteal';
    return { cycleDay, phase, menstrualEnd, follicularEnd, ovulatoryEnd };
}

function getPhaseForDay(day) {
    const menstrualEnd = appData.menstrualEndDay || 5;
    const remaining = appData.cycleLength - menstrualEnd;
    const follicularEnd = menstrualEnd + Math.round(remaining * 0.39);
    const ovulatoryEnd = follicularEnd + 3;
    return day <= menstrualEnd ? 'menstrual' : day <= follicularEnd ? 'follicular' : day <= ovulatoryEnd ? 'ovulatory' : 'luteal';
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function updateDisplay() {
    updatePhaseDisplay();
    updateCategoryView();
}

function updatePhaseDisplay() {
    const info = getCurrentCycleInfo();
    const display = document.getElementById('phaseDisplay');
    if (!info) {
        display.innerHTML = '<div class="phase-name">Welcome!</div><div class="phase-day">Set up in Settings ⚙️</div>';
        return;
    }
    const names = { menstrual: 'Menstrual', follicular: 'Follicular', ovulatory: 'Ovulatory', luteal: 'Luteal' };
    
    let html = `<div class="phase-name">${names[info.phase]} Phase</div>`;
    
    // Show end menstrual button right below phase name if in menstrual phase (starting from Day 1)
    if (info.phase === 'menstrual') {
        html += `
            <button class="btn-end-menstrual" onclick="endMenstrualPhase()" style="margin:10px auto;display:block;width:80%;padding:12px;font-size:14px">
                🔴 Period Ended - Switch to Follicular
            </button>
        `;
    }
    
    html += `<div class="phase-day">Day ${info.cycleDay} of ${appData.cycleLength}</div>`;
    
    display.innerHTML = html;
    
    // Also update settings button if it exists
    const settingsBtn = document.getElementById('endMenstrualBtn');
    if (settingsBtn) settingsBtn.style.display = info.phase === 'menstrual' ? 'block' : 'none';
}

function updateCategoryView() {
    const info = getCurrentCycleInfo();
    const today = getTodayString();
    if (!appData.dailyLogs[today]) appData.dailyLogs[today] = { food: [], study: [], completed: {} };
    
    if (currentCategory === 'food') updateFoodView(info, today);
    else if (currentCategory === 'exercise') updateExerciseView(info, today);
    else if (currentCategory === 'work') updateWorkView(info, today);
    else if (currentCategory === 'study') updateStudyView(info, today);
    else if (currentCategory === 'personal') updatePersonalView(info, today);
}

function updateFoodView(info, today) {
    if (!info) {
        document.getElementById('foodFocus').innerHTML = 'Set up cycle first';
        document.getElementById('foodItems').innerHTML = '<div class="empty-state">Set cycle first</div>';
        return;
    }
    
    document.getElementById('foodFocus').textContent = appData.phaseFocus.food[info.phase] || 'No focus set. Add in Template Builder!';
    
    const macros = appData.macroStars[info.phase];
    ['protein', 'carbs', 'fats'].forEach(macro => {
        const el = document.getElementById(macro + 'Stars');
        const stars = macros[macro] || 1;
        el.innerHTML = [1,2,3].map(i => `<span class="star ${i <= stars ? 'filled' : 'empty'}">⭐</span>`).join('');
    });
    
    const template = appData.dayTemplates.food[info.cycleDay] || [];
    const items = document.getElementById('foodItems');
    if (template.length === 0) items.innerHTML = '<div class="empty-state">No meals planned. Add in Template!</div>';
    else items.innerHTML = template.map((t,i) => renderTemplateItem(t, 'food', today, i+1)).join('');
}

function updateExerciseView(info, today) {
    if (!info) {
        document.getElementById('exerciseFocus').innerHTML = 'Set up cycle first';
        document.getElementById('exerciseItems').innerHTML = '<div class="empty-state">Set cycle first</div>';
        return;
    }
    
    document.getElementById('exerciseFocus').textContent = appData.phaseFocus.exercise[info.phase] || 'No focus set. Add in Template Builder!';
    
    const template = appData.dayTemplates.exercise[info.cycleDay] || [];
    const items = document.getElementById('exerciseItems');
    if (template.length === 0) items.innerHTML = '<div class="empty-state">No workout. Add in Template!</div>';
    else items.innerHTML = template.map((t,i) => renderTemplateItem(t, 'exercise', today, i+1)).join('');
}

function updateWorkView(info, today) {
    if (!info) {
        document.getElementById('workFocus').innerHTML = 'Set up cycle first';
        document.getElementById('workItems').innerHTML = '<div class="empty-state">Set cycle first</div>';
        return;
    }
    
    document.getElementById('workFocus').textContent = appData.phaseFocus.work[info.phase] || 'No focus set. Add in Template Builder!';
    
    const template = appData.dayTemplates.work[info.cycleDay] || [];
    const items = document.getElementById('workItems');
    if (template.length === 0) items.innerHTML = '<div class="empty-state">No tasks. Add in Template!</div>';
    else items.innerHTML = template.map((t,i) => renderTemplateItem(t, 'work', today, i+1)).join('');
}

function updateStudyView(info, today) {
    if (!info) {
        document.getElementById('studyFocus').innerHTML = 'Set up cycle first';
        document.getElementById('studyItems').innerHTML = '<div class="empty-state">Set cycle first</div>';
        return;
    }
    
    document.getElementById('studyFocus').textContent = appData.phaseFocus.study[info.phase] || 'No focus set. Add in Template Builder!';
    
    const template = appData.dayTemplates.study[info.cycleDay] || [];
    const items = document.getElementById('studyItems');
    if (template.length === 0) items.innerHTML = '<div class="empty-state">No study plan. Add in Template!</div>';
    else items.innerHTML = template.map((t,i) => renderTemplateItem(t, 'study', today, i+1)).join('');
}

function updatePersonalView(info, today) {
    if (!info) {
        document.getElementById('personalFocus').innerHTML = 'Set up cycle first';
        document.getElementById('personalItems').innerHTML = '<div class="empty-state">Set cycle first</div>';
        return;
    }
    
    document.getElementById('personalFocus').textContent = appData.phaseFocus.personal[info.phase] || 'No focus set. Add in Template Builder!';
    
    const template = appData.dayTemplates.personal[info.cycleDay] || [];
    const items = document.getElementById('personalItems');
    if (template.length === 0) items.innerHTML = '<div class="empty-state">No tasks. Add in Template!</div>';
    else items.innerHTML = template.map((t,i) => renderTemplateItem(t, 'personal', today, i+1)).join('');
}

function renderTemplateItem(item, category, dateString, stepNum) {
    const completed = appData.dailyLogs[dateString]?.completed?.[category]?.includes(item.id) || false;
    return `
        <div class="item ${completed ? 'completed' : ''}">
            <div class="item-header">
                <div class="item-content">
                    <div class="item-title"><span class="step-number">${stepNum}</span>${item.title}</div>
                    ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                </div>
            </div>
            <div class="item-actions">
                <button onclick="toggleComplete('${item.id}', '${category}', '${dateString}')">${completed ? '↻' : '✓'}</button>
            </div>
        </div>
    `;
}

function switchCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.querySelectorAll('.category-view').forEach(v => v.style.display = 'none');
    document.getElementById(cat + 'View').style.display = 'block';
    updateCategoryView();
}

function toggleMenu() {
    document.getElementById('slideMenu').classList.toggle('active');
}

function showTemplateBuilder() {
    toggleMenu();
    currentCategory = 'template';
    document.querySelectorAll('.category-view').forEach(v => v.style.display = 'none');
    document.getElementById('templateView').style.display = 'block';
    renderTemplateBuilder();
}

function showSettings() {
    toggleMenu();
    currentCategory = 'settings';
    document.querySelectorAll('.category-view').forEach(v => v.style.display = 'none');
    document.getElementById('settingsView').style.display = 'block';
    loadSettings();
}

function showCalendar() {
    toggleMenu();
    currentCategory = 'calendar';
    document.querySelectorAll('.category-view').forEach(v => v.style.display = 'none');
    document.getElementById('calendarView').style.display = 'block';
    if (!window.calendarMonth) {
        const today = new Date();
        window.calendarMonth = { year: today.getFullYear(), month: today.getMonth() };
    }
    renderCalendar();
}

function changeCalendarMonth(direction) {
    if (!window.calendarMonth) {
        const today = new Date();
        window.calendarMonth = { year: today.getFullYear(), month: today.getMonth() };
    }
    
    window.calendarMonth.month += direction;
    if (window.calendarMonth.month > 11) {
        window.calendarMonth.month = 0;
        window.calendarMonth.year++;
    } else if (window.calendarMonth.month < 0) {
        window.calendarMonth.month = 11;
        window.calendarMonth.year--;
    }
    renderCalendar();
}

function renderCalendar() {
    const info = getCurrentCycleInfo();
    const content = document.getElementById('calendarContent');
    
    if (!info || !appData.day1) {
        content.innerHTML = '<div class="empty-state">Set up your cycle in Settings first!</div>';
        return;
    }
    
    const day1Date = new Date(appData.day1);
    day1Date.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Use calendar navigation month or current month
    const viewYear = window.calendarMonth ? window.calendarMonth.year : today.getFullYear();
    const viewMonth = window.calendarMonth ? window.calendarMonth.month : today.getMonth();
    
    // Calculate start and end of viewing month
    const startOfMonth = new Date(viewYear, viewMonth, 1);
    const endOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    
    // Get day of week for first day of month (0 = Sunday)
    const firstDayOfWeek = startOfMonth.getDay();
    
    let html = `
        <div class="calendar-legend">
            <h3 style="margin-bottom:15px">Phase Colors</h3>
            <div class="legend-item">
                <div class="legend-color phase-menstrual-bg"></div>
                <span>Menstrual Phase (Days 1-${info.menstrualEnd})</span>
            </div>
            <div class="legend-item">
                <div class="legend-color phase-follicular-bg"></div>
                <span>Follicular Phase (Days ${info.menstrualEnd + 1}-${info.follicularEnd})</span>
            </div>
            <div class="legend-item">
                <div class="legend-color phase-ovulatory-bg"></div>
                <span>Ovulatory Phase (Days ${info.follicularEnd + 1}-${info.ovulatoryEnd})</span>
            </div>
            <div class="legend-item">
                <div class="legend-color phase-luteal-bg"></div>
                <span>Luteal Phase (Days ${info.ovulatoryEnd + 1}-${appData.cycleLength})</span>
            </div>
        </div>
        
        <div class="daily-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
                <button onclick="changeCalendarMonth(-1)" style="padding:10px 15px;border:none;background:rgba(255,255,255,0.3);color:var(--text-color);border-radius:8px;cursor:pointer;font-weight:bold">← Prev</button>
                <h3>${startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <button onclick="changeCalendarMonth(1)" style="padding:10px 15px;border:none;background:rgba(255,255,255,0.3);color:var(--text-color);border-radius:8px;cursor:pointer;font-weight:bold">Next →</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:8px;text-align:center;font-weight:bold;font-size:12px">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div class="calendar-grid">
    `;
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
        html += '<div></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(viewYear, viewMonth, day);
        currentDate.setHours(0, 0, 0, 0);
        
        // Calculate cycle day for this date - FIXED: Now starts at 1
        const daysDiff = Math.floor((currentDate - day1Date) / 86400000);
        let cycleDay = (daysDiff % appData.cycleLength) + 1;
        
        // Handle negative days (dates before Day 1)
        if (daysDiff < 0) {
            // Calculate how many days back from cycle start
            const daysBack = Math.abs(daysDiff);
            cycleDay = appData.cycleLength - (daysBack % appData.cycleLength);
            if (cycleDay === appData.cycleLength) cycleDay = appData.cycleLength;
        }
        
        const phase = getPhaseForDay(cycleDay);
        
        const isToday = currentDate.getTime() === today.getTime();
        const phaseClass = `phase-${phase}-bg`;
        
        html += `
            <div class="calendar-day ${phaseClass} ${isToday ? 'today' : ''}">
                <div class="date-num">${day}</div>
                <div class="phase-label">D${cycleDay}</div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

function switchTemplateCategory(cat) {
    currentTemplateCategory = cat;
    document.querySelectorAll('.template-cat-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderTemplateBuilder();
}

function renderTemplateBuilder() {
    const content = document.getElementById('templateContent');
    const cat = currentTemplateCategory;
    const phases = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
    const phaseNames = { menstrual: 'Menstrual', follicular: 'Follicular', ovulatory: 'Ovulatory', luteal: 'Luteal' };
    
    let html = '<div style="margin-top:20px">';
    
    // Phase focus section
    html += '<div class="daily-section"><h3>Phase Focus</h3>';
    phases.forEach(phase => {
        const focus = appData.phaseFocus[cat][phase] || '';
        html += `
            <div style="margin-bottom:15px">
                <label style="font-weight:bold">${phaseNames[phase]} Phase Focus:</label>
                <textarea id="focus-${cat}-${phase}" rows="2" style="width:100%;padding:10px;border-radius:8px;border:2px solid #ddd;margin-top:5px">${focus}</textarea>
                <button class="btn-primary" onclick="savePhaseFocus('${cat}', '${phase}')">Save Focus</button>
            </div>
        `;
    });
    html += '</div>';
    
    // Macro stars (food only)
    if (cat === 'food') {
        html += '<div class="daily-section"><h3>Macro Priority Stars</h3>';
        phases.forEach(phase => {
            const macros = appData.macroStars[phase];
            html += `
                <div style="margin-bottom:20px">
                    <h4>${phaseNames[phase]} Phase</h4>
                    ${['protein', 'carbs', 'fats'].map(macro => `
                        <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;padding:10px;background:rgba(255,255,255,0.3);border-radius:8px">
                            <span style="font-weight:500;text-transform:capitalize">${macro}:</span>
                            <div>
                                ${[1,2,3].map(s => `<button onclick="setMacroStars('${phase}', '${macro}', ${s})" style="border:none;background:none;font-size:24px;cursor:pointer;color:${macros[macro] >= s ? '#FFD700' : 'rgba(0,0,0,0.2)'}">⭐</button>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Day template
    const phase = getPhaseForDay(currentTemplateDay);
    const tasks = appData.dayTemplates[cat][currentTemplateDay] || [];
    html += `
        <div class="template-day-nav">
            <button onclick="changeTemplateDay(-1)">← Prev</button>
            <div class="template-day-info">
                <div class="day-number">Day ${currentTemplateDay}</div>
                <div>${phaseNames[phase]} Phase</div>
            </div>
            <button onclick="changeTemplateDay(1)">Next →</button>
        </div>
        <div class="daily-section">
            <h3>Steps/Tasks for Day ${currentTemplateDay}</h3>
            ${tasks.map((t,i) => `
                <div class="item">
                    <div><strong>Step ${i+1}:</strong> ${t.title}</div>
                    ${t.description ? `<div style="font-size:14px;opacity:0.8">${t.description}</div>` : ''}
                    <button onclick="removeDayTask('${cat}', ${currentTemplateDay}, ${i})" style="margin-top:8px;padding:6px 12px;border:none;background:rgba(255,0,0,0.7);color:white;border-radius:6px;cursor:pointer">Remove</button>
                </div>
            `).join('')}
            ${tasks.length === 0 ? '<div class="empty-state">No steps yet</div>' : ''}
            <button class="btn-primary" onclick="addDayTask('${cat}', ${currentTemplateDay})">+ Add Step</button>
        </div>
    `;
    
    content.innerHTML = html + '</div>';
}

function savePhaseFocus(cat, phase) {
    const val = document.getElementById(`focus-${cat}-${phase}`).value.trim();
    appData.phaseFocus[cat][phase] = val;
    saveData();
    alert('✅ Focus saved!');
}

function setMacroStars(phase, macro, stars) {
    appData.macroStars[phase][macro] = stars;
    saveData();
    renderTemplateBuilder();
}

function changeTemplateDay(dir) {
    currentTemplateDay += dir;
    if (currentTemplateDay < 1) currentTemplateDay = appData.cycleLength;
    if (currentTemplateDay > appData.cycleLength) currentTemplateDay = 1;
    renderTemplateBuilder();
}

function addDayTask(cat, day) {
    const title = prompt('Step/Task title:');
    if (!title) return;
    const desc = prompt('Description (optional):') || '';
    if (!appData.dayTemplates[cat][day]) appData.dayTemplates[cat][day] = [];
    appData.dayTemplates[cat][day].push({ id: Date.now().toString(), title, description: desc });
    saveData();
    renderTemplateBuilder();
}

function removeDayTask(cat, day, idx) {
    if (!confirm('Remove?')) return;
    appData.dayTemplates[cat][day].splice(idx, 1);
    saveData();
    renderTemplateBuilder();
}

function toggleComplete(id, cat, date) {
    if (!appData.dailyLogs[date].completed[cat]) appData.dailyLogs[date].completed[cat] = [];
    const arr = appData.dailyLogs[date].completed[cat];
    const idx = arr.indexOf(id);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(id);
    saveData();
    updateCategoryView();
}

function loadSettings() {
    document.getElementById('userNameInput').value = appData.userName || '';
    document.getElementById('day1Input').valueAsDate = appData.day1 ? new Date(appData.day1) : null;
    document.getElementById('menstrualEndInput').value = appData.menstrualEndDay || 5;
    document.getElementById('cycleLengthInput').value = appData.cycleLength || 28;
    document.querySelectorAll('.color-option').forEach(o => {
        if (o.dataset.color === appData.themeColor) o.classList.add('selected');
        else o.classList.remove('selected');
    });
}

function saveSettings() {
    const name = document.getElementById('userNameInput').value.trim();
    const day1 = document.getElementById('day1Input').value;
    const menEnd = parseInt(document.getElementById('menstrualEndInput').value);
    const cycLen = parseInt(document.getElementById('cycleLengthInput').value);
    if (name) appData.userName = name;
    if (day1) appData.day1 = day1;
    if (menEnd) appData.menstrualEndDay = menEnd;
    if (cycLen) appData.cycleLength = cycLen;
    saveData();
    updateUserName();
    updateDisplay();
    alert('✅ Settings saved!');
}

function endMenstrualPhase() {
    const info = getCurrentCycleInfo();
    if (!confirm(`Your period ended on Day ${info.cycleDay}?\n\nThe app will switch to Follicular Phase and update your calendar!`)) return;
    
    appData.menstrualEndDay = info.cycleDay;
    saveData();
    updateDisplay();
    
    // If calendar is open, refresh it to show updated phases
    if (currentCategory === 'calendar') {
        renderCalendar();
    }
    
    alert('✅ Switched to Follicular Phase! Calendar updated.');
}

loadData();
