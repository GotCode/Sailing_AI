import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import PolarDiagram from '../models/PolarDiagram';

const router = express.Router();

// Get all polars for user (including public ones)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userPolars = await PolarDiagram.find({ userId: req.userId }).sort({ updatedAt: -1 });
    const publicPolars = await PolarDiagram.find({ isPublic: true, userId: { $ne: req.userId } })
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({
      userPolars,
      publicPolars,
    });
  } catch (error) {
    console.error('Fetch polars error:', error);
    res.status(500).json({ error: 'Failed to fetch polar diagrams' });
  }
});

// Get single polar
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const polar = await PolarDiagram.findOne({
      _id: req.params.id,
      $or: [{ userId: req.userId }, { isPublic: true }],
    });

    if (!polar) {
      return res.status(404).json({ error: 'Polar diagram not found' });
    }

    res.json({ polar });
  } catch (error) {
    console.error('Fetch polar error:', error);
    res.status(500).json({ error: 'Failed to fetch polar diagram' });
  }
});

// Get default Lagoon 440 polar
router.get('/default/lagoon440', async (req, res) => {
  try {
    const polar = await PolarDiagram.findOne({ boatModel: 'Lagoon 440', isDefault: true });

    if (!polar) {
      return res.status(404).json({ error: 'Default Lagoon 440 polar not found' });
    }

    res.json({ polar });
  } catch (error) {
    console.error('Fetch default polar error:', error);
    res.status(500).json({ error: 'Failed to fetch default polar' });
  }
});

// Create polar
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      boatType,
      boatModel,
      description,
      length,
      beam,
      displacement,
      sailArea,
      polarData,
      isPublic,
    } = req.body;

    const polar = new PolarDiagram({
      userId: req.userId,
      name,
      boatType,
      boatModel,
      description,
      length,
      beam,
      displacement,
      sailArea,
      polarData,
      isPublic: isPublic || false,
      isDefault: false,
    });

    await polar.save();
    res.status(201).json({ polar });
  } catch (error) {
    console.error('Create polar error:', error);
    res.status(500).json({ error: 'Failed to create polar diagram' });
  }
});

// Update polar
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const polar = await PolarDiagram.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!polar) {
      return res.status(404).json({ error: 'Polar diagram not found' });
    }

    // Update fields
    const {
      name,
      boatType,
      boatModel,
      description,
      length,
      beam,
      displacement,
      sailArea,
      polarData,
      isPublic,
    } = req.body;

    if (name !== undefined) polar.name = name;
    if (boatType !== undefined) polar.boatType = boatType;
    if (boatModel !== undefined) polar.boatModel = boatModel;
    if (description !== undefined) polar.description = description;
    if (length !== undefined) polar.length = length;
    if (beam !== undefined) polar.beam = beam;
    if (displacement !== undefined) polar.displacement = displacement;
    if (sailArea !== undefined) polar.sailArea = sailArea;
    if (polarData !== undefined) polar.polarData = polarData;
    if (isPublic !== undefined) polar.isPublic = isPublic;

    await polar.save();
    res.json({ polar });
  } catch (error) {
    console.error('Update polar error:', error);
    res.status(500).json({ error: 'Failed to update polar diagram' });
  }
});

// Delete polar
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const polar = await PolarDiagram.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!polar) {
      return res.status(404).json({ error: 'Polar diagram not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete polar error:', error);
    res.status(500).json({ error: 'Failed to delete polar diagram' });
  }
});

// Clone polar (copy public polar to user's account)
router.post('/:id/clone', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sourcePolar = await PolarDiagram.findOne({
      _id: req.params.id,
      isPublic: true,
    });

    if (!sourcePolar) {
      return res.status(404).json({ error: 'Public polar diagram not found' });
    }

    // Create a copy for the user
    const newPolar = new PolarDiagram({
      userId: req.userId,
      name: `${sourcePolar.name} (Copy)`,
      boatType: sourcePolar.boatType,
      boatModel: sourcePolar.boatModel,
      description: sourcePolar.description,
      length: sourcePolar.length,
      beam: sourcePolar.beam,
      displacement: sourcePolar.displacement,
      sailArea: sourcePolar.sailArea,
      polarData: sourcePolar.polarData,
      isPublic: false,
      isDefault: false,
    });

    await newPolar.save();
    res.status(201).json({ polar: newPolar });
  } catch (error) {
    console.error('Clone polar error:', error);
    res.status(500).json({ error: 'Failed to clone polar diagram' });
  }
});

// Search public polars by boat model
router.get('/search/:boatModel', authMiddleware, async (req, res) => {
  try {
    const { boatModel } = req.params;
    const polars = await PolarDiagram.find({
      boatModel: new RegExp(boatModel, 'i'),
      isPublic: true,
    }).limit(20);

    res.json({ polars });
  } catch (error) {
    console.error('Search polars error:', error);
    res.status(500).json({ error: 'Failed to search polar diagrams' });
  }
});

export default router;
