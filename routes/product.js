const express = require('express');
const Router = express.Router();
const pool = require('../util/database').pool;
const validator = require('validator'); // Import the validator library
const {adminSignup}  = require('../Controllers/admin')
const multer = require("multer");
const {addProduct} = require('../Controllers/product')
const path = require('path');
const { fail } = require('assert');
const verifyToken = require("../Controllers/auth/verifyToken")
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
  
}

// Define a maximum file size
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB in bytes
// Define the storage configuration for Multer
const storage = multer.diskStorage({
   destination: function (req,file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        console.log('isValid:', isValid); // Log the isValid variable
     
      console.log('MIME Type:', file.mimetype);
        if (!isValid) {
            // Handle the validation error by passing it to Multer's error callback
            const uploadError = new Error('Invalid image type');      
            uploadError.status = 400; // Set the HTTP status code
            console.error('Upload Error:', uploadError.message); // Log the error message
            cb(uploadError); // Pass the error to Multer
        } else {
            // Set the destination folder where files will be stored
        cb(null, path.join(__dirname, '../public/uploads'));
        // Log the destination path
        }// Set the destination folder where files will be stored
    },
    filename: function (req, file, cb) {
      const originalName = file.originalname
      console.log('originalName: ',originalName)
      const fileName = originalName.replace(/\s/g, '-')
      console.log('fileName: ',fileName)
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      console.log('uniqueSuffix: ',uniqueSuffix)
      cb(null, uniqueSuffix + fileName);
     
    },
    // Add the 'limits' object to specify the maximum file size
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
    },
  });


  // Create a Multer instance with the storage configuration
const upload = multer({ storage: storage });

Router.post('/api/upload',upload.single('image'),async(req, res)=>{
  try {
    if (req.file) {
       return res.status(200).json({message: "Single file uploaded successfully"});
      } else {
        res.status(400).json({message:"Please upload a valid image"});
      }
      const {
       
        product_image,
       
      } = req.body;


      console.log(req.file)

 if (!validator.isURL(product_image)) {
    return res.status(400).json({ message: 'product image is not valid' });
  }
  // Access the uploaded file details via req.file
  const imagePath = req.file ? req.file.filename : null;
  console. log(imagePath);

  if (!imagePath) {
    return res.status(400).json({ success: false, message: 'Invalid input data.' });
}
  const basePath = '../public/uploads';
  console.log(basePath);
  const [result] = await pool.query(
    'INSERT INTO product ( product_image) VALUES (?)',
    [ 
    `${basePath}${imagePath}`,
     ]
  );
     
     
      // Perform any additional processing or database operations here
     
      if (!result) {
        return res.status(404).json({ 
          status: false, 
          message: 'image could not be added' });
      } 
  
        console.log(result,"Product added")
        res.status(200).json({
          status: true,  
          message: 'image uploaded successfully' });
    
} catch (error) {
  console.log(error)
return res.status(500).json({
  status: false, 
  error:error.message });
    
}
})




Router.post('/products',verifyToken, upload.single('images'),async(req, res)=>{
  const {
    product_name,
    product_brand,
    product_model,
    product_price,
    product_slug,
    product_image, 
    product_listing,
    product_description,
    stock_quantity,
    currency, 
    delivery_fee
  } = req.body;

  try {
  const fold = req.file
    if(!fold)
    res.status(400).json({status: false,message:"Please upload a valid image"});
    
      

      console. log(fold)
  
  // Access the uploaded file details via req.file
  const imagePath = req.file ? req.file.filename : null;
  console.log(imagePath);
  if (!product_name || !product_description || !product_price || !product_image) {
     res.status(400).json({ status: false, message: 'Invalid input data.' });
}
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
  console. log(basePath)

   // Check if the product already exists in the database
    const [result] = await pool.query(
      'SELECT * FROM product WHERE product_name = ?',
      [product_name]
    );

    if (result.length > 0) {
      res.status(400).json({ status: false, message: 'Product already exists' });
    }
     

  const [insertedResult] = await pool.query(
    'INSERT INTO product ( product_name, product_brand,product_model, product_price,  product_slug,product_image,product_listing,product_description,stock_quantity,currency, delivery_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
    [ product_name,
      product_brand,
      product_model,
      product_price,
      product_slug,
    `${basePath}${imagePath}`,
     product_listing,
     product_description,
     stock_quantity,
      currency, 
      delivery_fee]
  );
     

   
      // Perform any additional processing or database operations here
     
      if (!insertedResult) {
       return  res.status(400).json({ 
          status: false, 
          message: 'Product could not be added' });
      } 

        res.status(200).json({
          status: true,  
          message: 'Product added successfully'});
    
} catch (error) {
  console.log(error)
res.status(500).json({
  status: false, 
  error:  "An unexpected error occurred" });
    
}
})



Router.get('/products',verifyToken,  async (req, res) => {
   try {
    // Perform a database query to get all products
    const [products] = await pool.query('select * from product')


    // Check if there are products to return
    if(products.length===0)
    throw new Error(' no products found')

    res.status(200).json(products)
   } catch (error) {
    console.log(error)
    res.status(500).json({error:'internal server error'})
   }
  // Your GET endpoint logic here
});




Router.get('/products/:id',verifyToken, async(req,res)=>{
const productId = req.params.id
  try {
    const [products] = pool.query('select * from product where id = ?',[productId])
     // Check if there are products to return
    if(products.length===0)
    throw new Error(' no products found')

    res.status(200).json('Product found successfully',products[0])
  } catch (error) {
    res.status(404).json({error:'internal server error'})
  }
  
  
})





Router.get('/products/slug/:product_slug',verifyToken,  async(req, res)=>{
  const productSlug = req.params.product_slug
 try {
   const [products]= pool.query('select * from product where product_slug = ?' ,[productSlug] )
  // Check if the product with the specified slug exists
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Send the product as a JSON response
    res.status(200).json('Product found successfully',products[0]);
 } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Internal server error' });
 }
})





Router.patch('/products/:id',verifyToken, async(req,res)=>{
  const productId = req.params.id;
   // Extract the fields you want to update from the request body
  const {
    product_name,
        product_type,
        product_price,
        product_model,
        productSlug,
        product_image,
        stock_quantity,
        product_description,
        currency,
        product_listing
  } = req.body;
try {
  // Check if the product with the specified ID exists
  const [products] = pool.query('select * from product where id = ?',[productId])

  if(products.length === 0)
  res.status(404).json({message:'product not found'})

  const [result] = await pool.query('update product set (product_name,product_type,product_price,product_model,productSlug,product_image,stock_quantity,product_description,currency,product_listing) values(?,?,?,?,?,?,?,?,?,?)',[product_name, product_type,
    product_price,
    product_model,
    productSlug,
    product_image,
    stock_quantity,
    product_description,
    currency,
    product_listing])

    if (!result) {
      return res.status(404).json({ message: 'Product could not be updated' });
    } else {
      return res.status(200).json({ message: 'Product updated successfully' });
    }

} catch (error) {
  console.error(error);
    return res.status(500).json({
      status: false, 
       message: 'Error while updating product' });
}
})



{/*Router.put('/gallery-images/:id', upload.array('images', 10), async (req, res) => {
  try {
      const productId = req.params.id;
      const [product]  = await pool.query('SELECT * FROM products WHERE id =?',[productId])
      if(!product){
        res.status(404).json({
          status: false, 
          message: 'Product not found'})
      }

      if(product. length > 0){
        res.status(400).json({status: false, message: 'Product already exists'})
      }
      const files = req.files;
      const basePath = `${req.protocol}://${req.get('host')}/Assets/uploads/`;

      const imagesPaths = files.map(file => `${basePath}${file.filename}`);

     

      const values = [imagesPaths, productId];

      const { rows } = await pool.query('update products SET  =? WHERE id = ?', values);

      if (rows.length === 0) {
          return res.status(500).send('The gallery cannot be updated!');
      }

      console.log(rows[0]);
      res. status(200).json({ status: true, 
      message:rows[0] })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});
*/}

Router.delete('/products',verifyToken, async(req, res) => {
  
  try {
    const [result]  = await pool.query('DELETE FROM product')
    if (result.affectedRows === 0) {
      res.status(400).json({ status:false, message: 'Product not found' });
  } else {
      res.status(200).json({status: true,  message: 'Product deleted successfully' });
  }
  } catch (error) {
    res.status(500).json({
      status: false, 
      error: error.message});
  }
})


Router.delete('/delete/:id',verifyToken, async(req, res) => {
    const productId = req.params.id
    try {
      const [result]  = await pool.query('DELETE FROM product WHERE id =?',[productId])
      if (result.affectedRows === 0) {
        res.status(400).json({status: false,  message: 'Product not found' });
    } else {
        res.status(200).json({status: true,  message: 'Product deleted successfully' });
    }
    } catch (error) {
      res.status(500).json({
        status: false, 
        error: error.message});
    }
})

module.exports = Router;
