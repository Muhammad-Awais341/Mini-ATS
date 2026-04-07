# Mini ATS – Applicant Tracking System

A full-stack Applicant Tracking System (ATS) built with **Next.js**, **Supabase**, and **Tailwind CSS**.
The application allows users to manage job postings and track candidates through a simple Kanban workflow.

---

## 🚀 Live Application

https://Mini-ATS.vercel.app

---

## 💻 GitHub Repository

https://github.com/Muhammad-Awais341/Mini-ATS

---

## 🔐 Demo Account

You can use the following credentials to test the application:

* **Email:** [test@test.com](mailto:test@test.com)
* **Password:** 123456

Or create your own account using the Sign Up option.

---

## 🧪 How to Test

1. Open the live application
2. Login using the demo account OR register a new user
3. Access the **Dashboard**
4. Create jobs in the **Jobs** section
5. View and manage candidates in the **Kanban board**

---

## ✨ Features

* 🔐 Authentication (Login & Signup)
* 👥 Role-based access (Admin / Customer)
* 📄 Job creation and management
* 📊 Dashboard with user info
* 🗂️ Kanban board for candidate tracking
* 🔒 Secure database with Row Level Security (RLS)
* 🎨 Clean and responsive UI (Tailwind CSS)

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router)
* **Backend:** Supabase (Database + Auth)
* **Styling:** Tailwind CSS
* **State Management:** React Hooks
* **Deployment:** Vercel

---

## 📁 Project Structure

```bash
app/
  auth/        # Login & Register page
  dashboard/   # Dashboard page
  jobs/        # Job management
  kanban/      # Kanban board
lib/
  supabaseClient.js
```

---

## ⚙️ Environment Variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📌 Notes

* The backend is powered by Supabase (Auth + Database)
* Row Level Security (RLS) is implemented for data protection
* This project was developed as part of a Frontend Developer exam project

---

## 👨‍💻 Author

Muhammad Awais
Frontend Developer Student – KYH

---
