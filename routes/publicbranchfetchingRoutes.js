const express = require('express');
const PublicBranchFetching = require('../models/PublicBranchFetching');

const router = express.Router();

// GET /api/branches - Fetch all active branches with optional service filter
router.get('/', async (req, res) => {
  try {
    const { serviceType } = req.query;
    const query = { isActive: true };
    
    if (serviceType) {
      query.availableServices = serviceType;
    }
    
    const branches = await PublicBranchFetching.find(query).sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    console.error('Branch fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// GET /api/branches/:id - Fetch specific branch
router.get('/:id', async (req, res) => {
  try {
    const branch = await PublicBranchFetching.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    console.error('Branch fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

module.exports = router;
