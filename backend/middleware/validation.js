const { body, validationResult } = require('express-validator');

const validCategories = {
  job: ['admin.', 'blue-collar', 'entrepreneur', 'housemaid', 'management',
        'retired', 'self-employed', 'services', 'student', 'technician', 
        'unemployed', 'unknown'],
  marital: ['divorced', 'married', 'single', 'unknown'],
  education: ['basic.4y', 'basic.6y', 'basic.9y', 'high.school', 
              'illiterate', 'professional.course', 'university.degree', 'unknown'],
  default: ['no', 'yes', 'unknown'],
  housing: ['no', 'yes', 'unknown'],
  loan: ['no', 'yes', 'unknown'],
  contact: ['cellular', 'telephone'],
  month: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 
          'aug', 'sep', 'oct', 'nov', 'dec'],
  day_of_week: ['mon', 'tue', 'wed', 'thu', 'fri']
};

const validatePredictionInput = [
  body('age').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('job').isString().isIn(validCategories.job).withMessage('Invalid job category'),
  body('marital').isIn(validCategories.marital).withMessage('Invalid marital status'),
  body('education').isIn(validCategories.education).withMessage('Invalid education level'),
  body('default').isIn(validCategories.default).withMessage('Invalid default status'),
  body('housing').isIn(validCategories.housing).withMessage('Invalid housing status'),
  body('loan').isIn(validCategories.loan).withMessage('Invalid loan status'),
  body('contact').isIn(validCategories.contact).withMessage('Invalid contact type'),
  body('month').isIn(validCategories.month).withMessage('Invalid month'),
  body('day_of_week').isIn(validCategories.day_of_week).withMessage('Invalid day of week'),
  body('campaign').isInt({ min: 1 }).withMessage('Campaign must be >= 1'),
  body().custom((value) => {
    const hasEmpVar = value['emp.var.rate'] !== undefined || value['emp_var_rate'] !== undefined;
    const hasConsPrice = value['cons.price.idx'] !== undefined || value['cons_price_idx'] !== undefined;
    const hasConsConf = value['cons.conf.idx'] !== undefined || value['cons_conf_idx'] !== undefined;
    const hasEuribor = value['euribor3m'] !== undefined;
    const hasEmployed = value['nr.employed'] !== undefined || value['nr_employed'] !== undefined;
    if (!hasEmpVar) throw new Error('Missing employment variation rate (emp.var.rate or emp_var_rate)');
    if (!hasConsPrice) throw new Error('Missing consumer price index (cons.price.idx or cons_price_idx)');
    if (!hasConsConf) throw new Error('Missing consumer confidence index (cons.conf.idx or cons_conf_idx)');
    if (!hasEuribor) throw new Error('Missing euribor3m');
    if (!hasEmployed) throw new Error('Missing number employed (nr.employed or nr_employed)');
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors.array() 
      });
    }
    next();
  }
];

module.exports = { validatePredictionInput };
