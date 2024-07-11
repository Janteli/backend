import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId, //one to who is subscribing
        ref: "User"
    },
    channel:{
         type: mongoose.Schema.Types.ObjectId, //one to whom "subscriber" is subscribing
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)