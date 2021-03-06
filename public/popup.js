/*global chrome*/

const saveButton = document.getElementById('save-button');
const saveAndSubmitButton = document.getElementById('save-and-submit-button');
saveButton.onclick = generateTimeSheetHours.bind(null, 'SAVE');
saveAndSubmitButton.onclick = generateTimeSheetHours.bind(null, 'SAVE_SUBMIT');

chrome.storage.sync.get('tasks', function(data) {
    if (Array.isArray(data.tasks)) {
        saveButton.disabled = false;
    } else {
        saveButton.disabled = true;
    }
});

chrome.storage.sync.get('defaultDays', function(data) {
    if (Array.isArray(data.defaultDays)) {
        populateDefaultDays(data.defaultDays);
    } else {
        populateDefaultDays();
    }
});

function populateDefaultDays(defaultDays = []) {
    document.getElementById('day-row').innerHTML = defaultDays
        .map(obj => `<th>${obj.day}</th>`)
        .join('\n');
    document.getElementById('value-row').innerHTML = defaultDays
        .map(
            obj =>
                `<td><input class="form-control form-control-sm hours" type="text" value="${obj.value}"></td>`
        )
        .join('\n');
    document.getElementById('total-time').innerText = defaultDays.reduce(
        (a, obj) => {
            return a + Number(obj.value);
        },
        0
    );
    // set calbacks to calc totals
    const hourElements = document.querySelectorAll('.hours');
    for (const element of hourElements) {
        element.onkeyup = hourChange;
    }
}

function hourChange() {
    const hoursEle = document.querySelectorAll('.hours');
    let total = 0;
    for (const ele of hoursEle) {
        total += Number(ele.value);
    }
    document.getElementById('total-time').innerText = total;
}

function getTimeSheetHours(func) {
    const hours = document.querySelectorAll('.hours');
    chrome.storage.sync.get(['tasks', 'defaultDays'], function(data) {
        const { tasks, defaultDays } = data;
        if ((Array.isArray(tasks), Array.isArray(defaultDays))) {
            const tableData = [];
            for (const task of tasks) {
                const row = [];
                for (let i = 0, j = 0; i < defaultDays.length; i++) {
                    row.push(task.ratio * hours[j].value);
                    j++;
                }
                tableData.push(row.join('\\t'));
            }
            func(tableData.join('\\n'));
        } else {
            console.error('Could not generate time sheet hours');
        }
    });
}

function generateTimeSheetHours(eventType) {
    getTimeSheetHours(timeSheetHours => {
        chrome.tabs.query({ active: true }, function(tabs) {
            // Send a request to the content script.
            const tab = tabs.find(e => e.title === 'Edit Time Sheet');
            chrome.tabs.sendMessage(
                tab.id,
                { action: 'setHours', timeSheetHours, eventType },
                {},
                function() {
                    window.close();
                }
            );
        });
    });
}
