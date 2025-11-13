const express = require('express')
const pool = require('../config/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Apply authentication and admin middleware to all routes
router.use(authenticateToken)
router.use(requireAdmin)

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM user')
    const [componentsCount] = await pool.execute('SELECT COUNT(*) as count FROM component')
    const [buildsCount] = await pool.execute('SELECT COUNT(*) as count FROM build')
    const [commentsCount] = await pool.execute('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0')
    const [resetsCount] = await pool.execute('SELECT COUNT(*) as count FROM password_resets')

    const stats = {
      users: usersCount[0].count,
      components: componentsCount[0].count,
      builds: buildsCount[0].count,
      comments: commentsCount[0].count,
      resets: resetsCount[0].count
    }

    // Get all data for each section
    const [components] = await pool.execute(
      `SELECT c.*, cat.name as category_name, m.name as manufacturer_name 
       FROM component c 
       JOIN category cat ON c.category_id = cat.category_id 
       JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id 
       ORDER BY c.component_id DESC`
    )

    const [builds] = await pool.execute(
      `SELECT b.*, u.name as user_name 
       FROM build b 
       JOIN user u ON b.user_id = u.user_id 
       ORDER BY b.created_at DESC`
    )

    const [users] = await pool.execute(
      'SELECT * FROM user ORDER BY created_at DESC'
    )

    const [comments] = await pool.execute(
      'SELECT * FROM contact_messages ORDER BY is_read ASC, created_at DESC'
    )

    const [resets] = await pool.execute(
      'SELECT * FROM password_resets ORDER BY expires_at DESC'
    )

    res.json({
      status: 'success',
      stats,
      components,
      builds,
      users,
      comments,
      resets
    })

  } catch (error) {
    console.error('Get dashboard data error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    })
  }
})

// Component management
router.get('/components', async (req, res) => {
  try {
    const [components] = await pool.execute(
      `SELECT c.*, cat.name as category_name, m.name as manufacturer_name 
       FROM component c 
       JOIN category cat ON c.category_id = cat.category_id 
       JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id 
       ORDER BY c.name`
    )

    res.json({
      status: 'success',
      components
    })

  } catch (error) {
    console.error('Get components error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch components'
    })
  }
})

router.post('/components', async (req, res) => {
  const connection = await pool.getConnection()
  await connection.beginTransaction()

  try {
    const { name, category_id, manufacturer_id, model, price, stock, vendor_link, socket_type, ram_type, compat_cpu, compat_ram, compat_motherboard } = req.body

    if (!name || !category_id || !manufacturer_id || !model || !price) {
      await connection.rollback()
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      })
    }

    // Insert component
    const [result] = await connection.execute(
      `INSERT INTO component (name, category_id, manufacturer_id, model, price, stock, vendor_link, socket_type, ram_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category_id, manufacturer_id, model, price, stock || 0, vendor_link || null, socket_type || null, ram_type || null]
    )

    const componentId = result.insertId

    // Get category name to determine compatibility
    const [categories] = await connection.execute('SELECT name FROM category WHERE category_id = ?', [category_id])
    const categoryName = categories[0]?.name?.toLowerCase() || ''

    // Handle compatibility based on category
    // Check if arrays exist and have length > 0
    if (categoryName === 'cpu' && Array.isArray(compat_motherboard) && compat_motherboard.length > 0 && Array.isArray(compat_ram) && compat_ram.length > 0) {
      // For CPU: insert compatibility with all motherboard + RAM combinations
      for (const mbId of compat_motherboard) {
        for (const ramId of compat_ram) {
          await connection.execute(
            'INSERT INTO compatibility_check (cpu_id, motherboard_id, ram_id) VALUES (?, ?, ?)',
            [componentId, mbId, ramId]
          )
        }
      }
    } else if (categoryName === 'motherboard' && Array.isArray(compat_cpu) && compat_cpu.length > 0 && Array.isArray(compat_ram) && compat_ram.length > 0) {
      // For Motherboard: insert compatibility with all CPU + RAM combinations
      for (const cpuId of compat_cpu) {
        for (const ramId of compat_ram) {
          await connection.execute(
            'INSERT INTO compatibility_check (cpu_id, motherboard_id, ram_id) VALUES (?, ?, ?)',
            [cpuId, componentId, ramId]
          )
        }
      }
    } else if (categoryName === 'ram' && Array.isArray(compat_cpu) && compat_cpu.length > 0 && Array.isArray(compat_motherboard) && compat_motherboard.length > 0) {
      // For RAM: insert compatibility with all CPU + Motherboard combinations
      for (const cpuId of compat_cpu) {
        for (const mbId of compat_motherboard) {
          await connection.execute(
            'INSERT INTO compatibility_check (cpu_id, motherboard_id, ram_id) VALUES (?, ?, ?)',
            [cpuId, mbId, componentId]
          )
        }
      }
    }

    await connection.commit()

    res.json({
      status: 'success',
      message: 'Component added successfully',
      component_id: componentId
    })

  } catch (error) {
    await connection.rollback()
    console.error('Add component error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to add component: ' + error.message
    })
  } finally {
    connection.release()
  }
})

router.put('/components/:id', async (req, res) => {
  const connection = await pool.getConnection()
  await connection.beginTransaction()

  try {
    const componentId = req.params.id
    const { name, category_id, manufacturer_id, model, price, stock, vendor_link, socket_type, ram_type, compat_cpu, compat_ram, compat_motherboard } = req.body

    // Update component
    await connection.execute(
      `UPDATE component SET name = ?, category_id = ?, manufacturer_id = ?, model = ?, price = ?, stock = ?, vendor_link = ?, socket_type = ?, ram_type = ? 
       WHERE component_id = ?`,
      [name, category_id, manufacturer_id, model, price, stock || 0, vendor_link || null, socket_type || null, ram_type || null, componentId]
    )

    // Get category name
    const [categories] = await connection.execute('SELECT name FROM category WHERE category_id = ?', [category_id])
    const categoryName = categories[0]?.name?.toLowerCase() || ''

    // Delete old compatibility entries for this component
    if (categoryName === 'cpu') {
      await connection.execute('DELETE FROM compatibility_check WHERE cpu_id = ?', [componentId])
      // Insert new compatibility (only if arrays exist and have length > 0)
      if (Array.isArray(compat_motherboard) && compat_motherboard.length > 0 && Array.isArray(compat_ram) && compat_ram.length > 0) {
        for (const mbId of compat_motherboard) {
          for (const ramId of compat_ram) {
            await connection.execute(
              'INSERT INTO compatibility_check (cpu_id, motherboard_id, ram_id) VALUES (?, ?, ?)',
              [componentId, mbId, ramId]
            )
          }
        }
      }
    } else if (categoryName === 'motherboard') {
      await connection.execute('DELETE FROM compatibility_check WHERE motherboard_id = ?', [componentId])
      // Insert new compatibility (only if arrays exist and have length > 0)
      if (Array.isArray(compat_cpu) && compat_cpu.length > 0 && Array.isArray(compat_ram) && compat_ram.length > 0) {
        for (const cpuId of compat_cpu) {
          for (const ramId of compat_ram) {
            await connection.execute(
              'INSERT INTO compatibility_check (cpu_id, motherboard_id, ram_id) VALUES (?, ?, ?)',
              [cpuId, componentId, ramId]
            )
          }
        }
      }
    } else if (categoryName === 'ram') {
      await connection.execute('DELETE FROM compatibility_check WHERE ram_id = ?', [componentId])
      // Insert new compatibility (only if arrays exist and have length > 0)
      if (Array.isArray(compat_cpu) && compat_cpu.length > 0 && Array.isArray(compat_motherboard) && compat_motherboard.length > 0) {
        for (const cpuId of compat_cpu) {
          for (const mbId of compat_motherboard) {
            await connection.execute(
              'INSERT INTO compatibility_check (cpu_id, motherboard_id, ram_id) VALUES (?, ?, ?)',
              [cpuId, mbId, componentId]
            )
          }
        }
      }
    }

    await connection.commit()

    res.json({
      status: 'success',
      message: 'Component updated successfully'
    })

  } catch (error) {
    await connection.rollback()
    console.error('Update component error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update component: ' + error.message
    })
  } finally {
    connection.release()
  }
})

// Get components for compatibility selection (CPU, RAM, Motherboard)
// IMPORTANT: This route must come BEFORE /components/:id to avoid route conflict
router.get('/components/compatibility', async (req, res) => {
  try {
    const { type } = req.query // 'cpu', 'ram', 'motherboard'

    if (!type) {
      return res.status(400).json({
        status: 'error',
        message: 'Type parameter is required'
      })
    }

    // Map type to category name (case-sensitive matching with database)
    let categoryName = ''
    if (type.toLowerCase() === 'cpu') {
      categoryName = 'CPU'
    } else if (type.toLowerCase() === 'ram') {
      categoryName = 'RAM'
    } else if (type.toLowerCase() === 'motherboard') {
      categoryName = 'Motherboard'
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid type. Must be cpu, ram, or motherboard'
      })
    }

    console.log(`[Admin] Fetching compatibility components for type: ${type}, category: ${categoryName}`)

    const [components] = await pool.execute(
      `SELECT c.*, m.name as manufacturer_name 
       FROM component c 
       JOIN category cat ON c.category_id = cat.category_id 
       JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id 
       WHERE cat.name = ?
       ORDER BY c.name`,
      [categoryName]
    )

    console.log(`[Admin] Found ${components.length} components for category: ${categoryName}`)

    res.json({
      status: 'success',
      components: components || []
    })

  } catch (error) {
    console.error('Get compatibility components error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch components: ' + error.message
    })
  }
})

router.get('/components/:id', async (req, res) => {
  try {
    const componentId = req.params.id

    const [components] = await pool.execute(
      `SELECT c.*, cat.name as category_name, m.name as manufacturer_name 
       FROM component c 
       JOIN category cat ON c.category_id = cat.category_id 
       JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id 
       WHERE c.component_id = ?`,
      [componentId]
    )

    if (components.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Component not found'
      })
    }

    const component = components[0]
    const categoryName = component.category_name?.toLowerCase() || ''

    // Get compatibility data based on category
    let compatibility = { cpu: [], ram: [], motherboard: [] }
    
    if (categoryName === 'cpu') {
      const [compat] = await pool.execute(
        'SELECT DISTINCT motherboard_id, ram_id FROM compatibility_check WHERE cpu_id = ?',
        [componentId]
      )
      compatibility.motherboard = [...new Set(compat.map(c => c.motherboard_id))]
      compatibility.ram = [...new Set(compat.map(c => c.ram_id))]
    } else if (categoryName === 'motherboard') {
      const [compat] = await pool.execute(
        'SELECT DISTINCT cpu_id, ram_id FROM compatibility_check WHERE motherboard_id = ?',
        [componentId]
      )
      compatibility.cpu = [...new Set(compat.map(c => c.cpu_id))]
      compatibility.ram = [...new Set(compat.map(c => c.ram_id))]
    } else if (categoryName === 'ram') {
      const [compat] = await pool.execute(
        'SELECT DISTINCT cpu_id, motherboard_id FROM compatibility_check WHERE ram_id = ?',
        [componentId]
      )
      compatibility.cpu = [...new Set(compat.map(c => c.cpu_id))]
      compatibility.motherboard = [...new Set(compat.map(c => c.motherboard_id))]
    }

    res.json({
      status: 'success',
      component: { ...component, compatibility }
    })

  } catch (error) {
    console.error('Get component error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch component'
    })
  }
})

router.delete('/components/:id', async (req, res) => {
  const connection = await pool.getConnection()
  await connection.beginTransaction()

  try {
    const componentId = req.params.id

    // Check if component is used in any builds
    const [buildComponents] = await connection.execute(
      'SELECT COUNT(*) as count FROM buildcomponent WHERE component_id = ?',
      [componentId]
    )

    if (buildComponents[0].count > 0) {
      await connection.rollback()
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete component that is used in builds'
      })
    }

    // Get category to delete compatibility entries
    const [components] = await connection.execute(
      'SELECT category_id FROM component WHERE component_id = ?',
      [componentId]
    )
    
    if (components.length > 0) {
      const [categories] = await connection.execute(
        'SELECT name FROM category WHERE category_id = ?',
        [components[0].category_id]
      )
      const categoryName = categories[0]?.name?.toLowerCase() || ''
      
      // Delete compatibility entries
      if (categoryName === 'cpu') {
        await connection.execute('DELETE FROM compatibility_check WHERE cpu_id = ?', [componentId])
      } else if (categoryName === 'motherboard') {
        await connection.execute('DELETE FROM compatibility_check WHERE motherboard_id = ?', [componentId])
      } else if (categoryName === 'ram') {
        await connection.execute('DELETE FROM compatibility_check WHERE ram_id = ?', [componentId])
      }
    }

    // Delete component
    await connection.execute('DELETE FROM component WHERE component_id = ?', [componentId])

    await connection.commit()

    res.json({
      status: 'success',
      message: 'Component deleted successfully'
    })

  } catch (error) {
    await connection.rollback()
    console.error('Delete component error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete component'
    })
  } finally {
    connection.release()
  }
})

// User management
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT user_id, name, email, is_admin, created_at FROM user ORDER BY created_at DESC'
    )

    res.json({
      status: 'success',
      users
    })

  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    })
  }
})

router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id
    const { name, email, is_admin } = req.body

    await pool.execute(
      'UPDATE user SET name = ?, email = ?, is_admin = ? WHERE user_id = ?',
      [name, email, is_admin, userId]
    )

    res.json({
      status: 'success',
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    })
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id

    // Don't allow deleting yourself
    if (parseInt(userId) === req.user.user_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      })
    }

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Delete user's builds and build components
      const [builds] = await connection.execute('SELECT build_id FROM build WHERE user_id = ?', [userId])
      
      for (const build of builds) {
        await connection.execute('DELETE FROM buildcomponent WHERE build_id = ?', [build.build_id])
      }
      
      await connection.execute('DELETE FROM build WHERE user_id = ?', [userId])
      await connection.execute('DELETE FROM user WHERE user_id = ?', [userId])

      await connection.commit()

      res.json({
        status: 'success',
        message: 'User deleted successfully'
      })

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    })
  }
})

// Build management
router.get('/builds', async (req, res) => {
  try {
    const [builds] = await pool.execute(
      `SELECT b.*, u.name as user_name 
       FROM build b 
       JOIN user u ON b.user_id = u.user_id 
       ORDER BY b.created_at DESC`
    )

    res.json({
      status: 'success',
      builds
    })

  } catch (error) {
    console.error('Get builds error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch builds'
    })
  }
})

router.put('/builds/:id', async (req, res) => {
  try {
    const buildId = req.params.id
    const { name, is_public, is_submitted } = req.body

    await pool.execute(
      'UPDATE build SET name = ?, is_public = ?, is_submitted = ? WHERE build_id = ?',
      [name, is_public, is_submitted, buildId]
    )

    res.json({
      status: 'success',
      message: 'Build updated successfully'
    })

  } catch (error) {
    console.error('Update build error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update build'
    })
  }
})

router.delete('/builds/:id', async (req, res) => {
  try {
    const buildId = req.params.id

    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      await connection.execute('DELETE FROM buildcomponent WHERE build_id = ?', [buildId])
      await connection.execute('DELETE FROM build WHERE build_id = ?', [buildId])

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

// Contact messages management
router.get('/contact-messages', async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT * FROM contact_messages ORDER BY is_read ASC, created_at DESC'
    )

    res.json({
      status: 'success',
      messages
    })

  } catch (error) {
    console.error('Get contact messages error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    })
  }
})

router.put('/contact-messages/:id/read', async (req, res) => {
  try {
    const messageId = req.params.id

    await pool.execute(
      'UPDATE contact_messages SET is_read = 1 WHERE id = ?',
      [messageId]
    )

    res.json({
      status: 'success',
      message: 'Message marked as read'
    })

  } catch (error) {
    console.error('Mark message as read error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update message'
    })
  }
})

router.put('/contact-messages/:id/replied', async (req, res) => {
  try {
    const messageId = req.params.id

    await pool.execute(
      'UPDATE contact_messages SET is_read = 1, is_replied = 1 WHERE id = ?',
      [messageId]
    )

    res.json({
      status: 'success',
      message: 'Message marked as replied'
    })

  } catch (error) {
    console.error('Mark message as replied error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update message'
    })
  }
})

router.delete('/contact-messages/:id', async (req, res) => {
  try {
    const messageId = req.params.id

    await pool.execute(
      'DELETE FROM contact_messages WHERE id = ?',
      [messageId]
    )

    res.json({
      status: 'success',
      message: 'Message deleted successfully'
    })

  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message'
    })
  }
})

// Password resets management
router.get('/password-resets', async (req, res) => {
  try {
    const [resets] = await pool.execute(
      'SELECT * FROM password_resets ORDER BY expires_at DESC'
    )

    res.json({
      status: 'success',
      resets
    })

  } catch (error) {
    console.error('Get password resets error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch password resets'
    })
  }
})

router.delete('/password-resets/:token', async (req, res) => {
  try {
    const token = req.params.token

    await pool.execute(
      'DELETE FROM password_resets WHERE token = ?',
      [token]
    )

    res.json({
      status: 'success',
      message: 'Password reset request deleted successfully'
    })

  } catch (error) {
    console.error('Delete password reset error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete password reset'
    })
  }
})

// Get categories and manufacturers for forms
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM category ORDER BY name')

    res.json({
      status: 'success',
      categories
    })

  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    })
  }
})

router.get('/manufacturers', async (req, res) => {
  try {
    const [manufacturers] = await pool.execute('SELECT * FROM manufacturer ORDER BY name')

    res.json({
      status: 'success',
      manufacturers
    })

  } catch (error) {
    console.error('Get manufacturers error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch manufacturers'
    })
  }
})

module.exports = router
