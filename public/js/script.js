const exercises = window.exercises || [];

function searchExercise() {
  const input = document.getElementById('exercise-search').value.toLowerCase();
  const suggestions = document.getElementById('exercise-suggestions');
  const descriptionDiv = document.getElementById('exercise-description');
  suggestions.innerHTML = '';
  descriptionDiv.innerHTML = '';

  if (input.length > 0) {
    const filteredExercises = exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(input)
    );

    filteredExercises.forEach(exercise => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.textContent = exercise.name;
      suggestionItem.onclick = () => {
        document.getElementById('exercise-search').value = exercise.name;
        descriptionDiv.innerHTML = `<h3>${exercise.name}</h3><p>${exercise.description}</p>`;
        suggestions.innerHTML = '';
      };
      suggestions.appendChild(suggestionItem);
    });
  }
}

function logWorkout() {
  const exercise = document.getElementById('exercise-search').value;
  const hours = document.getElementById('hours').value;
  const sets = document.getElementById('sets').value;
  const trials = document.getElementById('trials').value;
  const workoutList = document.getElementById('workoutList');

  if (exercise && hours && sets && trials) {
    const li = document.createElement('li');
    li.textContent = `${exercise}: ${hours} hours, ${sets} sets, ${trials} trials per set`;
    workoutList.appendChild(li);

    // Clear the input fields
    document.getElementById('exercise-search').value = '';
    document.getElementById('hours').value = '';
    document.getElementById('sets').value = '';
    document.getElementById('trials').value = '';
    document.getElementById('exercise-description').innerHTML = '';
  } else {
    alert('Please fill out all fields.');
  }
}
