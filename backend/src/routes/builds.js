const express = require('express')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const createBuildSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  components: Joi.array().items(
    Joi.object({
      component_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().default(1)
    })
  ).required(),
  total_price: Joi.number().positive().required(),
  is_public: Joi.boolean().default(false),
  is_submitted: Joi.boolean().default(true)
})

// Get all public builds (search)
router.get('/search', async (req, res) => {
  try {
    const { 
      search, 
      sort = 'updated', 
      filter = 'all',
      minPrice,
      maxPrice,
      cpuBrand,
      budget
    } = req.query
    
    // Try to get user_id from token if present (optional auth)
    let userId = null
    try {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        userId = decoded.userId
      }
    } catch (error) {
      // Token invalid or not present - continue without user
    }
    
    // Build the query with subquery to get CPU manufacturer
    let sql = `
      SELECT b.*, u.name as user_name,
             (SELECT COUNT(*) FROM build_likes bl WHERE bl.build_id = b.build_id) as like_count,
             (SELECT m.manufacturer_id 
              FROM buildcomponent bc
              JOIN component c ON bc.component_id = c.component_id
              JOIN category cat ON c.category_id = cat.category_id
              JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id
              WHERE bc.build_id = b.build_id 
                AND cat.category_id = 1
              LIMIT 1) as cpu_manufacturer_id
      FROM build b 
      JOIN user u ON b.user_id = u.user_id 
      WHERE b.is_public = 1 AND b.is_submitted = 1
    `
    const params = []

    // Add search filter
    if (search) {
      sql += ' AND (b.name LIKE ? OR u.name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    // Add price range filter
    if (minPrice && minPrice !== '' && minPrice !== '0') {
      const minPriceNum = parseFloat(minPrice)
      if (!isNaN(minPriceNum) && minPriceNum > 0) {
        sql += ' AND b.total_price >= ?'
        params.push(minPriceNum)
      }
    }
    
    if (maxPrice && maxPrice !== '' && maxPrice !== '0') {
      const maxPriceNum = parseFloat(maxPrice)
      if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
        sql += ' AND b.total_price <= ?'
        params.push(maxPriceNum)
      }
    }

    // Add budget filter (under $1000) - only if no maxPrice is set
    if (budget === 'true' && (!maxPrice || maxPrice === '' || maxPrice === '0')) {
      sql += ' AND b.total_price <= 1000'
    }

    // Add CPU brand filter (AMD = 2, Intel = 1)
    if (cpuBrand) {
      if (cpuBrand.toLowerCase() === 'amd') {
        sql += ' AND EXISTS (SELECT 1 FROM buildcomponent bc JOIN component c ON bc.component_id = c.component_id JOIN category cat ON c.category_id = cat.category_id WHERE bc.build_id = b.build_id AND cat.category_id = 1 AND c.manufacturer_id = 2)'
      } else if (cpuBrand.toLowerCase() === 'intel') {
        sql += ' AND EXISTS (SELECT 1 FROM buildcomponent bc JOIN component c ON bc.component_id = c.component_id JOIN category cat ON c.category_id = cat.category_id WHERE bc.build_id = b.build_id AND cat.category_id = 1 AND c.manufacturer_id = 1)'
      }
    }

    // Add sorting
    switch (sort) {
      case 'price':
        sql += ' ORDER BY b.total_price ASC'
        break
      case 'name':
        sql += ' ORDER BY b.name ASC'
        break
      case 'popular':
        sql += ' ORDER BY like_count DESC, b.created_at DESC'
        break
      default:
        sql += ' ORDER BY b.updated_at DESC'
    }

    const [builds] = await pool.execute(sql, params)

    // Get user's like status for each build (if authenticated)
    if (userId) {
      const buildIds = builds.map(b => b.build_id)
      if (buildIds.length > 0) {
        const placeholders = buildIds.map(() => '?').join(',')
        const [userLikes] = await pool.execute(
          `SELECT build_id FROM build_likes WHERE build_id IN (${placeholders}) AND user_id = ?`,
          [...buildIds, userId]
        )
        const likedBuildIds = new Set(userLikes.map(l => l.build_id))
        
        builds.forEach(build => {
          build.user_liked = likedBuildIds.has(build.build_id)
        })
      }
    } else {
      builds.forEach(build => {
        build.user_liked = false
      })
    }

    res.json({
      status: 'success',
      builds
    })

  } catch (error) {
    console.error('Search builds error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch builds'
    })
  }
})

// Get user's builds
router.get('/my', authenticateToken, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { minPrice, maxPrice, cpuBrand, budget } = req.query
    
    // Build SQL query with CPU manufacturer info (similar to /search endpoint)
    let sql = `
      SELECT b.*, u.name as user_name,
             (SELECT COUNT(*) FROM build_likes bl WHERE bl.build_id = b.build_id) as like_count,
             (SELECT m.manufacturer_id 
              FROM buildcomponent bc
              JOIN component c ON bc.component_id = c.component_id
              JOIN category cat ON c.category_id = cat.category_id
              JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id
              WHERE bc.build_id = b.build_id 
                AND cat.category_id = 1
              LIMIT 1) as cpu_manufacturer_id
       FROM build b 
       JOIN user u ON b.user_id = u.user_id 
       WHERE b.user_id = ?
    `
    const params = [req.user.user_id]
    
    // Apply price filters
    if (minPrice && minPrice !== '' && minPrice !== '0') {
      const minPriceNum = parseFloat(minPrice)
      if (!isNaN(minPriceNum) && minPriceNum > 0) {
        sql += ' AND b.total_price >= ?'
        params.push(minPriceNum)
      }
    }
    
    if (maxPrice && maxPrice !== '' && maxPrice !== '0') {
      const maxPriceNum = parseFloat(maxPrice)
      if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
        sql += ' AND b.total_price <= ?'
        params.push(maxPriceNum)
      }
    }
    
    // Apply budget filter (under $1000) - only if no maxPrice is set
    if (budget === 'true' || budget === true) {
      if (!maxPrice || maxPrice === '' || maxPrice === '0') {
        sql += ' AND b.total_price <= 1000'
      }
    }
    
    // Apply CPU brand filter (AMD = 2, Intel = 1)
    if (cpuBrand && cpuBrand !== '') {
      const cpuBrandLower = cpuBrand.toLowerCase()
      if (cpuBrandLower === 'amd') {
        sql += ' AND EXISTS (SELECT 1 FROM buildcomponent bc JOIN component c ON bc.component_id = c.component_id JOIN category cat ON c.category_id = cat.category_id WHERE bc.build_id = b.build_id AND cat.category_id = 1 AND c.manufacturer_id = 2)'
      } else if (cpuBrandLower === 'intel') {
        sql += ' AND EXISTS (SELECT 1 FROM buildcomponent bc JOIN component c ON bc.component_id = c.component_id JOIN category cat ON c.category_id = cat.category_id WHERE bc.build_id = b.build_id AND cat.category_id = 1 AND c.manufacturer_id = 1)'
      }
    }
    
    // Add sorting
    sql += ' ORDER BY b.updated_at DESC'
    
    const [builds] = await pool.execute(sql, params)

    res.json({
      status: 'success',
      builds
    })

  } catch (error) {
    console.error('Get my builds error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your builds'
    })
  }
})

// IMPORTANT: All /:id/* routes must come BEFORE /:id route to avoid route conflicts

// Get build likes count and user's like status (optional auth)
router.get('/:id/likes', async (req, res) => {
  try {
    const buildId = req.params.id
    // Try to get user_id from token if present (optional auth)
    let userId = null
    try {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        userId = decoded.userId
      }
    } catch (error) {
      // Token invalid or not present - continue without user
    }

    // Get like count
    const [likeCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM build_likes WHERE build_id = ?',
      [buildId]
    )

    // Check if user has liked this build
    let userLiked = false
    if (userId) {
      const [userLike] = await pool.execute(
        'SELECT like_id FROM build_likes WHERE build_id = ? AND user_id = ?',
        [buildId, userId]
      )
      userLiked = userLike.length > 0
    }

    res.json({
      status: 'success',
      likeCount: likeCount[0].count,
      userLiked
    })

  } catch (error) {
    console.error('Get likes error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get likes'
    })
  }
})

// Toggle like (like/unlike)
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const buildId = req.params.id
    const userId = req.user.user_id

    console.log('Like request received - buildId:', buildId, 'userId:', userId)

    if (!buildId) {
      return res.status(400).json({
        status: 'error',
        message: 'Build ID is required'
      })
    }

    // Check if build exists and is public
    const [builds] = await pool.execute(
      'SELECT is_public, user_id FROM build WHERE build_id = ?',
      [buildId]
    )

    if (builds.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Build not found'
      })
    }

    const build = builds[0]

    // Prevent users from liking their own builds
    if (build.user_id === userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You cannot like your own build'
      })
    }

    if (!build.is_public) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot like private builds'
      })
    }

    // Check if build_likes table exists and check if user already liked this build
    let existingLike = []
    try {
      [existingLike] = await pool.execute(
        'SELECT like_id FROM build_likes WHERE build_id = ? AND user_id = ?',
        [buildId, userId]
      )
    } catch (tableError) {
      console.error('Error accessing build_likes table:', tableError)
      if (tableError.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          status: 'error',
          message: 'Likes feature not available. Please run: cd backend && node create-build-likes-table.js'
        })
      }
      throw tableError
    }

    if (existingLike.length > 0) {
      // Unlike: remove the like
      await pool.execute(
        'DELETE FROM build_likes WHERE build_id = ? AND user_id = ?',
        [buildId, userId]
      )

      // Get updated like count
      const [likeCountResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM build_likes WHERE build_id = ?',
        [buildId]
      )

      const likeCount = likeCountResult[0]?.count || 0

      res.json({
        status: 'success',
        message: 'Build unliked',
        likeCount: parseInt(likeCount),
        userLiked: false
      })
    } else {
      // Like: add the like
      try {
        await pool.execute(
          'INSERT INTO build_likes (build_id, user_id, created_at) VALUES (?, ?, NOW())',
          [buildId, userId]
        )
      } catch (insertError) {
        console.error('Insert like error:', insertError)
        // Check if it's a duplicate key error (race condition)
        if (insertError.code === 'ER_DUP_ENTRY') {
          // Like already exists, just get the count - continue
          console.log('Duplicate entry, continuing...')
        } else if (insertError.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({
            status: 'error',
            message: 'Likes feature not available. Please run: cd backend && node create-build-likes-table.js'
          })
        } else {
          throw insertError
        }
      }

      // Get updated like count
      const [likeCountResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM build_likes WHERE build_id = ?',
        [buildId]
      )

      const likeCount = likeCountResult[0]?.count || 0

      res.json({
        status: 'success',
        message: 'Build liked',
        likeCount: parseInt(likeCount),
        userLiked: true
      })
    }

  } catch (error) {
    console.error('Toggle like error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to toggle like'
    })
  }
})

// Duplicate build (MUST come before /:id)
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const buildId = req.params.id

    // Get original build (must be public or owned by user)
    const [builds] = await pool.execute(
      'SELECT * FROM build WHERE build_id = ? AND (is_public = 1 OR user_id = ?)',
      [buildId, req.user.user_id]
    )

    if (builds.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Build not found or not accessible'
      })
    }

    const originalBuild = builds[0]

    // Get original build components
    const [components] = await pool.execute(
      'SELECT * FROM buildcomponent WHERE build_id = ?',
      [buildId]
    )

    // Generate unique name
    let baseName = `${originalBuild.name} Copy`
    let counter = 1
    let newName = baseName
    
    while (true) {
      const [existing] = await pool.execute(
        'SELECT build_id FROM build WHERE name = ?',
        [newName]
      )
      if (existing.length === 0) break
      newName = `${baseName} ${counter}`
      counter++
    }

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Create new build (always private when duplicated)
      const [buildResult] = await connection.execute(
        `INSERT INTO build (user_id, name, is_public, total_price, created_at, updated_at, is_submitted) 
         VALUES (?, ?, 0, ?, NOW(), NOW(), ?)`,
        [req.user.user_id, newName, originalBuild.total_price, originalBuild.is_submitted || 0]
      )

      const newBuildId = buildResult.insertId

      // Copy components
      for (const component of components) {
        await connection.execute(
          'INSERT INTO buildcomponent (build_id, component_id, quantity) VALUES (?, ?, ?)',
          [newBuildId, component.component_id, component.quantity]
        )
      }

      await connection.commit()

      res.json({
        status: 'success',
        message: 'Build duplicated successfully',
        build_id: newBuildId
      })

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Duplicate build error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to duplicate build'
    })
  }
})

// Toggle build visibility (public/private) (MUST come before /:id)
router.put('/:id/visibility', authenticateToken, async (req, res) => {
  try {
    const buildId = req.params.id
    const { is_public } = req.body

    // Check if build exists and user owns it
    const [builds] = await pool.execute(
      'SELECT user_id FROM build WHERE build_id = ?',
      [buildId]
    )

    if (builds.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Build not found'
      })
    }

    if (builds[0].user_id !== req.user.user_id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    await pool.execute(
      'UPDATE build SET is_public = ?, updated_at = NOW() WHERE build_id = ?',
      [is_public ? 1 : 0, buildId]
    )

    res.json({
      status: 'success',
      message: `Build ${is_public ? 'made public' : 'made private'} successfully`
    })

  } catch (error) {
    console.error('Toggle visibility error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update build visibility'
    })
  }
})

// Get specific build (MUST BE LAST - after all /:id/* routes)
router.get('/:id', async (req, res) => {
  try {
    const buildId = req.params.id

    // Get build info (b.* includes user_id from build table)
    const [builds] = await pool.execute(
      `SELECT b.*, u.name as user_name
       FROM build b 
       JOIN user u ON b.user_id = u.user_id 
       WHERE b.build_id = ?`,
      [buildId]
    )

    if (builds.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Build not found'
      })
    }

    const build = builds[0]

    // Get build components
    const [components] = await pool.execute(
      `SELECT c.*, cat.name as category, m.name as manufacturer, bc.quantity
       FROM buildcomponent bc
       JOIN component c ON bc.component_id = c.component_id
       JOIN category cat ON c.category_id = cat.category_id
       JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id
       WHERE bc.build_id = ?
       ORDER BY cat.category_id`,
      [buildId]
    )

    res.json({
      status: 'success',
      build,
      components
    })

  } catch (error) {
    console.error('Get build error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch build'
    })
  }
})

// Create build
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createBuildSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      })
    }

    const { name, components, total_price, is_public, is_submitted } = value

    // Check if build name already exists
    const [existingBuilds] = await pool.execute(
      'SELECT build_id FROM build WHERE name = ?',
      [name]
    )

    if (existingBuilds.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Build name already exists'
      })
    }

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Create build
      const [buildResult] = await connection.execute(
        `INSERT INTO build (user_id, name, is_public, total_price, created_at, updated_at, is_submitted) 
         VALUES (?, ?, ?, ?, NOW(), NOW(), ?)`,
        [req.user.user_id, name, is_public, total_price, is_submitted]
      )

      const buildId = buildResult.insertId

      // Add components
      for (const component of components) {
        await connection.execute(
          'INSERT INTO buildcomponent (build_id, component_id, quantity) VALUES (?, ?, ?)',
          [buildId, component.component_id, component.quantity]
        )
      }

      await connection.commit()

      res.status(201).json({
        status: 'success',
        message: 'Build created successfully',
        build_id: buildId
      })

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Create build error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to create build'
    })
  }
})

// Update build
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const buildId = req.params.id
    const { error, value } = createBuildSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      })
    }

    const { name, components, total_price, is_public, is_submitted } = value

    // Check if build exists and user owns it
    const [builds] = await pool.execute(
      'SELECT user_id FROM build WHERE build_id = ?',
      [buildId]
    )

    if (builds.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Build not found'
      })
    }

    if (builds[0].user_id !== req.user.user_id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Update build
      await connection.execute(
        `UPDATE build SET name = ?, is_public = ?, total_price = ?, is_submitted = ?, updated_at = NOW() 
         WHERE build_id = ?`,
        [name, is_public, total_price, is_submitted, buildId]
      )

      // Remove existing components
      await connection.execute(
        'DELETE FROM buildcomponent WHERE build_id = ?',
        [buildId]
      )

      // Add new components
      for (const component of components) {
        await connection.execute(
          'INSERT INTO buildcomponent (build_id, component_id, quantity) VALUES (?, ?, ?)',
          [buildId, component.component_id, component.quantity]
        )
      }

      await connection.commit()

      res.json({
        status: 'success',
        message: 'Build updated successfully'
      })

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Update build error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update build'
    })
  }
})

// Delete build
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const buildId = req.params.id

    // Check if build exists and user owns it
    const [builds] = await pool.execute(
      'SELECT user_id FROM build WHERE build_id = ?',
      [buildId]
    )

    if (builds.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Build not found'
      })
    }

    if (builds[0].user_id !== req.user.user_id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Delete build components
      await connection.execute(
        'DELETE FROM buildcomponent WHERE build_id = ?',
        [buildId]
      )

      // Delete build
      await connection.execute(
        'DELETE FROM build WHERE build_id = ?',
        [buildId]
      )

      await connection.commit()

      res.json({
        status: 'success',
        message: 'Build deleted successfully'
      })

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Delete build error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete build'
    })
  }
})

module.exports = router
