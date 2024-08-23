const validator = require("validator");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { Company, User, pool} = require("../models/user"); // Import the User model from ./models/user
const express = require("express");
const router = express.Router();
const config = require("../config");
const { sendEmail } = require("../Helpers/email");


router.post('/register_company', async (req, res) => {
  try {
    const { company_name, company_type, registration_number, company_address, contact_person, email } = req.body;

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if(!validator. isLength(registration_number, { min: 14 , max: 14})){
       return res.status(400).json({ error: 'registration number must be of 14 characters'})
    }



    const companyExists = await Company.findOne({
      where: {
        registration_number,
        email
      }
    });

    if (companyExists) {
      return res.status(409).json({ error: 'Company already exists' });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, saltRounds);
    const createCompany = await Company.create({
      company_name,
      company_type,
      registration_number,
      company_address,
      contact_person,
      email,
      password: hashedPassword
    });

    console.log('company created', createCompany.toJSON());
     // Generate a token for the new company
     const payload = {
      company: {
        id: createCompany.id, // Add the company ID or any other company data to the payload
        name: createCompany.company_name,
        email: createCompany.email,
        // ...other company data
      },
    };
    const confirmToken = jwt.sign(payload,config.EMAIL_VERIFICATION_TOKEN ,{
      expiresIn:'2h'
    })
   const confirm =` ${config. BASE_URL}/confirm?token = ${confirmToken} `
   const details = {
    templateContent: ['name', 'confirmEmail', confirm]
   }
   sendEmail(email, 'Confirm Your Email', 'Please confirm your email', details)
    return res.status(201).json({ message: 'Company registered successfully.',accessToken });
  } catch (error) {
    console.log('error creating company', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/register_user', async (req, res) => {
  try {
    const { company_id, username, email, password, role } = req.body;

    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const userExists = await User.findOne({
      where: {
        email
      }
    });

    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    await User.create({
      company_id,
      username,
      email,
      password: hashedPassword,
      role, // Assuming that role is being sent in req.body
    });

    return res.status(201).json({ message: 'User account created successfully.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

(async () => {
  try {
    await pool.sync({ alter: true }); // Set { force: true } to drop existing tables and recreate them
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error('Error synchronizing the database:', error);
  }
})();

module.exports = router;
