Open home.html first. Replace picsum placeholder images with your exact project images for a closer match.

Backend email server
--------------------
A simple Node.js backend is included to send contact form submissions to your info email address.

1. Copy `.env.example` to `.env`.
2. Update the values in `.env`:
   - `INFO_EMAIL` — recipient address for feedback
   - `SMTP_HOST` — your SMTP server host
   - `SMTP_PORT` — SMTP server port (usually 587 or 465)
   - `SMTP_USER` — SMTP username
   - `SMTP_PASS` — SMTP password
   - `ADMIN_EMAIL` — admin login email
   - `ADMIN_PASSWORD` — admin login password
   - `ADMIN_TOKEN` — secret token used by the admin frontend
3. Install dependencies:
   - `npm install`
4. Start the server:
   - `npm start`
5. Open the site in your browser and submit the contact form.

Admin dashboard
---------------
- Visit `login.html` to sign in.
- Use the admin email and password from your `.env` file.
- From the dashboard you can add announcements and blog posts.
- Public users see blog posts on `blog.html` and announcements on `home.html`.

The frontend uses `/send-feedback` for contact submissions and `/content` for public blog/announcement data. Admin actions use `/admin/login`, `/admin/announcement`, and `/admin/blog`.