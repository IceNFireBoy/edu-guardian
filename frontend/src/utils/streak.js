export function updateStreak() {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem("lastStudyDate");
  let streak = Number(localStorage.getItem("studyStreak") || 0);

  if (lastDate) {
    const last = new Date(lastDate);
    const diff = (new Date(today) - last) / (1000 * 60 * 60 * 24);
    streak = (diff === 1) ? streak + 1 : (diff > 1 ? 1 : streak);
  } else {
    streak = 1;
  }

  localStorage.setItem("lastStudyDate", today);
  localStorage.setItem("studyStreak", streak);
  return streak;
}
