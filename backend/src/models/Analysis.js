import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('review', 'debug', 'approaches', 'optimize'),
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalCode: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  result: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  qualityScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  processingTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  indexes: [
    {
      fields: ['userId', 'createdAt'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['language'],
    },
  ],
});

// Define associations
User.hasMany(Analysis, { foreignKey: 'userId', as: 'analyses' });
Analysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Analysis;