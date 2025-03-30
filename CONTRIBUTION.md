# **👨‍💻 Contributing to Student Hub**

## 📌 Table of Contents

- [📜 Code of Conduct](#-code-of-conduct)
- [🛠 Setting Up Student Hub Locally](#-setting-up-student-hub-locally)
- [⚡ Submitting a Pull Request](#-submitting-a-pull-request)
- [🐛 Reporting Issues](#-reporting-issues)

---

# 📜 Code of Conduct

Welcome to **Student Hub!** 🎉  
We aim to create a **welcoming, inclusive, and respectful** environment for everyone. By contributing, you agree to follow these guidelines.

## **👥 Our Pledge**

We pledge to make participation in this project a **harassment-free experience** for everyone, regardless of:

- Age, gender, sexual orientation, disability, race, or religion.
- Technical ability or experience level.

We promise to:  
✔ Be **respectful** to others.  
✔ Welcome **constructive feedback** and discussions.  
✔ Keep discussions **inclusive and beginner-friendly**.  
✔ Value **diverse perspectives** and ideas.

## **🚨 Reporting Issues**

If you experience or witness unacceptable behavior:  
📩 Contact the project maintainers via **[email/project Discord]**.  
📜 Report issues in **GitHub Discussions** (for non-sensitive cases).

## **🔍 Enforcement**

- Violations will result in warnings, temporary bans, or permanent removal from the project.
- Maintainers have the right to **moderate discussions and enforce rules**.

Thank you for helping us build a **positive, collaborative, and welcoming** community! 🚀

---

# 🛠 Setting Up Student Hub Locally

Follow these steps to set up **Student Hub** on your local machine for development and contribution. 🚀

---

## **💻 Prerequisites**

Make sure you have the following installed:  
✔ **Git** – Version control system ([Download Git](https://git-scm.com/downloads))  
✔ **Node.js** – Recommended: **v18.x or later** ([Download Node.js](https://nodejs.org/))  
✔ **npm** – Comes with Node.js

---

## **📥 Installation Steps**

### **1️⃣ Fork & Clone the Repository**

1. Go to the **[Student Hub GitHub Repository](https://github.com/iiitl/student-hub)**.
2. Click the **Fork** button (top-right corner) to create your copy of the repository.

### **2️⃣ Clone Your Fork**

Once forked, clone the repository to your local machine using the following command:

```bash
# Clone the repository from your GitHub account
git clone https://github.com/<your-username>/student-hub.git
```

### **3️⃣ Navigate to the Project Directory**

Once cloned, move into the project directory:

```bash
cd student-hub
```

### **4️⃣ Installing Dependencies**

Before running the project, install all necessary dependencies using **npm**:  
Run the following command inside the project directory:

```bash
npm install
```

### **5️⃣ Running the Development Server**

Once you have installed the dependencies, start the development server using:  
Run the following command in the terminal:

```bash
npm run dev
```

---

## **🚀 Making Changes and Pushing to GitHub**

Once you have cloned the repository, follow these steps to contribute effectively.

### **🧭Navigate into the Project Directory**

After cloning the repository, move into the project folder using:

```bash
cd student-hub
```

### **🌿 Creating a New Branch**

Before making any changes, always create a **new branch** to keep your contributions organized.

```bash
git checkout -b feature-<your-feature-name>
```

### **📝 Making Your Changes**

Once you have created a new branch, you can start making changes to the project files.

### **➕ Staging Your Changes**

Once you've made modifications, you need to stage them before committing.  
To stage a specific file:

```bash
git add <filename>
```

### **📌 Committing Your Changes**

After staging your changes, you need to commit them with a meaningful message.  
Run the following command:

```bash
git commit -m "feat: <short description of the change>"
```

### ** 🔥Pushing Your Changes**

Once you've committed your changes, push them to your forked repository:

```bash
git push origin feature-<your-feature-name>
```

### **🚀 Creating a Pull Request (PR)**

Once you've pushed your changes, it's time to open a **Pull Request (PR)** to propose merging them into the main repository.

### **📌 Example PR Title & Description**

**Title:**

```bash
feat: Added dark mode toggle for better accessibility
```

### Changes Made

- Implemented dark mode support using `next-themes`.
- Users can toggle between light and dark modes.
- Updated UI to adapt to theme changes.

### Related Issue

Closes #42

### Screenshots

📸 _Attach screenshots of the new feature in action._

---

## **🐛 Reporting Issues**

Before submitting an issue, check if it already exists. Provide **detailed steps** and screenshots if necessary.

---

**🚀 Ready to contribute?** Fork the repo and start coding! 💻🔥
