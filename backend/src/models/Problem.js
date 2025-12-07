import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Problem = sequelize.define('Problem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  constraints: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  examples: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  testCases: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  starterCode: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  solution: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  acceptanceRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  totalSubmissions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  acceptedSubmissions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  indexes: [
    { fields: ['difficulty'] },
    { fields: ['category'] },
    { fields: ['isActive'] },
  ],
});

export default Problem;