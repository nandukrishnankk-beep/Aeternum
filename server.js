const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 3000;
const INFO_EMAIL = process.env.INFO_EMAIL || "aeternuminnovate@gmail.com";
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn("Warning: SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in environment variables.");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || "smtp.example.com",
  port: Number(SMTP_PORT) || 587,
  secure: Number(SMTP_PORT) === 465,
  auth: {
    user: SMTP_USER || "",
    pass: SMTP_PASS || ""
  }
});

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@aeternuminnovate.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function authenticate(token) {
  return token && token === process.env.ADMIN_TOKEN;
}

app.post("/send-feedback", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const mailOptions = {
    from: `"Aeternum Website" <${SMTP_USER || INFO_EMAIL}>`,
    to: INFO_EMAIL,
    subject: `Website feedback: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "Message sent successfully." });
  } catch (error) {
    console.error("Error sending feedback email:", error);
    return res.status(500).json({ error: "Unable to send message at this time." });
  }
});

app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = process.env.ADMIN_TOKEN || "default-admin-token";
  return res.json({ token });
});

app.get("/content", (req, res) => {
  try {
    const contentPath = path.join(__dirname, "data", "content.json");
    const data = JSON.parse(require("fs").readFileSync(contentPath, "utf8"));
    return res.json(data);
  } catch (error) {
    console.error("Error reading content.json:", error);
    return res.status(500).json({ error: "Unable to load content." });
  }
});

app.get("/admin/content", (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!authenticate(auth)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const contentPath = path.join(__dirname, "data", "content.json");
    const data = JSON.parse(require("fs").readFileSync(contentPath, "utf8"));
    return res.json(data);
  } catch (error) {
    console.error("Error reading content.json:", error);
    return res.status(500).json({ error: "Unable to load content." });
  }
});

app.post("/admin/announcement", (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!authenticate(auth)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required." });
  }

  try {
    const contentPath = path.join(__dirname, "data", "content.json");
    const fs = require("fs");
    const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    const newAnnouncement = {
      id: `announce-${Date.now()}`,
      title,
      message,
      date: new Date().toISOString().split("T")[0]
    };
    data.announcements.unshift(newAnnouncement);
    fs.writeFileSync(contentPath, JSON.stringify(data, null, 2), "utf8");
    return res.json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error("Error saving announcement:", error);
    return res.status(500).json({ error: "Unable to save announcement." });
  }
});

app.post("/admin/blog", (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!authenticate(auth)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { title, summary, image, content } = req.body;
  if (!title || !summary || !image || !content) {
    return res.status(400).json({ error: "All blog fields are required." });
  }

  try {
    const contentPath = path.join(__dirname, "data", "content.json");
    const fs = require("fs");
    const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    const newBlog = {
      id: `blog-${Date.now()}`,
      title,
      summary,
      image,
      content,
      date: new Date().toISOString().split("T")[0]
    };
    data.blog.unshift(newBlog);
    fs.writeFileSync(contentPath, JSON.stringify(data, null, 2), "utf8");
    return res.json({ success: true, blog: newBlog });
  } catch (error) {
    console.error("Error saving blog:", error);
    return res.status(500).json({ error: "Unable to save blog post." });
  }
});

app.put("/admin/announcement/:id", (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!authenticate(auth)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const announcementId = req.params.id;
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required." });
  }

  try {
    const contentPath = path.join(__dirname, "data", "content.json");
    const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    const announcement = data.announcements.find(item => item.id === announcementId);
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found." });
    }
    announcement.title = title;
    announcement.message = message;
    fs.writeFileSync(contentPath, JSON.stringify(data, null, 2), "utf8");
    return res.json({ success: true, announcement });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return res.status(500).json({ error: "Unable to update announcement." });
  }
});

app.delete("/admin/announcement/:id", (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!authenticate(auth)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const announcementId = req.params.id;
  try {
    const contentPath = path.join(__dirname, "data", "content.json");
    const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    data.announcements = data.announcements.filter(item => item.id !== announcementId);
    fs.writeFileSync(contentPath, JSON.stringify(data, null, 2), "utf8");
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({ error: "Unable to delete announcement." });
  }
});

app.put("/admin/blog/:id", (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!authenticate(auth)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const blogId = req.params.id;
  const { title, summary, image, content } = req.body;
  if (!title || !summary || !image || !content) {
    return res.status(400).json({ error: "All blog fields are required." });
  }

  try {
    const contentPath = path.join(__dirname, "data", "content.json");
    const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    const blog = data.blog.find(item => item.id === blogId);
    if (!blog) {
      return res.status(404).json({ error: "Blog post not found." });
    }
    blog.title = title;
    blog.summary = summary;
    blog.image = image;
    blog.content = content;
    fs.writeFileSync(contentPath, JSON.stringify(data, null, 2), "utf8");
    return res.json({ success: true, blog });
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).json({ error: "Unable to update blog post." });
  }
});

app.delete("/admin/blog/:id", (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!authenticate(auth)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const blogId = req.params.id;
  try {
    const contentPath = path.join(__dirname, "data", "content.json");
    const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    data.blog = data.blog.filter(item => item.id !== blogId);
    fs.writeFileSync(contentPath, JSON.stringify(data, null, 2), "utf8");
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return res.status(500).json({ error: "Unable to delete blog post." });
  }
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}
