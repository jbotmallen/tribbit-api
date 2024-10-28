import { model, Schema, models, Model } from "mongoose";

type UserDocument = Document & {
    email: string;
    username: string;
    password: string;
    deleted_at: Date;
}

const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
});

const User: Model<UserDocument> = models.User || model("User", userSchema);

export { User, UserDocument };