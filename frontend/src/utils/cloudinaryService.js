import axios from "axios";

export async function uploadNote(file, { grade, semester, subject, topic }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "your_unsigned_preset");
  formData.append("tags", [
    `grade_${grade}`,
    `semester_${semester}`,
    subject.toLowerCase(),
    topic?.toLowerCase()
  ].filter(Boolean).join(","));

  const response = await axios.post("https://api.cloudinary.com/v1_1/your_cloud_name/auto/upload", formData);
  return response.data;
}

export async function fetchNotesByContext({ grade, semester, subject, topic }) {
  const expressions = [];
  if (grade) expressions.push(`tags:grade_${grade}`);
  if (semester) expressions.push(`tags:semester_${semester}`);
  if (subject) expressions.push(`tags:${subject.toLowerCase()}`);
  if (topic) expressions.push(`tags:${topic.toLowerCase()}`);
  const expression = expressions.join(" AND ");
  const result = await axios.post("https://api.cloudinary.com/v1_1/your_cloud_name/resources/search", {
    expression,
    with_field: "tags",
    max_results: 50
  }, {
    auth: {
      username: "your_api_key",
      password: "your_api_secret"
    }
  });
  return result.data.resources;
}
