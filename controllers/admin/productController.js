const Product=require("../../models/productModel")
const Category=require("../../models/categoryModel")
const Brand=require("../../models/brandModel")
const { name } = require("ejs")

// load product
const loadProduct = async (req, res) => {

    try {
        // search option
        let search = ''
        if(req.query.search){
            search=req.query.search
        } 
        // pagination
        let page = parseInt(req.query.page) || 1; 
        let limit = 5;
        let skip = (page - 1) * limit;
        const productData = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: "i" } 
        })
        .populate("category") 
        .populate("brand") 
        .sort({ addedDate: -1 })
        .skip(skip)
        .limit(limit);

        const totalProducts = await Product.countDocuments({
            productName: { $regex: ".*" + search + ".*", $options: "i" }
        });

        const totalPage = Math.ceil(totalProducts / limit);

        res.render("products", {
            products: productData,
            currentPage: page,
            totalPages: totalPage,
            searchQuery: search,
        });

    } catch (error) {
        console.log("load product", error);
        res.status(500).json({ message: error.message });
    }
};

// load add products
const loadAddProducts= async(req,res)=>{
    try {
        const category = await Category.find();
        const brand= await Brand.find()
        res.render("addProducts",{
            category:category,
            brand:brand
        })

    } catch (error) {
        console.log("add Product",error)
    }
}

//add products
const addProducts = async (req, res) => {
    try {
      const { 
        productName, 
        productDescription, 
        price, 
        quantity, 
        highlights, 
        productDetails, 
        categoryName, 
        brandName ,
      } = req.body;
      console.log(brandName,"fkhfskhs")
      // console.log(req.files)
      
      // Check for the category
      const category = await Category.findOne({ name: categoryName }); 
      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
  
      // Check for the brand
      const brand = await Brand.findOne({brandName: brandName }); 
      if (!brand) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
  
      // Convert highlights to an array
      const highlightsArray = highlights.split('\n').map(feature => feature.trim());
  
      // Create a new product
      const product = new Product({
        productName: productName,
        price: price,
        category: category._id, 
        productDesc: productDescription, 
        highlights: highlightsArray,
        productDetails: productDetails,
        addedDate: new Date(),
        brand:brand._id,
        quantity: quantity,
      });
  
      // Push uploaded images to the product
      for (const file of req.files) {
        product.image.push(file.filename);
      }
  
      // Save the product
      await product.save();
      res.status(201).json({ success: true, message: "Product added successfully" });
    } catch (error) {
      console.error("add product error:", error);
      res.status(500).json({ success: false, message: "An error occurred while adding the product." });
    }
  };
  
  //list  products
  const listProduct = async (req,res) => {
    try {
      const id = req.body.id;
      console.log(id)
      await Product.updateOne({ _id: id }, { $set: { status: "active" } });
      res.json({ success: true });
    } catch (error) {
      console.log("list product error:", error);
      res.status(500).json({ success: false, message: "Failed to list product" });
    }
  };
  
  // unlist products
  const unListProduct = async (req,res) => {
    try {
      const id = req.body.id;
      await Product.updateOne({ _id: id }, { $set: { status: "inactive" } });
      res.json({ success: true });
    } catch (error) {
      console.log("unlist product error:", error);
      res.status(500).json({ success: false, message: "Failed to unlist product" });
    }
  };


  // load edit product
  const loadEditProduct= async(req,res)=>{
    try {
      const  id= req.query.id;
      const category= await Category.find()
      const brand= await Brand.find()
      const product= await Product.findOne({_id:id}).populate("category").populate("brand")

      if(product){
        res.render("edit-products",{
          product:product,
          category:category,
          brand:brand
        })
      }else{
        res.status(404).send("product not found")
      }
    } catch (error) {
      res.status(500)
      console.log("edit product",error)
    }
  }

  //edit the products
  const editProduct= async(req,res)=>{
    try {
      // getting the elements from the body
      const {categoryName,productName,brandName,productDescription,productDetails,highlights,quantity,price,id}=req.body;
     
      //finding the category name
      const category= await Category.findOne({name:categoryName})
      //finding the brand name
      const brand= await Brand.findOne({brandName:brandName})

      // for seperating highlights to new lines
      const highlightsArray= highlights.split('\n').map(feature=> feature.trim())
      
      //storing the images
      const imageFiles = req.files; 
      const images = [];
      
      // console.log(req.body  )
      
      // Initialize images array to keep track of image filenames
      for (let i = 1; i <= 3; i++) {
        
        //from the body 
          const fieldName = `image${i}`;
          const existingImageField = `existingImage${i}`;
      
          // Check if there's an uploaded file for the current field
          if (imageFiles[fieldName] && imageFiles[fieldName][0]) {
              images.push(imageFiles[fieldName][0].filename); 
          } else {
              // If no new image uploaded, check for existing image
              if (req.body[existingImageField]) {
                  images.push(req.body[existingImageField]); 
              } else {
                  images.push(null); 
              }
          }
      }
      
      // console.log(images)

      // updating the product by the selected elements
      const product= await Product.findByIdAndUpdate(id, 
        {
          productName:productName,
          price:price,
          category:category._id,
          productDesc:productDescription,
          quantity:quantity,
          highlights:highlightsArray,
          productDetails:productDetails,
          brand:brand._id,
          image:images
        },{new:true}
      );
     
      console.log(req.files)

      res.json({success:true})
    } catch (error) {
      
      console.log("edit product error",error)

    }
  }

module.exports={
    loadProduct,
    loadAddProducts,
    addProducts,
    listProduct,
    unListProduct,
    loadEditProduct,
    editProduct
}