import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    description: {
        required: true,
        types: String,
    },
    name: {
        type: String,
        required: true
    },
    productImage: {
        type: String
    },
    price: {
        type: Number,
        default: 0
    }, 
    stock: {
        default: 0,
        type: Number
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }
},{timestamps: true})

export const Product = mongoose.model("Product", productSchema)