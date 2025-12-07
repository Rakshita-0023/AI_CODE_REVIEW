import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AIInteraction = sequelize.define('AIInteraction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Projects',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('review', 'debug', 'optimize', 'chat', 'explain'),
    allowNull: false,
  },
  input: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  output: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
  processingTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['userId'] },
    { fields: ['projectId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] },
  ],
});

export default AIInteraction;