import express from 'express';
import { Op } from 'sequelize';
import Project from '../models/Project.js';
import File from '../models/File.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get user projects with search, filter, and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      search,
      type,
      language,
      sortBy = 'lastOpened',
      page = 1,
      limit = 12
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };

    // Add search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add type filter
    if (type && type !== 'all') {
      where.type = type;
    }

    // Add language filter
    if (language && language !== 'all') {
      where.language = language;
    }

    // Set sort order
    let order;
    switch (sortBy) {
      case 'created':
        order = [['createdAt', 'DESC']];
        break;
      case 'title':
        order = [['title', 'ASC']];
        break;
      default:
        order = [['lastOpenedAt', 'DESC']];
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset,
      include: [{
        model: File,
        attributes: ['id', 'name', 'language'],
        limit: 1,
        where: { isMain: true },
        required: false
      }]
    });

    res.json({
      projects,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalProjects, weeklyActivity] = await Promise.all([
      Project.count({ where: { userId } }),
      Project.count({
        where: {
          userId,
          lastOpenedAt: { [Op.gte]: oneWeekAgo }
        }
      })
    ]);

    // Mock data for other stats (implement with actual models later)
    const stats = {
      totalProjects,
      totalAnalyses: 0, // Will be implemented with AIInteraction model
      totalProblems: 0, // Will be implemented with Problem submissions
      weeklyActivity
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Create new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, type = 'sandbox', language = 'javascript', tags = [] } = req.body;

    const project = await Project.create({
      userId: req.user.id,
      title,
      description,
      type,
      language,
      tags
    });

    // Create default main file
    await File.create({
      projectId: project.id,
      name: getDefaultFileName(language),
      path: `/${getDefaultFileName(language)}`,
      content: getStarterCode(language),
      language,
      isMain: true
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get single project with files
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: File,
        order: [['isMain', 'DESC'], ['name', 'ASC']]
      }]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update last opened time
    await project.update({ lastOpenedAt: new Date() });

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, tags, settings, content, lastOpenedAt } = req.body;

    const project = await Project.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{ model: File, where: { isMain: true }, required: false }]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update project metadata
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (settings !== undefined) updateData.settings = { ...project.settings, ...settings };
    if (lastOpenedAt !== undefined) updateData.lastOpenedAt = lastOpenedAt;

    await project.update(updateData);

    // Update main file content if provided
    if (content !== undefined && project.Files && project.Files.length > 0) {
      await project.Files[0].update({ content });
    }

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete associated files first
    await File.destroy({ where: { projectId: project.id } });
    
    // Delete project
    await project.destroy();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Helper functions
function getDefaultFileName(language) {
  const extensions = {
    javascript: 'main.js',
    typescript: 'main.ts',
    python: 'main.py',
    java: 'Main.java',
    cpp: 'main.cpp',
    c: 'main.c',
    csharp: 'Program.cs',
    php: 'index.php',
    ruby: 'main.rb',
    go: 'main.go',
    rust: 'main.rs',
    kotlin: 'Main.kt',
    swift: 'main.swift'
  };
  return extensions[language] || 'main.txt';
}

function getStarterCode(language) {
  const starters = {
    javascript: `// Welcome to your new JavaScript project
console.log("Hello, World!");

function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`,
    python: `# Welcome to your new Python project
print("Hello, World!")

def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println(greet("Developer"));
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,
    cpp: `#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

int main() {
    std::cout << "Hello, World!" << std::endl;
    std::cout << greet("Developer") << std::endl;
    return 0;
}`
  };
  return starters[language] || `// Welcome to your new ${language} project\n`;
}

export default router;