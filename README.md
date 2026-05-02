# SalesAgent V1

## 1. What it does
SalesAgent is a smart cold email outreach system. It ingests leads from a CSV, uses Google's Gemini AI to automatically generate 3 personalized email variants (friendly, direct, curiosity), and sends the selected variant via your personal Gmail. It also tracks replies and automatically generates and sends follow-ups to non-responders using a different tone.

## 2. Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **Gmail Account** (with 2-Step Verification and an App Password configured)
- **Google Gemini API Key**

## 3. Setup

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (On Windows: `venv\Scripts\activate`)
4. `pip install -r requirements.txt`
5. Ensure your `.env` file is properly configured.
6. `uvicorn main:app --reload --port 8000`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. The dashboard will be available at `http://localhost:5173`.

## 4. Environment Variables
Your `.env` file should look like this (but with your real credentials):
```
GEMINI_API_KEY=AIza...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=youremail@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Your Name
DATABASE_URL=sqlite:///../salesagent.db
BACKEND_PORT=8000
```

## 5. Getting your Gemini API Key
Go to [Google AI Studio](https://aistudio.google.com/app/apikey). Sign in with your Google account, click "Create API Key", and copy it into your `.env` file.

## 6. How to use
1. **Upload Leads:** Go to the "Upload Leads" page and upload a CSV or manually enter leads.
2. **Generate:** Go to the "Campaigns" page, name your campaign, select leads, and click "Generate".
3. **Send:** Preview the generated variants, select your preferred tone, and click "Send Campaign".
4. **Track:** Manually mark leads as "Replied" on the Dashboard when they respond.
5. **Follow-up:** On the Dashboard, click "Send Followups" to automatically reach out to unreplied leads.

## 7. Gmail App Password
1. Go to your [Google Account Security](https://myaccount.google.com/security).
2. Ensure 2-Step Verification is enabled.
3. Search for "App Passwords".
4. Create a new App Password (e.g., named "SalesAgent").
5. Copy the 16-character code into your `.env` file as `SMTP_PASSWORD`.

## 8. Free Tier Limits
This app uses `gemini-2.5-flash` on the free tier.
- 15 Requests per minute (RPM).
- 1,500 Requests per day (RPD).
The rate limiter strictly enforces a cap of 10 RPM and 100 RPD for safety. A campaign of 50 leads will take roughly 4-5 minutes to generate.

## 9. Known V1 Limitations
- No automatic email reply parsing (must be marked manually).
- No email open tracking pixel.
- No scheduled sending.
- Plain text emails only (no HTML).
- Single-user system (no multi-user auth).
