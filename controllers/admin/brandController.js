const Brand=require("../../models/brandModel")
const Category = require("../../models/categoryModel")
const { find } = require("../../models/userModel")


const getBrand= async(req,res)=>{
     try {
          const page=parseInt(req.query.page) ||1
          const limit= 4
          const skip=(page-1)*limit
          let search=""
          if(req.query.search){
            search=req.query.search
          }

          const brandData= await Brand.find({
            $or:[
                {brandName:{$regex:'.*' + search + '.*',$options:'i'}}
            ]
          }).sort({createdAt:-1}).skip(skip).limit(limit);
          const totalBrands= await Brand.countDocuments();
          const totalPages= Math.ceil(totalBrands / limit)
          res.render("brands",{
               data:brandData,
               totalBrands:totalBrands,
               currentPage:page,
               totalPages:totalPages,
               searchQuery:search
          })
     } catch (error) {
          console.log("brand page error",error)       
     }
}

const addBrand = async (req, res) => {
  try {
      const brand = req.body.name.trim();
      // Case-insensitive check for existing brand
      const findBrand = await Brand.findOne({ 
      brandName: { $regex: new RegExp(`^${brand}$`, 'i') } 
      });
      if (findBrand) {
          return res.status(409).json({
              success: false,
              message: "Brand already exists."
          });
      }

      const newBrand = new Brand({ brandName: brand });
      await newBrand.save();

      // Send success response
      res.status(201).json({
          success: true,
          message: "Brand added successfully",
          brand: newBrand
      });

  } catch (error) {
      console.error("add brand error", error);
      res.status(500).json({
          success: false,
          message: "An error occurred while adding the brand."
      });
  }
};

 const deleteBrand = async (req, res) => {
    try {
      const id = req.query.id;
    
       await Brand.updateOne({ _id: id }, { $set: { isDeleted: true } });
  
      res.json({ success: true, message: "Brand deleted successfully" });
    } catch (error) {
      console.log("Delete brand error", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
  

const restoreBrand=async(req,res)=>{
    try {
        const id = req.query.id;
      
        await Brand.updateOne({ _id: id }, { $set: { isDeleted: false } });
    
      
    
        res.json({ success: true, message: "Brand deleted successfully" });
      } catch (error) {
        console.log("Delete brand error", error);
        res.status(500).json({ success: false, message: "Internal server error" });
      }
}
 
module.exports={
     getBrand,
     addBrand,
    deleteBrand,
    restoreBrand
}