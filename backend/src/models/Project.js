import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Project = sequelize.define('Project', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('problem', 'project', 'sandbox'),
    defaultValue: 'sandbox',
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'javascript',
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastOpenedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      theme: 'dark',
      fontSize: 14,
      tabSize: 2,
    },
  },
}, {
  indexes: [
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['language'] },
    { fields: ['lastOpenedAt'] },
  ],
});

export default Project;