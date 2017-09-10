var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next)=>{
  res.render('index', { title: 'Express' });
});

router.get('/main/:params', (req, res, next)=>{
  res.render('main', { title: 'Main' });
});

module.exports = router;
