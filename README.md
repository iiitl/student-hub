# Important Notice:
- We strictly do not accept low-effort PRs for this project. Any such PRs will result in deducted points.
- Do not attempt to claim issues labeled as blocked. These issues are not ready for work, and claiming them will lead to unnecessary delays.

# Setting Up Student Hub Locally

## Prerequisites

Before you begin, ensure you have the following installed:
- Git
- Node.js (recommended version 18.x or later)
- npm (Node Package Manager)
- A GitHub account

## Setup Steps

### 1. Fork the Repository
- Navigate to the project repository on GitHub
- Click the "Fork" button in the top-right corner of the page
- This creates a copy of the repository in your GitHub account
- Choose your personal account as the destination for the fork

### 2. Clone Your Forked Repository
```bash
# Replace <your-username> with your GitHub username
git clone https://github.com/<your-username>/student-hub.git

# Navigate to the project directory
cd student-hub
```

### 3. Install Dependencies
```bash
# Install required npm packages
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```

### 5. View the Project
- Open http://localhost:3000 with your browser to see the result
- You can start editing the page by modifying `app/page.tsx`
- The page auto-updates as you edit the file

## Additional Information
- This project uses next/font to automatically optimize and load Geist, a new font family for Vercel.
- If you like this project, please consider starring the repository! 

