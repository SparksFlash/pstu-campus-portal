const PhoneDiary = require('../models/PhoneDiary');

exports.getAllContacts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    const contacts = await PhoneDiary.find(filter);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const contact = await PhoneDiary.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createContact = async (req, res) => {
  try {
    const { category, department, contactPerson, designation, phone, email, address } = req.body;
    const contact = new PhoneDiary({
      category, department, contactPerson, designation, phone, email, address
    });
    await contact.save();
    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const contact = await PhoneDiary.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await PhoneDiary.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};