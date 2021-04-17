// HOLD DB CONNECTION //
let db;

// ESTABLISH CONNECTION TO indexedDB AND SET IT TO VERSION 1 //
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budget', { autoIncrement: true });
}

// UPON SUCCESS //
request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

function saveRecord(record) {
    // OPEN NEW TRANS. WITH DATABASE AND READWRITE PERMISSIONS //
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // ACCESS OBJECT STORE //
    const budgetObjectStore = transaction.objectStore('new_budget');

    // ADD RECORD TO STORE //
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // OPEN TRANSACTION ON DB //
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // ACESS OBJECT STORE //
    const budgetObjectStore = transaction.objectStore('new_budget');

    // GET ALL RECORDS FROM STORE + SET TO A VARIABLE //
    const getAll = budgetObjectStore.getAll();

    // ON SUCCESSFUL .getAll() RUN //
    getAll.onsuccess = function() {
        // IF DATA IS IN indexedDB STORE, SEND TO API SERVER //
        if(getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // OPEN ANOTHER TRANSACTION //
                const transaction = db.transaction(['new_budget'], 'readwrite');
                // ACESS new_budget OBJECT STORE//
                const budgetObjectStore = transaction.objectStore('new_budget');
                // CLEAR ALL ITEMS IN STORE //
                budgetObjectStore.clear();

                alert('Saved budgets have been submitted');
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
}

// LISTEN FOR NETWORK CONNECTION //
window.addEventListener('online', uploadBudget);