const express = require('express');
const router = express.Router();
const variantController = require('../controllers/admin/variantmanagement');


router.get('/', variantController.getVariantsPage);


router.post('/ram/create', variantController.createRamVariant);
router.post('/processor/create', variantController.createProcessorVariant);
router.post('/display/create', variantController.createDisplayVariant);
router.post('/storage/create', variantController.createStorageVariant);



router.get('/processor/edit/:id', variantController.editVariant);
router.get('/display/edit/:id', variantController.editVariant);
router.get('/storage/edit/:id', variantController.editVariant);


router.post('/ram/delete/:id', variantController.deleteVariant);
router.post('/processor/delete/:id', variantController.deleteVariant);
router.post('/display/delete/:id', variantController.deleteVariant);
router.post('/storage/delete/:id', variantController.deleteVariant);


router.post('/ram/toggle-block/:id', variantController.toggleBlockVariant);
router.post('/processor/toggle-block/:id', variantController.toggleBlockVariant);
router.post('/display/toggle-block/:id', variantController.toggleBlockVariant);
router.post('/storage/toggle-block/:id', variantController.toggleBlockVariant);


router.post('/processor/edit/:id', variantController.updateVariant);
router.post('/display/edit/:id', variantController.updateVariant);
router.post('/storage/edit/:id', variantController.updateVariant);

router.get("/createVariant", variantController.loadCreateVariant);
router.post("/createVariant", variantController.createVariant);
module.exports = router;