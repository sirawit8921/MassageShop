const express = require('express');
const {
  getMassageShops,
  getMassageShop,
  createMassageShop,
  updateMassageShop,
  deleteMassageShop
} = require('../controllers/massageshop');

//Include other resource routes
const appointmentRouter = require('./appointments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:massageShopId/appointments', appointmentRouter);

/**
 * @swagger
 * components:
 *   schemas:
 *     MassageShop:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - telephone
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the massage shop
 *           example: 671e8f9a1c4a2d3a6c2f4a90
 *         name:
 *           type: string
 *           description: Massage shop name
 *         address:
 *           type: string
 *           description: Address of the massage shop
 *         telephone:
 *           type: string
 *           description: Telephone number
 *         openTime:
 *           type: string
 *           description: Opening time (e.g. 10:00)
 *         closeTime:
 *           type: string
 *           description: Closing time (e.g. 22:00)
 *       example:
 *         id: 671e8f9a1c4a2d3a6c2f4a90
 *         name: "Aroma Spa Bangkok"
 *         address: "123 Sukhumvit Road, Klongtoey, Bangkok"
 *         telephone: "0812345678"
 *         openTime: "10:00"
 *         closeTime: "22:00"
 *
 * tags:
 *   - name: MassageShops
 *     description: API for managing massage shops
 *
 * /massageshops:
 *   get:
 *     summary: Returns the list of all massage shops
 *     tags: [MassageShops]
 *     responses:
 *       200:
 *         description: The list of massage shops
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MassageShop'
 *
 *   post:
 *     summary: Create a new massage shop
 *     tags: [MassageShops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MassageShop'
 *     responses:
 *       201:
 *         description: Massage shop created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MassageShop'
 *       500:
 *         description: Some server error
 *
 * /massageshops/{id}:
 *   get:
 *     summary: Get a massage shop by ID
 *     tags: [MassageShops]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The massage shop ID
 *     responses:
 *       200:
 *         description: The massage shop data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MassageShop'
 *       404:
 *         description: Massage shop not found
 *
 *   put:
 *     summary: Update a massage shop by ID
 *     tags: [MassageShops]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The massage shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MassageShop'
 *     responses:
 *       200:
 *         description: Massage shop updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MassageShop'
 *       404:
 *         description: Massage shop not found
 *       500:
 *         description: Some server error
 *
 *   delete:
 *     summary: Delete a massage shop by ID
 *     tags: [MassageShops]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The massage shop ID
 *     responses:
 *       200:
 *         description: The massage shop was deleted
 *       404:
 *         description: The massage shop was not found
 */

// Main routes
router
  .route('/')
  .get(getMassageShops)
  .post(protect, authorize('admin'), createMassageShop);

router
  .route('/:id')
  .get(getMassageShop)
  .put(protect, authorize('admin'), updateMassageShop)
  .delete(protect, authorize('admin'), deleteMassageShop);

module.exports = router;
