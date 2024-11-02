
const multer = require('multer');
const path = require('path');

// Define storage for the files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination folder for uploads
    cb(null, path.join(__dirname,"../public/uploads/product-images")); 
  },
  filename: (req, file, cb) => {
    // Create a unique filename for each uploaded file
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

// Create the multer instance with the defined storage configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    }
  }
});


module.exports = upload;

