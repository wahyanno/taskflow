<div align="center">

# 🗂️ TaskFlow

**A modern, full-featured project & task management application**  
Built with **Angular 15** · **TypeScript** · **SweetAlert2** · **Drag & Drop Kanban**

[![Angular](https://img.shields.io/badge/Angular-15-DD0031?logo=angular&logoColor=white)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

🌐 **Live Demo:** [`https://taskflow.pages.dev`](https://taskflow.pages.dev)  
⚙️ **Backend API:** [`https://github.com/wahyanno/api-taskflow`](https://github.com/wahyanno/api-taskflow)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Setup Instructions](#-setup-instructions)
- [Environment Configuration](#-environment-configuration)
- [Demo Accounts](#-demo-accounts)
- [Role-Based Access Control](#-role-based-access-control)
- [Project Structure](#-project-structure)

---

## 🚀 Project Overview

**TaskFlow** is a full-stack, production-ready task management SPA (Single Page Application) that demonstrates professional frontend engineering. It consumes the [TaskFlow REST API](https://github.com/wahyanno/api-taskflow) and supports multi-user collaboration with fine-grained role-based permissions.

**Why this project?** It showcases end-to-end full-stack capability — from JWT auth flows to Kanban drag-and-drop — patterns commonly required in freelance and enterprise client projects.

### What makes it stand out

- 🎯 **Real RBAC enforcement** on the frontend — not just hiding buttons, UI adapts per role
- 🔄 **Optimistic UI updates** — drag-drop status changes feel instant, with rollback on failure
- 📋 **Audit trail integration** — activity logs surface within the UI
- 💅 **Production CSS design system** — custom CSS variables, dark-themed, zero external UI frameworks
- ⚡ **Overdue task detection** — computed server-side, surfaced in the UI with visual indicators

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Angular 15 SPA                        │
│                  (Cloudflare Pages / Vercel)                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   app.module.ts                       │   │
│  │   Routes · HttpClientModule · ReactiveFormsModule    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  features/                    core/                        │
│  ┌─────────────────────┐  ┌──────────────────────────┐     │
│  │ auth/               │  │ services/                │     │
│  │  LoginComponent     │  │  AuthService   (JWT)    │     │
│  │  RegisterComponent  │  │  ProjectService         │     │
│  │                     │  │  TaskService            │     │
│  │ dashboard/          │  │  ProjectStatusService   │     │
│  │  DashboardComponent │  │  UserService            │     │
│  │                     │  ├──────────────────────────┤     │
│  │ projects/           │  │ guards/                  │     │
│  │  ProjectListComponent│  │  AuthGuard (JWT check)  │     │
│  │  ProjectDetailComponent│├──────────────────────────┤     │
│  │  (Table + Kanban)  │  │ interceptors/            │     │
│  │                     │  │  AuthInterceptor (token) │     │
│  └─────────────────────┘  └──────────────────────────┘     │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP + Bearer JWT
                             ▼
              ┌──────────────────────────┐
              │   TaskFlow REST API      │
              │   (Yii2 + PostgreSQL)    │
              │  api-taskflow.fly.dev    │
              └──────────────────────────┘
```

**Data Flow:**
1. `AuthInterceptor` automatically attaches `Authorization: Bearer <token>` to every HTTP request
2. `AuthGuard` protects all routes — unauthenticated users are redirected to `/auth/login`
3. Components use `async/await` + RxJS Observables with explicit error handling
4. SweetAlert2 is used for all confirmations and feedback (no native `alert()`)

---

## 💻 Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Angular 15 |
| Language | TypeScript 5 |
| Styling | Vanilla CSS with CSS custom properties (design tokens) |
| HTTP Client | Angular HttpClient + RxJS |
| Forms | Angular Reactive Forms |
| Notifications | SweetAlert2 |
| Drag & Drop | HTML5 native Drag & Drop API |
| Routing | Angular Router with `AuthGuard` |
| Auth | JWT stored in `localStorage` |
| Deployment | Cloudflare Pages |

---

## ✨ Features

### 🔐 Authentication
- Secure login and registration (Reactive Forms with validation)
- JWT token stored in `localStorage`
- Auto-redirect on expired/invalid token
- `AuthInterceptor` auto-attaches token to every request

### 📊 Dashboard
- Role-aware statistics (Admins see all projects, Members see their own)
- Total projects, tasks, completed tasks, overdue count
- Completion percentage with visual indicator
- Recent projects list

### 📁 Project Management
- Paginated project list with status filter (All / Active / Completed)
- Create, update, soft-delete projects
- Team member management (add/remove)
- Project activity log (audit trail)

### ✅ Task Management
- Table view + **Kanban board** (togglable)
- Create, update, soft-delete tasks
- Assign tasks to team members
- Priority levels: Low / Medium / High (with color badges)
- **Overdue detection** — visual warning for past-due unfinished tasks
- Task activity log (who changed what)

### 🏷 Custom Kanban Statuses
- Per-project custom status columns (not hardcoded)
- **Drag & drop reordering** of columns in the modal
- Color-coded status dots (gray, blue, green, red, yellow, purple, orange)
- Task count per status column

### 🎨 UI/UX
- Dark-themed design with CSS custom properties
- Fully responsive layout (sidebar collapses on mobile)
- SweetAlert2 for all confirmations — no native `alert()` / `confirm()`
- Smooth transitions and loading states
- Empty state illustrations

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+
- Angular CLI 15: `npm install -g @angular/cli@15`

### 1. Clone the repository

```bash
git clone https://github.com/wahyanno/taskflow.git
cd taskflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the API URL

Open `src/environments/environment.ts` and set your API URL:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',  // Your local API server
};
```

For production, update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api-taskflow.fly.dev',  // Your deployed API
};
```

### 4. Start the development server

```bash
ng serve
# or
npm start
```

Open `http://localhost:4200` in your browser.

### 5. Build for production

```bash
ng build --configuration=production
```

Output will be in `dist/taskflow/` — deploy this folder to any static host (Cloudflare Pages, Vercel, Netlify).

---

## 🌍 Environment Configuration

Unlike the backend, the Angular app does **not** use `.env` files. API URLs are managed through Angular's environment files:

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | Development settings |
| `src/environments/environment.prod.ts` | Production settings |

> The only sensitive "config" in the frontend is the `apiUrl`. No secrets are stored in the Angular app.

---

## 🔖 Demo Accounts

> Make sure you have the [backend API](https://github.com/wahyanno/api-taskflow) running and database seeded first.

| Role | Email | Password | Capabilities |
|------|-------|----------|-------------|
| 👑 Admin | `admin@taskflow.dev` | `password123` | Full access — all projects, all tasks, delete anything |
| 📋 Manager | `manager@taskflow.dev` | `password123` | Create projects, manage tasks, add members |
| 👤 Member | `member@taskflow.dev` | `password123` | View projects, update task status (assigned only) |

---

## 🔐 Role-Based Access Control

The UI is fully role-aware — buttons and sections appear/disappear based on the logged-in user's role.

| UI Action | Admin | Manager | Member |
|-----------|:-----:|:-------:|:------:|
| Create project button | ✅ | ✅ | ❌ |
| Delete project button | ✅ | ❌ | ❌ |
| Add task button | ✅ | ✅ | ❌ |
| Delete task button | ✅ | ✅ | ❌ |
| Manage Statuses button | ✅ | ✅ | ❌ |
| Change task status | ✅ | ✅ | ✅ (kanban drag) |
| View activity logs | ✅ | ✅ | ✅ |
| See all projects | ✅ | ✅ | ❌ |

---

## 📂 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts           # Protects all routes
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts     # Attaches JWT to requests
│   │   ├── models/
│   │   │   └── models.ts               # All TypeScript interfaces (Project, Task, etc.)
│   │   └── services/
│   │       ├── auth.service.ts         # Login, logout, user state
│   │       ├── project.service.ts      # Project CRUD + members + logs
│   │       ├── task.service.ts         # Task CRUD + status updates
│   │       ├── project-status.service.ts  # Custom status management
│   │       └── user.service.ts         # User list + profile
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/                  # Login page
│   │   │   └── register/               # Registration page
│   │   ├── dashboard/                  # Stats + recent projects
│   │   └── projects/
│   │       ├── project-list/           # All projects (paginated + filter)
│   │       └── project-detail/         # Tasks + Kanban + Status management
│   │
│   ├── app.component.ts                # Root: layout, sidebar, logout
│   ├── app.module.ts                   # All modules + routing
│   └── app-routing.module.ts           # Routes definition
│
├── environments/
│   ├── environment.ts                  # Dev: API URL
│   └── environment.prod.ts             # Prod: API URL
│
└── styles.scss                         # Global design system (CSS variables)
```

---

## 🚢 Deployment (Cloudflare Pages)

1. Push to GitHub
2. Connect repo to [Cloudflare Pages](https://pages.cloudflare.com)
3. Set build command: `ng build --configuration=production`
4. Set output directory: `dist/taskflow`
5. Done — auto-deploys on every push to `main`

---

<div align="center">

Built with ❤️ by **[@wahyanno](https://github.com/wahyanno)**  
*Portfolio project — Open for freelance opportunities*

</div>
