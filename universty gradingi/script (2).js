document.addEventListener("DOMContentLoaded", () => {

    // --- 1. OUR "DATABASE" ---
    let hostelData = loadData();
    // This Set now stores a "roll-year-gender" key
    const allAllocatedRolls = new Set(); 
    
    if (hostelData) {
        Object.values(hostelData).forEach(hostel => {
            hostel.students.forEach(student => {
                allAllocatedRolls.add(`${student.roll}-${student.year}-${student.gender}`);
            });
        });
    } else {
        // If no saved data, set up the default structure
        hostelData = {
            "A": { name: "Hostel A", capacity: 50, gender: "male", students: [] },
            "B": { name: "Hostel B", capacity: 40, gender: "female", students: [] },
            "C": { name: "Hostel C", capacity: 50, gender: "male", students: [] }
        };
    }

    // --- 2. GET HTML ELEMENTS ---
    const form = document.getElementById("allocation-form");
    const allocationList = document.getElementById("allocation-list");

    // --- 3. REBUILD THE UI FROM SAVED DATA ---
    rebuildUIFromSavedData();
    
    // --- 4. FORM SUBMIT EVENT ---
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Get all values from the form inputs
        const studentName = document.getElementById("student-name").value.trim();
        const studentRoll = document.getElementById("student-roll").value.trim();
        const studentCourse = document.getElementById("student-course").value.trim();
        const studentYear = document.getElementById("student-year").value;
        const hostelValue = document.getElementById("hostel-select").value; 
        const studentGender = document.getElementById("student-gender").value;

        // --- 5. ADVANCED VALIDATION (Fixes "multiple input errors") ---
        
        // CHECK 1: Are all fields filled? (More robust than HTML 'required')
        if (!studentName || !studentRoll || !studentCourse || !studentYear) {
            alert("Error: Please fill out all fields.");
            return;
        }

        // --- 6. LOGICAL VALIDATION ---
        
        // Check using the "roll-year-gender" compound key
        const compoundKey = `${studentRoll}-${studentYear}-${studentGender}`;
        
        if (allAllocatedRolls.has(compoundKey)) {
            // Updated alert message for clarity
            alert(`Error: Student (Roll: ${studentRoll}, Year: ${studentYear}, Gender: ${studentGender}) is already allocated.`);
            return;
        }

        const targetHostel = hostelData[hostelValue];

        // CHECK 3: Does the student's gender match the hostel's gender?
        if (targetHostel.gender !== studentGender) {
            alert(`Error: ${targetHostel.name} is a ${targetHostel.gender}-only hostel.`);
            return;
        }

        // CHECK 4: Is this hostel full?
        if (targetHostel.students.length >= targetHostel.capacity) {
            alert(`Error: ${targetHostel.name} is full. (Capacity: ${targetHostel.capacity})`);
            return;
        }

        // --- 7. ALL CHECKS PASSED: Allocate the student ---
        const newStudent = {
            name: studentName,
            roll: studentRoll,
            course: studentCourse,
            year: studentYear,
            gender: studentGender,
            hostel: hostelValue
        };

        targetHostel.students.push(newStudent);
        allAllocatedRolls.add(compoundKey);

        addStudentToUIList(newStudent); // Add to the visual list
        saveData(); // Save changes
        
        form.reset();
    });

    // --- 8. FUNCTION TO ADD STUDENT TO THE <ul> LIST ---
    function addStudentToUIList(student) {
        const li = document.createElement("li");
        li.dataset.roll = student.roll;
        li.dataset.hostel = student.hostel;
        li.dataset.year = student.year; 
        li.dataset.gender = student.gender;

        li.innerHTML = `
            <strong>${student.name}</strong> (Roll: ${student.roll})
            <br>
            ${student.course} - Year ${student.year} (${student.gender})
            <br>
            Allocated to: ${hostelData[student.hostel].name}
            <button class="remove-btn">Remove</button>
        `;
        
        allocationList.appendChild(li);

        // Add click listener to the new remove button
        li.querySelector(".remove-btn").addEventListener("click", () => {
            removeStudent(li);
        });
    }

    // --- 9. FUNCTION TO REMOVE A STUDENT ---
    function removeStudent(li) {
        const rollToRemove = li.dataset.roll;
        const hostelValue = li.dataset.hostel;
        const yearToRemove = li.dataset.year;
        const genderToRemove = li.dataset.gender;

        // 1. Remove the compound key from 'all rolls' Set
        const compoundKey = `${rollToRemove}-${yearToRemove}-${genderToRemove}`;
        allAllocatedRolls.delete(compoundKey);

        // 2. Remove from hostel's student array
        const targetHostel = hostelData[hostelValue];
        const indexToRemove = targetHostel.students.findIndex(
            student => student.roll === rollToRemove && 
                       student.year === yearToRemove && 
                       student.gender === genderToRemove
        );
        if (indexToRemove > -1) {
            targetHostel.students.splice(indexToRemove, 1);
        }

        // 3. Remove from visual list
        li.remove();

        saveData(); // Save changes
    }

    // --- 10. LOCALSTORAGE FUNCTIONS ---
    function saveData() {
        localStorage.setItem("hostelAllocationData", JSON.stringify(hostelData));
    }

    function loadData() {
        const savedData = localStorage.getItem("hostelAllocationData");
        if (savedData) {
            return JSON.parse(savedData);
        } else {
            return null;
        }
    }

    function rebuildUIFromSavedData() {
        if (!hostelData) return; 

        Object.values(hostelData).forEach(hostel => {
            hostel.students.forEach(student => {
                addStudentToUIList(student);
            });
        });
    }

    // --- 11. SEARCH FUNCTIONALITY (WITH FIX) ---
    const searchBar = document.getElementById("search-bar");

    // **THIS IS THE FIX:** We only run this code if the searchBar actually exists.
    // This stops the script from crashing.
    if (searchBar) {
        searchBar.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const allStudents = allocationList.querySelectorAll("li");

            allStudents.forEach(studentLi => {
                const studentText = studentLi.textContent.toLowerCase();
                if (studentText.includes(searchTerm)) {
                    studentLi.style.display = ""; 
                } else {
                    studentLi.style.display = "none"; 
                }
            });
        });
    }

});