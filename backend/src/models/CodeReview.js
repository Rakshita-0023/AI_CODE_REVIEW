import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const CodeReview = sequelize.define('CodeReview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalCode: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  language: {
    type: DataTypes.ENUM('python', 'javascript', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift', 'typescript', 'sql', 'auto'),
    allowNull: false
  },
  reviewType: {
    type: DataTypes.ENUM('review', 'debug', 'approaches', 'optimize'),
    allowNull: false
  },
  aiResponse: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
});

CodeReview.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(CodeReview, { foreignKey: 'userId' });

export default CodeReview;