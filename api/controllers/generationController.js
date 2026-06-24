import Generation from '../models/Generation.js';

export const createGeneration = async (req, res) => {
  try {
    const { repoUrl, repoOwner, repoName, customInstructions, markdown, status, jobId } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ message: 'Repository URL is required.' });
    }

    const generation = await Generation.create({
      userId: req.user.id,
      repoUrl,
      repoOwner: repoOwner || '',
      repoName: repoName || '',
      customInstructions: customInstructions || '',
      markdown: markdown || '',
      status: status || 'completed',
      jobId: jobId || null,
    });

    res.status(201).json({ success: true, generation });
  } catch (error) {
    console.error('Create generation error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getGenerations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [generations, total] = await Promise.all([
      Generation.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Generation.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success: true,
      generations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + generations.length < total,
      },
    });
  } catch (error) {
    console.error('Get generations error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getGeneration = async (req, res) => {
  try {
    const generation = await Generation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!generation) {
      return res.status(404).json({ message: 'Generation not found.' });
    }

    res.json({ success: true, generation });
  } catch (error) {
    console.error('Get generation error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const deleteGeneration = async (req, res) => {
  try {
    const generation = await Generation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!generation) {
      return res.status(404).json({ message: 'Generation not found.' });
    }

    res.json({ success: true, message: 'Generation deleted.' });
  } catch (error) {
    console.error('Delete generation error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
