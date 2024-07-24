const exercises = window.exercises || [];

function showExerciseDescription() {
  const exerciseSelect = document.getElementById('exercise-select');
  const exerciseId = exerciseSelect.value;
  const descriptionDiv = document.getElementById('exercise-description');
  
  if (exerciseId) {
    const selectedExercise = exercises.find(exercise => exercise._id === exerciseId);
    if (selectedExercise) {
      descriptionDiv.innerHTML = `<h3>${selectedExercise.name}</h3><p>${selectedExercise.description}</p>`;
    } else {
      descriptionDiv.innerHTML = '';
    }
  } else {
    descriptionDiv.innerHTML = '';
  }
}

function logWorkout() {
  const exerciseSelect = document.getElementById('exercise-select');
  const exerciseId = exerciseSelect.value;
  const exerciseName = exerciseSelect.options[exerciseSelect.selectedIndex].text;
  const hours = document.getElementById('hours').value;
  const sets = document.getElementById('sets').value;
  const trials = document.getElementById('trials').value;
  const workoutList = document.getElementById('workoutList');

  if (exerciseId && hours && sets && trials) {
    const li = document.createElement('li');
    li.textContent = `${exerciseName}: ${hours} hours, ${sets} sets, ${trials} trials per set`;
    workoutList.appendChild(li);

    // Clear the input fields
    exerciseSelect.value = '';
    document.getElementById('hours').value = '';
    document.getElementById('sets').value = '';
    document.getElementById('trials').value = '';
    document.getElementById('exercise-description').innerHTML = '';
  } else {
    alert('Please fill out all fields.');
  }
}
