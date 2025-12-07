import User from './User.js';
import RefreshToken from './RefreshToken.js';
import OAuthAccount from './OAuthAccount.js';
import Project from './Project.js';
import File from './File.js';
import Problem from './Problem.js';
import AIInteraction from './AIInteraction.js';
import Note from './Note.js';
import Analysis from './Analysis.js';
import CodeReview from './CodeReview.js';

// Define associations
User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(OAuthAccount, { foreignKey: 'userId', onDelete: 'CASCADE' });
OAuthAccount.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Project, { foreignKey: 'userId', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'userId' });

Project.hasMany(File, { foreignKey: 'projectId', onDelete: 'CASCADE' });
File.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(AIInteraction, { foreignKey: 'userId', onDelete: 'CASCADE' });
AIInteraction.belongsTo(User, { foreignKey: 'userId' });

Project.hasMany(AIInteraction, { foreignKey: 'projectId', onDelete: 'SET NULL' });
AIInteraction.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(Note, { foreignKey: 'userId', onDelete: 'CASCADE' });
Note.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Analysis, { foreignKey: 'userId', onDelete: 'CASCADE' });
Analysis.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CodeReview, { foreignKey: 'userId', onDelete: 'CASCADE' });
CodeReview.belongsTo(User, { foreignKey: 'userId' });

export {
  User,
  RefreshToken,
  OAuthAccount,
  Project,
  File,
  Problem,
  AIInteraction,
  Note,
  Analysis,
  CodeReview
};