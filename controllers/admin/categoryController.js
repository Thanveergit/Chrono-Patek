const { name } = require("ejs");
const Category = require("../../models/categoryModel");

const categoryDetails = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        let search=""
        if(req.query.search){
            search=req.query.search
        }
        const categoryData = await Category.find({
            $or:[
                {name:{$regex:'.*' + search + '.*',$options:'i'}}
            ]
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategory = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategory / limit);
        res.render("category", { cat: categoryData, currentPage: page, totalPages: totalPages, totalCategory: totalCategory,
            searchQuery:search
         });

    } catch (error) {
        console.log("category error", error);
        res.status(500).send("Internal server error");
    }
};

const addCategory = async (req, res) => {
   try {
     res.render("add-category")
   } catch (error) {
     console.log(error)
   }
};

const addNewCategory=async(req,res)=>{
     try {
          const {categoryName}=req.body
        //   console.log(categoryName)
          const existingCategory= await Category.findOne({
               name:{$regex:new RegExp('^' + categoryName + '$','i')}
          })
        //   console.log(existingCategory)
          
          if(existingCategory){
               return res.status(400).json({error:"Category already exists"})
          }
          
          const newCategory= new Category({name:categoryName})
          console.log(newCategory)
          await newCategory.save()
          return res.status(200).json({message:"Category added successfully"})
     } catch (error) {
          console.log(error)
     }
}

const listCategory = async (req, res) => {
    try {
        let { id } = req.body;
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });
        return res.status(200).json({ success: true, message: "Category listed successfully" });
    } catch (error) {
        console.log("list category error", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const unListCategory = async (req, res) => {
    try {
        let { id } = req.body;
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        return res.status(200).json({ success: true, message: "Category unlisted successfully" });
    } catch (error) {
        console.log("unlist category error", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



const updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { name } = req.body; 

        // Check if the category with the same name already exists
        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Category already exists, please choose another name." });
        }

        // Update the category if it exists
        const updatedCategory = await Category.findByIdAndUpdate(id, { name }, { new: true });

        if (updatedCategory) {
            return res.status(200).json({ success: true, message: "Category updated successfully!" });
        } else {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
    } catch (error) {
        console.error("Update category error", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports = {
    categoryDetails,
    addCategory,
    listCategory,
    unListCategory,
    updateCategory,
    addNewCategory
};
