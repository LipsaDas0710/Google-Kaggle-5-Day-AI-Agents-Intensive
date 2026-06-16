# BigQuery Release Notes Monitor & Twitter Agent

A premium, interactive web application built with **Python Flask** and **plain vanilla HTML/CSS/JavaScript**. It fetches the official Google BigQuery release notes XML feed in real-time, splits them into individual updates, categorizes them, and provides a custom Tweet Composer for sharing updates with developers.

## Project Architecture

The project is structured inside [bq-release-notes](file:///C:/Users/KIIT/bq-release-notes):

* **[app.py](file:///C:/Users/KIIT/bq-release-notes/app.py)**: Flask backend that fetches the XML atom feed, parses it using `BeautifulSoup` to break down multi-update dates, caches the results for 5 minutes, and exposes JSON endpoints.
* **[requirements.txt](file:///C:/Users/KIIT/bq-release-notes/requirements.txt)**: Core dependencies (`flask`, `requests`, `beautifulsoup4`).
* **[templates/index.html](file:///C:/Users/KIIT/bq-release-notes/templates/index.html)**: Clean, semantic dashboard UI.
* **[static/css/style.css](file:///C:/Users/KIIT/bq-release-notes/static/css/style.css)**: Glassmorphic dark styling system with neon accent states for update categories.
* **[static/js/main.js](file:///C:/Users/KIIT/bq-release-notes/static/js/main.js)**: Client-side engine managing active query filters, live keyword search, dashboard statistics, and the tweet generator.

---

## Technical Features

### 1. Feed Parsing & Atom Breakdown
Google Cloud release notes use a single XML entry per date. That single entry may contain multiple features, changes, and bug fixes under separate `<h3>` tags. 

* The backend splits these using a BeautifulSoup DOM parser.
* Individual updates are returned as separate card components, allowing users to tweet about a specific feature rather than the entire day's notes.
* A robust fallback is built in case the layout of a release note doesn't match standard headers.

### 2. Tweet Template Composer
When selecting a release note, a glassmorphic modal opens. It provides three AI-styled tweet templates:

| Style | Purpose | Emojis / Hashtags |
| :--- | :--- | :--- |
| **Professional** | Informative & clear | 📢, #BigQuery, #GCP |
| **Punchy & Short** | Focused on the headline | ⚡ |
| **Dev-Rel Style** | Engaging developer-advocacy layout | 🔥, 👉, 🔗, #GoogleCloud, #BigQuery |

* The composer has a **character counter** limiting content to 280 characters.
* It uses a custom **SVG progress ring** that shifts color from blue (normal) to amber (warning) to red (exceeded).
* The script calculates the length of the link, hashtags, and labels, and automatically truncates the description text using an ellipsis to prevent the tweet from exceeding 280 characters.

---

## Visual Design Details

* **Theme**: Deep space dark mode (`#07090e` main background) with glowing glassmorphic panels and borders.
* **Ambient glow**: CSS keyframe floating background radial gradients.
* **Color-coded Badges**:
  * **Features**: Green gradient (`#059669` to `#10b981`)
  * **Changes**: Blue gradient (`#0284c7` to `#0ea5e9`)
  * **Issues**: Red gradient (`#dc2626` to `#ef4444`)
  * **Deprecations**: Amber gradient (`#d97706` to `#f59e0b`)
  * **General**: Purple gradient (`#7c3aed` to `#8b5cf6`)
* **Responsive Layout**: Adapts gracefully to desktop grids, tablet states, and single-column mobile viewports.

---

## How to Run the Application

Follow these steps to run the application:

1. Open a terminal in [bq-release-notes](file:///C:/Users/KIIT/bq-release-notes).
2. Activate the virtual environment:
   * **PowerShell**: `.\.venv\Scripts\Activate.ps1`
   * **Command Prompt**: `.\.venv\Scripts\activate.bat`
3. Start the Flask application:
   ```bash
   python app.py
   ```
4. Access the application in your browser at:
   [http://127.0.0.1:5000](http://127.0.0.1:5000)
