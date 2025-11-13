const express = require('express')
const pool = require('../config/database')

const router = express.Router()

// Get filtered components for system builder
router.get('/filtered', async (req, res) => {
  try {
    const { component_type, cpu_id, motherboard_id, ram_id } = req.query

    if (!component_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Component type is required'
      })
    }

    let sql = `
      SELECT DISTINCT c.*, m.name as manufacturer_name 
      FROM component c 
      JOIN category cat ON c.category_id = cat.category_id 
      JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id 
      WHERE cat.name = ?
    `
    const params = [component_type]

    // Add compatibility filtering for CPU, Motherboard, RAM
    if (['CPU', 'Motherboard', 'RAM'].includes(component_type)) {
      if (component_type === 'CPU') {
        if (motherboard_id) {
          sql += ' AND EXISTS (SELECT 1 FROM compatibility_check cc WHERE cc.cpu_id = c.component_id AND cc.motherboard_id = ?)'
          params.push(motherboard_id)
        }
        if (ram_id) {
          sql += ' AND EXISTS (SELECT 1 FROM compatibility_check cc WHERE cc.cpu_id = c.component_id AND cc.ram_id = ?)'
          params.push(ram_id)
        }
      } else if (component_type === 'Motherboard') {
        if (cpu_id) {
          sql += ' AND EXISTS (SELECT 1 FROM compatibility_check cc WHERE cc.motherboard_id = c.component_id AND cc.cpu_id = ?)'
          params.push(cpu_id)
        }
        if (ram_id) {
          sql += ' AND EXISTS (SELECT 1 FROM compatibility_check cc WHERE cc.motherboard_id = c.component_id AND cc.ram_id = ?)'
          params.push(ram_id)
        }
      } else if (component_type === 'RAM') {
        if (cpu_id) {
          sql += ' AND EXISTS (SELECT 1 FROM compatibility_check cc WHERE cc.ram_id = c.component_id AND cc.cpu_id = ?)'
          params.push(cpu_id)
        }
        if (motherboard_id) {
          sql += ' AND EXISTS (SELECT 1 FROM compatibility_check cc WHERE cc.ram_id = c.component_id AND cc.motherboard_id = ?)'
          params.push(motherboard_id)
        }
      }
    }

    sql += ' ORDER BY c.name'

    const [components] = await pool.execute(sql, params)

    // Format response
    const formattedComponents = components.map(comp => ({
      component_id: comp.component_id,
      name: comp.name,
      price: parseFloat(comp.price),
      stock: comp.stock || 0,
      specs: comp.model || comp.specs || '',
      manufacturer: comp.manufacturer_name,
      model: comp.model,
      category_id: comp.category_id
    }))

    res.json({
      status: 'success',
      components: formattedComponents,
      debug: {
        component_type,
        cpu_id,
        motherboard_id,
        ram_id,
        total_components_found: formattedComponents.length
      }
    })

  } catch (error) {
    console.error('Get filtered components error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to load components'
    })
  }
})

// Get all components (admin)
router.get('/', async (req, res) => {
  try {
    const { category, manufacturer, search } = req.query

    let sql = `
      SELECT c.*, cat.name as category_name, m.name as manufacturer_name 
      FROM component c 
      JOIN category cat ON c.category_id = cat.category_id 
      JOIN manufacturer m ON c.manufacturer_id = m.manufacturer_id 
      WHERE 1=1
    `
    const params = []

    if (category) {
      sql += ' AND cat.name = ?'
      params.push(category)
    }

    if (manufacturer) {
      sql += ' AND m.name LIKE ?'
      params.push(`%${manufacturer}%`)
    }

    if (search) {
      sql += ' AND (c.name LIKE ? OR c.model LIKE ? OR m.name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    sql += ' ORDER BY c.name'

    const [components] = await pool.execute(sql, params)

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

// Get specific component
router.get('/:id', async (req, res) => {
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

    res.json({
      status: 'success',
      component: components[0]
    })

  } catch (error) {
    console.error('Get component error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch component'
    })
  }
})

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM category ORDER BY name'
    )

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

// Get manufacturers
router.get('/manufacturers/list', async (req, res) => {
  try {
    const [manufacturers] = await pool.execute(
      'SELECT * FROM manufacturer ORDER BY name'
    )

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
