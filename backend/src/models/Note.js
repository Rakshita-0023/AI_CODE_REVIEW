import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Note = sequelize.define('Note', {
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
    defaultValue: 'Untitled Note',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: 'default',
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  folder: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastModified: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'notes',
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['userId', 'isPinned'],
    },
    {
      fields: ['userId', 'folder'],
    },
  ],
});

// Update lastModified on save
Note.beforeUpdate((note) => {
  note.lastModified = new Date();
});

export default Note;