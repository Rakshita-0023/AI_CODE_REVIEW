# AI Code Review Platform - Complete Architectural Redesign

## Overview
This document outlines the complete transformation of your coding platform from a simple single-page application to a professional, scalable SaaS-style multi-page application with modern authentication, comprehensive project management, and enhanced user experience.

## 🔐 Authentication System Redesign

### New Authentication Flow
- **Unified Design**: Login and Signup pages now share identical styling and layout
- **Google OAuth Integration**: Both pages include Google OAuth buttons for seamless authentication
- **Secure Token Management**: 
  - Short-lived access tokens (15 minutes)
  - HTTP-only refresh tokens (7 days) stored in secure cookies
  - Automatic token refresh without user intervention
  - Proper token revocation on logout

### Security Enhancements
- JWT-based authentication with refresh token rotation
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration for production
- Input validation and sanitization

## 🏗️ New Database Schema

### Core Models

#### Users Table
```sql
- id (UUID, Primary Key)
- fullName (String)
- username (String, Unique)
- email (String, Unique)
- phone (String, Unique)
- password (Hashed)
- preferences (JSON)
- createdAt, updatedAt
```

#### RefreshTokens Table
```sql
- id (UUID, Primary Key)
- token (String, Unique)
- userId (UUID, Foreign Key)
- expiresAt (Date)
- isRevoked (Boolean)
- deviceInfo (JSON)
```

#### OAuthAccounts Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- provider (Enum: google, github)
- providerId (String)
- email (String)
- name (String)
- avatar (String)
- accessToken (Text)
- refreshToken (Text)
```

#### Projects Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- title (String)
- description (Text)
- type (Enum: problem, project, sandbox)
- language (String)
- tags (JSON Array)
- isPublic (Boolean)
- lastOpenedAt (Date)
- settings (JSON)
- createdAt, updatedAt
```

#### Files Table
```sql
- id (UUID, Primary Key)
- projectId (UUID, Foreign Key)
- name (String)
- path (String)
- content (Text)
- language (String)
- isMain (Boolean)
- size (Integer)
- createdAt, updatedAt
```

#### Problems Table
```sql
- id (UUID, Primary Key)
- title (String)
- description (Text)
- difficulty (Enum: easy, medium, hard)
- category (String)
- tags (JSON Array)
- constraints (Text)
- examples (JSON Array)
- testCases (JSON Array)
- starterCode (JSON Object)
- solution (JSON Object)
- isActive (Boolean)
- acceptanceRate (Float)
- totalSubmissions (Integer)
- acceptedSubmissions (Integer)
```

#### AIInteractions Table
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- projectId (UUID, Foreign Key, Nullable)
- type (Enum: review, debug, optimize, chat, explain)
- input (Text)
- output (Text)
- language (String)
- metadata (JSON)
- rating (Integer, 1-5)
- processingTime (Integer)
- createdAt, updatedAt
```

## 🎨 New Page Structure

### 1. Dashboard (Main Hub)
- **Welcome Section**: Personalized greeting with user stats
- **Statistics Cards**: 
  - Total Projects
  - AI Analyses Count
  - Problems Solved
  - Weekly Activity
- **Quick Actions**: 
  - New Sandbox (instant project creation)
  - Browse Problems
  - AI Chat
  - View Analytics
- **Recent Projects**: Grid of recently opened workspaces

### 2. Workspaces Page
- **Advanced Search**: Real-time search across project titles and descriptions
- **Dynamic Filtering**: 
  - Type (sandbox, project, problem)
  - Language
  - Sort by (last opened, created, title)
- **Backend Pagination**: Server-side pagination for scalability
- **Project Cards**: Rich metadata display with actions
- **Bulk Operations**: Select multiple projects for batch actions

### 3. Problems Page (LeetCode-style)
- **Problem Browser**: Searchable and filterable problem list
- **Difficulty Indicators**: Visual difficulty badges with icons
- **Category Filtering**: Array, String, Tree, Graph, etc.
- **Progress Tracking**: Solved/unsolved status indicators
- **Acceptance Rates**: Community statistics
- **Tag System**: Multiple tags per problem

### 4. Code Editor Workspace (Enhanced)
- **Multi-file Support**: Tab-based file management
- **Monaco Editor**: VS Code-like editing experience
- **Collapsible Panels**:
  - Left: File explorer, project settings
  - Right: AI assistant, code analysis
  - Bottom: Console output, debugger, test results
- **Top Action Bar**: Run, Debug, Language Select, AI Analyze, Save
- **Real-time Collaboration**: Foundation for future team features

### 5. AI Chat Page
- **Dedicated AI Interface**: Full-screen chat experience
- **Context Awareness**: Integration with current projects
- **Chat History**: Persistent conversation threads
- **Code Snippets**: Syntax-highlighted code in responses
- **Export Options**: Save conversations as notes

### 6. History & Analytics
- **Comprehensive History**: All AI interactions and analyses
- **Advanced Filtering**: By date, type, project, language
- **Analytics Dashboard**: Usage patterns and insights
- **Export Capabilities**: JSON, PDF export options

### 7. Notes Management
- **Rich Text Editor**: Markdown support with live preview
- **Organization**: Folders and tags system
- **Search**: Full-text search across all notes
- **Project Linking**: Associate notes with specific projects

## 🔧 Backend API Architecture

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - Email/password login
POST /api/auth/google - Google OAuth login
POST /api/auth/refresh - Token refresh
POST /api/auth/logout - Secure logout
GET /api/auth/me - Current user profile
PATCH /api/auth/preferences - Update preferences
```

### Project Management
```
GET /api/projects - List projects (with search/filter/pagination)
POST /api/projects - Create new project
GET /api/projects/stats - User statistics
GET /api/projects/:id - Get project with files
PUT /api/projects/:id - Update project
DELETE /api/projects/:id - Delete project
```

### File Management
```
GET /api/projects/:id/files - List project files
POST /api/projects/:id/files - Create new file
PUT /api/projects/:id/files/:fileId - Update file
DELETE /api/projects/:id/files/:fileId - Delete file
```

### AI Services
```
POST /api/ai/review - Code quality analysis
POST /api/ai/debug - Bug detection and fixes
POST /api/ai/optimize - Performance optimization
POST /api/ai/chat - AI conversation
POST /api/ai/explain - Code explanation
```

## 🎯 Frontend State Management

### Updated Zustand Store Structure
```javascript
{
  // Authentication
  user: null,
  token: null,
  isAuthenticated: false,
  
  // Projects
  currentProject: null,
  projects: [],
  projectsLoading: false,
  
  // Editor
  activeFiles: [],
  currentFile: null,
  editorSettings: {},
  
  // AI
  aiHistory: [],
  currentChat: null,
  
  // UI State
  sidebarCollapsed: false,
  activePanel: 'files',
  theme: 'dark'
}
```

### Token Management
- Automatic refresh token handling in API interceptors
- Seamless re-authentication without user disruption
- Secure storage using HTTP-only cookies for refresh tokens
- Local storage for access tokens with automatic cleanup

## 🚀 Navigation & Routing

### Protected Route Structure
```
/ - Landing page (public)
/signin - Login page (public)
/signup - Registration page (public)
/dashboard - Main dashboard (protected)
/workspaces - Project management (protected)
/problems - Coding challenges (protected)
/problems/:id - Individual problem (protected)
/editor/:projectId - Code editor (protected)
/ai-chat - AI assistant (protected)
/history - Analysis history (protected)
/notes - Notes management (protected)
/analytics - Usage analytics (protected)
/settings - User settings (protected)
```

### Navigation Components
- **Desktop**: Fixed sidebar with collapsible sections
- **Mobile**: Responsive hamburger menu with slide-out drawer
- **Breadcrumbs**: Context-aware navigation breadcrumbs
- **Quick Actions**: Floating action buttons for common tasks

## 🔒 Security Implementation

### Authentication Security
- Bcrypt password hashing (12 rounds)
- JWT tokens with short expiration
- Refresh token rotation
- Device fingerprinting for sessions
- Rate limiting on auth endpoints

### API Security
- Helmet.js security headers
- CORS with specific origin whitelist
- Request size limits
- SQL injection prevention with Sequelize ORM
- Input validation and sanitization

### Data Protection
- Sensitive data exclusion in API responses
- Encrypted database connections
- Environment variable configuration
- Audit logging for sensitive operations

## 📊 Performance Optimizations

### Frontend
- Code splitting with React.lazy()
- Memoized components with React.memo()
- Virtual scrolling for large lists
- Debounced search inputs
- Optimistic UI updates

### Backend
- Database indexing on frequently queried fields
- Connection pooling
- Response caching for static data
- Pagination for large datasets
- Background job processing for heavy operations

### Database
- Proper foreign key relationships
- Composite indexes for complex queries
- Soft deletes for data recovery
- Automated backups and migrations

## 🚀 Deployment Strategy

### Development Environment
```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend
cd frontend/my-app
npm install
npm run dev
```

### Production Deployment
- **Database**: PostgreSQL with connection pooling
- **Backend**: Node.js with PM2 process management
- **Frontend**: Static build deployed to CDN
- **Reverse Proxy**: Nginx for load balancing
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Health checks and error tracking

## 📈 Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Session storage in Redis
- Database read replicas
- CDN for static assets
- Microservices architecture preparation

### Monitoring & Analytics
- Application performance monitoring
- Error tracking and alerting
- User behavior analytics
- Resource usage monitoring
- Automated scaling triggers

## 🔄 Migration Path

### Phase 1: Authentication Upgrade
1. Implement new authentication system
2. Migrate existing users to new schema
3. Deploy Google OAuth integration
4. Test token refresh mechanisms

### Phase 2: Database Migration
1. Create new database schema
2. Migrate existing data to new structure
3. Update API endpoints
4. Implement new project management

### Phase 3: Frontend Redesign
1. Deploy new navigation structure
2. Implement new dashboard
3. Create workspace management
4. Add problems browser

### Phase 4: Enhanced Features
1. Multi-file editor support
2. Advanced AI chat interface
3. Analytics and reporting
4. Performance optimizations

This architectural redesign transforms your application into a professional, scalable platform ready for production use and future growth. The modular design allows for incremental implementation while maintaining backward compatibility during the transition period.