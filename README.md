# AI-Powered Code Reviewer

A full-stack web application that uses AI to review, debug, and optimize code in multiple programming languages.

## Features

### 🔍 **Code Analysis**
- **Code Review**: Comprehensive quality analysis with scoring (0-100)
- **Bug Detection**: Identify and fix syntax/logic errors
- **Alternative Approaches**: Suggest different coding paradigms and algorithms
- **Performance Optimization**: Runtime and memory improvements

### 💻 **Editor Features**
- Monaco Editor (VS Code engine) with syntax highlighting
- Support for 13+ programming languages
- Auto-language detection
- Dark/Light theme support
- Real-time code statistics

### 🤖 **AI Integration**
- Multiple AI providers (OpenAI, Anthropic, AWS Bedrock)
- Structured analysis results
- Line-by-line issue detection
- Code quality scoring
- Performance metrics

### 📊 **User Features**
- Analysis history tracking
- Export results (JSON, PDF)
- User authentication (optional)
- Responsive design
- Mobile-friendly interface

## Tech Stack

### Frontend
- **React 18** with Vite
- **Monaco Editor** for code editing
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Axios** for API calls
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** authentication
- **Rate limiting** and security middleware
- **Multi-AI provider** support

### DevOps
- **Docker** containerization
- **Docker Compose** for local development
- **Nginx** for production serving
- **Health checks** and monitoring

## Quick Start

### Prerequisites
- Node.js 18+
- Neon PostgreSQL database (free tier available)
- Google Gemini API key

### 1. Clone and Setup
```bash
git clone <repository-url>
cd AI_CODE_REVIEW

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your AI API keys

# Frontend setup
cd ../frontend/my-app
npm install
```

### 2. Environment Configuration

**Backend (.env)**:
```env
PORT=5001
DATABASE_URL=postgresql://username:password@ep-example.us-east-1.aws.neon.tech/ai-code-reviewer?sslmode=require
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:5001/api
```

### 3. Run Locally (Development)
```bash
# Quick start (runs both backend and frontend)
./start-local.sh

# Or manually:
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend/my-app
npm run dev

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:5001
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/preferences` - Update user preferences

### AI Analysis
- `POST /api/ai/review` - Code quality review
- `POST /api/ai/debug` - Bug detection and fixes
- `POST /api/ai/approaches` - Alternative approaches
- `POST /api/ai/optimize` - Performance optimization

### Code Management
- `GET /api/code/history` - User's analysis history
- `GET /api/code/review/:id` - Get specific review
- `DELETE /api/code/review/:id` - Delete review
- `GET /api/code/analytics` - User analytics

## Supported Languages

- JavaScript/TypeScript
- Python
- Java
- C/C++
- C#
- PHP
- Ruby
- Go
- Rust
- Kotlin
- Swift
- SQL
- Auto-detection

## AI Providers

### OpenAI (Default)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-key
```

### Anthropic Claude
```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
```

### AWS Bedrock
```env
AI_PROVIDER=bedrock
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BEDROCK_REGION=us-east-1
```

## Deployment

### AWS Deployment
1. **ECS with Fargate**:
   ```bash
   # Build and push images
   docker build -t your-registry/ai-code-reviewer-backend ./backend
   docker build -t your-registry/ai-code-reviewer-frontend ./frontend/my-app
   
   # Deploy to ECS
   # Use provided task definitions in /deployment folder
   ```

2. **Lambda + S3**:
   - Frontend: Deploy to S3 + CloudFront
   - Backend: Serverless with Lambda functions
   - Database: DocumentDB or MongoDB Atlas

### Production Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai-code-reviewer
JWT_SECRET=super-secure-production-secret
OPENAI_API_KEY=prod-openai-key
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes
- **Helmet.js**: Security headers
- **CORS**: Configured for production domains
- **JWT**: Secure authentication
- **Input Validation**: Request sanitization
- **Error Handling**: No sensitive data exposure

## Performance Optimizations

- **Code Splitting**: Lazy-loaded components
- **Caching**: Static asset caching
- **Compression**: Gzip enabled
- **Database Indexing**: Optimized queries
- **Connection Pooling**: MongoDB connections

## Monitoring & Health Checks

- **Health Endpoint**: `/health`
- **Docker Health Checks**: Container monitoring
- **Error Logging**: Structured logging
- **Performance Metrics**: Response time tracking

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or create an issue in the repository.

---

**Built with ❤️ using React, Node.js, and AI**