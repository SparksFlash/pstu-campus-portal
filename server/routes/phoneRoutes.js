const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const { requireFields } = require('../middleware/validation');
const {
  getAllContacts, getContactById, createContact, updateContact, deleteContact
} = require('../controllers/phoneController');

router.get('/', getAllContacts);
router.get('/:id', getContactById);
router.post('/', auth, allowRoles('admin', 'superadmin'), requireFields('phone'), createContact);
router.put('/:id', auth, allowRoles('admin', 'superadmin'), updateContact);
router.delete('/:id', auth, allowRoles('admin', 'superadmin'), deleteContact);

module.exports = router;